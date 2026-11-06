const router = require('express').Router();
const { randomBytes, scryptSync } = require('node:crypto');
const { coleccion } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { creado } = require('../utils/respuestas');
const { siguientesIds, conReintentoDeId } = require('../utils/ids');
const requireRector = require('../middlewares/requireRector');

const CARGOS = [
  'Director financiero', 'Asesor de créditos', 'Tesorero',
  'Auxiliar administrativo', 'Analista financiero', 'Coordinador de cartera',
];
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
function texto(v) { return typeof v === 'string' ? v.trim() : ''; }

router.post('/', requireRector, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const tipo = texto(body.tipo).toLowerCase();
  const nombre = texto(body.nombre);
  const email = texto(body.email).toLowerCase();
  const telefono = texto(body.telefono);
  const password = typeof body.password === 'string' ? body.password : '';
  const documento = texto(body.documento);
  const cargo = texto(body.cargo);

  if (!['estudiante', 'funcionario'].includes(tipo)) throw new AppError(400, 'El tipo debe ser estudiante o funcionario.');
  if (nombre.length < 3 || nombre.length > 100) throw new AppError(400, 'El nombre debe tener entre 3 y 100 caracteres.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError(400, 'Escribe un correo electrónico válido.');
  if (telefono && !/^\d{7,15}$/.test(telefono)) throw new AppError(400, 'El teléfono debe tener entre 7 y 15 dígitos.');
  if (password.length < 8 || password.length > 128) throw new AppError(400, 'La contraseña debe tener entre 8 y 128 caracteres.');
  if (tipo === 'estudiante' && !/^\d{5,15}$/.test(documento)) throw new AppError(400, 'El documento del estudiante debe tener entre 5 y 15 dígitos.');
  if (tipo === 'funcionario' && !CARGOS.includes(cargo)) throw new AppError(400, 'Selecciona un cargo válido.');

  const usuarios = coleccion('usuarios');
  const funcionarios = coleccion('funcionarios');
  if (await usuarios.findOne({ email }) || await funcionarios.findOne({ email })) {
    throw new AppError(409, 'Ya existe una cuenta con ese correo electrónico.');
  }
  if (tipo === 'estudiante' && await usuarios.findOne({ documento })) {
    throw new AppError(409, 'Ya existe un usuario con ese documento.');
  }

  const password_hash = hashPassword(password);
  if (tipo === 'estudiante') {
    const creadoUsuario = await conReintentoDeId('usuario_id', async () => {
      const [usuario_id] = await siguientesIds(usuarios, 'usuario_id', 'U');
      const persona = { usuario_id, nombre, documento, telefono, email, tipo: 'estudiante', estado: 'activo', password_hash };
      await usuarios.insertOne(persona);
      return persona;
    });
    // Cada estudiante nuevo recibe una cuenta de ahorro vacía para poder entrar a la app.
    const ahorros = coleccion('ahorros');
    const [ahorro_id] = await siguientesIds(ahorros, 'ahorro_id', 'A');
    await ahorros.insertOne({ ahorro_id, usuario_id: creadoUsuario.usuario_id, saldo: 0, estado: 'activo' });
    return creado(res, {
      tipo, id: creadoUsuario.usuario_id, nombre, email, estado: 'activo', ahorro_id,
    }, 'Cuenta de estudiante creada correctamente.');
  }

  const creadoFuncionario = await conReintentoDeId('funcionario_id', async () => {
    const [funcionario_id] = await siguientesIds(funcionarios, 'funcionario_id', 'F');
    const persona = { funcionario_id, nombre, cargo, telefono, email, estado: 'activo', password_hash };
    await funcionarios.insertOne(persona);
    return persona;
  });
  return creado(res, {
    tipo, id: creadoFuncionario.funcionario_id, nombre, email, cargo, estado: 'activo',
  }, 'Cuenta de funcionario creada correctamente.');
}));

module.exports = router;
