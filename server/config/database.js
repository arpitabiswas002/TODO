const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create a new Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'todo_mern_app',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'Aritanda1*',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: console.log, // Enable SQL query logging
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
);

// Test the database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the MySQL database:', error);
  }
};

module.exports = {
  sequelize,
  testConnection
};
