// File: src/config/db.js

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('PostgreSQL connected successfully');
  }
});

module.exports = {
  supabase,
  pool
}; 