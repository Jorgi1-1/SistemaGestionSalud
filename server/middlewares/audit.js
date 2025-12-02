const AuditLog = require('../models/AuditLog');

const logAction = (action) => async (req, res, next) => {
  // Guardamos la referencia original de res.json para interceptarla
  const originalJson = res.json;

  res.json = function (data) {
    // Solo loguear si la respuesta fue exitosa (2xx) o según política
    if (res.statusCode >= 200 && res.statusCode < 400) {
      try {
        AuditLog.create({
          userId: req.user ? req.user._id : null,
          action: action,
          resource: req.originalUrl,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          details: { method: req.method, body: req.body } // Cuidado con passwords aquí (se debe limpiar)
        });
      } catch (err) {
        console.error("Fallo auditoría", err);
      }
    }
    originalJson.call(this, data);
  };
  next();
};

module.exports = { logAction };