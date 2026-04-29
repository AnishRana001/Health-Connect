import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';

/* ── helpers ──────────────────────────────────────────────────────────── */

/**
 * Convert "HH:MM" → total minutes from midnight.
 */
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Convert total minutes → zero-padded "HH:MM".
 */
const toHHMM = (mins) => {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

/**
 * Get short weekday name ("Mon", "Tue", …) from a YYYY-MM-DD string.
 * Uses UTC to avoid local-timezone day-shift bugs.
 */
const dayShortName = (dateStr) => {
  const [y, mo, d] = dateStr.split('-').map(Number);
  // Date.UTC so we stay in UTC – avoids +5:30 / -X shifting the date
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
};

/**
 * Generate all slot start-times for a doctor on a given date,
 * then subtract already-booked ones.
 *
 * @returns {{ allSlots: string[], bookedSlots: string[], availableSlots: string[] }}
 */
export const generateSlots = async (doctor, dateStr) => {
  const { start, end } = doctor.availableTiming;
  const duration = doctor.slotDuration || 30;

  const startMins = toMinutes(start);
  const endMins   = toMinutes(end);

  const allSlots = [];
  for (let t = startMins; t + duration <= endMins; t += duration) {
    allSlots.push(toHHMM(t));
  }

  // Fetch non-cancelled appointments on that day for this doctor
  const booked = await Appointment.find({
    doctorId: doctor._id,
    date:     dateStr,
    status:   { $nin: ['cancelled'] },
  }).select('time');

  const bookedSlots = booked.map((a) => a.time);
  const availableSlots = allSlots.filter((s) => !bookedSlots.includes(s));

  return { allSlots, bookedSlots, availableSlots };
};

/* ── controllers ──────────────────────────────────────────────────────── */

// @desc    Get available slots for a doctor on a specific date
// @route   GET /api/availability/:doctorId/slots?date=YYYY-MM-DD
// @access  Public
export const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date }     = req.query; // YYYY-MM-DD

    if (!date) {
      return res.status(400).json({ message: 'Query param `date` is required (YYYY-MM-DD).' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.verificationStatus !== 'approved') {
      return res.status(404).json({ message: 'Doctor not found or not approved.' });
    }

    // Validate working day
    const dayName     = dayShortName(date);
    // availableDays may be stored as full names ("Monday"), short ("Mon"), or the
    // legacy value "all" meaning every day is a working day.
    const isAllDays   = doctor.availableDays.some((d) => d.toLowerCase() === 'all');
    const workingDays = isAllDays
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : doctor.availableDays.map((d) => d.substring(0, 3));
    if (!workingDays.includes(dayName)) {
      return res.status(200).json({
        date,
        available: [],
        reason: 'Doctor does not work on this day.',
      });
    }

    // Validate not on vacation
    if (doctor.unavailableDates.includes(date)) {
      return res.status(200).json({
        date,
        available: [],
        reason: 'Doctor is unavailable on this date.',
      });
    }

    const { availableSlots, bookedSlots, allSlots } = await generateSlots(doctor, date);

    return res.json({
      date,
      slotDuration: doctor.slotDuration || 30,
      allSlots,
      bookedSlots,
      available: availableSlots,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a date to doctor's unavailable list (vacation / day off)
// @route   POST /api/availability/unavailable
// @access  Private/Doctor
export const addUnavailableDate = async (req, res) => {
  try {
    const { date } = req.body; // YYYY-MM-DD
    if (!date) {
      return res.status(400).json({ message: '`date` field is required (YYYY-MM-DD).' });
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    if (!doctor.unavailableDates.includes(date)) {
      doctor.unavailableDates.push(date);
      await doctor.save();
    }

    res.json({ unavailableDates: doctor.unavailableDates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a date from doctor's unavailable list
// @route   DELETE /api/availability/unavailable/:date
// @access  Private/Doctor
export const removeUnavailableDate = async (req, res) => {
  try {
    const { date } = req.params;

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    doctor.unavailableDates = doctor.unavailableDates.filter((d) => d !== date);
    await doctor.save();

    res.json({ unavailableDates: doctor.unavailableDates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get the doctor's own unavailable dates list
// @route   GET /api/availability/unavailable/me
// @access  Private/Doctor
export const getMyUnavailableDates = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id }).select('unavailableDates slotDuration');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }
    res.json({ unavailableDates: doctor.unavailableDates, slotDuration: doctor.slotDuration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
