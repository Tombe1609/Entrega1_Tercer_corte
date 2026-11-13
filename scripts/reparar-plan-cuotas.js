// Completa un plan faltante de un préstamo activo sin modificar saldos ni pagos históricos.
// Uso (plan nuevo): node scripts/reparar-plan-cuotas.js P010 1 2026-12-09 --aplicar
// Uso (normalizar cuotas pendientes ya creadas): agrega --reconstruir en vez de --aplicar.
require('dotenv').config({ quiet: true });

const config = require('../src/config/config');
const { MongoClient } = require('mongodb');
const { fechaISOValida } = require('../src/utils/fechas');

function fechaCuota(fechaBase, incrementoMeses) {
  const [anio, mes, dia] = fechaBase.split('-').map(Number);
  const mesAbsoluto = mes - 1 + incrementoMeses;
  const anioFinal = anio + Math.floor(mesAbsoluto / 12);
  const mesFinal = ((mesAbsoluto % 12) + 12) % 12;
  const ultimoDia = new Date(Date.UTC(anioFinal, mesFinal + 1, 0)).getUTCDate();
  return new Date(Date.UTC(anioFinal, mesFinal, Math.min(dia, ultimoDia), 17)); // 12:00 America/Bogota
}

async function main() {
  const [prestamoId, plazoTexto, fechaPrimerPago, accion] = process.argv.slice(2);
  const plazo = Number(plazoTexto);
  const reconstruir = accion === '--reconstruir' || accion === '--simular-reconstruccion';
  if (!prestamoId || !Number.isInteger(plazo) || plazo < 1 || plazo > 3 || !fechaISOValida(fechaPrimerPago)) {
    throw new Error('Uso: node scripts/reparar-plan-cuotas.js <PRESTAMO_ID> <PLAZO_1_A_3> <AAAA-MM-DD> [--aplicar]');
  }

  const client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 7000 });
  try {
    await client.connect();
    const prestamos = client.db(config.dbName).collection('prestamos');
    const pagos = client.db(config.dbName).collection('pagos_prestamo');
    const prestamo = await prestamos.findOne({ prestamo_id: prestamoId }, { projection: { _id: 0 } });
    if (!prestamo) throw new Error(`No existe el préstamo ${prestamoId}.`);
    if (prestamo.estado !== 'activo') throw new Error('Solo se puede reparar un préstamo activo.');
    const cuotasExistentes = Array.isArray(prestamo.cuotas) ? prestamo.cuotas : [];
    if (cuotasExistentes.length > 0 && !reconstruir) throw new Error('El préstamo ya tiene cuotas; usa --reconstruir solo si todas siguen pendientes.');
    if (reconstruir && cuotasExistentes.some(cuota => cuota.estado !== 'pendiente')) {
      throw new Error('Hay cuotas pagadas; no se puede reconstruir el calendario sin conciliación manual.');
    }
    const cantidadPagos = await pagos.countDocuments({ prestamo_id: prestamoId });
    if (!Number.isFinite(prestamo.capital_pendiente) || prestamo.capital_pendiente <= 0
      || !Number.isFinite(prestamo.interes_pendiente) || prestamo.interes_pendiente < 0) {
      throw new Error('Los saldos pendientes no son válidos.');
    }

    const redondear = valor => Math.round((valor + Number.EPSILON) * 100) / 100;
    const capitalBase = redondear(prestamo.capital_pendiente / plazo);
    const interesBase = redondear(prestamo.interes_pendiente / plazo);
    const total = redondear(prestamo.capital_pendiente + prestamo.interes_pendiente);
    let capitalAcumulado = 0;
    let interesAcumulado = 0;
    const cuotas = Array.from({ length: plazo }, (_, i) => {
      const capital = i === plazo - 1 ? redondear(prestamo.capital_pendiente - capitalAcumulado) : capitalBase;
      const interes = i === plazo - 1 ? redondear(prestamo.interes_pendiente - interesAcumulado) : interesBase;
      capitalAcumulado = redondear(capitalAcumulado + capital);
      interesAcumulado = redondear(interesAcumulado + interes);
      return { numero: i + 1, fecha_vencimiento: fechaCuota(fechaPrimerPago, i), capital, interes, valor: redondear(capital + interes), estado: 'pendiente' };
    });
    console.log(JSON.stringify({ prestamoId, plazoMeses: plazo, fechaPrimerPago, pagosHistoricosConservados: cantidadPagos, capitalPendiente: prestamo.capital_pendiente, interesPendiente: prestamo.interes_pendiente, totalCuotas: total, cuotas: cuotas.map(c => ({ numero: c.numero, fechaVencimiento: c.fecha_vencimiento.toISOString(), capital: c.capital, interes: c.interes, valor: c.valor, estado: c.estado })), modo: accion === '--aplicar' || accion === '--reconstruir' ? 'aplicar' : 'simulación' }, null, 2));

    if (accion !== '--aplicar' && accion !== '--reconstruir') return;
    const resultado = await prestamos.updateOne({
      prestamo_id: prestamoId,
      estado: 'activo',
      cuotas: prestamo.cuotas ?? { $exists: false },
    }, { $set: { plazo_meses: plazo, fecha_primer_pago: cuotas[0].fecha_vencimiento, cuotas } });
    if (resultado.modifiedCount !== 1) throw new Error('El préstamo cambió durante la operación; vuelve a consultar MongoDB.');
    console.log('Plan de cuotas guardado. Los saldos y pagos históricos no fueron alterados.');
  } finally {
    await client.close();
  }
}

main().catch(error => {
  console.error(`No se pudo reparar el plan: ${error.message}`);
  process.exitCode = 1;
});
