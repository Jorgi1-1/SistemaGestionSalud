const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifica que el token sea válido
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Agregamos el usuario al request (sin password)
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'No autorizado, token fallido' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'No autorizado, no hay token' });
  }
};

// Verifica roles (Admin, Doctor, Student)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
       return res.status(401).json({ message: 'No autorizado, usuario no encontrado' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Rol ${req.user.role} no autorizado para esta acción` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };