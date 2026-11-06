const AppError = require('../utils/AppError');
const config = require('../config/config');

/** Ruta inexistente -> 404 en JSON. */
function rutaNoEncontrada(req, res) {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

/** Manejo centralizado de errores: toda falla termina aquí y responde en JSON. */
// eslint-disable-next-line no-unused-vars
function manejadorErrores(error, req, res, next) {
  let status = 500;
  let message = 'Error interno del servidor.';
  let errors;

  if (error instanceof AppError) {
    status = error.status;
    message = error.message;
    errors = error.detalles;
  } else if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'El cuerpo de la solicitud no es un JSON válido.';
  } else if (error.type === 'entity.too.large') {
    status = 400;
    message = 'El cuerpo de la solicitud es demasiado grande.';
  } else if (error.code === 11000) {
    status = 409;
    message = 'Ya existe un registro con esos datos únicos.';
  } else if (/Mongo(Server|Network)/.test(error.name || '') || /ECONNREFUSED|not connected/i.test(error.message || '')) {
    message = 'No se pudo comunicar con la base de datos.';
  }

  if (status === 500) console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ->`, error);

  const cuerpo = { success: false, message };
  if (errors) cuerpo.errors = errors;
  // En desarrollo se muestra la causa; en producción nunca se expone información interna.
  if (status === 500 && config.entorno !== 'production') cuerpo.detalle = error.message;
  return res.status(status).json(cuerpo);
}

module.exports = { rutaNoEncontrada, manejadorErrores };
