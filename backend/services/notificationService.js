import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import { getIO } from '../config/socket.js';

// ── NotificationService ────────────────────────────────────────────────────────
// Single responsibility: controllers call NotificationService.send(...)
// and this service handles:
//   1. Persisting the notification in MongoDB
//   2. Emitting the Socket.IO event to the recipient's room
//   3. Graceful error handling (a notification failure should not crash the API)

const NotificationService = {
  /**
   * send — create and deliver a notification.
   *
   * @param {object} params
   * @param {string}  params.recipientId   Recipient user _id (string)
   * @param {string}  params.recipientRole 'patient' | 'doctor' | 'admin'
   * @param {string}  [params.senderId]    Sender user _id (optional)
   * @param {string}  params.type          Notification type enum value
   * @param {string}  params.title         Short heading (e.g. "Appointment Confirmed")
   * @param {string}  params.message       Full body text
   * @param {string}  [params.appointmentId] Linked appointment _id (optional)
   */
  send: async ({
    recipientId,
    recipientRole,
    senderId = null,
    type,
    title,
    message,
    appointmentId = null,
  }) => {
    try {
      // 1. Persist to MongoDB
      const notification = await Notification.create({
        recipient:     recipientId,
        recipientRole,
        sender:        senderId,
        type,
        title,
        message,
        appointmentId,
      });

      // 2. Emit real-time event to the recipient's private room
      try {
        const io = getIO();
        io.to(recipientId.toString()).emit('new_notification', {
          _id:           notification._id,
          type:          notification.type,
          title:         notification.title,
          message:       notification.message,
          appointmentId: notification.appointmentId,
          isRead:        notification.isRead,
          createdAt:     notification.createdAt,
        });
      } catch (socketErr) {
        // Socket.IO not yet ready or user is offline — notification is still saved to DB
        console.warn('[NotificationService] Socket emit skipped:', socketErr.message);
      }

      return notification;
    } catch (err) {
      // Log the error but DO NOT re-throw — notifications must never fail the main request
      console.error('[NotificationService] Failed to send notification:', err.message);
      return null;
    }
  },
};

// ── ActivityLogService ─────────────────────────────────────────────────────────
// Writes an immutable audit entry. Called alongside NotificationService.send
// wherever an admin-visible action occurs.

export const ActivityLogService = {
  /**
   * log — create an activity log entry.
   *
   * @param {object} params
   * @param {string} params.userId      The acting user's _id
   * @param {string} params.role        Role of the acting user
   * @param {string} params.action      Machine-readable action enum
   * @param {string} params.description Human-readable sentence
   */
  log: async ({ userId, role, action, description }) => {
    try {
      await ActivityLog.create({ user: userId, role, action, description });
    } catch (err) {
      console.error('[ActivityLogService] Failed to write log:', err.message);
    }
  },
};

export default NotificationService;
