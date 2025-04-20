import express from 'express';
import pool from '../config/database';

const router = express.Router();

// Получение общей статистики продаж
router.get('/summary', async (req, res) => {
    try {
        const { startDate, endDate, regionId, productId } = req.query;
        
        // Создаем условия для фильтрации
        const conditions = [];
        const params: any[] = [];
        
        if (startDate) {
            conditions.push(`order_date >= $${params.length + 1}`);
            params.push(startDate);
        }
        
        if (endDate) {
            conditions.push(`order_date <= $${params.length + 1}`);
            params.push(endDate);
        }
        
        if (regionId) {
            conditions.push(`region_id = $${params.length + 1}`);
            params.push(regionId);
        }
        
        if (productId) {
            conditions.push(`product_id = $${params.length + 1}`);
            params.push(productId);
        }
        
        // Составляем WHERE часть запроса
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        console.log(`Summary query with WHERE: ${whereClause}, params:`, params);
        
        const query = `
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(sales), 0) as total_revenue,
                CASE 
                    WHEN COUNT(*) > 0 THEN ROUND(COALESCE(SUM(sales), 0) / COUNT(*), 2)
                    ELSE 0
                END as average_order_value
            FROM orders
            ${whereClause}
        `;
        
        const result = await pool.query(query, params);
        console.log('Summary result:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching sales summary:', error);
        res.status(500).json({ error: 'Ошибка при получении статистики продаж' });
    }
});

// Получение продаж по регионам
router.get('/by-region', async (req, res) => {
    try {
        const { startDate, endDate, productId } = req.query;
        
        // Создаем условия для фильтрации
        const conditions = [];
        const params: any[] = [];
        
        if (startDate) {
            conditions.push(`o.order_date >= $${params.length + 1}`);
            params.push(startDate);
        }
        
        if (endDate) {
            conditions.push(`o.order_date <= $${params.length + 1}`);
            params.push(endDate);
        }
        
        if (productId) {
            conditions.push(`o.product_id = $${params.length + 1}`);
            params.push(productId);
        }
        
        // Составляем WHERE часть запроса
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        console.log(`Region query with WHERE: ${whereClause}, params:`, params);
        
        const query = `
            SELECT 
                r.name as region,
                COUNT(DISTINCT o.id) as order_count,
                COALESCE(SUM(o.sales), 0) as revenue
            FROM regions r
            LEFT JOIN orders o ON r.id = o.region_id ${whereClause ? `AND ${conditions.join(' AND ')}` : ''}
            GROUP BY r.name
            ORDER BY revenue DESC
        `;
        
        const result = await pool.query(query, params);
        console.log('Region data:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching sales by region:', error);
        res.status(500).json({ error: 'Ошибка при получении продаж по регионам' });
    }
});

// Получение продаж по продуктам
router.get('/by-product', async (req, res) => {
    try {
        const { startDate, endDate, regionId } = req.query;
        
        // Создаем условия для фильтрации
        const conditions = [];
        const params: any[] = [];
        
        if (startDate) {
            conditions.push(`o.order_date >= $${params.length + 1}`);
            params.push(startDate);
        }
        
        if (endDate) {
            conditions.push(`o.order_date <= $${params.length + 1}`);
            params.push(endDate);
        }
        
        if (regionId) {
            conditions.push(`o.region_id = $${params.length + 1}`);
            params.push(regionId);
        }
        
        // Составляем WHERE часть запроса
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        console.log(`Product query with WHERE: ${whereClause}, params:`, params);
        
        const query = `
            SELECT 
                p.name as product,
                COALESCE(SUM(o.sales), 0) as revenue,
                COALESCE(SUM(o.quantity), 0) as total_quantity
            FROM products p
            LEFT JOIN orders o ON p.id = o.product_id ${whereClause ? `AND ${conditions.join(' AND ')}` : ''}
            GROUP BY p.name
            ORDER BY revenue DESC
        `;
        
        const result = await pool.query(query, params);
        console.log('Product data:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching sales by product:', error);
        res.status(500).json({ error: 'Ошибка при получении продаж по продуктам' });
    }
});

// Получение тренда продаж
router.get('/trend', async (req, res) => {
    try {
        const { startDate, endDate, regionId, productId } = req.query;
        
        // Создаем условия для фильтрации
        const conditions = ['order_date IS NOT NULL'];
        const params: any[] = [];
        
        if (startDate) {
            conditions.push(`order_date >= $${params.length + 1}`);
            params.push(startDate);
        }
        
        if (endDate) {
            conditions.push(`order_date <= $${params.length + 1}`);
            params.push(endDate);
        }
        
        if (regionId) {
            conditions.push(`region_id = $${params.length + 1}`);
            params.push(regionId);
        }
        
        if (productId) {
            conditions.push(`product_id = $${params.length + 1}`);
            params.push(productId);
        }
        
        // Составляем WHERE часть запроса
        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        
        console.log(`Trend query with WHERE: ${whereClause}, params:`, params);
        
        const query = `
            SELECT 
                TO_CHAR(order_date, 'YYYY-MM-DD') as date,
                COALESCE(SUM(sales), 0) as revenue
            FROM orders
            ${whereClause}
            GROUP BY order_date
            ORDER BY order_date DESC
        `;
        
        const result = await pool.query(query, params);
        console.log('Trend data:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching sales trend:', error);
        res.status(500).json({ error: 'Ошибка при получении тренда продаж' });
    }
});

export default router; 