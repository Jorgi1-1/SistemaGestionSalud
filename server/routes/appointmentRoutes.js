const express = require('express');
const router = express.Router();
const { createAppointment, cancelAppointment, confirmAppointment, getAppointments, 
        blockSlot, unblockSlot,getBusySlots,blockSlotRange } = require('../controllers/appointmentController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { logAction } = require('../middlewares/audit'); // <--- Importar

router.route('/')
  .post(protect, authorize('student'), createAppointment) // Ya tiene log manual interno
  .get(protect, getAppointments);

router.get('/busy-slots', protect, getBusySlots);

// Acciones sobre citas
router.put('/:id/cancel', protect, authorize('student', 'doctor'), logAction('CANCEL_APPT'), cancelAppointment);
router.put('/:id/confirm', protect, authorize('doctor'), logAction('CONFIRM_APPT'), confirmAppointment);

// Gestión de Disponibilidad (Médicos)
router.post('/block', protect, authorize('doctor'), logAction('DOCTOR_BLOCK_SLOT'), blockSlot);
router.post('/block-range', protect, authorize('doctor'), logAction('DOCTOR_BLOCK_RANGE'), blockSlotRange);
router.delete('/block/:id', protect, authorize('doctor'), logAction('DOCTOR_UNBLOCK'), unblockSlot);

module.exports = router;