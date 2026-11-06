const servicio = require('../services/funcionarios.service');
const v = require('../utils/validadores');
const { ok, creado } = require('../utils/respuestas');

/** POST /api/funcionarios  (HU2) */
async function registrar(req, res) {
  const body = v.exigirCuerpo(req.body);
  const errores = [];
  const datos = {
    nombre: v.texto(body, 'nombre', errores, { min: 3, max: 100 }),
    cargo: v.enumerado(body.cargo, 'cargo', servicio.CARGOS_PERMITIDOS, errores, { obligatorio: true }),
    telefono: v.digitos(body, 'telefono', errores, { min: 7, max: 15 }),
    email: v.email(body, 'email', errores),
    estado: v.enumerado(body.estado, 'estado', servicio.ESTADOS_PERMITIDOS, errores, { porDefecto: 'activo' }),
  };
  v.lanzarSiHayErrores(errores);

  const funcionario = await servicio.registrar(datos);
  return creado(res, funcionario, 'Funcionario registrado correctamente.');
}

/** GET /api/funcionarios?cargo=Tesorero&estado=activo  (HU2) */
async function listar(req, res) {
  const errores = [];
  const cargo = v.enumerado(req.query.cargo, 'cargo', servicio.CARGOS_PERMITIDOS, errores);
  const estado = v.enumerado(req.query.estado, 'estado', servicio.ESTADOS_PERMITIDOS, errores);
  v.lanzarSiHayErrores(errores);
  const lista = await servicio.listar({ cargo, estado });
  return ok(res, { cantidad: lista.length, funcionarios: lista }, 'Funcionarios consultados correctamente.');
}

/** GET /api/funcionarios/:funcionario_id  (HU2) */
async function obtener(req, res) {
  const id = v.idParametro(req.params.funcionario_id, 'funcionario', 'funcionario_id');
  return ok(res, await servicio.obtener(id), 'Funcionario consultado correctamente.');
}

module.exports = { registrar, listar, obtener };
