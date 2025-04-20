import express from 'express';
import pool from '../config/database';
import { createObjectCsvStringifier } from 'csv-writer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.get('/csv', async (req, res) => {
    const { startDate, endDate, regionId, productId } = req.query;
    
    try {
        console.log('Exporting data with filters:', req.query);
        
        // Build WHERE clause based on filters
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
        
        if (productId) {
            conditions.push(`o.product_id = $${params.length + 1}`);
            params.push(productId);
        }
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        // Query to get all relevant orders with detailed information
        const query = `
            SELECT 
                o.order_id,
                o.customer_id,
                o.customer_name,
                p.name as product_name,
                o.quantity,
                o.sales,
                o.order_date,
                r.name as region_name
            FROM orders o
            LEFT JOIN products p ON o.product_id = p.id
            LEFT JOIN regions r ON o.region_id = r.id
            ${whereClause}
            ORDER BY o.order_date DESC
        `;
        
        const { rows } = await pool.query(query, params);
        
        // Create CSV header and rows
        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'order_id', title: 'Номер заказа' },
                { id: 'customer_id', title: 'ID клиента' },
                { id: 'customer_name', title: 'Имя клиента' },
                { id: 'product_name', title: 'Товар' },
                { id: 'quantity', title: 'Количество' },
                { id: 'sales', title: 'Сумма' },
                { id: 'order_date', title: 'Дата заказа' },
                { id: 'region_name', title: 'Регион' }
            ]
        });
        
        // Convert dates to proper format
        const formattedRows = rows.map(row => ({
            ...row,
            order_date: new Date(row.order_date).toISOString().split('T')[0]
        }));
        
        const csvHeader = csvStringifier.getHeaderString();
        const csvRows = csvStringifier.stringifyRecords(formattedRows);
        const csvContent = csvHeader + csvRows;
        
        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=sales_export_${new Date().toISOString().split('T')[0]}.csv`);
        
        // Send CSV content
        res.send(csvContent);
        
        console.log(`Exported ${rows.length} records as CSV`);
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ error: 'Ошибка при экспорте данных' });
    }
});

export default router; 