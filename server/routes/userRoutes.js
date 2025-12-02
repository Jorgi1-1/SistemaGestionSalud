const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getMe, 
  getDoctors, 
  getAllUsers, 
  toggleUserStatus, 
  deleteUser, 
  getAuditLogs 
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { logAction } = require('../middlewares/audit'); // <--- Importar Middleware de Auditoría

// Rutas públicas
// Registramos el Login exitoso automáticamente
router.post('/login', logAction('USER_LOGIN'), loginUser);

// Rutas protegidas generales
router.get('/profile', protect, getMe);
router.get('/doctors', protect, getDoctors);

// Rutas EXCLUSIVAS de Admin
router.post('/', protect, authorize('admin'), logAction('ADMIN_CREATE_USER'), registerUser); 
router.get('/', protect, authorize('admin'), getAllUsers); // Lectura masiva (opcional loguear)
router.get('/audit-logs', protect, authorize('admin'), getAuditLogs);

// Acciones críticas de Admin
router.put('/:id/status', protect, authorize('admin'), logAction('ADMIN_TOGGLE_STATUS'), toggleUserStatus);
router.delete('/:id', protect, authorize('admin'), logAction('ADMIN_DELETE_USER'), deleteUser);

module.exports = router;