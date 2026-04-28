import express from 'express';
import { getDoctors, getDoctorById, manageDoctorProfile } from '../controllers/doctorController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getDoctors);
router.get('/:id', getDoctorById);

// Protected Doctor routes
router.post('/profile', protect, authorizeRoles('doctor'), manageDoctorProfile);

export default router;
