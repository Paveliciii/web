import { Pool } from 'pg';
import { parse } from 'pg-connection-string';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Определяем конфигурацию базы данных
const setupDatabaseConfig = () => {
    // Проверяем наличие переменной окружения DATABASE_URL (для продакшена)
    if (process.env.DATABASE_URL) {
        console.log('Using DATABASE_URL from environment');
        
        // Если используется Render или другой хостинг, требуется SSL
        return {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        };
    }
    
    // Локальная конфигурация для разработки из переменных окружения
    console.log('Using environment variables for database configuration');
    return {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'sales_analytics',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    };
};

// Создаем и экспортируем пул соединений
const pool = new Pool(setupDatabaseConfig());

// Функция для инициализации базы данных
export const initializeDatabase = async () => {
    console.log('Initializing database...');
    let client;
    
    try {
        // Подключаемся к базе данных
        client = await pool.connect();
        console.log('Connected to database');
        
        // Путь к SQL-файлу для создания таблиц
        const sqlFilePath = path.join(__dirname, '../database/create_tables.sql');
        
        if (fs.existsSync(sqlFilePath)) {
            // Читаем содержимое SQL-файла
            const createTablesSql = fs.readFileSync(sqlFilePath, 'utf8');
            
            // Выполняем SQL-команды для создания таблиц
            console.log('Creating tables if they do not exist...');
            await client.query(createTablesSql);
            console.log('Tables created or already exist');
        } else {
            console.error(`SQL file not found at path: ${sqlFilePath}`);
        }
    } catch (err) {
        console.error('Error initializing database:', err);
        throw err;
    } finally {
        if (client) {
            client.release();
            console.log('Database connection released');
        }
    }
};

// Функция для проверки подключения к базе данных
export const checkDatabaseConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to the database');
        client.release();
        return true;
    } catch (err) {
        console.error('Error connecting to the database:', err);
        return false;
    }
};

export default pool; 