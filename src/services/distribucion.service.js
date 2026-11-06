const { coleccion } = require('../config/database');
const AppError = require('../utils/AppError');
const { confirmarEscritura } = require('../utils/validadores');
const { siguientesIds, conReintentoDeId } = require('../utils/ids');
const { ejecutarAtomico } = require('../utils/transaccion');
const { redondear } = require('../utils/dinero');

const SIN_ID = { projection: { _id: 0 } };

/**
 * HU9: calcula (sin guardar) la distribución proporcional de intereses.
 *   participacion    = saldo de la cuenta / total ahorrado
 *   interes_recibido = participacion * intereses generados (2 decimales)
 * Solo participan cuentas activas con saldo mayor que cero.
 */
async function calcular(intereses_generados) {
  const cuentas = await coleccion('ahorros')
    .find({ estado: 'activo', saldo: { $gt: 0 } }, SIN_ID)
    .sort({ ahorro_id: 1 })
    .toArray();
  if (cuentas.length === 0) {
    throw new AppError(400, 'No hay cuentas de ahorro activas con saldo para distribuir intereses.');
  }

  const total_ahorrado = cuentas.reduce((suma, c) => suma + c.saldo, 0);
  const distribucion = cuentas.map((c) => ({
    usuario_id: c.usuario_id,
    ahorro_id: c.ahorro_id,
    ahorro_base: c.saldo,
    total_ahorrado,
    intereses_generados,
    participacion: Math.round((c.saldo / total_ahorrado) * 1e10) / 1e10,
    interes_recibido: redondear((c.saldo / total_ahorrado) * intereses_generados),
  }));

  const suma_distribuida = redondear(distribucion.reduce((s, d) => s + d.interes_recibido, 0));
  return {
    intereses_generados,
    total_ahorrado,
    cantidad_ahorradores: distribucion.length,
    suma_distribuida,
    diferencia_por_redondeo: redondear(intereses_generados - suma_distribuida),
    distribucion,
  };
}

/** HU9: calcula y guarda la distribución de un periodo (una sola vez por periodo). */
async function registrar(periodo, intereses_generados) {
  const coleccionDistribucion = coleccion('distribucion_intereses');

  if (await coleccionDistribucion.findOne({ periodo }, SIN_ID)) {
    throw new AppError(409, `Ya existe una distribución registrada para el periodo ${periodo}.`);
  }
  const calculo = await calcular(intereses_generados);

  return conReintentoDeId('distribucion_id', () =>
    ejecutarAtomico(async ({ session, alDeshacer }) => {
      const ids = await siguientesIds(coleccionDistribucion, 'distribucion_id', 'DI', calculo.distribucion.length, session);
      const documentos = calculo.distribucion.map((d, i) => ({
        distribucion_id: ids[i],
        periodo,
        usuario_id: d.usuario_id,
        ahorro_id: d.ahorro_id,
        ahorro_base: d.ahorro_base,
        total_ahorrado: d.total_ahorrado,
        intereses_generados: d.intereses_generados,
        participacion: d.participacion,
        interes_recibido: d.interes_recibido,
      }));

      alDeshacer(() => coleccionDistribucion.deleteMany({ distribucion_id: { $in: ids } }));
      const resultado = await coleccionDistribucion.insertMany(documentos.map((d) => ({ ...d })), { session });
      confirmarEscritura(resultado, 'No se pudo registrar la distribución.');
      if (resultado.insertedCount !== documentos.length) {
        throw new AppError(500, 'MongoDB no confirmó todos los registros de la distribución.');
      }

      return {
        periodo,
        intereses_generados,
        total_ahorrado: calculo.total_ahorrado,
        cantidad_ahorradores: documentos.length,
        suma_distribuida: calculo.suma_distribuida,
        diferencia_por_redondeo: calculo.diferencia_por_redondeo,
        distribucion: documentos,
      };
    })
  );
}

/** HU9: consulta las distribuciones guardadas (opcionalmente de un periodo o de un estudiante). */
async function consultar({ periodo, usuario_id } = {}) {
  const filtro = {};
  if (periodo) filtro.periodo = periodo;
  if (usuario_id) filtro.usuario_id = usuario_id;
  const lista = await coleccion('distribucion_intereses')
    .find(filtro, SIN_ID)
    .sort({ periodo: 1, distribucion_id: 1 })
    .toArray();
  return {
    cantidad_registros: lista.length,
    total_interes_recibido: redondear(lista.reduce((s, d) => s + d.interes_recibido, 0)),
    distribucion: lista,
  };
}

module.exports = { calcular, registrar, consultar };
