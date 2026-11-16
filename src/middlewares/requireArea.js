const AppError = require('../utils/AppError');

function tieneArea(auth, ...areas) {
  return auth?.rol === 'rector' ||
    (auth?.rol === 'funcionario' && areas.includes(auth.area));
}

function requireArea(...areas) {
  return (req, res, next) => {
    if (!tieneArea(req.auth, ...areas)) {
      return next(new AppError(403, 'Esta operación corresponde a otra área de la cooperativa.'));
    }
    return next();
  };
}

module.exports = { tieneArea, requireArea };
