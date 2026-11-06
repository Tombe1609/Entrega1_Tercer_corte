const servicio = require('../services/ahorros.service');
const v = require('../utils/validadores');
const { ok, creado } = require('../utils/respuestas');

/** POST /api/ahorros  (HU3) */
async function crearCuenta(req, res) {
  const body = v.exigirCuerpo(req.body);
  const errores = [];
  const usuario_id = v.idEnCuerpo(body, 'usuario_id', 'usuario', errores);
  v.lanzarSiHayErrores(errores);
  const cuenta = await servicio.crearCuenta(usuario_id);
  return creado(res, cuenta, 'Cuenta de ahorro creada correctamente.');
}

/** GET /api/ahorros  (HU3) */
async function listarCuentas(req, res) {
  const lista = await servicio.listarCuentas();
  return ok(res, { cantidad: lista.length, cuentas: lista }, 'Cuentas de ahorro consultadas correctamente.');
}

/** GET /api/ahorros/:ahorro_id  (HU3) */
async function obtenerCuenta(req, res) {
  const id = v.idParametro(req.params.ahorro_id, 'ahorro', 'ahorro_id');
  return ok(res, await servicio.obtenerCuenta(id), 'Cuenta de ahorro consultada correctamente.');
}

function crearMovimiento(tipo, descripcionPorDefecto, mensaje) {
  return async (req, res) => {
    const ahorro_id = v.idParametro(req.params.ahorro_id, 'ahorro', 'ahorro_id');
    const body = v.exigirCuerpo(req.body);
    const errores = [];
    const valor = v.montoPositivo(body, 'valor', errores);
    const descripcion = v.textoOpcional(body, 'descripcion', errores, { max: 200, porDefecto: descripcionPorDefecto });
    v.lanzarSiHayErrores(errores);
    const resultado = await servicio.registrarMovimiento(ahorro_id, tipo, valor, descripcion);
    return creado(res, resultado, mensaje);
  };
}

/** POST /api/ahorros/:ahorro_id/depositos  (HU4) */
const depositar = crearMovimiento('deposito', 'Depósito realizado por el estudiante', 'Depósito registrado correctamente.');

/** POST /api/ahorros/:ahorro_id/retiros  (HU4) */
const retirar = crearMovimiento('retiro', 'Retiro autorizado', 'Retiro registrado correctamente.');

/** GET /api/ahorros/:ahorro_id/movimientos?tipo=deposito  (HU4) */
async function consultarMovimientos(req, res) {
  const ahorro_id = v.idParametro(req.params.ahorro_id, 'ahorro', 'ahorro_id');
  const errores = [];
  const tipo = v.enumerado(req.query.tipo, 'tipo', ['deposito', 'retiro'], errores);
  v.lanzarSiHayErrores(errores);
  const data = await servicio.consultarMovimientos(ahorro_id, { tipo });
  return ok(res, data, 'Movimientos consultados correctamente.');
}

module.exports = { crearCuenta, listarCuentas, obtenerCuenta, depositar, retirar, consultarMovimientos };
