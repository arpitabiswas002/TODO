const { neon } = require('@netlify/neon');
const sql = neon(); // Automatically uses NETLIFY_DATABASE_URL

// Initialize database tables
const initDatabase = async () => {
    try {
        console.log('Starting database initialization...');
        console.log('Database URL:', process.env.NETLIFY_DATABASE_URL);

        // First check if the database connection works
        console.log('Testing database connection...');
        const testResult = await sql`SELECT 1 + 1`;
        console.log('Database connection test result:', testResult);

        // Check if tables already exist
        console.log('Checking for existing tables...');
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'todos')
        `;
        console.log('Existing tables:', tables);

        // Create tables if they don't exist
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS todos (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                completed BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Verify tables were created
        const tablesAfter = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'todos')
        `;
        console.log('Tables after initialization:', tablesAfter);

        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error; // Rethrow error to make it visible in the logs
    }
};

// Initialize tables on startup
initDatabase();

module.exports = {
    query: async (query, params = []) => {
        try {
            console.log('Executing query:', query);
            console.log('With params:', params);
            const result = await sql`${query}`;
            console.log('Query result:', result);
            return result;
        } catch (error) {
            console.error('Database error:', error);
            throw error; // Rethrow error to make it visible in the logs
        }
    }
};
