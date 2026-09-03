require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../src/config/db');

async function migrate() {
  try {
    console.log('Adding cloudinary columns to supplier_invoices table...');
    console.log('Connected to:', process.env.DB_HOST);

    await pool.query(`
      ALTER TABLE supplier_invoices
      ADD COLUMN IF NOT EXISTS cloudinary_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS cloudinary_id VARCHAR(255)
    `);

    console.log('✓ Columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
