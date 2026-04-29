import express from 'express';
import {
  getAvailableSlots,
  addUnavailableDate,
  removeUnavailableDate,
  getMyUnavailableDates,
} from '../controllers/availabilityController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public — patients query available slots before booking
router.get('/:doctorId/slots', getAvailableSlots);

// Doctor-only — manage unavailable / vacation dates
router.get('/unavailable/me',        protect, authorizeRoles('doctor'), getMyUnavailableDates);
router.post('/unavailable',          protect, authorizeRoles('doctor'), addUnavailableDate);
router.delete('/unavailable/:date',  protect, authorizeRoles('doctor'), removeUnavailableDate);

export default router;
