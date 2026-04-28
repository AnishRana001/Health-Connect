import express from 'express';
import {
  bookAppointment,
  getUserAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  getAllAppointments,
  addPrescription
} from '../controllers/appointmentController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Patient routes
router.route('/').post(protect, authorizeRoles('patient'), bookAppointment);
router.route('/myappointments').get(protect, authorizeRoles('patient'), getUserAppointments);

// Doctor routes
router.route('/doctorappointments').get(protect, authorizeRoles('doctor'), getDoctorAppointments);

// Shared/Specific Update Status (Patient canceling, Doctor confirming)
router.route('/:id/status').put(protect, authorizeRoles('doctor', 'patient', 'admin'), updateAppointmentStatus);
router.route('/:id/prescription').put(protect, authorizeRoles('doctor'), addPrescription);

// Admin routes
router.route('/').get(protect, authorizeRoles('admin'), getAllAppointments);

export default router;
