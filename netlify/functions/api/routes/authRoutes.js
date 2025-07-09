const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const authRoutes = (app) => {
    // Register new user
    app.post('/register', async (req, res) => {
        try {
            // Log the raw request body
            console.log('Raw request body:', JSON.stringify(req.body, null, 2));

            // Get the request body
            const body = req.body;
            if (!body) {
                console.error('No request body received');
                return res.status(400).json({ 
                    error: 'Invalid request',
                    details: 'No request body received'
                });
            }

            // Validate request body
            if (typeof body !== 'object') {
                console.error('Invalid request body format', body);
                return res.status(400).json({ 
                    error: 'Invalid request',
                    details: 'Request body must be a valid object'
                });
            }

            // Extract required fields
            const { name, email, password } = body;
            if (!name || !email || !password) {
                console.error('Missing required fields', { name, email, password });
                return res.status(400).json({ 
                    error: 'Missing required fields',
                    details: 'Please provide name, email, and password'
                });
            }

            console.log('Attempting to register user:', { email });

            // Check if user already exists
            try {
                const existingUser = await db.query`SELECT * FROM users WHERE email = ${email}`;
                if (existingUser.length > 0) {
                    console.log('User already exists:', { email });
                    return res.status(400).json({ 
                        error: 'User already exists',
                        details: 'A user with this email already exists'
                    });
                }
            } catch (dbError) {
                console.error('Database query error:', dbError);
                return res.status(500).json({ 
                    error: 'Database error',
                    details: 'Failed to check user existence'
                });
            }

            // Hash password
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                console.log('Password hashed successfully');

                // Create new user
                const result = await db.query`
                    INSERT INTO users (name, email, password, created_at) 
                    VALUES (${name}, ${email}, ${hashedPassword}, CURRENT_TIMESTAMP) 
                    RETURNING *
                `;
                console.log('User created successfully:', { userId: result[0].id });

                // Create JWT token
                try {
                    const token = jwt.sign(
                        { userId: result[0].id },
                        process.env.JWT_SECRET,
                        { expiresIn: '7d' }
                    );

                    res.status(201).json({
                        success: true,
                        message: 'User registered successfully',
                        data: {
                            token,
                            user: {
                                id: result[0].id,
                                name: result[0].name,
                                email: result[0].email
                            }
                        }
                    });
                } catch (jwtError) {
                    console.error('JWT error:', jwtError);
                    return res.status(500).json({ 
                        error: 'Token generation failed',
                        details: jwtError.message
                    });
                }
            } catch (bcryptError) {
                console.error('Password hashing error:', bcryptError);
                return res.status(500).json({ 
                    error: 'Password processing failed',
                    details: bcryptError.message
                });
            }
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ 
                error: 'Registration failed',
                details: error.message 
            });
        }
    });

    // Login user
    app.post('/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ 
                    error: 'Invalid credentials',
                    details: 'Please provide both email and password'
                });
            }

            // Find user
            const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);

            if (user.length === 0) {
                return res.status(401).json({ 
                    error: 'Invalid credentials',
                    details: 'User not found'
                });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user[0].password);
            if (!isValidPassword) {
                return res.status(401).json({ 
                    error: 'Invalid credentials',
                    details: 'Incorrect password'
                });
            }

            // Create JWT token
            const token = jwt.sign(
                { userId: user[0].id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    user: {
                        id: user[0].id,
                        name: user[0].name,
                        email: user[0].email
                    }
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ 
                error: 'Login failed',
                details: error.message 
            });
        }
    });

    // Get current user (protected route)
    app.get('/me', async (req, res) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ 
                    error: 'Unauthorized',
                    details: 'No token provided'
                });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await db.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);

            if (user.length === 0) {
                return res.status(404).json({ 
                    error: 'Not found',
                    details: 'User not found'
                });
            }

            res.json({
                success: true,
                data: {
                    user: {
                        id: user[0].id,
                        name: user[0].name,
                        email: user[0].email
                    }
                }
            });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(401).json({ 
                error: 'Unauthorized',
                details: error.message 
            });
        }
    });
};

module.exports = authRoutes;
