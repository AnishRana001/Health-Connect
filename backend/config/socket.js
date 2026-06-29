import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ── Module-level io reference ──────────────────────────────────────────────────
// Stored here so any module can call getIO() without circular imports.
let io;

/**
 * initSocket — attach Socket.IO to the existing HTTP server.
 *
 * @param {import('http').Server} httpServer  The Node http.Server created in server.js
 * @returns {import('socket.io').Server}       The initialised io instance
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    // Allow the Vite dev server (and production origin) to connect
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── Authentication middleware ──────────────────────────────────────────────
  // Runs before any event handler. Rejects unauthenticated connections.
  io.use(async (socket, next) => {
    try {
      // Token is sent via socket.handshake.auth.token (NOT query params)
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication error: no token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: user not found'));
      }

      // Attach user info to socket for later use in event handlers
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  // ── Connection handler ─────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Each user joins their own private room identified by their MongoDB _id.
    // This allows targeted delivery: io.to(userId).emit(...)
    socket.join(userId);

    console.log(`[Socket] User connected: ${socket.user.name} (${userId})`);

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] User disconnected: ${socket.user.name} — reason: ${reason}`);
    });
  });

  return io;
};

/**
 * getIO — retrieve the initialised Socket.IO instance from any module.
 *
 * @returns {import('socket.io').Server}
 * @throws  {Error} if called before initSocket
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialised. Call initSocket() first.');
  }
  return io;
};
