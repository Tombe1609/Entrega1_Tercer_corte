const { coleccion } = require('../config/database');
const config = require('../config/config');
const AppError = require('../utils/AppError');
const { confirmarEscritura } = require('../utils/validadores');
const { siguientesIds, conReintentoDeId } = require('../utils/ids');
const { ejecutarAtomico } = require('../utils/transaccion');
const { redondear } = require('../utils/dinero');

const SIN_ID = { projection: { _id: 0 } };

async function listarFines() {
  return coleccion('fines_educativos').find({}, SIN_ID).sort({ fin_id: 1 }).toArray();
}

async function obtenerPrestamo(prestamo_id, session) {
  const prestamo = await coleccion('prestamos').findOne({ prestamo_id }, { session, ...SIN_ID });
  if (!prestamo) throw new AppError(404, `No existe un préstamo con id ${prestamo_id}.`);
  return prestamo;
}

/**
 * HU5: solicita un préstamo educativo.
 * Reglas: estudiante activo, finalidad educativa activa, monto > 0 y <= límite,
 * y un solo préstamo activo por estudiante. Interés inicial = capital * 5 %.
 */
async function solicitar({ usuario_id, fin_id, monto }) {
  const estudiante = await coleccion('usuarios').findOne({ usuario_id, tipo: 'estudiante' }, SIN_ID);
  if (!estudiante) throw new AppError(404, `No existe un estudiante con id ${usuario_id}.`);
  if (estudiante.estado !== 'activo') throw new AppError(400, 'El estudiante no está activo.');

  const fin = await coleccion('fines_educativos').findOne({ fin_id }, SIN_ID);
  if (!fin) throw new AppError(404, `No existe la finalidad educativa ${fin_id}.`);
  if (fin.estado !== 'activo') throw new AppError(400, 'La finalidad educativa no está activa.');

  if (monto > config.limitePrestamo) {
    throw new AppError(400, `El monto supera el límite permitido de ${config.limitePrestamo}.`);
  }

  const prestamos = coleccion('prestamos');
  const activo = await prestamos.findOne({ usuario_id, estado: 'activo' }, SIN_ID);
  if (activo) {
    throw new AppError(409, `El estudiante ya tiene un préstamo activo (${activo.prestamo_id}).`);
  }

  return conReintentoDeId('prestamo_id', async () => {
    const [prestamo_id] = await siguientesIds(prestamos, 'prestamo_id', 'P');
    const interes = redondear(monto * config.tasaInteres);
    const prestamo = {
      prestamo_id,
      usuario_id,
      fin_id,
      capital_inicial: monto,
      interes_inicial: interes,
      capital_pendiente: monto,
      interes_pendiente: interes,
      tasa_interes: config.tasaInteres,
      estado: 'activo',
      fecha_solicitud: new Date(),
    };
    confirmarEscritura(await prestamos.insertOne({ ...prestamo }), 'No se pudo registrar el préstamo.');
    return prestamo;
  });
}

/**
 * HU6: calcula el interés del préstamo (capital * tasa) y el total a pagar.
 * Se muestran dos cálculos del TXT: sobre el capital inicial y sobre el capital pendiente.
 */
async function calcularInteres(prestamo_id) {
  const p = await obtenerPrestamo(prestamo_id);
  const interesInicial = redondear(p.capital_inicial * p.tasa_interes);
  const interesSobrePendiente = redondear(p.capital_pendiente * p.tasa_interes);
  return {
    prestamo_id: p.prestamo_id,
    usuario_id: p.usuario_id,
    estado: p.estado,
    tasa_interes: p.tasa_interes,
    sobre_capital_inicial: {
      capital_inicial: p.capital_inicial,
      interes_calculado: interesInicial,
      total_calculado: redondear(p.capital_inicial + interesInicial),
    },
    sobre_capital_pendiente: {
      capital_pendiente: p.capital_pendiente,
      interes_calculado: interesSobrePendiente,
      total_pendiente_calculado: redondear(p.capital_pendiente + interesSobrePendiente),
    },
    interes_pendiente_registrado: p.interes_pendiente,
  };
}

/** HU7: préstamos de un estudiante con su finalidad educativa y totales pendientes. */
async function consultarDeEstudiante(usuario_id, { estado } = {}) {
  const estudiante = await coleccion('usuarios').findOne({ usuario_id, tipo: 'estudiante' }, SIN_ID);
  if (!estudiante) throw new AppError(404, `No existe un estudiante con id ${usuario_id}.`);

  const filtro = { usuario_id };
  if (estado) filtro.estado = estado;
  const prestamos = await coleccion('prestamos').find(filtro, SIN_ID).sort({ prestamo_id: 1 }).toArray();

  const fines = await coleccion('fines_educativos')
    .find({ fin_id: { $in: [...new Set(prestamos.map((p) => p.fin_id))] } }, SIN_ID)
    .toArray();
  const nombreFin = Object.fromEntries(fines.map((f) => [f.fin_id, f.nombre]));

  const lista = prestamos.map((p) => ({
    prestamo_id: p.prestamo_id,
    fin_id: p.fin_id,
    finalidad: nombreFin[p.fin_id] || null,
    capital_inicial: p.capital_inicial,
    capital_pendiente: p.capital_pendiente,
    interes_pendiente: p.interes_pendiente,
    estado: p.estado,
    fecha_solicitud: p.fecha_solicitud,
  }));

  return {
    estudiante: { usuario_id: estudiante.usuario_id, nombre: estudiante.nombre },
    cantidad_prestamos: lista.length,
    total_capital_pendiente: redondear(lista.reduce((s, p) => s + p.capital_pendiente, 0)),
    total_interes_pendiente: redondear(lista.reduce((s, p) => s + p.interes_pendiente, 0)),
    prestamos: lista,
  };
}

/**
 * HU8: registra un pago a capital o a interés.
 *  - capital: reduce capital_pendiente y recalcula interes_pendiente = nuevo capital * tasa.
 *             Si capital e interés quedan en 0 el préstamo pasa a "pagado".
 *  - interes: reduce interes_pendiente; el capital no cambia.
 * El préstamo y el historial (pagos_prestamo) se actualizan como una sola operación atómica.
 */
async function registrarPago(prestamo_id, tipo_abono, valor) {
  const prestamos = coleccion('prestamos');
  const pagos = coleccion('pagos_prestamo');

  return conReintentoDeId('pago_id', () =>
    ejecutarAtomico(async ({ session, alDeshacer }) => {
      const antes = await obtenerPrestamo(prestamo_id, session);
      if (antes.estado !== 'activo') throw new AppError(400, `El préstamo ${prestamo_id} no está activo (estado: ${antes.estado}).`);

      let capital = antes.capital_pendiente;
      let interes = antes.interes_pendiente;
      if (tipo_abono === 'capital') {
        if (valor > antes.capital_pendiente) {
          throw new AppError(400, `El abono (${valor}) supera el capital pendiente (${antes.capital_pendiente}).`);
        }
        capital = redondear(antes.capital_pendiente - valor);
        interes = redondear(capital * antes.tasa_interes);
      } else {
        if (valor > antes.interes_pendiente) {
          throw new AppError(400, `El pago (${valor}) supera el interés pendiente (${antes.interes_pendiente}).`);
        }
        interes = redondear(antes.interes_pendiente - valor);
      }
      const estado = capital === 0 && interes === 0 ? 'pagado' : 'activo';

      // El filtro incluye los saldos leídos: si otra solicitud modificó el préstamo, no se aplica.
      const actualizacion = await prestamos.updateOne(
        {
          prestamo_id,
          estado: 'activo',
          capital_pendiente: antes.capital_pendiente,
          interes_pendiente: antes.interes_pendiente,
        },
        { $set: { capital_pendiente: capital, interes_pendiente: interes, estado } },
        { session }
      );
      confirmarEscritura(actualizacion);
      if (actualizacion.matchedCount !== 1) {
        throw new AppError(409, 'El préstamo fue modificado por otra operación. Intente de nuevo.');
      }
      alDeshacer(() =>
        prestamos.updateOne(
          { prestamo_id },
          { $set: { capital_pendiente: antes.capital_pendiente, interes_pendiente: antes.interes_pendiente, estado: antes.estado } }
        )
      );

      const [pago_id] = await siguientesIds(pagos, 'pago_id', 'PG', 1, session);
      const pago = { pago_id, prestamo_id, usuario_id: antes.usuario_id, tipo_abono, valor, fecha: new Date() };
      confirmarEscritura(await pagos.insertOne({ ...pago }, { session }), 'No se pudo registrar el pago.');

      return {
        pago,
        prestamo: await obtenerPrestamo(prestamo_id, session),
        saldos_anteriores: { capital_pendiente: antes.capital_pendiente, interes_pendiente: antes.interes_pendiente },
      };
    })
  );
}

/** HU8: historial de pagos de un préstamo. */
async function historialPagos(prestamo_id) {
  const prestamo = await obtenerPrestamo(prestamo_id);
  const pagos = await coleccion('pagos_prestamo').find({ prestamo_id }, SIN_ID).sort({ fecha: 1, pago_id: 1 }).toArray();
  return {
    prestamo: {
      prestamo_id: prestamo.prestamo_id,
      usuario_id: prestamo.usuario_id,
      capital_pendiente: prestamo.capital_pendiente,
      interes_pendiente: prestamo.interes_pendiente,
      estado: prestamo.estado,
    },
    cantidad_pagos: pagos.length,
    pagos,
  };
}

module.exports = { listarFines, obtenerPrestamo, solicitar, calcularInteres, consultarDeEstudiante, registrarPago, historialPagos };
