-- Создаем таблицы, если они не существуют

-- Создаем таблицу регионов
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Создаем таблицу продуктов
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

-- Создаем таблицу заказов
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    customer_id INT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    sales DECIMAL(10,2) NOT NULL,
    order_date DATE NOT NULL,
    region_id INTEGER REFERENCES regions(id)
);

-- Создаем последовательность для customer_id если её ещё нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'customer_id_seq') THEN
        CREATE SEQUENCE customer_id_seq START 1;
    END IF;
END
$$;

-- Создаем функцию для получения следующего customer_id
CREATE OR REPLACE FUNCTION get_next_customer_id() RETURNS INTEGER AS $$
BEGIN
    RETURN nextval('customer_id_seq');
END;
$$ LANGUAGE plpgsql;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_region_id ON orders(region_id);

-- Добавляем тестовые данные, если таблицы пустые
INSERT INTO regions (id, name)
SELECT 1, 'Центральный'
WHERE NOT EXISTS (SELECT 1 FROM regions);

INSERT INTO regions (id, name)
SELECT 2, 'Южный'
WHERE NOT EXISTS (SELECT 1 FROM regions WHERE id = 2);

INSERT INTO regions (id, name)
SELECT 3, 'Северный'
WHERE NOT EXISTS (SELECT 1 FROM regions WHERE id = 3);

INSERT INTO products (id, name, price)
SELECT 1, 'Ноутбук', 45000.00
WHERE NOT EXISTS (SELECT 1 FROM products);

INSERT INTO products (id, name, price)
SELECT 2, 'Смартфон', 35000.00
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = 2);

INSERT INTO products (id, name, price)
SELECT 3, 'Планшет', 25000.00
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = 3);

-- Добавляем тестовые заказы, если таблица пустая
INSERT INTO orders (order_id, customer_id, customer_name, product_id, quantity, sales, order_date, region_id)
SELECT 'ORD-1', 1, 'Иванов Иван', 1, 2, 90000.00, '2023-01-15', 1
WHERE NOT EXISTS (SELECT 1 FROM orders);

INSERT INTO orders (order_id, customer_id, customer_name, product_id, quantity, sales, order_date, region_id)
SELECT 'ORD-2', 2, 'Петрова Мария', 2, 1, 35000.00, '2023-01-20', 2
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE order_id = 'ORD-2');

INSERT INTO orders (order_id, customer_id, customer_name, product_id, quantity, sales, order_date, region_id)
SELECT 'ORD-3', 3, 'Сидоров Петр', 3, 3, 75000.00, '2023-01-25', 3
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE order_id = 'ORD-3'); 