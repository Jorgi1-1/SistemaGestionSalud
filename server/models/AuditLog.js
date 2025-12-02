const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // e.g., 'READ_RECORD', 'CREATE_APPT'
  resource: { type: String }, // e.g., 'MedicalRecord:123'
  details: { type: Object },
  ip: String,
  userAgent: String
}, { timestamps: true }); // createdAt sirve como timestamp del log

module.exports = mongoose.model('AuditLog', auditLogSchema);