const { coleccion } = require('../config/database');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const ROLES_ADMINISTRATIVOS = ['funcionario', 'rector'];

/** Permite al estudiante acceder a su propio recurso y al personal a cualquier recurso. */
function requireOwnerOrStaff({ collection, idParam, idField, ownerField = 'usuario_id' }) {
  return asyncHandler(async (req, res, next) => {
    if (ROLES_ADMINISTRATIVOS.includes(req.auth?.rol)) return next();
    if (req.auth?.rol !== 'estudiante') {
      throw new AppError(403, 'Tu rol no tiene permiso para acceder a este recurso.');
    }

    const filtro = { [idField]: req.params[idParam] };
    const recurso = await coleccion(collection).findOne(filtro, {
      projection: { _id: 0, [ownerField]: 1 },
    });
    // Si no existe, el controlador conserva su respuesta 404 correspondiente.
    if (recurso && recurso[ownerField] !== req.auth.id) {
      throw new AppError(403, 'No puedes acceder a información de otra persona.');
    }
    return next();
  });
}

/** Restringe rutas con :usuario_id al propio estudiante o a personal administrativo. */
function requireSelfOrStaff(param = 'usuario_id') {
  return (req, res, next) => {
    if (ROLES_ADMINISTRATIVOS.includes(req.auth?.rol)) return next();
    if (req.auth?.rol !== 'estudiante') {
      return next(new AppError(403, 'Tu rol no tiene permiso para acceder a este recurso.'));
    }
    if (req.params[param] !== req.auth.id) {
      return next(new AppError(403, 'No puedes consultar información de otra persona.'));
    }
    return next();
  };
}

/** Un estudiante solo puede crear recursos asociados a su propio usuario_id. */
function requireSelfBodyOrStaff(field = 'usuario_id') {
  return (req, res, next) => {
    if (ROLES_ADMINISTRATIVOS.includes(req.auth?.rol)) return next();
    if (req.auth?.rol !== 'estudiante') {
      return next(new AppError(403, 'Tu rol no tiene permiso para realizar esta operación.'));
    }
    if (typeof req.body?.[field] !== 'string' || !req.body[field].trim()) return next();
    if (req.body?.[field] !== req.auth.id) {
      return next(new AppError(403, 'Solo puedes realizar operaciones para tu propia cuenta.'));
    }
    return next();
  };
}

module.exports = { requireOwnerOrStaff, requireSelfOrStaff, requireSelfBodyOrStaff };
