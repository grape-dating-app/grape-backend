// File: src/config/db.js

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.POSTGRES_CONNECTION_STRING) {
  console.error('POSTGRES_CONNECTION_STRING is not set in environment variables');
  process.exit(1);
}

// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err.message);
    process.exit(1);
  }
  console.log('PostgreSQL connected successfully');
  release();
});

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = {
  supabase,
  pool
}; 