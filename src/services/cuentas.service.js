const { ObjectId } = require('mongodb');
const { coleccion } = require('../config/database');
const AppError = require('../utils/AppError');
const { hashPassword, verificarPassword } = require('../utils/password');
const { siguientesIds, conReintentoDeId } = require('../utils/ids');
const { ejecutarAtomico } = require('../utils/transaccion');

const proyeccionSolicitud = {
  nombre: 1, documento: 1, telefono: 1, email: 1, estado: 1,
  fecha: 1, fecha_decision: 1, decidido_por: 1, motivo: 1,
};
const texto = (v) => typeof v === 'string' ? v.trim() : '';

function correoInstitucional(valor) {
  const email = texto(valor).toLowerCase();
  if (email.length > 254 || !/^[a-z0-9]+(?:[._+-][a-z0-9]+)*@uniautonoma\.edu\.co$/.test(email)) {
    throw new AppError(400, 'Usa tu correo institucional terminado en @uniautonoma.edu.co.');
  }
  return email;
}

function datosPersonales(body) {
  const nombre = texto(body?.nombre);
  const telefono = texto(body?.telefono);
  if (nombre.length < 3 || nombre.length > 100) throw new AppError(400, 'El nombre debe tener entre 3 y 100 caracteres.');
  if (!/^\d{7,15}$/.test(telefono)) throw new AppError(400, 'El número de teléfono debe tener entre 7 y 15 dígitos.');
  return { nombre, telefono };
}

async function indicesCuentas(db) {
  const solicitudes = db.collection('solicitudes_cuenta');
  for (const campo of ['email', 'documento']) {
    await solicitudes.createIndex({ [campo]: 1 }, {
      unique: true, partialFilterExpression: { estado: 'pendiente' },
    });
  }
  await db.collection('auditoria_cuentas').createIndex({ fecha: -1 });
}

async function comprobarDisponibilidad(email, documento, session) {
  const filtro = documento ? { $or: [{ email }, { documento }] } : { email };
  if (await coleccion('usuarios').findOne(filtro, { session, projection: { _id: 1 } }) ||
      await coleccion('funcionarios').findOne({ email }, { session, projection: { _id: 1 } })) {
    throw new AppError(409, 'Ya existe una cuenta con ese correo o documento.');
  }
}

async function solicitar(body) {
  const { nombre, telefono } = datosPersonales(body);
  const email = correoInstitucional(body?.email);
  const documento = texto(body?.documento);
  const password = body?.password;
  if (!/^\d{5,15}$/.test(documento)) throw new AppError(400, 'El documento debe tener entre 5 y 15 dígitos.');
  if (typeof password !== 'string' || password.trim().length < 8 || password.length > 128) {
    throw new AppError(400, 'La contraseña debe tener entre 8 y 128 caracteres.');
  }
  await comprobarDisponibilidad(email, documento);
  const solicitud = { nombre, telefono, email, documento, estado: 'pendiente', fecha: new Date() };
  try {
    const id = await coleccion('solicitudes_cuenta').insertOne({ ...solicitud, password_hash: await hashPassword(password) });
    return { id: id.insertedId.toHexString(), estado: solicitud.estado };
  } catch (error) {
    if (error.code === 11000) throw new AppError(409, 'Ya hay una solicitud pendiente para ese correo o documento.');
    throw error;
  }
}

async function listarSolicitudes() {
  // La bandeja de trabajo solo incluye solicitudes pendientes; las decididas
  // se conservan en MongoDB como historial y dejan de ofrecer acciones.
  const items = await coleccion('solicitudes_cuenta').find({ estado: 'pendiente' }, { projection: proyeccionSolicitud })
    .sort({ fecha: -1 }).limit(100).toArray();
  return items.map(({ _id, ...datos }) => ({ id: _id.toHexString(), ...datos }));
}

async function editarSolicitud(id, body, actor) {
  if (!/^[0-9a-f]{24}$/i.test(id)) throw new AppError(400, 'Identificador de solicitud inválido.');
  const { nombre, telefono } = datosPersonales(body);
  const email = correoInstitucional(body?.email);
  const documento = texto(body?.documento);
  if (!/^\\d{5,15}$/.test(documento)) throw new AppError(400, 'El documento debe tener entre 5 y 15 dígitos.');

  const solicitudes = coleccion('solicitudes_cuenta');
  const actual = await solicitudes.findOne({ _id: new ObjectId(id), estado: 'pendiente' });
  if (!actual) throw new AppError(409, 'La solicitud ya fue atendida o no existe.');
  await comprobarDisponibilidad(email, documento);
  const duplicada = await solicitudes.findOne({
    _id: { $ne: actual._id }, estado: 'pendiente', $or: [{ email }, { documento }],
  }, { projection: { _id: 1 } });
  if (duplicada) throw new AppError(409, 'Otra solicitud pendiente ya usa ese correo o documento.');

  const cambios = {};
  for (const [campo, valor] of Object.entries({ nombre, telefono, email, documento })) {
    if (actual[campo] !== valor) cambios[campo] = valor;
  }
  if (!Object.keys(cambios).length) return { id, actualizada: false };
  const historial = {
    fecha: new Date(), actor_id: actor.id,
    cambios: Object.fromEntries(Object.entries(cambios).map(([campo, nuevo]) => [campo, { anterior: actual[campo], nuevo }])),
  };
  const resultado = await solicitudes.updateOne(
    { _id: actual._id, estado: 'pendiente' },
    { $set: cambios, $push: { historial_ediciones: historial } },
  );
  if (resultado.matchedCount !== 1) throw new AppError(409, 'La solicitud cambió. Actualiza la pantalla e inténtalo de nuevo.');
  return { id, actualizada: true };
}

async function auditar({ actor, usuario, accion, campos = [], cambios = [], session }) {
  await coleccion('auditoria_cuentas').insertOne({
    fecha: new Date(), actor_id: actor.id, actor_rol: actor.rol, usuario_id: usuario, accion,
    campos, cambios,
  }, { session });
}

async function decidirSolicitud(id, body, actor) {
  if (!/^[0-9a-f]{24}$/i.test(id)) throw new AppError(400, 'Identificador de solicitud inválido.');
  const estado = body?.estado;
  const motivo = texto(body?.motivo);
  if (!['aprobada', 'rechazada'].includes(estado)) throw new AppError(400, 'Decisión inválida.');
  if (motivo.length > 250 || (estado === 'rechazada' && !motivo)) {
    throw new AppError(400, 'Indica el motivo del rechazo, hasta 250 caracteres.');
  }
  const solicitudes = coleccion('solicitudes_cuenta');
  const usuarios = coleccion('usuarios');
  const ahorros = coleccion('ahorros');
  const filtro = { _id: new ObjectId(id), estado: 'pendiente' };
  return conReintentoDeId(['usuario_id', 'ahorro_id'], () => ejecutarAtomico(async ({ session, alDeshacer }) => {
    const solicitud = await solicitudes.findOneAndUpdate(filtro, {
      $set: { estado, motivo, decidido_por: actor.id, fecha_decision: new Date() },
      $unset: { password_hash: '' },
    }, { session, returnDocument: 'before' });
    if (!solicitud) throw new AppError(409, 'Esta solicitud ya fue atendida o no existe.');
    alDeshacer(() => solicitudes.replaceOne({ _id: solicitud._id, estado }, solicitud));
    if (estado === 'rechazada') return { estado };
    await comprobarDisponibilidad(solicitud.email, solicitud.documento, session);
    const [usuario_id] = await siguientesIds(usuarios, 'usuario_id', 'U', 1, session);
    const [ahorro_id] = await siguientesIds(ahorros, 'ahorro_id', 'A', 1, session);
    const { nombre, documento, telefono, email, password_hash } = solicitud;
    const usuario = await usuarios.insertOne({
      usuario_id, nombre, documento, telefono, email, password_hash, estado: 'activo', tipo: 'estudiante',
    }, { session });
    alDeshacer(() => usuarios.deleteOne({ _id: usuario.insertedId }));
    const ahorro = await ahorros.insertOne({ ahorro_id, usuario_id, saldo: 0, estado: 'activo' }, { session });
    alDeshacer(() => ahorros.deleteOne({ _id: ahorro.insertedId }));
    await auditar({ actor, usuario: usuario_id, accion: 'creacion_cuenta', campos: [], session });
    return { estado, usuario_id, ahorro_id };
  }));
}

async function editarPerfil(body, actor) {
  const nuevos = datosPersonales(body);
  const usuarios = coleccion('usuarios');
  const filtro = { usuario_id: actor.id, tipo: 'estudiante', estado: 'activo' };
  const cuenta = await usuarios.findOne(filtro);
  if (!cuenta) throw new AppError(404, 'Tu cuenta no está disponible.');
  if (body?.email !== cuenta.email) {
    nuevos.email = correoInstitucional(body?.email);
  }
  const campos = Object.keys(nuevos).filter(campo => nuevos[campo] !== cuenta[campo]);
  if (!campos.length) return { nombre: cuenta.nombre, telefono: cuenta.telefono, email: cuenta.email };
  if (campos.includes('email')) {
    const password = body?.password_actual;
    if (typeof password !== 'string' || !password || Buffer.byteLength(password) > 4096 ||
        !await verificarPassword(password, cuenta.password_hash)) {
      throw new AppError(403, 'Confirma tu contraseña actual para cambiar el correo.');
    }
    await comprobarDisponibilidad(nuevos.email);
  }
  return ejecutarAtomico(async ({ session, alDeshacer }) => {
    const cambios = Object.fromEntries(campos.map(campo => [campo, nuevos[campo]]));
    const anteriores = Object.fromEntries(campos.map(campo => [campo, cuenta[campo] ?? null]));
    const resultado = await usuarios.updateOne({
      ...filtro, password_hash: cuenta.password_hash, ...anteriores,
    }, { $set: cambios }, { session });
    if (resultado.matchedCount !== 1) throw new AppError(409, 'Tus datos cambiaron. Vuelve a intentarlo.');
    alDeshacer(() => usuarios.updateOne({ ...filtro, ...cambios }, { $set: anteriores }));
    const detalleCambios = campos.map(campo => ({
      campo, anterior: anteriores[campo], nuevo: cambios[campo],
    }));
    await auditar({ actor, usuario: actor.id, accion: 'perfil_actualizado', campos, cambios: detalleCambios, session });
    const actual = { ...cuenta, ...cambios };
    return { nombre: actual.nombre, telefono: actual.telefono, email: actual.email };
  });
}

module.exports = { indicesCuentas, solicitar, listarSolicitudes, editarSolicitud, decidirSolicitud, editarPerfil, auditar };
