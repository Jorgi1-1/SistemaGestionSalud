const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDIENTE', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'REPROGRAMAR', 'BLOQUEADO'], // <--- AGREGADO
    default: 'PENDIENTE'
  },
  reason: { // Motivo inicial de la cita
    type: String,
    required: true
  }
}, { timestamps: true }); // Incluye createdAt 

// Índice compuesto para validar regla: "Máx 1 cita activa por día por estudiante" 
// Se gestionará lógica en controlador, pero el índice ayuda a búsquedas rápidas
appointmentSchema.index({ studentId: 1, date: 1 });
appointmentSchema.index({ doctorId: 1, date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);