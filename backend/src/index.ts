import express from 'express';
import cors from 'cors';
import path from 'path';
import importRoutes from './routes/importRoutes';
import exportRoutes from './routes/exportRoutes';
import regionRoutes from './routes/regionRoutes';
import productRoutes from './routes/productRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import orderRoutes from './routes/orderRoutes';
import customerRoutes from './routes/customerRoutes';
import initDatabase from './scripts/initDb';

const app = express();
const PORT = process.env.PORT || 3001;

// Инициализация базы данных
initDatabase()
  .then(() => {
    console.log('Database initialization completed');
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Создаем директорию для загрузок, если она не существует
const uploadDir = path.join(process.cwd(), 'uploads');
if (!require('fs').existsSync(uploadDir)) {
    require('fs').mkdirSync(uploadDir, { recursive: true });
}

// Routes
app.use('/api/import', importRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sales', analyticsRoutes); // Alias for analytics for better naming
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    // Serve frontend build
    app.use(express.static(path.resolve(__dirname, '../../frontend/build')));
    
    // Handle SPA routing
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
        res.sendFile(path.resolve(__dirname, '../../frontend/build/index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 