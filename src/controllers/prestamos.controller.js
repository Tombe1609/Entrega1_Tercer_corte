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
    fin_id: v.texto(body, 'fin_id', errores, { min: 3, max: 10 }),
    monto: v.montoPositivo(body, 'monto', errores),
  };
  if (datos.fin_id !== undefined) datos.fin_id = datos.fin_id.toUpperCase();
  v.lanzarSiHayErrores(errores);
  const prestamo = await servicio.solicitar(datos);
  return creado(res, prestamo, 'Préstamo educativo registrado correctamente.');
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

/** POST /api/prestamos/:prestamo_id/pagos  (HU8) */
async function registrarPago(req, res) {
  const id = v.idParametro(req.params.prestamo_id, 'prestamo', 'prestamo_id');
  const body = v.exigirCuerpo(req.body);
  const errores = [];
  const tipo_abono = v.enumerado(body.tipo_abono, 'tipo_abono', ['capital', 'interes'], errores, { obligatorio: true });
  const valor = v.montoPositivo(body, 'valor', errores);
  v.lanzarSiHayErrores(errores);
  const resultado = await servicio.registrarPago(id, tipo_abono, valor);
  return creado(res, resultado, `Pago a ${tipo_abono === 'capital' ? 'capital' : 'interés'} registrado correctamente.`);
}

/** GET /api/prestamos/:prestamo_id/pagos  (HU8) */
async function historialPagos(req, res) {
  const id = v.idParametro(req.params.prestamo_id, 'prestamo', 'prestamo_id');
  return ok(res, await servicio.historialPagos(id), 'Historial de pagos consultado correctamente.');
}

module.exports = { listarFines, solicitar, obtener, calcularInteres, registrarPago, historialPagos };
