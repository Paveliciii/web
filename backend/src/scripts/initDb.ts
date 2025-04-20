import fs from 'fs';
import path from 'path';
import pool from '../config/database';

const initDatabase = async () => {
    console.log('Initializing database...');
    
    try {
        // Читаем SQL скрипт инициализации
        const sqlFilePath = path.join(__dirname, '../database/init.sql');
        const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
        
        // Подключаемся к базе данных и выполняем скрипт
        const client = await pool.connect();
        
        try {
            console.log('Connected to database, executing init script...');
            await client.query(sqlScript);
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Error executing init script:', error);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
};

export default initDatabase; 