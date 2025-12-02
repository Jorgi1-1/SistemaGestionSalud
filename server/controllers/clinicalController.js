const MedicalRecord = require('../models/MedicalRecord');
const Encounter = require('../models/Encounter');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification'); // <--- LÍNEA CORREGIDA

// @desc    Obtener Expediente de Estudiante
// @route   GET /api/records/:studentId
const getMedicalRecord = async (req, res) => {
  try {
    // Regla Privacidad: Solo el estudiante dueño o médico pueden ver 
    if (req.user.role === 'student' && req.user._id.toString() !== req.params.studentId) {
      return res.status(403).json({ message: 'Acceso denegado al expediente.' });
    }

    const record = await MedicalRecord.findOne({ studentId: req.params.studentId });
    if (!record) return res.status(404).json({ message: 'Expediente no encontrado' });

    // Cargar historial de consultas (encounters)
    const encounters = await Encounter.find({ recordId: record._id })
      .populate('doctorId', 'profile.fullName')
      .sort({ createdAt: -1 });

    res.json({ record, encounters });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Registrar Consulta (Médico)
// @route   POST /api/encounters
const createEncounter = async (req, res) => {
  const { appointmentId, clinicalNote, diagnoses } = req.body;
  
  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: 'Cita no encontrada' });

    // Validar que la cita esté CONFIRMADA y pertenezca al médico
    if (appointment.status !== 'CONFIRMADA') {
      return res.status(400).json({ message: 'La cita debe estar confirmada para atenderse.' });
    }
    if (appointment.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado.' });
    }

    // Obtener expediente
    const record = await MedicalRecord.findOne({ studentId: appointment.studentId });
    
    // Validar campos críticos 
    if (!diagnoses || diagnoses.length === 0 || !clinicalNote.treatmentPlan) {
      return res.status(400).json({ message: 'Diagnóstico y Plan de tratamiento son obligatorios.' });
    }

    // Crear Encounter (Documento inmutable de la visita)
    const encounter = await Encounter.create({
      recordId: record._id,
      appointmentId: appointment._id,
      doctorId: req.user._id,
      clinicalNote,
      diagnoses
    });

    // Actualizar estado de la cita a ATENDIDA 
    appointment.status = 'ATENDIDA';
    await appointment.save();

    // --- 6. GENERAR NOTIFICACIONES (NUEVO) ---
    
    // A. Al Estudiante
    await Notification.create({
      userId: appointment.studentId._id,
      type: 'ENCOUNTER_STUDENT',
      message: 'Tu consulta ha sido atendida. Revisa tus instrucciones.',
      scheduledFor: new Date(), // Enviar ya
      metadata: { appointmentId: appointment._id }
    });

    // B. Al Médico (Confirmación)
    await Notification.create({
      userId: req.user._id,
      type: 'ENCOUNTER_DOCTOR',
      message: 'Consulta cerrada exitosamente.',
      scheduledFor: new Date(), // Enviar ya
      metadata: { appointmentId: appointment._id }
    });
    
    res.status(201).json(encounter);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Actualizar mi propio historial (Estudiante)
// @route   PUT /api/clinical/my-record
const updateMyRecord = async (req, res) => {
  try {
    // Buscar el expediente del usuario logueado
    let record = await MedicalRecord.findOne({ studentId: req.user._id });

    if (!record) {
      // Si por error no existe (aunque el Seeder lo crea), lo creamos
      record = new MedicalRecord({ studentId: req.user._id });
    }

    // Actualizar campos. Esperamos arrays o strings separados por comas
    // Nota: El frontend enviará arrays, pero por seguridad nos aseguramos
    const { allergies, medicalConditions, vaccines } = req.body;

    record.allergies = allergies || record.allergies;
    record.medicalConditions = medicalConditions || record.medicalConditions;
    record.vaccines = vaccines || record.vaccines;

    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMedicalRecord, createEncounter, updateMyRecord };