const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const colors = require('colors');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io middleware to attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Todo MERN API with MongoDB');
});

// Import routes
const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const activityRoutes = require('./routes/activities');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/activities', activityRoutes);

// Error handling middleware (should be after all other middleware and routes)
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`.yellow.bold);
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('A user connected'.cyan.bold);

  // Handle todo updates
  socket.on('todoUpdated', (todo) => {
    io.emit('todoUpdated', todo);
  });

  // Handle activity creation
  socket.on('activityCreated', (activity) => {
    io.emit('activityCreated', activity);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected'.red.bold);
  });
});
