const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://sales_admin:SRer9gPoS7s1dZwW2sV4KA5LHfEAnyOc@dpg-d02a2uruibrs73alv2fg-a/sales_analytics_db'
});

pool.query(`
  INSERT INTO orders (order_id, customer_id, customer_name, product_id, quantity, sales, order_date, region_id)
  VALUES ('ORD-101', 101, 'Тестовый Клиент', 1, 2, 90000, '2024-03-20', 1)
`).then(res => {
  console.log('Запись успешно добавлена');
  pool.end();
}).catch(err => {
  console.error('Ошибка при добавлении записи:', err);
  pool.end();
});