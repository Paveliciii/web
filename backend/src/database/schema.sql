-- Удаляем старую таблицу orders, если она существует
DROP TABLE IF EXISTS orders;

-- Создаем новую таблицу orders с правильной структурой
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    sales DECIMAL(10,2) NOT NULL,
    order_date DATE NOT NULL,
    region_id INTEGER REFERENCES regions(id)
);

-- Добавляем новые колонки в существующую таблицу orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS customer_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id),
ADD COLUMN IF NOT EXISTS quantity INTEGER,
ADD COLUMN IF NOT EXISTS sales DECIMAL(10,2);

-- Создаем индексы для новых колонок
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);

-- Обновляем существующие записи
UPDATE orders 
SET 
    order_id = 'ORD-' || id::text,
    customer_id = 'CUST-' || id::text,
    customer_name = 'Customer ' || id::text,
    quantity = 1,
    sales = 0
WHERE 
    order_id IS NULL OR 
    customer_id IS NULL OR 
    customer_name IS NULL OR 
    quantity IS NULL OR 
    sales IS NULL;

-- Делаем колонки NOT NULL после заполнения
ALTER TABLE orders
ALTER COLUMN order_id SET NOT NULL,
ALTER COLUMN customer_id SET NOT NULL,
ALTER COLUMN customer_name SET NOT NULL,
ALTER COLUMN quantity SET NOT NULL,
ALTER COLUMN sales SET NOT NULL; 