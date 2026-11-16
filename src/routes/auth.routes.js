const router = require('express').Router();
const { rateLimit } = require('express-rate-limit');
const { coleccion } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respuestas');
const AppError = require('../utils/AppError');
const { firmarToken } = require('../utils/authToken');
const { hashPassword, verificarPassword } = require('../utils/password');
const requireAuth = require('../middlewares/requireAuth');

const limitarLogin = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos. Vuelve a intentarlo en unos minutos.' },
});

const limitarCambioPassword = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 8,
  keyGenerator: (req) => `${req.auth.rol}:${req.auth.id}`,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos. Vuelve a intentarlo en unos minutos.' },
});

router.post('/login', limitarLogin, asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) throw new AppError(400, 'Escribe tu correo y contraseña.');
  if (Buffer.byteLength(email) > 254 || Buffer.byteLength(password) > 4096) {
    throw new AppError(400, 'El correo o la contraseña exceden la longitud permitida.');
  }

  let persona = await coleccion('usuarios').findOne({ email }, { projection: { _id: 0 } });
  let rol = persona?.tipo || null;
  let id = persona?.usuario_id || null;
  if (!persona) {
    persona = await coleccion('funcionarios').findOne({ email }, { projection: { _id: 0 } });
    rol = persona ? 'funcionario' : null;
    id = persona?.funcionario_id || null;
  }
  const passwordValido = await verificarPassword(password, persona?.password_hash);
  if (!persona || String(persona.estado || '').toLowerCase() !== 'activo' || !passwordValido) {
    throw new AppError(401, 'Correo o contraseña incorrectos, o cuenta inactiva.');
  }

  let ahorro_id = null;
  if (rol === 'estudiante') {
    const cuenta = await coleccion('ahorros').findOne({ usuario_id: id }, { projection: { _id: 0, ahorro_id: 1 } });
    ahorro_id = cuenta?.ahorro_id || null;
  }
  const token = firmarToken({ id, rol, email: persona.email, version_sesion: persona.version_sesion ?? 0 });
  return ok(res, {
    rol, id, nombre: persona.nombre, email: persona.email,
    documento: persona.documento || null, telefono: persona.telefono || null,
    cargo: persona.cargo || null, estado: persona.estado || null,
    ahorro_id, token,
  }, 'Inicio de sesión correcto.');
}));

router.patch('/password', requireAuth, limitarCambioPassword, asyncHandler(async (req, res) => {
  const { password_actual: actual, password_nueva: nueva } = req.body || {};
  if (typeof actual !== 'string' || !actual || Buffer.byteLength(actual) > 4096) {
    throw new AppError(400, 'Escribe una contraseña actual válida.');
  }
  if (typeof nueva !== 'string' || nueva.trim().length < 8 || nueva.length > 128) {
    throw new AppError(400, 'La nueva contraseña debe tener entre 8 y 128 caracteres.');
  }
  if (actual === nueva) throw new AppError(400, 'Elige una contraseña diferente de la actual.');

  const esFuncionario = req.auth.rol === 'funcionario';
  const cuentas = coleccion(esFuncionario ? 'funcionarios' : 'usuarios');
  const identidad = esFuncionario
    ? { funcionario_id: req.auth.id }
    : { usuario_id: req.auth.id, tipo: req.auth.rol };
  const cuenta = await cuentas.findOne(identidad, { projection: { password_hash: 1, estado: 1, version_sesion: 1 } });
  if (!cuenta || String(cuenta.estado || '').toLowerCase() !== 'activo' ||
      (cuenta.version_sesion ?? 0) !== (req.auth.version_sesion ?? 0)) {
    throw new AppError(401, 'La sesión ya no es válida.');
  }
  if (!await verificarPassword(actual, cuenta.password_hash)) {
    throw new AppError(403, 'La contraseña actual no es correcta.');
  }

  const password_hash = await hashPassword(nueva);
  const cambio = await cuentas.updateOne(
    { ...identidad, _id: cuenta._id, estado: cuenta.estado, password_hash: cuenta.password_hash },
    { $set: { password_hash }, $inc: { version_sesion: 1 } },
  );
  if (cambio.matchedCount !== 1) throw new AppError(409, 'La cuenta cambió. Inicia sesión e inténtalo nuevamente.');
  return ok(res, { actualizada: true }, 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
}));

module.exports = router;
