const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'restaurantos',
  max: 20,
  idleTimeoutMillis: 30000,
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('neon') ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err);
});

module.exports = pool;
