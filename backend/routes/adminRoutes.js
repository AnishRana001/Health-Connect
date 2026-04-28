import express from 'express';
import {
  getDashboardStats,
  getAllDoctorsAdmin,
  verifyDoctor,
  getAllUsersAdmin,
  deleteUserAdmin,
  getAllAppointmentsAdmin,
} from '../controllers/adminController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, authorizeRoles('admin'));

router.get('/stats', getDashboardStats);
router.get('/doctors', getAllDoctorsAdmin);
router.put('/doctors/:id/verify', verifyDoctor);
router.get('/users', getAllUsersAdmin);
router.delete('/users/:id', deleteUserAdmin);
router.get('/appointments', getAllAppointmentsAdmin);

export default router;
