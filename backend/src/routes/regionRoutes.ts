import express from 'express';
import pool from '../config/database';

const router = express.Router();

// Получение списка всех регионов
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM regions ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching regions:', error);
        res.status(500).json({ error: 'Ошибка при получении списка регионов' });
    }
});

// Создание нового региона
router.post('/', async (req, res) => {
    const { name } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO regions (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating region:', error);
        res.status(500).json({ error: 'Ошибка при создании региона' });
    }
});

// Обновление региона
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const result = await pool.query(
            'UPDATE regions SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Регион не найден' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating region:', error);
        res.status(500).json({ error: 'Ошибка при обновлении региона' });
    }
});

// Удаление региона
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM regions WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Регион не найден' });
        }
        res.json({ message: 'Регион успешно удален' });
    } catch (error) {
        console.error('Error deleting region:', error);
        res.status(500).json({ error: 'Ошибка при удалении региона' });
    }
});

export default router; 