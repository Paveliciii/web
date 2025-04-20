-- Создаем временную таблицу для сохранения данных
CREATE TEMP TABLE temp_orders AS 
SELECT * FROM orders;

-- Удаляем старую таблицу
DROP TABLE orders;

-- Создаем новую таблицу с правильной структурой
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    product_id INT,
    quantity INT,
    price DECIMAL(10, 2),
    sales DECIMAL(10, 2),
    order_date DATE,
    region_id INT
);

-- Добавляем последовательность для customer_id если ее нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'customer_id_seq') THEN
        CREATE SEQUENCE customer_id_seq START 1;
    END IF;
END
$$;

-- Создаем функцию для получения следующего customer_id
CREATE OR REPLACE FUNCTION get_next_customer_id() RETURNS INT AS $$
BEGIN
    RETURN nextval('customer_id_seq');
END;
$$ LANGUAGE plpgsql;

-- Восстанавливаем данные из временной таблицы
INSERT INTO orders (order_id, customer_id, product_id, quantity, price, sales, order_date, region_id)
SELECT 
    order_id, 
    CASE
        WHEN customer_id IS NULL THEN get_next_customer_id()
        WHEN customer_id ~ E'^\\d+$' THEN customer_id::INTEGER
        ELSE get_next_customer_id()
    END as customer_id,
    CASE 
        WHEN product_id IS NULL THEN NULL
        ELSE product_id::INTEGER
    END as product_id,
    quantity,
    price,
    CASE 
        WHEN order_id LIKE 'ORD-%' THEN COALESCE(sales, quantity * price, 0.00)
        ELSE 0.00
    END as sales,
    order_date,
    region_id
FROM temp_orders;

-- Удаляем временную таблицу
DROP TABLE temp_orders;

-- Создаем индексы
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_region_id ON orders(region_id); 