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

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'https://paveliciii.github.io'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Создаем директорию для загрузок, если она не существует
const uploadDir = path.join(process.cwd(), 'uploads');
if (!require('fs').existsSync(uploadDir)) {
    require('fs').mkdirSync(uploadDir, { recursive: true });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/import', importRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sales', analyticsRoutes); // Alias for analytics for better naming
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
    });
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

// Initialize database
initDatabase()
    .then(() => {
        console.log('Database initialization completed');
        
        // Start server after database initialization
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            if (process.env.RENDER) {
                console.log('Running on Render.com');
                console.log(`Environment: ${process.env.NODE_ENV}`);
            }
        });
    })
    .catch(error => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    });

// Handle shutdown gracefully
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
    console.log('Shutting down gracefully...');
    // Close any open connections, etc.
    process.exit(0);
} 