-- Создаем таблицу регионов, если она не существует
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Создаем таблицу продуктов, если она не существует
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    category VARCHAR(50)
);

-- Создаем таблицу заказов, если она не существует
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    customer_name VARCHAR(100),
    product_id INT REFERENCES products(id),
    quantity INT,
    sales DECIMAL(10, 2),
    order_date DATE NOT NULL,
    region_id INT REFERENCES regions(id)
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_region_id ON orders(region_id);

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