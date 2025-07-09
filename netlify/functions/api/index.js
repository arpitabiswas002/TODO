const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add pre-flight request handling
app.options('*', cors(corsOptions));

// Authentication middleware
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                error: 'Unauthorized',
                details: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ 
            error: 'Unauthorized',
            details: error.message 
        });
    }
};

// Import routes
const todoRoutes = require('./routes/todoRoutes');
const authRoutes = require('./routes/authRoutes');
const dbTest = require('./routes/dbTest');

// Use routes
app.use('/auth', authRoutes(app));
app.use('/todos', authMiddleware, todoRoutes(app));
app.use('/test', dbTest(app));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Netlify function handler
module.exports.handler = async (event, context) => {
    return new Promise((resolve, reject) => {
        app(event, context, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};
