import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    userId: { // The Patient
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    doctorId: { // The Doctor 
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Doctor',
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    time: {
      type: String, // HH:MM
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    reason: {
      type: String,
      required: true,
    },
    prescription: {
      type: String,
      default: '',
    },
    medicines: [{
      name: { type: String, required: true },
      dosage: { type: String, required: true }, // e.g., "1-0-1"
      duration: { type: Number, required: true }, // number of days
      startDate: { type: String, required: true }, // YYYY-MM-DD
    }],
  },
  {
    timestamps: true,
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
