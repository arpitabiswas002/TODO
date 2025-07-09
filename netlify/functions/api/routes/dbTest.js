const db = require('../config/db');

const dbTest = (app) => {
    app.get('/test', async (req, res) => {
        try {
            // Test database connection
            console.log('Testing database connection...');
            const testResult = await db.query('SELECT 1 + 1 AS result');
            console.log('Test query result:', testResult);

            // Check tables
            const tables = await db.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `);
            console.log('Existing tables:', tables);

            // Try a simple query
            const users = await db.query('SELECT * FROM users LIMIT 1');
            console.log('Users query result:', users);

            res.json({
                success: true,
                message: 'Database connection test successful',
                data: {
                    testResult: testResult[0].result,
                    tables: tables.map(t => t.table_name),
                    usersCount: users.length
                }
            });
        } catch (error) {
            console.error('Database test error:', error);
            res.status(500).json({
                error: 'Database test failed',
                details: error.message
            });
        }
    });
};

module.exports = dbTest;
