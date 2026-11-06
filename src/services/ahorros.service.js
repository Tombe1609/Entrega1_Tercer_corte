const { coleccion } = require('../config/database');
const AppError = require('../utils/AppError');
const { confirmarEscritura } = require('../utils/validadores');
const { siguientesIds, conReintentoDeId } = require('../utils/ids');
const { ejecutarAtomico } = require('../utils/transaccion');

const SIN_ID = { projection: { _id: 0 } };

/** HU3: abre una cuenta de ahorro (saldo inicial 0) para un estudiante activo. */
async function crearCuenta(usuario_id) {
  const estudiante = await coleccion('usuarios').findOne({ usuario_id, tipo: 'estudiante' }, SIN_ID);
  if (!estudiante) throw new AppError(404, `No existe un estudiante con id ${usuario_id}.`);
  if (estudiante.estado !== 'activo') throw new AppError(400, 'El estudiante no está activo.');

  const ahorros = coleccion('ahorros');
  if (await ahorros.findOne({ usuario_id }, SIN_ID)) {
    throw new AppError(409, 'El estudiante ya tiene una cuenta de ahorro.');
  }

  return conReintentoDeId('ahorro_id', async () => {
    const [ahorro_id] = await siguientesIds(ahorros, 'ahorro_id', 'A');
    const cuenta = { ahorro_id, usuario_id, saldo: 0, estado: 'activo' };
    confirmarEscritura(await ahorros.insertOne({ ...cuenta }), 'No se pudo crear la cuenta de ahorro.');
    return cuenta;
  });
}

async function listarCuentas() {
  return coleccion('ahorros').find({}, SIN_ID).sort({ ahorro_id: 1 }).toArray();
}

async function obtenerCuenta(ahorro_id) {
  const cuenta = await coleccion('ahorros').findOne({ ahorro_id }, SIN_ID);
  if (!cuenta) throw new AppError(404, `No existe una cuenta de ahorro con id ${ahorro_id}.`);
  return cuenta;
}

/**
 * HU4: registra un depósito o un retiro. Actualiza el saldo y guarda el
 * movimiento en el historial como una sola operación atómica.
 * El retiro solo se aplica si el saldo es suficiente (filtro saldo >= valor).
 */
async function registrarMovimiento(ahorro_id, tipo, valor, descripcion) {
  const ahorros = coleccion('ahorros');
  const movimientos = coleccion('movimientos_ahorro');

  return conReintentoDeId('movimiento_id', () =>
    ejecutarAtomico(async ({ session, alDeshacer }) => {
      const cuenta = await ahorros.findOne({ ahorro_id }, { session });
      if (!cuenta) throw new AppError(404, `No existe una cuenta de ahorro con id ${ahorro_id}.`);
      if (cuenta.estado !== 'activo') throw new AppError(400, 'La cuenta de ahorro no está activa.');

      const filtro = { ahorro_id, estado: 'activo' };
      if (tipo === 'retiro') filtro.saldo = { $gte: valor };
      const variacion = tipo === 'deposito' ? valor : -valor;

      const actualizacion = await ahorros.updateOne(filtro, { $inc: { saldo: variacion } }, { session });
      confirmarEscritura(actualizacion);
      if (actualizacion.matchedCount !== 1) {
        throw new AppError(400, `Saldo insuficiente: el saldo actual es ${cuenta.saldo} y el retiro es ${valor}.`);
      }
      alDeshacer(() => ahorros.updateOne({ ahorro_id }, { $inc: { saldo: -variacion } }));

      const [movimiento_id] = await siguientesIds(movimientos, 'movimiento_id', 'M', 1, session);
      const movimiento = {
        movimiento_id,
        ahorro_id,
        usuario_id: cuenta.usuario_id,
        tipo,
        valor,
        fecha: new Date(),
        descripcion,
      };
      confirmarEscritura(await movimientos.insertOne({ ...movimiento }, { session }), 'No se pudo registrar el movimiento.');

      const cuentaActual = await ahorros.findOne({ ahorro_id }, { session, ...SIN_ID });
      return { movimiento, saldo_anterior: cuenta.saldo, saldo_actual: cuentaActual.saldo };
    })
  );
}

/** HU4: consulta el historial de movimientos de una cuenta. */
async function consultarMovimientos(ahorro_id, { tipo } = {}) {
  const cuenta = await obtenerCuenta(ahorro_id);
  const filtro = { ahorro_id };
  if (tipo) filtro.tipo = tipo;
  const lista = await coleccion('movimientos_ahorro').find(filtro, SIN_ID).sort({ fecha: 1, movimiento_id: 1 }).toArray();
  return { cuenta, cantidad: lista.length, movimientos: lista };
}

module.exports = { crearCuenta, listarCuentas, obtenerCuenta, registrarMovimiento, consultarMovimientos };
