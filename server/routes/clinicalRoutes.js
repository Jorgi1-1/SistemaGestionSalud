const express = require('express');
const router = express.Router();
const { getMedicalRecord, createEncounter, updateMyRecord } = require('../controllers/clinicalController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { logAction } = require('../middlewares/audit'); // <--- Importar

// Expedientes
router.get('/record/:studentId', protect, getMedicalRecord); // Lectura (opcional loguear 'READ_RECORD')

// Actualización por estudiante
router.put('/my-record', protect, authorize('student'), logAction('UPDATE_OWN_RECORD'), updateMyRecord);

// Consultas Médicas (Crear Encounter)
router.post('/encounter', protect, authorize('doctor'), logAction('CREATE_ENCOUNTER'), createEncounter);

module.exports = router;