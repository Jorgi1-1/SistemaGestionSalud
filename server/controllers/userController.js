const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const jwt = require('jsonwebtoken');

// Generar JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Registrar usuario (Público o Admin)
// @route   POST /api/users
const registerUser = async (req, res) => {
  const { email, password, role, fullName, studentId, doctorLicense } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Usuario ya existe' });

    // Crear usuario
    const user = await User.create({
      email,
      password,
      role,
      profile: { fullName, studentId, doctorLicense }
    });

    // Si es estudiante, crear automáticamente su Expediente vacío (Regla 1:1) 
    if (role === 'student') {
      await MedicalRecord.create({ studentId: user._id });
    }

    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login
// @route   POST /api/users/login
// ... dentro de loginUser ...
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      
      if (user.status === 'inactive') {
        console.log("desactivado");
        return res.status(401).json({ message: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
      }

      res.json({
        _id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Credenciales inválidas' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener perfil propio
// @route   GET /api/users/profile
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user);
};

// @desc    Obtener lista de médicos activos
// @route   GET /api/users/doctors
const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', status: 'active' })
      .select('profile.fullName profile.doctorLicense email');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener todos los usuarios (Solo Admin)
// @route   GET /api/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cambiar estatus (Alta/Baja)
// @route   PUT /api/users/:id/status
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Evitar que el admin se desactive a sí mismo
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'No puedes desactivar tu propia cuenta' });
    }

    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();
    res.json({ message: `Usuario ${user.status === 'active' ? 'activado' : 'desactivado'}`, status: user.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Eliminar usuario permanentemente
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (user.role === 'admin') return res.status(400).json({ message: 'No puedes eliminar a un administrador' });

    // Eliminación en cascada (Opcional pero recomendada)
    // await Appointment.deleteMany({ studentId: user._id }); 
    // await MedicalRecord.deleteMany({ studentId: user._id });
    
    await user.deleteOne(); // O User.findByIdAndDelete(req.params.id)
    res.json({ message: 'Usuario eliminado permanentemente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener Audit Logs
// @route   GET /api/users/audit-logs
const AuditLog = require('../models/AuditLog'); // Asegúrate de importar el modelo arriba

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate('userId', 'email role') // Traer datos de quien hizo la acción
      .sort({ createdAt: -1 })
      .limit(100); // Limitar a los últimos 100 para no saturar
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getMe, getDoctors, getAllUsers, toggleUserStatus, deleteUser, getAuditLogs };