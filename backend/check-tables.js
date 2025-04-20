require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log('Checking tables in remote database...');

pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'')
  .then(res => {
    console.log('Tables in database:', res.rows);
    
    if (res.rows.length === 0) {
      console.log('No tables found. Creating tables...');
      const fs = require('fs');
      const initSQL = fs.readFileSync('./src/database/init.sql', 'utf8');
      
      return pool.query(initSQL)
        .then(() => {
          console.log('Tables created successfully');
          return pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
        })
        .then(newRes => {
          console.log('New tables:', newRes.rows);
        });
    }
  })
  .catch(err => {
    console.error('Error:', err);
  })
  .finally(() => {
    pool.end();
  }); 