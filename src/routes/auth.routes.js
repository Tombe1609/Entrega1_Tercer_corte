const router = require('express').Router();
const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const { rateLimit } = require('express-rate-limit');
const { coleccion } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respuestas');
const AppError = require('../utils/AppError');
const { firmarToken } = require('../utils/authToken');

const derivarClave = promisify(scrypt);
const salDeRelleno = randomBytes(16).toString('hex');
const hashDeRelleno = randomBytes(64);
const limitarLogin = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos. Vuelve a intentarlo en unos minutos.' },
});

async function verificarPassword(password, almacenado) {
  const formato = /^([0-9a-f]{32}):([0-9a-f]{128})$/i.exec(almacenado || '');
  const esperado = formato ? Buffer.from(formato[2], 'hex') : hashDeRelleno;
  // Las cuentas ausentes también incurren en el costo del hash.
  const recibido = await derivarClave(password, formato?.[1] || salDeRelleno, esperado.length);
  return timingSafeEqual(esperado, recibido) && Boolean(formato);
}

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
  const token = firmarToken({ id, rol, email: persona.email });
  return ok(res, {
    rol, id, nombre: persona.nombre, email: persona.email,
    documento: persona.documento || null, telefono: persona.telefono || null,
    cargo: persona.cargo || null, estado: persona.estado || null,
    ahorro_id, token,
  }, 'Inicio de sesión correcto.');
}));

module.exports = router;
