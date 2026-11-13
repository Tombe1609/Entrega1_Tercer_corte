const servicio = require('../services/prestamos.service');
const v = require('../utils/validadores');
const { ok, creado } = require('../utils/respuestas');

/** GET /api/fines-educativos  (apoyo de HU5: finalidades válidas) */
async function listarFines(req, res) {
  const fines = await servicio.listarFines();
  return ok(res, { cantidad: fines.length, fines_educativos: fines }, 'Finalidades educativas consultadas correctamente.');
}

/** POST /api/prestamos  (HU5) */
async function solicitar(req, res) {
  const body = v.exigirCuerpo(req.body);
  const errores = [];
  const datos = {
    usuario_id: v.idEnCuerpo(body, 'usuario_id', 'usuario', errores),
    fin_id: body.producto_id ? null : v.texto(body, 'fin_id', errores, { min: 3, max: 10 }),
    producto_id: body.producto_id ? v.texto(body,'producto_id',errores,{max:20}) : null,
    monto: v.montoPositivo(body, 'monto', errores),
    plazo_meses: body.plazo_meses ?? 1,
    fecha_primer_pago: body.fecha_primer_pago ?? (() => { const d=new Date(); d.setMonth(d.getMonth()+1); return d.toISOString().slice(0,10); })(),
  };
  if (datos.monto !== undefined && datos.monto < 1000) errores.push('El monto mínimo del préstamo es 1000.');
  if (!Number.isInteger(datos.plazo_meses) || datos.plazo_meses < 1 || datos.plazo_meses > 3) errores.push('El plazo debe ser de 1 a 3 meses.');
  if (typeof datos.fecha_primer_pago !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha_primer_pago)) errores.push('Selecciona una fecha válida para la primera cuota (AAAA-MM-DD).');
  if (datos.fin_id !== undefined) datos.fin_id = datos.fin_id.toUpperCase();
  v.lanzarSiHayErrores(errores);
  const prestamo = await servicio.solicitar(datos);
  return creado(res, prestamo, 'Solicitud de préstamo registrada; está pendiente de aprobación.');
}

/** POST /api/prestamos/:prestamo_id/aprobar (HU5) */
async function aprobar(req, res) {
  const id = v.idParametro(req.params.prestamo_id, 'prestamo', 'prestamo_id');
  const resultado = await servicio.aprobar(id, req.auth.id);
  return ok(res, resultado, 'Préstamo aprobado y desembolsado correctamente.');
}

/** GET /api/prestamos/:prestamo_id  (apoyo de HU6/HU7) */
async function obtener(req, res) {
  const id = v.idParametro(req.params.prestamo_id, 'prestamo', 'prestamo_id');
  return ok(res, await servicio.obtenerPrestamo(id), 'Préstamo consultado correctamente.');
}

/** GET /api/prestamos/:prestamo_id/interes  (HU6) */
async function calcularInteres(req, res) {
  const id = v.idParametro(req.params.prestamo_id, 'prestamo', 'prestamo_id');
  return ok(res, await servicio.calcularInteres(id), 'Interés del préstamo calculado correctamente.');
}

async function pagarCuota(req,res) {
  const id=v.idParametro(req.params.prestamo_id,'prestamo','prestamo_id');
  const numero=Number(req.params.numero);
  if(!Number.isInteger(numero)||numero<1) throw new (require('../utils/AppError'))(400,'El número de cuota no es válido.');
  return creado(res,await servicio.pagarCuota(id,numero,req.auth.id),'Cuota pagada desde ahorros correctamente.');
}

/** GET /api/prestamos/:prestamo_id/pagos  (HU8) */
async function historialPagos(req, res) {
  const id = v.idParametro(req.params.prestamo_id, 'prestamo', 'prestamo_id');
  return ok(res, await servicio.historialPagos(id), 'Historial de pagos consultado correctamente.');
}

module.exports = { listarFines, solicitar, aprobar, obtener, calcularInteres, pagarCuota, historialPagos };
