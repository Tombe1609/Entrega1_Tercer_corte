const router = require('express').Router();
const { scryptSync, timingSafeEqual } = require('node:crypto');
const { coleccion } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/respuestas');
const AppError = require('../utils/AppError');
const { firmarToken } = require('../utils/authToken');

function verificarPassword(password, almacenado) {
  if (typeof password !== 'string' || !almacenado || typeof almacenado !== 'string') return false;
  const [salt, hashHex] = almacenado.split(':');
  if (!salt || !hashHex) return false;
  const esperado = Buffer.from(hashHex, 'hex');
  const recibido = scryptSync(password, salt, esperado.length);
  return esperado.length === recibido.length && timingSafeEqual(esperado, recibido);
}

router.post('/login', asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) throw new AppError(400, 'Escribe tu correo y contraseña.');

  let persona = await coleccion('usuarios').findOne({ email }, { projection: { _id: 0 } });
  let rol = persona?.tipo || null;
  let id = persona?.usuario_id || null;
  if (!persona) {
    persona = await coleccion('funcionarios').findOne({ email }, { projection: { _id: 0 } });
    rol = persona ? 'funcionario' : null;
    id = persona?.funcionario_id || null;
  }
  if (!persona || String(persona.estado || '').toLowerCase() !== 'activo' || !verificarPassword(password, persona.password_hash)) {
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
