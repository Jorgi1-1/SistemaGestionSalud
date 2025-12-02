const mongoose = require('mongoose');

const encounterSchema = new mongoose.Schema({
  recordId: { // Vinculado al expediente
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord',
    required: true
  },
  appointmentId: { // Vinculado a la cita
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true // Una cita genera un solo encounter
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Datos clínicos capturados 
  clinicalNote: {
    reason: String,
    findings: String,
    treatmentPlan: String, 
    vaccinesApplied: [String]
  },
  diagnoses: [{ 
    code: String, 
    description: String
  }],
  prescriptionUrl: { type: String } 
}, { timestamps: true });

module.exports = mongoose.model('Encounter', encounterSchema);