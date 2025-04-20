-- Проверка данных в таблице orders
SELECT 
    COUNT(*) as total_orders,
    SUM(sales) as total_sales,
    ROUND(AVG(sales), 2) as average_order_value
FROM orders;

-- Проверка продаж по регионам
SELECT 
    r.name as region_name,
    SUM(o.sales) as total_sales,
    COUNT(*) as order_count
FROM orders o
JOIN regions r ON o.region_id = r.id
GROUP BY r.name
ORDER BY total_sales DESC;

-- Проверка продаж по продуктам
SELECT 
    p.name as product_name,
    SUM(o.sales) as total_sales,
    SUM(o.quantity) as quantity_sold
FROM orders o
JOIN products p ON o.product_id = p.id
GROUP BY p.name
ORDER BY total_sales DESC;

-- Проверка тренда продаж
SELECT 
    order_date as date,
    SUM(sales) as revenue
FROM orders
GROUP BY order_date
ORDER BY order_date DESC; 