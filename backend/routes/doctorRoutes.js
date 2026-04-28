import express from 'express';
import {
  getDoctors,
  getDoctorById,
  getMyDoctorProfile,
  manageDoctorProfile,
  uploadKYCDocuments,
} from '../controllers/doctorController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { uploadKYCDocs } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getDoctors);

// Protected Doctor routes — must come before /:id to avoid 'profile' being treated as an id
router.get('/profile/me', protect, authorizeRoles('doctor'), getMyDoctorProfile);
router.post('/profile', protect, authorizeRoles('doctor'), manageDoctorProfile);
router.post('/kyc', protect, authorizeRoles('doctor'), uploadKYCDocs, uploadKYCDocuments);

// Public route — after specific paths
router.get('/:id', getDoctorById);

export default router;
