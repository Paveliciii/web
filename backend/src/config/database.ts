import { Pool } from 'pg';
import { parse } from 'pg-connection-string';
import dotenv from 'dotenv';

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
        user: process.env.DB_USER || 'sales_admin',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'sales_analytics',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    };
};

// Создаем и экспортируем пул соединений
const pool = new Pool(setupDatabaseConfig());

export default pool; 