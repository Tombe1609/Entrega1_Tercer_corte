const AppError = require('../utils/AppError');

module.exports = (...rolesPermitidos) => (req, res, next) => {
  if (!req.auth) return next(new AppError(401, 'Inicia sesión para continuar.'));
  if (!rolesPermitidos.includes(req.auth.rol)) {
    return next(new AppError(403, 'Tu rol no tiene permiso para realizar esta operación.'));
  }
  return next();
};
