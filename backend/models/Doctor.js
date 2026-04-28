import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    specialization: {
      type: String,
      required: true,
    },
    experience: {
      type: Number,
      required: true,
    },
    consultationFee: {
      type: Number,
      required: true,
    },
    availableDays: {
      type: [String],
      required: true,
    },
    availableTiming: {
      start: { type: String, required: true },
      end: { type: String, required: true },
    },
    about: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
