import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Настройка пула соединений с базой данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://sales_admin:postgres@localhost:5432/sales_analytics',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Функция для проверки соединения с базой данных
export const checkDatabaseConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    client.release();
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
};

// Экспорт пула соединений для использования в других частях приложения
export default pool; 