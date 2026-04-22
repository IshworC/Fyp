import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import config from './config/config.js';

// Load environment variables
dotenv.config();

// ES Module dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoute from './route/authRoute.js';
import venueRoute from './route/venueRoute.js';
import bookingRoute from './route/bookingRoute.js';
import otpRoutes from './route/otpRoutes.js';
import venueRegistrationRoute from './route/venueRegistrationRoute.js';
import notificationRoute from './route/notificationRoute.js';
import contactRoute from './route/contactRoute.js';
import menuRoute from './route/menuRoute.js';
import packageRoute from './route/packageRoute.js';
import esewaRoute from './route/esewa.routes.js';
import createChatRouter from './route/chatRoute.js';
import initCronJobs from './jobs/cronJob.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log('✓ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  });

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'SAN - Venue Booking System API',
    version: '1.0.0',
    status: 'running'
  });
});

// Routes
app.use('/api/auth', authRoute);
app.use('/api/venues', venueRoute);
app.use('/api/bookings', bookingRoute);
app.use('/api/otp', otpRoutes);
app.use('/api/venue-registration', venueRegistrationRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/contact', contactRoute);
app.use('/api/menus', menuRoute);
app.use('/api/packages', packageRoute);
app.use('/api/esewa', esewaRoute);

// Create HTTP server and attach Socket.IO
const PORT = config.port;
const server = http.createServer(app);
const io = new IOServer(server, { cors: { origin: '*' } });

// Simple socket handling: clients register with their userId and join a room by userId
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('register', (userId) => {
    if (!userId) return;
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room ${userId}`);
  });

  // Typing indicators
  socket.on('typing', ({ recipientId }) => {
    if (recipientId) {
      socket.to(recipientId).emit('userTyping', { userId: socket.userId || 'unknown' });
    }
  });

  socket.on('stopTyping', ({ recipientId }) => {
    if (recipientId) {
      socket.to(recipientId).emit('userStopTyping', { userId: socket.userId || 'unknown' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Mount chat route with io
app.use('/api/chat', createChatRouter(io));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

// Start HTTP server (Socket.IO attached)
server.listen(PORT, () => {
  console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${config.nodeEnv}\n`);
  
  // Initialize cron jobs
  initCronJobs();
});
