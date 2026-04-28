import Doctor from '../models/Doctor.js';
import User from '../models/User.js';

// @desc    Get all doctors
// @route   GET /api/doctors
export const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('userId', 'name email');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email');
    if (doctor) {
      res.json(doctor);
    } else {
      res.status(404).json({ message: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update doctor profile
// @route   POST /api/doctors/profile
// @access  Private/Doctor
export const manageDoctorProfile = async (req, res) => {
  try {
    const { specialization, experience, consultationFee, availableDays, availableTiming, about } = req.body;

    let doctor = await Doctor.findOne({ userId: req.user._id });

    if (doctor) {
      // Update
      doctor.specialization = specialization || doctor.specialization;
      doctor.experience = experience || doctor.experience;
      doctor.consultationFee = consultationFee || doctor.consultationFee;
      doctor.availableDays = availableDays || doctor.availableDays;
      doctor.availableTiming = availableTiming || doctor.availableTiming;
      doctor.about = about || doctor.about;

      const updatedDoctor = await doctor.save();
      res.json(updatedDoctor);
    } else {
      // Create
      doctor = await Doctor.create({
        userId: req.user._id,
        specialization,
        experience,
        consultationFee,
        availableDays,
        availableTiming,
        about,
      });
      res.status(201).json(doctor);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
