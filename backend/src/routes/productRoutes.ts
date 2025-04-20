import express from 'express';
import pool from '../config/database';

const router = express.Router();

// Получение списка всех продуктов
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Ошибка при получении списка продуктов' });
    }
});

// Создание нового продукта
router.post('/', async (req, res) => {
    const { name, price } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *',
            [name, price]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Ошибка при создании продукта' });
    }
});

// Обновление продукта
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, price } = req.body;
    try {
        const result = await pool.query(
            'UPDATE products SET name = $1, price = $2 WHERE id = $3 RETURNING *',
            [name, price, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Продукт не найден' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Ошибка при обновлении продукта' });
    }
});

// Удаление продукта
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Продукт не найден' });
        }
        res.json({ message: 'Продукт успешно удален' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Ошибка при удалении продукта' });
    }
});

export default router; 