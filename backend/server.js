import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';

// ── Route imports ──────────────────────────────────────────────────────────────
import authRoutes         from './routes/authRoutes.js';
import doctorRoutes       from './routes/doctorRoutes.js';
import appointmentRoutes  from './routes/appointmentRoutes.js';
import adminRoutes        from './routes/adminRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';

// ── NEW: Socket.IO + Notification routes ───────────────────────────────────────
import { initSocket }       from './config/socket.js';
import notificationRoutes   from './routes/notificationRoutes.js';

// Guard: JWT secret required
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  process.exit(1);
}

// Cloudinary warning (optional safety check)
const cloudinaryVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingCloudinary = cloudinaryVars.filter(
  key => !process.env[key] || process.env[key].startsWith('your_')
);

if (missingCloudinary.length) {
  console.warn(
    `⚠ Cloudinary not configured (${missingCloudinary.join(', ')}). Document uploads may fail.`
  );
}

// Connect DB
connectDB();

const app = express();

// Middleware
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = [
  clientOrigin,
  clientOrigin.endsWith('/') ? clientOrigin.slice(0, -1) : `${clientOrigin}/`
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/doctors',       doctorRoutes);
app.use('/api/appointments',  appointmentRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/availability',  availabilityRoutes);
app.use('/api/notifications', notificationRoutes);   // NEW

// Test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// ── HTTP Server + Socket.IO ───────────────────────────────────────────────────
// We wrap Express with Node's http.Server so Socket.IO can share the same port.
const httpServer = http.createServer(app);

// Initialise Socket.IO (JWT auth middleware + room joining is handled inside)
initSocket(httpServer);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO attached on ws://localhost:${PORT}`);
});