import express from 'express';
import {
  bookAppointment,
  getUserAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  getAllAppointments,
  addPrescription,
  confirmPayment,
  adminReleaseExpired,
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

// Payment confirmation (patient only)
router.route('/:id/pay').put(protect, authorizeRoles('patient'), confirmPayment);

// Admin routes
router.route('/admin/all').get(protect, authorizeRoles('admin'), getAllAppointments);
router.route('/admin/release-expired').post(protect, authorizeRoles('admin'), adminReleaseExpired);

export default router;
