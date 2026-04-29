import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import { generateSlots } from './availabilityController.js';

/* helper: short weekday from YYYY-MM-DD using UTC to avoid tz shift */
const dayShortName = (dateStr) => {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d))
    .toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
};

/* helper: generate a mock transaction ID like HC-20260429-A3F9B2 */
const generateTransactionId = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `HC-${date}-${rand}`;
};

// @desc    Release expired pending appointments (slot auto-cleanup)
// @called  On every bookAppointment request (lazy cleanup) + admin endpoint
export const releaseExpiredReservations = async () => {
  try {
    const result = await Appointment.updateMany(
      {
        paymentStatus: 'unpaid',
        reservationExpiresAt: { $lt: new Date() },
        status: 'pending',
      },
      {
        $set: { status: 'cancelled', paymentStatus: 'failed' },
      }
    );
    return result.modifiedCount;
  } catch (err) {
    console.error('Auto-release cleanup error:', err.message);
    return 0;
  }
};

// @desc    Book an appointment (with full slot validation)
// @route   POST /api/appointments
// @access  Private/Patient
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;

    // ── 0. Lazy cleanup: release any expired pending reservations ──────────
    await releaseExpiredReservations();

    // ── 1. Doctor exists and is approved ──────────────────────────────────
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }
    if (doctor.verificationStatus !== 'approved') {
      return res.status(403).json({
        message: 'This doctor is not yet verified and cannot accept appointments.',
      });
    }

    // ── 2. Validate working day ───────────────────────────────────────────
    const dayName     = dayShortName(date);
    const isAllDays   = doctor.availableDays.some((d) => d.toLowerCase() === 'all');
    const workingDays = isAllDays
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : doctor.availableDays.map((d) => d.substring(0, 3));
    if (!workingDays.includes(dayName)) {
      return res.status(400).json({
        message: `Doctor does not work on ${dayName}. Available days: ${doctor.availableDays.join(', ')}.`,
      });
    }

    // ── 3. Validate not on vacation / unavailable date ────────────────────
    if (doctor.unavailableDates.includes(date)) {
      return res.status(400).json({
        message: 'Doctor is unavailable on this date.',
      });
    }

    // ── 4. Validate slot exists within working hours ──────────────────────
    const { allSlots } = await generateSlots(doctor, date);
    if (!allSlots.includes(time)) {
      return res.status(400).json({
        message: `${time} is not a valid slot. Slots are every ${doctor.slotDuration || 30} minutes between ${doctor.availableTiming.start} and ${doctor.availableTiming.end}.`,
      });
    }

    // ── 5. Double-booking prevention (excluding expired pending) ──────────
    const conflict = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $nin: ['cancelled'] },
      // Only block if still within reservation window OR already paid/confirmed
      $or: [
        { paymentStatus: { $in: ['paid', 'pay_at_clinic'] } },
        { paymentStatus: 'unpaid', reservationExpiresAt: { $gt: new Date() } },
      ],
    });
    if (conflict) {
      return res.status(409).json({
        message: 'This slot has already been booked. Please choose another time.',
      });
    }

    // ── 6. Create appointment with 15-min reservation window ─────────────
    const appointment = await Appointment.create({
      userId: req.user._id,
      doctorId,
      date,
      time,
      reason,
      status: 'pending',
      paymentStatus: 'unpaid',
      reservationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm payment for an appointment
// @route   PUT /api/appointments/:id/pay
// @access  Private/Patient
export const confirmPayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    const validMethods = ['upi', 'card', 'netbanking', 'cash'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method.' });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Ownership check
    if (appointment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    // Check reservation has not expired
    if (
      appointment.paymentStatus === 'unpaid' &&
      appointment.reservationExpiresAt < new Date()
    ) {
      appointment.status = 'cancelled';
      appointment.paymentStatus = 'failed';
      await appointment.save();
      return res.status(410).json({
        message: 'Your reservation has expired. Please book a new slot.',
      });
    }

    // Already paid?
    if (['paid', 'pay_at_clinic'].includes(appointment.paymentStatus)) {
      return res.status(409).json({ message: 'Payment already completed.' });
    }

    // Simulate payment
    appointment.paymentMethod = paymentMethod;

    if (paymentMethod === 'cash') {
      appointment.paymentStatus = 'pay_at_clinic';
      appointment.status = 'confirmed';
      appointment.mockTransactionId = null; // no digital txn for cash
    } else {
      appointment.paymentStatus = 'paid';
      appointment.status = 'confirmed';
      appointment.mockTransactionId = generateTransactionId();
    }

    const updated = await appointment.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user appointments
// @route   GET /api/appointments/myappointments
// @access  Private/Patient
export const getUserAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user._id })
      .populate('doctorId')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' }
      });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor's appointments
// @route   GET /api/appointments/doctorappointments
// @access  Private/Doctor
export const getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate('userId', 'name email');
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.status = status;
    const updatedAppointment = await appointment.save();

    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all appointments (kept for backward compat — admin now uses /api/admin/appointments)
// @route   GET /api/appointments/admin/all
// @access  Private/Admin
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('userId', 'name email')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' }
      });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update prescription and medicines for an appointment
// @route   PUT /api/appointments/:id/prescription
// @access  Private/Doctor
export const addPrescription = async (req, res) => {
  try {
    const { prescription, medicines } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.prescription = prescription;
    appointment.medicines = medicines || [];

    // Automatically complete the appointment when a prescription is added
    if (appointment.status !== 'completed' && appointment.status !== 'cancelled') {
      appointment.status = 'completed';
    }

    const updatedAppointment = await appointment.save();
    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: release all expired pending reservations manually
// @route   POST /api/appointments/admin/release-expired
// @access  Private/Admin
export const adminReleaseExpired = async (req, res) => {
  try {
    const count = await releaseExpiredReservations();
    res.json({ message: `Released ${count} expired reservation(s).`, count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
