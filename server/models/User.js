const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: true,
    select: false // Por seguridad, no devolver password por defecto
  },
  role: {
    type: String,
    enum: ['student', 'doctor', 'admin', 'privacy'], // 
    default: 'student'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  profile: { // 
    fullName: { type: String, required: true },
    studentId: { type: String },     // Solo estudiantes
    doctorLicense: { type: String }, // Solo médicos
    phone: { type: String }
  }
}, { timestamps: true });

// Middleware para encriptar password antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);