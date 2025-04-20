require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://sales_admin:postgres@localhost:5432/sales_analytics'
});

console.log('Reading SQL file...');
const sql = fs.readFileSync('./src/database/fix_tables.sql', 'utf8');
console.log('SQL file read successfully');

console.log('Executing SQL script...');
pool.query(sql)
  .then(() => {
    console.log('Tables fixed successfully');
    pool.end();
  })
  .catch(err => {
    console.error('Error fixing tables:', err);
    pool.end();
  }); 