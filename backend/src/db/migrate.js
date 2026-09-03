require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function run() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('Applying schema...');
  await pool.query(schema);
  console.log('Schema applied successfully.');

  if (process.argv.includes('--seed')) {
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    console.log('Applying seed data...');
    await pool.query(seed);
    console.log('Seed data applied successfully.');
  }

  await pool.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
