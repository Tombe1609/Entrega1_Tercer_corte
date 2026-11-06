const { coleccion } = require('../config/database');
const AppError = require('../utils/AppError');
const { confirmarEscritura } = require('../utils/validadores');
const { siguientesIds, conReintentoDeId } = require('../utils/ids');

const SIN_ID = { projection: { _id: 0 } };

/** HU1: registra un estudiante (el identificador U### se genera automáticamente). */
async function registrar({ nombre, documento, telefono, email }) {
  const usuarios = coleccion('usuarios');

  const duplicado = await usuarios.findOne({ $or: [{ documento }, { email }] }, SIN_ID);
  if (duplicado) {
    const campo = duplicado.documento === documento ? 'documento' : 'email';
    throw new AppError(409, `No se registró: ya existe un usuario con ese ${campo}.`);
  }

  return conReintentoDeId('usuario_id', async () => {
    const [usuario_id] = await siguientesIds(usuarios, 'usuario_id', 'U');
    const estudiante = { usuario_id, nombre, documento, telefono, email, tipo: 'estudiante', estado: 'activo' };
    confirmarEscritura(await usuarios.insertOne({ ...estudiante }), 'No se pudo registrar el estudiante.');
    return estudiante;
  });
}

async function listar({ estado } = {}) {
  const filtro = { tipo: 'estudiante' };
  if (estado) filtro.estado = estado;
  return coleccion('usuarios').find(filtro, SIN_ID).sort({ usuario_id: 1 }).toArray();
}

async function obtener(usuario_id) {
  const estudiante = await coleccion('usuarios').findOne({ usuario_id, tipo: 'estudiante' }, SIN_ID);
  if (!estudiante) throw new AppError(404, `No existe un estudiante con id ${usuario_id}.`);
  return estudiante;
}

module.exports = { registrar, listar, obtener };
