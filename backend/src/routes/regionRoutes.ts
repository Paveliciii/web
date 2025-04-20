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
    
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Имя региона не может быть пустым' });
    }
    
    try {
        // Сначала проверим, существует ли уже регион с таким именем
        const checkResult = await pool.query(
            'SELECT id FROM regions WHERE LOWER(name) = LOWER($1)',
            [name]
        );
        
        if (checkResult.rows.length > 0) {
            // Регион уже существует, возвращаем его
            return res.status(200).json({
                id: checkResult.rows[0].id,
                name: name,
                message: 'Регион с таким именем уже существует'
            });
        }
        
        const result = await pool.query(
            'INSERT INTO regions (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating region:', error);
        
        // Проверяем, является ли ошибка нарушением уникальности
        if (error.code === '23505') { // код ошибки PostgreSQL для нарушения уникального ограничения
            return res.status(409).json({ 
                error: 'Регион с таким именем уже существует',
                details: 'Duplicate key violation'
            });
        }
        
        res.status(500).json({ 
            error: 'Ошибка при создании региона',
            details: error.message
        });
    }
});

// Обновление региона
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Имя региона не может быть пустым' });
    }
    
    try {
        // Проверяем, не будет ли конфликта с существующим регионом
        const checkResult = await pool.query(
            'SELECT id FROM regions WHERE LOWER(name) = LOWER($1) AND id != $2',
            [name, id]
        );
        
        if (checkResult.rows.length > 0) {
            return res.status(409).json({ 
                error: 'Регион с таким именем уже существует',
                details: 'Duplicate name'
            });
        }
        
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
        
        if (error.code === '23505') {
            return res.status(409).json({ 
                error: 'Регион с таким именем уже существует',
                details: 'Duplicate key violation'
            });
        }
        
        res.status(500).json({ 
            error: 'Ошибка при обновлении региона',
            details: error.message
        });
    }
});

// Удаление региона
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Проверяем, используется ли регион в заказах
        const checkResult = await pool.query(
            'SELECT COUNT(*) FROM orders WHERE region_id = $1',
            [id]
        );
        
        if (parseInt(checkResult.rows[0].count) > 0) {
            return res.status(409).json({ 
                error: 'Невозможно удалить регион, так как он используется в заказах',
                details: 'Foreign key constraint'
            });
        }
        
        const result = await pool.query('DELETE FROM regions WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Регион не найден' });
        }
        res.json({ message: 'Регион успешно удален' });
    } catch (error) {
        console.error('Error deleting region:', error);
        
        // Проверяем ошибку нарушения внешнего ключа
        if (error.code === '23503') { // код ошибки PostgreSQL для нарушения внешнего ключа
            return res.status(409).json({ 
                error: 'Невозможно удалить регион, так как он используется в заказах',
                details: 'Foreign key constraint violation'
            });
        }
        
        res.status(500).json({ 
            error: 'Ошибка при удалении региона',
            details: error.message
        });
    }
});

export default router; 