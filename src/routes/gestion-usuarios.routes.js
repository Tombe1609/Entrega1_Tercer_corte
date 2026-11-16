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
const AREAS = ['solicitudes', 'finanzas', 'creditos'];
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
  const area = texto(body.area).toLowerCase();

  if (!['estudiante', 'funcionario'].includes(tipo)) throw new AppError(400, 'El tipo debe ser estudiante o funcionario.');
  if (nombre.length < 3 || nombre.length > 100) throw new AppError(400, 'El nombre debe tener entre 3 y 100 caracteres.');
  if (!/^[a-z0-9]+(?:[._+-][a-z0-9]+)*@uniautonoma\.edu\.co$/.test(email)) {
    throw new AppError(400, 'Todas las cuentas deben usar un correo @uniautonoma.edu.co.');
  }
  if (telefono && !/^\d{7,15}$/.test(telefono)) throw new AppError(400, 'El teléfono debe tener entre 7 y 15 dígitos.');
  if (password.length < 8 || password.length > 128) throw new AppError(400, 'La contraseña debe tener entre 8 y 128 caracteres.');
  if (tipo === 'estudiante' && !/^\d{5,15}$/.test(documento)) throw new AppError(400, 'El documento del estudiante debe tener entre 5 y 15 dígitos.');
  if (tipo === 'funcionario' && !CARGOS.includes(cargo)) throw new AppError(400, 'Selecciona un cargo válido.');
  if (tipo === 'funcionario' && !AREAS.includes(area)) throw new AppError(400, 'Selecciona un área válida para el funcionario.');

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
    const persona = { funcionario_id, nombre, cargo, telefono, email, area, estado: 'activo', password_hash };
    await funcionarios.insertOne(persona);
    return persona;
  });
  return creado(res, {
    tipo, id: creadoFuncionario.funcionario_id, nombre, email, cargo, area, estado: 'activo',
  }, 'Cuenta de funcionario creada correctamente.');
}));

// El rector puede suspender/reactivar estudiantes; se bloquea la suspensión si
// hay saldo o un préstamo pendiente, para no dejar fondos u obligaciones aislados.
router.patch('/estudiantes/:usuario_id/estado', requireRector, asyncHandler(async (req, res) => {
  const usuario_id = texto(req.params.usuario_id);
  const estado = texto(req.body?.estado).toLowerCase();
  if (!/^U\d{3,}$/.test(usuario_id)) throw new AppError(400, 'Identificador de estudiante inválido.');
  if (!['activo', 'inactivo'].includes(estado)) throw new AppError(400, 'El estado debe ser activo o inactivo.');
  const usuarios = coleccion('usuarios');
  const actual = await usuarios.findOne({ usuario_id, tipo: 'estudiante' }, { projection: { _id: 0, estado: 1 } });
  if (!actual) throw new AppError(404, 'No se encontró el estudiante.');
  if (actual.estado === estado) return res.json({ success: true, message: 'El estado ya estaba actualizado.', data: { usuario_id, estado } });
  if (estado === 'inactivo') {
    const cuenta = await coleccion('ahorros').findOne({ usuario_id, estado: 'activo' }, { projection: { _id: 0, saldo: 1 } });
    if (cuenta && Number(cuenta.saldo) !== 0) throw new AppError(409, 'No se puede desactivar: el estudiante debe retirar el saldo disponible primero.');
    const deuda = await coleccion('prestamos').findOne({ usuario_id, $or: [
      { estado: { $in: ['pendiente', 'activo'] } },
      { capital_pendiente: { $gt: 0 } },
      { interes_pendiente: { $gt: 0 } },
    ] }, { projection: { _id: 0, prestamo_id: 1 } });
    if (deuda) throw new AppError(409, `No se puede desactivar: el préstamo ${deuda.prestamo_id} sigue pendiente o con saldo por pagar.`);
  }
  const cambio = await usuarios.updateOne(
    { usuario_id, tipo: 'estudiante', estado: actual.estado },
    { $set: { estado }, $inc: { version_sesion: 1 } },
  );
  if (cambio.matchedCount !== 1) throw new AppError(409, 'El estado cambió. Actualiza e inténtalo de nuevo.');
  await coleccion('auditoria_cuentas').insertOne({ fecha: new Date(), actor_id: req.auth.id,
    actor_rol: 'rector', usuario_id, accion: estado === 'inactivo' ? 'cuenta_estudiante_desactivada' : 'cuenta_estudiante_activada',
    campos: ['estado'], cambios: [{ campo: 'estado', anterior: actual.estado, nuevo: estado }],
  });
  return res.json({ success: true, message: estado === 'activo' ? 'Cuenta activada.' : 'Cuenta desactivada.', data: { usuario_id, estado } });
}));

module.exports = router;
