import express from 'express';
import { Pool } from 'pg';

const router = express.Router();
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'sales_analytics',
    password: 'postgres',
    port: 5432,
});

// Получение всех клиентов
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT customer_id, customer_name 
            FROM orders 
            ORDER BY customer_name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Ошибка при получении списка клиентов' });
    }
});

// Создание нового клиента
router.post('/', async (req, res) => {
    const { customer_name } = req.body;
    const customer_id = 'CUST-' + Date.now();
    
    try {
        const result = await pool.query(
            `INSERT INTO orders (customer_id, customer_name, order_date, quantity, sales)
             VALUES ($1, $2, CURRENT_DATE, 0, 0)
             RETURNING customer_id, customer_name`,
            [customer_id, customer_name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Ошибка при создании клиента' });
    }
});

export default router; 