const AppError = require('../utils/AppError');
const { verificarToken } = require('../utils/authToken');
const { coleccion } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

module.exports = asyncHandler(async (req, res, next) => {
  const cabecera = req.get('authorization') || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7).trim() : '';
  const sesion = verificarToken(token);
  const errorSesion = () => new AppError(401, 'La sesión no es válida o ha vencido. Inicia sesión de nuevo.');
  if (!sesion || typeof sesion.id !== 'string' || !sesion.id ||
      !['estudiante', 'funcionario', 'rector'].includes(sesion.rol)) {
    throw errorSesion();
  }
  const esFuncionario = sesion.rol === 'funcionario';
  const cuenta = await coleccion(esFuncionario ? 'funcionarios' : 'usuarios').findOne(
    esFuncionario ? { funcionario_id: sesion.id } : { usuario_id: sesion.id, tipo: sesion.rol },
    { projection: { _id: 0, estado: 1, version_sesion: 1 } },
  );
  if (!cuenta || String(cuenta.estado || '').toLowerCase() !== 'activo' ||
      (sesion.version_sesion ?? 0) !== (cuenta.version_sesion ?? 0)) throw errorSesion();

  req.auth = sesion;
  return next();
});
