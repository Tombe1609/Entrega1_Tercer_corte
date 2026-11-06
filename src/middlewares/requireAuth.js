const AppError = require('../utils/AppError');
const { verificarToken } = require('../utils/authToken');

module.exports = function requireAuth(req, res, next) {
  const cabecera = req.get('authorization') || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7).trim() : '';
  const sesion = verificarToken(token);
  if (!sesion || !sesion.id || !sesion.rol) {
    return next(new AppError(401, 'La sesión no es válida o ha vencido. Inicia sesión de nuevo.'));
  }
  req.auth = sesion;
  return next();
};
