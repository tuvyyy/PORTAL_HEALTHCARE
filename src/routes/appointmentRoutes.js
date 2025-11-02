import express from 'express';
import { showAppointmentForm, createAppointment, listMyAppointments } from '../controllers/appointmentController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

router.get('/book', requireAuth, showAppointmentForm);
router.post('/book', requireAuth, createAppointment);
router.get('/my', requireAuth, listMyAppointments);

export default router;
