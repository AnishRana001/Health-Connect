import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  getLatestNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// GET  /api/notifications              — paginated list
// GET  /api/notifications/unread-count — bell badge number
// GET  /api/notifications/latest       — top 5 for dropdown
// PUT  /api/notifications/read-all     — bulk mark read
// PUT  /api/notifications/:id/read     — single mark read
router.get('/',              getNotifications);
router.get('/unread-count',  getUnreadCount);
router.get('/latest',        getLatestNotifications);
router.put('/read-all',      markAllAsRead);
router.put('/:id/read',      markAsRead);

export default router;
