import mongoose from 'mongoose';

const documentSlot = {
  url:          { type: String, default: '' },
  publicId:     { type: String, default: '' },
  originalName: { type: String, default: '' },
};

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
      end:   { type: String, required: true },
    },
    slotDuration: {
      type: Number,
      default: 30, // minutes per appointment slot
      min: 10,
      max: 120,
    },
    unavailableDates: {
      type: [String], // YYYY-MM-DD strings for blocked / vacation dates
      default: [],
    },
    about: {
      type: String,
    },

    // ── KYC / Verification ────────────────────────────────────────────────
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    licenseNumber: {
      type: String,
      default: '',
    },
    hospitalAffiliation: {
      type: String,
      default: '',
    },
    verificationNote: {
      type: String,
      default: '',
    },

    // ── Cloudinary document uploads ───────────────────────────────────────
    documents: {
      licenseDocument: documentSlot,   // Medical License Certificate
      medicalDegree:   documentSlot,   // Degree Certificate
      governmentId:    documentSlot,   // Government-issued ID
    },
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
