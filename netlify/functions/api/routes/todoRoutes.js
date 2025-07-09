const db = require('../config/db');

const todoRoutes = (app) => {
    app.get('/todos', async (req, res) => {
        try {
            const result = await db.query('SELECT * FROM todos ORDER BY created_at DESC');
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/todos', async (req, res) => {
        const { title, description } = req.body;
        
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        try {
            const result = await db.query(
                'INSERT INTO todos (title, description, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING *',
                [title, description]
            );
            res.status(201).json(result[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.put('/todos/:id', async (req, res) => {
        const { id } = req.params;
        const { title, description, completed } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        try {
            const result = await db.query(
                'UPDATE todos SET title = $1, description = $2, completed = $3 WHERE id = $4 RETURNING *',
                [title, description, completed, id]
            );

            if (result.length === 0) {
                return res.status(404).json({ error: 'Todo not found' });
            }

            res.json(result[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.delete('/todos/:id', async (req, res) => {
        const { id } = req.params;

        try {
            const result = await db.query(
                'DELETE FROM todos WHERE id = $1 RETURNING *',
                [id]
            );

            if (result.length === 0) {
                return res.status(404).json({ error: 'Todo not found' });
            }

            res.json({ message: 'Todo deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
};

module.exports = todoRoutes;
