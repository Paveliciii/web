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
    console.log(`Created upload directory: ${uploadDir}`);
} else {
    console.log(`Upload directory exists: ${uploadDir}`);
}

// Настраиваем хранилище для multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.csv';
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Создаем middleware для обработки загрузки файлов
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB максимальный размер файла
    },
    fileFilter: function (req, file, cb) {
        // Проверяем MIME тип или расширение файла
        if (file.mimetype === 'text/csv' || 
            file.originalname.toLowerCase().endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Только CSV файлы разрешены для загрузки'));
        }
    }
});

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

// Функция для создания или получения региона по имени
const createOrGetRegion = async (client, regionName) => {
    if (!regionName || regionName.trim() === '') {
        return null;
    }
    
    try {
        // Проверяем, существует ли уже регион с таким именем
        const checkResult = await client.query(
            'SELECT id FROM regions WHERE LOWER(name) = LOWER($1)',
            [regionName]
        );
        
        if (checkResult.rows.length > 0) {
            // Регион уже существует, возвращаем его ID
            return checkResult.rows[0].id;
        }
        
        // Создаем новый регион
        const result = await client.query(
            'INSERT INTO regions (name) VALUES ($1) RETURNING id',
            [regionName]
        );
        
        return result.rows[0].id;
    } catch (error) {
        console.error('Error creating or getting region:', error);
        if (error.code === '23505') { // Нарушение уникальности
            // Попробуем еще раз получить ID
            const retryResult = await client.query(
                'SELECT id FROM regions WHERE LOWER(name) = LOWER($1)',
                [regionName]
            );
            
            if (retryResult.rows.length > 0) {
                return retryResult.rows[0].id;
            }
        }
        throw error;
    }
};

router.post('/csv', (req, res) => {
    console.log('Received file upload request at /import/csv');
    console.log('Headers:', req.headers);
    
    // Используем multer middleware с обработкой ошибок
    upload.single('file')(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ 
                error: 'Ошибка при загрузке файла', 
                details: err.message 
            });
        }
        
        console.log('Multer processing complete');
        
        if (!req.file) {
            console.log('No file received');
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        console.log('File received:', req.file);
        console.log('File content length:', req.file.size);
        console.log('File path:', req.file.path);
        console.log('File mimetype:', req.file.mimetype);
        
        // Проверим, что файл существует
        try {
            fs.accessSync(req.file.path, fs.constants.F_OK);
            console.log('File exists and is accessible');
        } catch (err) {
            console.error('File access error:', err);
            return res.status(500).json({ error: 'Ошибка доступа к файлу', details: err.message });
        }
        
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
            let fileContent;
            try {
                fileContent = fs.readFileSync(filePath, 'utf-8');
                console.log('File read successfully');
            } catch (fileReadError) {
                console.error('Error reading file:', fileReadError);
                throw new Error(`Failed to read file: ${fileReadError.message}`);
            }
            
            // Проверим содержимое начала файла для отладки
            console.log('File content preview:', fileContent.substring(0, 200));
            
            const lines = fileContent.split('\n');
            console.log(`Total lines: ${lines.length}`);

            // Проверка на простой формат (без # секций)
            const isSimpleFormat = !lines.some(line => line.trim().startsWith('#'));
            
            if (isSimpleFormat) {
                console.log('Detected simple format without sections');
                let headerLine = '';
                
                // Найдем строку заголовка и получим индексы столбцов
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line && !line.startsWith('#')) {
                        headerLine = line;
                        isHeaderRow = true;
                        break;
                    }
                }
                
                const headerValues = headerLine.split(',').map(v => v.trim().toLowerCase());
                
                // Получаем индексы нужных столбцов
                const orderIdIndex = headerValues.findIndex(h => h.includes('заказ') || h.includes('order'));
                const customerIdIndex = headerValues.findIndex(h => h.includes('клиент') && h.includes('id'));
                const customerNameIndex = headerValues.findIndex(h => (h.includes('клиент') || h.includes('customer')) && h.includes('имя') || h.includes('name'));
                const productNameIndex = headerValues.findIndex(h => h.includes('товар') || h.includes('product'));
                const quantityIndex = headerValues.findIndex(h => h.includes('кол') || h.includes('quant'));
                const salesIndex = headerValues.findIndex(h => h.includes('сумм') || h.includes('sales'));
                const dateIndex = headerValues.findIndex(h => h.includes('дата') || h.includes('date'));
                const regionNameIndex = headerValues.findIndex(h => h.includes('регион') || h.includes('region'));
                
                console.log('Column indexes:', {
                    orderIdIndex,
                    customerIdIndex,
                    customerNameIndex,
                    productNameIndex,
                    quantityIndex,
                    salesIndex,
                    dateIndex,
                    regionNameIndex
                });
                
                // Проверим существуют ли регионы и продукты, или нам нужно их создать
                let existingRegions: {[key: string]: number} = {};
                let existingProducts: {[key: string]: number} = {};
                
                try {
                    const regionsResult = await pool.query('SELECT id, name FROM regions');
                    regionsResult.rows.forEach(row => {
                        existingRegions[row.name.toLowerCase()] = row.id;
                    });
                    
                    const productsResult = await pool.query('SELECT id, name FROM products');
                    productsResult.rows.forEach(row => {
                        existingProducts[row.name.toLowerCase()] = row.id;
                    });
                    
                    console.log('Existing regions:', existingRegions);
                    console.log('Existing products:', existingProducts);
                } catch (err) {
                    console.error('Error fetching existing entities:', err);
                }
                
                // Проходим по всем строкам и обрабатываем данные
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line || line === headerLine) continue;
                    
                    try {
                        const values = line.split(',').map(v => v.trim());
                        
                        // Получаем значения из строки
                        const orderId = orderIdIndex >= 0 ? values[orderIdIndex] : `ORD-${i}`;
                        const customerId = customerIdIndex >= 0 ? parseInt(values[customerIdIndex]) || 0 : 0;
                        const customerName = customerNameIndex >= 0 ? values[customerNameIndex] : '';
                        const productName = productNameIndex >= 0 ? values[productNameIndex] : '';
                        const quantity = quantityIndex >= 0 ? parseInt(values[quantityIndex]) || 0 : 0;
                        const sales = salesIndex >= 0 ? parseFloat(values[salesIndex]) || 0 : 0;
                        const orderDate = dateIndex >= 0 ? values[dateIndex] : new Date().toISOString().split('T')[0];
                        const regionName = regionNameIndex >= 0 ? values[regionNameIndex] : '';
                        
                        // Проверим и при необходимости создадим регион
                        let regionId: number | null = null;
                        if (regionName) {
                            if (existingRegions[regionName.toLowerCase()]) {
                                regionId = existingRegions[regionName.toLowerCase()];
                            } else {
                                // Добавляем регион в список для последующей обработки в базе данных
                                const newRegionId = Object.keys(existingRegions).length + 1;
                                results.regions.push({
                                    id: newRegionId,
                                    name: regionName
                                });
                                existingRegions[regionName.toLowerCase()] = newRegionId;
                                regionId = newRegionId;
                            }
                        }
                        
                        // Проверим и при необходимости создадим продукт
                        let productId: number | null = null;
                        if (productName) {
                            if (existingProducts[productName.toLowerCase()]) {
                                productId = existingProducts[productName.toLowerCase()];
                            } else {
                                // Создаем новый продукт
                                const newProductId = Object.keys(existingProducts).length + 1;
                                results.products.push({
                                    id: newProductId,
                                    name: productName,
                                    price: sales / quantity // Примерно оцениваем цену
                                });
                                existingProducts[productName.toLowerCase()] = newProductId;
                                productId = newProductId;
                            }
                        }
                        
                        // Добавляем заказ
                        results.orders.push({
                            order_id: orderId,
                            customer_id: customerId,
                            customer_name: customerName,
                            product_id: productId,
                            quantity: quantity,
                            sales: sales,
                            order_date: orderDate,
                            region_id: regionId
                        });
                    } catch (error) {
                        console.error('Error processing line:', line, error);
                    }
                }
            } else {
                // Обработка формата с секциями (оригинальный код)
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
                            // Convert customer_id to integer if possible
                            let customerId: number;
                            try {
                                customerId = parseInt(values[1]);
                                if (isNaN(customerId)) {
                                    console.warn(`Non-numeric customer_id: ${values[1]}, using 0 instead`);
                                    customerId = 0; // Default value
                                }
                            } catch (err) {
                                console.warn(`Error parsing customer_id: ${values[1]}, using 0 instead`);
                                customerId = 0;
                            }
                            
                            results.orders.push({
                                order_id: values[0],
                                customer_id: customerId,
                                customer_name: values[2],
                                product_id: parseInt(values[3]) || null,
                                quantity: parseInt(values[4]) || 0,
                                sales: parseFloat(values[5]) || 0,
                                order_date: values[6],
                                region_id: parseInt(values[7]) || null
                            });
                        }
                    } catch (parseError) {
                        console.error('Error parsing line:', line);
                        console.error('Parse error:', parseError);
                    }
                }
            }

            console.log('Parsed data:', {
                products: results.products.length,
                regions: results.regions.length,
                orders: results.orders.length
            });

            // Import data into database
            let client;
            try {
                client = await pool.connect();
                console.log('Connected to database');

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
                        
                        if (!region.name || region.name.trim() === '') {
                            console.warn('Skipping region with empty name');
                            await client.query('ROLLBACK');
                            continue;
                        }
                        
                        // Проверяем, существует ли уже регион с таким именем
                        const checkResult = await client.query(
                            'SELECT id FROM regions WHERE LOWER(name) = LOWER($1)',
                            [region.name]
                        );
                        
                        if (checkResult.rows.length > 0) {
                            console.log(`Region "${region.name}" already exists with id ${checkResult.rows[0].id}`);
                            region.id = checkResult.rows[0].id; // Обновляем id для использования в заказах
                            await client.query('COMMIT');
                            continue;
                        }
                        
                        const insertResult = await client.query(
                            'INSERT INTO regions (name) VALUES ($1) RETURNING id',
                            [region.name]
                        );
                        region.id = insertResult.rows[0].id;
                        await client.query('COMMIT');
                    } catch (regionError) {
                        await client.query('ROLLBACK');
                        console.error('Error importing region:', region);
                        console.error('Region error:', regionError);
                        
                        if (regionError.code === '23505') { // Нарушение уникальности
                            try {
                                // Попробуем получить ID существующего региона
                                const retryResult = await client.query(
                                    'SELECT id FROM regions WHERE LOWER(name) = LOWER($1)',
                                    [region.name]
                                );
                                
                                if (retryResult.rows.length > 0) {
                                    region.id = retryResult.rows[0].id;
                                    console.log(`Retrieved existing region "${region.name}" with id ${region.id}`);
                                }
                            } catch (retryError) {
                                console.error('Error retrieving existing region:', retryError);
                            }
                        }
                        // Continue with next region
                    }
                }

                // Finally import orders
                console.log('Importing orders...');
                for (const order of results.orders) {
                    try {
                        console.log('Inserting order:', order);
                        await client.query('BEGIN');
                        
                        // Use parameterized query to prevent SQL injection
                        const query = `
                            INSERT INTO orders (order_id, customer_id, customer_name, product_id, quantity, sales, order_date, region_id)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            ON CONFLICT (order_id) DO UPDATE
                            SET customer_id = $2, customer_name = $3, product_id = $4, quantity = $5, sales = $6, order_date = $7, region_id = $8
                        `;
                        
                        await client.query(query, [
                            order.order_id, 
                            order.customer_id, 
                            order.customer_name, 
                            order.product_id, 
                            order.quantity, 
                            order.sales, 
                            order.order_date, 
                            order.region_id
                        ]);
                        
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
            } catch (dbError) {
                console.error('Database operation error:', dbError);
                res.status(500).json({ 
                    error: 'Ошибка при импорте данных в базу',
                    details: dbError instanceof Error ? dbError.message : 'Unknown database error'
                });
            } finally {
                if (client) {
                    client.release();
                    console.log('Database connection released');
                }
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
});

export default router; 