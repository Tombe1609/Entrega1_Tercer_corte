const AppError = require('../utils/AppError');

module.exports = function requireRector(req, res, next) {
  if (!req.auth) return next(new AppError(401, 'Inicia sesión para continuar.'));
  if (req.auth.rol !== 'rector') return next(new AppError(403, 'Solo el rector puede realizar esta operación.'));
  return next();
};
