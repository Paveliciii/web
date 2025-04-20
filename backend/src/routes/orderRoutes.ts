import express from 'express';
import pool from '../config/database';

const router = express.Router();

// Создание нового заказа
router.post('/', async (req, res) => {
    console.log('Received order data:', JSON.stringify(req.body, null, 2));
    
    // Проверяем наличие всех обязательных полей
    if (!req.body.product_id || !req.body.quantity || !req.body.customer_name) {
        return res.status(400).json({ 
            error: 'Missing required fields',
            details: 'product_id, quantity, and customer_name are required'
        });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Получаем следующий customer_id
            const customerIdResult = await client.query('SELECT get_next_customer_id()');
            const customer_id = customerIdResult.rows[0].get_next_customer_id;
            console.log('Generated customer_id:', customer_id);

            // Генерируем order_id в формате ORD-{timestamp}
            const order_id = `ORD-${Date.now()}`;
            console.log('Generated order_id:', order_id);

            const orderData = {
                order_id: order_id,
                customer_id: customer_id,
                customer_name: req.body.customer_name,
                product_id: parseInt(req.body.product_id),
                quantity: parseInt(req.body.quantity),
                sales: 0, // Будет пересчитано после проверки продукта
                region_id: parseInt(req.body.region_id || 1)
            };

            console.log('Processed order data:', JSON.stringify(orderData, null, 2));

            // Проверяем существование продукта и получаем его цену
            console.log('Checking product:', orderData.product_id);
            const productCheck = await client.query(
                'SELECT id, price FROM products WHERE id = $1',
                [orderData.product_id]
            );

            if (productCheck.rows.length === 0) {
                throw new Error(`Product with id ${orderData.product_id} not found`);
            }

            const productPrice = parseFloat(productCheck.rows[0].price);
            console.log('Product price:', productPrice);

            // Пересчитываем сумму на основе цены продукта
            orderData.sales = orderData.quantity * productPrice;
            console.log('Recalculated sales:', orderData.sales);

            // Проверяем существование региона
            console.log('Checking region:', orderData.region_id);
            const regionCheck = await client.query(
                'SELECT id FROM regions WHERE id = $1',
                [orderData.region_id]
            );

            if (regionCheck.rows.length === 0) {
                throw new Error(`Region with id ${orderData.region_id} not found`);
            }

            console.log('Inserting order with data:', JSON.stringify(orderData, null, 2));

            const result = await client.query(
                `INSERT INTO orders (
                    order_id, 
                    customer_id, 
                    customer_name, 
                    product_id, 
                    quantity, 
                    sales, 
                    order_date,
                    region_id
                ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7)
                RETURNING *`,
                [
                    orderData.order_id,
                    orderData.customer_id,
                    orderData.customer_name,
                    orderData.product_id,
                    orderData.quantity,
                    orderData.sales,
                    orderData.region_id
                ]
            );

            console.log('Order created successfully:', JSON.stringify(result.rows[0], null, 2));
            await client.query('COMMIT');
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error in transaction:', error);
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ 
            error: 'Ошибка при создании заказа',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Получение всех заказов
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                o.*, 
                p.name as product_name, 
                p.price as unit_price,
                r.name as region_name
            FROM orders o
            LEFT JOIN products p ON o.product_id = p.id
            LEFT JOIN regions r ON o.region_id = r.id
            ORDER BY o.order_date DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Ошибка при получении заказов' });
    }
});

export default router; 