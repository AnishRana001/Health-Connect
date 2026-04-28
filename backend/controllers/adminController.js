import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
export const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalDoctors, pendingKYC, approvedDoctors, totalAppointments] =
      await Promise.all([
        User.countDocuments(),
        Doctor.countDocuments(),
        Doctor.countDocuments({ verificationStatus: 'pending' }),
        Doctor.countDocuments({ verificationStatus: 'approved' }),
        Appointment.countDocuments(),
      ]);
    res.json({ totalUsers, totalDoctors, pendingKYC, approvedDoctors, totalAppointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all doctors (all statuses — admin view)
// @route   GET /api/admin/doctors
export const getAllDoctorsAdmin = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate('userId', 'name email createdAt')
      .sort({ createdAt: -1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve or reject a doctor (KYC verification)
// @route   PUT /api/admin/doctors/:id/verify
export const verifyDoctor = async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status. Use approved or rejected.' });
    }

    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    doctor.verificationStatus = status;
    doctor.verified           = status === 'approved';   // sync boolean
    doctor.verificationNote   = note || '';
    await doctor.save();

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
export const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
export const deleteUserAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all appointments (admin view)
// @route   GET /api/admin/appointments
export const getAllAppointmentsAdmin = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('userId', 'name email')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
