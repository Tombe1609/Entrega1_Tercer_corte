const servicio = require('../services/estudiantes.service');
const prestamos = require('../services/prestamos.service');
const v = require('../utils/validadores');
const { ok, creado } = require('../utils/respuestas');

/** POST /api/estudiantes  (HU1) */
async function registrar(req, res) {
  const body = v.exigirCuerpo(req.body);
  const errores = [];
  const datos = {
    nombre: v.texto(body, 'nombre', errores, { min: 3, max: 100 }),
    documento: v.digitos(body, 'documento', errores, { min: 5, max: 15 }),
    telefono: v.digitos(body, 'telefono', errores, { min: 7, max: 15 }),
    email: v.email(body, 'email', errores),
  };
  v.lanzarSiHayErrores(errores);

  const estudiante = await servicio.registrar(datos);
  return creado(res, estudiante, 'Estudiante registrado correctamente.');
}

/** GET /api/estudiantes?estado=activo  (HU1) */
async function listar(req, res) {
  const errores = [];
  const estado = v.enumerado(req.query.estado, 'estado', ['activo', 'inactivo'], errores);
  v.lanzarSiHayErrores(errores);
  const lista = await servicio.listar({ estado });
  return ok(res, { cantidad: lista.length, estudiantes: lista }, 'Estudiantes consultados correctamente.');
}

/** GET /api/estudiantes/:usuario_id  (HU1) */
async function obtener(req, res) {
  const usuario_id = v.idParametro(req.params.usuario_id, 'usuario', 'usuario_id');
  return ok(res, await servicio.obtener(usuario_id), 'Estudiante consultado correctamente.');
}

/** GET /api/estudiantes/:usuario_id/prestamos?estado=activo  (HU7) */
async function consultarPrestamos(req, res) {
  const usuario_id = v.idParametro(req.params.usuario_id, 'usuario', 'usuario_id');
  const errores = [];
  const estado = v.enumerado(req.query.estado, 'estado', ['activo', 'pagado'], errores);
  v.lanzarSiHayErrores(errores);
  const data = await prestamos.consultarDeEstudiante(usuario_id, { estado });
  return ok(res, data, 'Préstamos del estudiante consultados correctamente.');
}

module.exports = { registrar, listar, obtener, consultarPrestamos };
