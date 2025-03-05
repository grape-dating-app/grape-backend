const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
);

// Initialize PostGIS
const initPostGIS = async () => {
  try {
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('PostGIS extension initialized');
  } catch (error) {
    console.error('Error initializing PostGIS:', error);
  }
};

module.exports = { sequelize, initPostGIS }; 