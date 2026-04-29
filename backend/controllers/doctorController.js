import Doctor from '../models/Doctor.js';

// @desc    Get all APPROVED doctors (public listing)
// @route   GET /api/doctors
export const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ verificationStatus: 'approved' }).populate('userId', 'name email');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor by ID — only approved doctors visible publicly
// @route   GET /api/doctors/:id
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email');
    if (doctor && doctor.verificationStatus === 'approved') {
      res.json(doctor);
    } else {
      res.status(404).json({ message: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get the logged-in doctor's own profile (for pre-populating the dashboard form)
// @route   GET /api/doctors/profile/me
// @access  Private/Doctor
export const getMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    res.json(doctor || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update doctor profile (text fields only)
// @route   POST /api/doctors/profile
// @access  Private/Doctor
export const manageDoctorProfile = async (req, res) => {
  try {
    const {
      specialization, experience, consultationFee,
      availableDays, availableTiming, about,
      licenseNumber, hospitalAffiliation, slotDuration,
    } = req.body;

    let doctor = await Doctor.findOne({ userId: req.user._id });

    if (doctor) {
      doctor.specialization      = specialization      ?? doctor.specialization;
      doctor.experience           = experience          ?? doctor.experience;
      doctor.consultationFee      = consultationFee     ?? doctor.consultationFee;
      doctor.availableDays        = availableDays       ?? doctor.availableDays;
      doctor.availableTiming      = availableTiming     ?? doctor.availableTiming;
      doctor.about                = about               ?? doctor.about;
      doctor.licenseNumber        = licenseNumber       ?? doctor.licenseNumber;
      doctor.hospitalAffiliation  = hospitalAffiliation ?? doctor.hospitalAffiliation;
      if (slotDuration !== undefined) doctor.slotDuration = slotDuration;

      const updated = await doctor.save();
      res.json(updated);
    } else {
      doctor = await Doctor.create({
        userId: req.user._id,
        specialization,
        experience,
        consultationFee,
        availableDays,
        availableTiming,
        about,
        licenseNumber:       licenseNumber       || '',
        hospitalAffiliation: hospitalAffiliation || '',
        slotDuration:        slotDuration        || 30,
      });
      res.status(201).json(doctor);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload KYC documents to Cloudinary
// @route   POST /api/doctors/kyc
// @access  Private/Doctor
export const uploadKYCDocuments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        message: 'Please save your profile before uploading documents.',
      });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No files were uploaded.' });
    }

    // multer-storage-cloudinary puts the Cloudinary URL in file.path
    // and the public_id in file.filename
    const mapFile = (f) => ({
      url:          f.path,
      publicId:     f.filename,
      originalName: f.originalname,
    });

    if (req.files.licenseDocument) doctor.documents.licenseDocument = mapFile(req.files.licenseDocument[0]);
    if (req.files.medicalDegree)   doctor.documents.medicalDegree   = mapFile(req.files.medicalDegree[0]);
    if (req.files.governmentId)    doctor.documents.governmentId    = mapFile(req.files.governmentId[0]);

    // Re-trigger review when new docs are uploaded after rejection
    if (doctor.verificationStatus === 'rejected') {
      doctor.verificationStatus = 'pending';
      doctor.verified           = false;
      doctor.verificationNote   = '';
    }

    const updated = await doctor.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
