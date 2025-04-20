require('dotenv').config();

const { Pool } = require('pg');

// Determine if using connection string or individual params
const useConnectionString = !!process.env.DATABASE_URL;

const pool = useConnectionString 
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }) 
  : new Pool({
      user: process.env.DB_USER || 'sales_admin',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'sales_analytics', 
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

// Test the database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Successfully connected to the database');
    release();
  }
});

module.exports = pool; 