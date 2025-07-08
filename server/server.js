const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const colors = require('colors');
const cors = require('cors');
const db = require('./models');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Your client's URL
    methods: ['GET', 'POST'],
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

// Sync database
db.sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced successfully.'.cyan.bold);
});

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Todo MERN API');
});

// Import routes
const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const activities = require('./routes/activities');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/activities', activities);

// Error handling middleware
const errorHandler = require('./middleware/error');
app.use(errorHandler);

// Start server
io.on('connection', (socket) => {
  console.log('a user connected'.cyan);
  socket.on('disconnect', () => {
    console.log('user disconnected'.yellow);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
});
