import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import importRoutes from './routes/importRoutes';
import exportRoutes from './routes/exportRoutes';
import regionRoutes from './routes/regionRoutes';
import productRoutes from './routes/productRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import orderRoutes from './routes/orderRoutes';
import customerRoutes from './routes/customerRoutes';
import customerAnalyticsRoutes from './routes/customersAnalyticsRoutes';
import { initializeDatabase, checkDatabaseConnection } from './config/database';

const app = express();
// Преобразуем порт в число
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

console.log('App configured to use PORT:', PORT);
console.log('Environment PORT value:', process.env.PORT);

// Настройка CORS для работы с credentials
const corsOptions = {
  origin: function(origin, callback) {
    // В режиме разработки разрешаем запросы без origin
    if (!origin) {
      return callback(null, true);
    }
    
    // Список разрешенных источников
    const allowedOrigins = [
      'http://localhost:3000',
      'https://paveliciii.github.io'
    ];
    
    // Проверяем точное совпадение
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Проверяем если origin начинается с GitHub Pages URL
    if (origin.startsWith('https://paveliciii.github.io')) {
      return callback(null, true);
    }
    
    // Отклоняем все остальные источники
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Важно: разрешаем credentials
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// API Routes
app.use('/api/import', importRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sales', analyticsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customer-analytics', customerAnalyticsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Запуск сервера
const startServer = async () => {
  try {
    // Инициализируем базу данных
    await initializeDatabase();
    
    // Проверяем подключение к базе данных
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database, server will not start');
      process.exit(1);
    }
    
    // Запускаем сервер - explicitly listen on all interfaces (0.0.0.0)
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Server is listening at http://0.0.0.0:${PORT}`);
      
      if (process.env.RENDER) {
        console.log('Running on Render.com');
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      }
    });
    
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

startServer();

export default app;