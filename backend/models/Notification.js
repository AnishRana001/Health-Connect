import mongoose from 'mongoose';

// ── Notification Model ─────────────────────────────────────────────────────────
// Stores all real-time + persisted notifications sent to users.
// Each notification belongs to exactly one recipient and has an optional
// linked appointment and sender.

const notificationSchema = new mongoose.Schema(
  {
    // The user who should see this notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Role helps frontend decide icon/colour without an extra lookup
    recipientRole: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      required: true,
    },

    // Who triggered the notification (nullable for system events)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Machine-readable event type (used to pick icon/colour on the frontend)
    type: {
      type: String,
      enum: [
        'appointment_booked',
        'appointment_confirmed',
        'appointment_cancelled',
        'doctor_verified',
        'doctor_rejected',
        'payment_success',
      ],
      required: true,
    },

    title:   { type: String, required: true },
    message: { type: String, required: true },

    // Optional link back to the appointment document
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },

    // Read state
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Optimise the most common query: "fetch all notifications for recipient X,
// newest first, with unread count badge"
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
