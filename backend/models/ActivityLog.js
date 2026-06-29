import mongoose from 'mongoose';

// ── ActivityLog Model ──────────────────────────────────────────────────────────
// Records auditable actions across the platform.
// Displayed in the Admin Dashboard → Activity Log tab.

const activityLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      required: true,
    },

    // Short machine-readable verb
    action: {
      type: String,
      enum: [
        'appointment_booked',
        'appointment_confirmed',
        'appointment_cancelled',
        'doctor_approved',
        'doctor_rejected',
        'payment_completed',
      ],
      required: true,
    },

    // Human-readable sentence shown in the log
    description: { type: String, required: true },
  },
  {
    // createdAt acts as the "timestamp" field in the log
    timestamps: { createdAt: 'timestamp', updatedAt: false },
  }
);

// Index for admin dashboard: newest events first
activityLogSchema.index({ timestamp: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
