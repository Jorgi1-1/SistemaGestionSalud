const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true 
  },
  allergies: [{ type: String }],        
  medicalConditions: [{ type: String }],
  vaccines: [{ type: String }]          
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);