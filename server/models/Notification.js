const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'APPT_CONFIRM', 
      'APPT_REMINDER', 
      'FOLLOWUP', 
      'CANCELLATION',
      'ENCOUNTER_STUDENT',
      'ENCOUNTER_DOCTOR'  
    ], 
    required: true
  },
  message: String,
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED', 'DLQ'],
    default: 'PENDING'
  },
  scheduledFor: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  nextRetry: { type: Date },
  metadata: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);