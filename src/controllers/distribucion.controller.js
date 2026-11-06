const servicio = require('../services/distribucion.service');
const v = require('../utils/validadores');
const { ok, creado } = require('../utils/respuestas');

/** GET /api/distribucion-intereses/calculo?intereses_generados=500000  (HU9, solo calcula) */
async function calcular(req, res) {
  const errores = [];
  const texto = req.query.intereses_generados;
  const numero = typeof texto === 'string' ? Number(texto) : texto;
  const intereses = v.montoPositivo({ intereses_generados: numero }, 'intereses_generados', errores);
  v.lanzarSiHayErrores(errores);
  const data = await servicio.calcular(intereses);
  return ok(res, data, 'Distribución calculada (no se guardó).');
}

/** POST /api/distribucion-intereses  (HU9, calcula y guarda) */
async function registrar(req, res) {
  const body = v.exigirCuerpo(req.body);
  const errores = [];
  const periodo = v.periodo(body.periodo, 'periodo', errores);
  const intereses = v.montoPositivo(body, 'intereses_generados', errores);
  v.lanzarSiHayErrores(errores);
  const data = await servicio.registrar(periodo, intereses);
  return creado(res, data, 'Distribución de intereses registrada correctamente.');
}

/** GET /api/distribucion-intereses?periodo=2026-03&usuario_id=U001  (HU9) */
async function consultar(req, res) {
  const errores = [];
  let periodo;
  if (req.query.periodo !== undefined) periodo = v.periodo(req.query.periodo, 'periodo', errores);
  v.lanzarSiHayErrores(errores);
  let usuario_id;
  if (req.query.usuario_id !== undefined) usuario_id = v.idParametro(req.query.usuario_id, 'usuario', 'usuario_id');
  const data = await servicio.consultar({ periodo, usuario_id });
  return ok(res, data, 'Distribuciones consultadas correctamente.');
}

module.exports = { calcular, registrar, consultar };
