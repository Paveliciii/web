-- Удаляем старую таблицу orders, если она существует
DROP TABLE IF EXISTS orders CASCADE;

-- Создаем новую таблицу orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    customer_id INTEGER NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    sales DECIMAL(10,2) NOT NULL,
    order_date DATE NOT NULL,
    region_id INTEGER REFERENCES regions(id)
);

-- Создаем последовательность для customer_id
CREATE SEQUENCE customer_id_seq START WITH 1;

-- Создаем функцию для получения следующего customer_id
CREATE OR REPLACE FUNCTION get_next_customer_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN nextval('customer_id_seq');
END;
$$ LANGUAGE plpgsql;

-- Создаем индексы
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_region_id ON orders(region_id); 