const { sequelize } = require('./config/database');

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Test query
    const [results] = await sequelize.query('SELECT 1+1 AS result');
    console.log('Test query result:', results[0].result);
    
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

testConnection();
