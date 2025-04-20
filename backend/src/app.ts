import express from 'express';
import cors from 'cors';
import orderRoutes from './routes/orderRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import importRoutes from './routes/importRoutes';
import regionRoutes from './routes/regionRoutes';
import productRoutes from './routes/productRoutes';

const app = express();

app.use(cors());
app.use(express.json());

// Маршруты для заказов
app.use('/api/orders', orderRoutes);

// Маршруты для аналитики
app.use('/api/sales', analyticsRoutes);

// Маршруты для импорта данных
app.use('/api/import', importRoutes);

// Маршруты для регионов
app.use('/api/regions', regionRoutes);

// Маршруты для продуктов
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 