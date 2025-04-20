-- Сохраняем данные во временную таблицу
CREATE TEMP TABLE temp_orders AS 
SELECT * FROM orders;

-- Удаляем существующую таблицу
DROP TABLE orders;

-- Создаем новую таблицу с правильной структурой
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    customer_id INT NOT NULL,
    customer_name VARCHAR(100),
    product_id INT,
    quantity INT,
    sales DECIMAL(10, 2),
    order_date DATE NOT NULL,
    region_id INT
);

-- Создаем последовательность для customer_id если она еще не существует
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'customer_id_seq') THEN
        CREATE SEQUENCE customer_id_seq START 1;
    END IF;
END
$$;

-- Создаем функцию для получения следующего customer_id
CREATE OR REPLACE FUNCTION get_next_customer_id()
RETURNS INT AS $$
BEGIN
    RETURN nextval('customer_id_seq');
END;
$$ LANGUAGE plpgsql;

-- Восстанавливаем данные из временной таблицы
INSERT INTO orders (
    order_id, 
    customer_id, 
    customer_name, 
    product_id, 
    quantity, 
    sales, 
    order_date, 
    region_id
)
SELECT 
    order_id,
    CASE
        WHEN customer_id::TEXT ~ '^[0-9]+$' THEN customer_id::INTEGER
        ELSE get_next_customer_id()
    END as customer_id,
    customer_name,
    CASE
        WHEN product_id IS NOT NULL THEN product_id
        ELSE 1
    END as product_id,
    quantity,
    CASE
        WHEN sales IS NOT NULL THEN sales
        ELSE 0
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