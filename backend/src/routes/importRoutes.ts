import express from 'express';
import multer from 'multer';
import fs from 'fs';
import pool from '../config/database';
import path from 'path';

const router = express.Router();

// Создаем директорию для загрузок, если она не существует
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// Проверка подключения к базе данных
const checkDatabaseConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to the database');
        client.release();
    } catch (err) {
        console.error('Error connecting to the database:', err);
        throw err;
    }
};

// Проверяем подключение при запуске
checkDatabaseConnection().catch(console.error);

router.post('/csv', upload.single('file'), async (req, res) => {
    console.log('Received file upload request');
    
    if (!req.file) {
        console.log('No file received');
        return res.status(400).json({ error: 'Файл не загружен' });
    }

    console.log('File received:', req.file);
    const filePath = req.file.path;
    const results: any = {
        products: [],
        regions: [],
        orders: []
    };

    let currentSection = '';
    let isHeaderRow = true;

    try {
        console.log('Reading file content');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n');
        console.log(`Total lines: ${lines.length}`);

        for (const line of lines) {
            if (line.trim() === '') continue;

            if (line.startsWith('# Products data')) {
                currentSection = 'products';
                isHeaderRow = true;
                console.log('Found Products section');
                continue;
            } else if (line.startsWith('# Regions data')) {
                currentSection = 'regions';
                isHeaderRow = true;
                console.log('Found Regions section');
                continue;
            } else if (line.startsWith('# Orders data')) {
                currentSection = 'orders';
                isHeaderRow = true;
                console.log('Found Orders section');
                continue;
            }

            if (line.startsWith('#')) continue;

            const values = line.split(',').map(v => v.trim());
            
            // Skip header rows
            if (isHeaderRow) {
                isHeaderRow = false;
                console.log(`Skipping header row: ${line}`);
                continue;
            }

            try {
                if (currentSection === 'products') {
                    // Create product without category
                    const product = {
                        id: parseInt(values[0]),
                        name: values[1],
                        price: parseFloat(values[2])
                    };
                    console.log('Adding product:', product);
                    results.products.push(product);
                } else if (currentSection === 'regions') {
                    results.regions.push({
                        id: parseInt(values[0]),
                        name: values[1]
                    });
                } else if (currentSection === 'orders') {
                    results.orders.push({
                        order_id: values[0],
                        customer_id: values[1],
                        customer_name: values[2],
                        product_id: parseInt(values[3]),
                        quantity: parseInt(values[4]),
                        sales: parseFloat(values[5]),
                        order_date: values[6],
                        region_id: parseInt(values[7])
                    });
                }
            } catch (parseError) {
                console.error('Error parsing line:', line);
                console.error('Parse error:', parseError);
            }
        }

        console.log('Parsed data:', {
            products: results.products.length,
            regions: results.regions.length,
            orders: results.orders.length
        });

        // Import data into database
        const client = await pool.connect();
        console.log('Connected to database');

        try {
            // Import each entity type with its own transaction
            // First import products
            console.log('Importing products...');
            for (const product of results.products) {
                try {
                    console.log('Inserting product:', product);
                    await client.query('BEGIN');
                    await client.query(
                        'INSERT INTO products (id, name, price) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET price = $3',
                        [product.id, product.name, product.price]
                    );
                    await client.query('COMMIT');
                } catch (productError) {
                    await client.query('ROLLBACK');
                    console.error('Error importing product:', product);
                    console.error('Product error:', productError);
                    // Continue with next product instead of stopping the whole import
                }
            }

            // Next import regions
            console.log('Importing regions...');
            for (const region of results.regions) {
                try {
                    await client.query('BEGIN');
                    await client.query(
                        'INSERT INTO regions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2',
                        [region.id, region.name]
                    );
                    await client.query('COMMIT');
                } catch (regionError) {
                    await client.query('ROLLBACK');
                    console.error('Error importing region:', region);
                    console.error('Region error:', regionError);
                    // Continue with next region
                }
            }

            // Finally import orders
            console.log('Importing orders...');
            for (const order of results.orders) {
                try {
                    await client.query('BEGIN');
                    await client.query(
                        `INSERT INTO orders (order_id, customer_id, customer_name, product_id, quantity, sales, order_date, region_id)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                         ON CONFLICT (order_id) DO UPDATE
                         SET customer_id = $2, customer_name = $3, product_id = $4, quantity = $5, sales = $6, order_date = $7, region_id = $8`,
                        [order.order_id, order.customer_id, order.customer_name, order.product_id, 
                         order.quantity, order.sales, order.order_date, order.region_id]
                    );
                    await client.query('COMMIT');
                } catch (orderError) {
                    await client.query('ROLLBACK');
                    console.error('Error importing order:', order);
                    console.error('Order error:', orderError);
                    // Continue with next order
                }
            }

            res.json({ 
                message: 'Импорт завершен', 
                results: {
                    products: results.products.length,
                    regions: results.regions.length,
                    orders: results.orders.length
                }
            });
        } catch (error) {
            console.error('Database operation error:', error);
            res.status(500).json({ 
                error: 'Ошибка при импорте данных',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            client.release();
            console.log('Database connection released');
        }
    } catch (error) {
        console.error('Import process error:', error);
        res.status(500).json({ 
            error: 'Ошибка при импорте данных',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    } finally {
        try {
            fs.unlinkSync(filePath);
            console.log('Temporary file deleted');
        } catch (unlinkError) {
            console.error('Error deleting temporary file:', unlinkError);
        }
    }
});

export default router; 