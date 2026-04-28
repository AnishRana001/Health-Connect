import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';

// @desc    Book an appointment
// @route   POST /api/appointments
// @access  Private/Patient
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;

    const appointment = await Appointment.create({
      userId: req.user._id, // User booking the appointment
      doctorId,
      date,
      time,
      reason,
    });

    res.status(201).json(appointment);
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
    // Determine the doctor profile based on logged in user ID
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
// Allows Doctors to Confirm/Cancel/Complete, Patients to Cancel.
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

// @desc    Get all appointments
// @route   GET /api/appointments
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
}

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
    
    // Automatically complete the appointment if a prescription is added/updated
    if (appointment.status !== 'completed' && appointment.status !== 'cancelled') {
        appointment.status = 'completed';
    }

    const updatedAppointment = await appointment.save();
    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
