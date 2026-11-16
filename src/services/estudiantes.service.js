const { coleccion } = require('../config/database');
const AppError = require('../utils/AppError');
const { confirmarEscritura } = require('../utils/validadores');
const { siguientesIds, conReintentoDeId } = require('../utils/ids');

const DATOS_PUBLICOS = { projection: {
  _id: 0, usuario_id: 1, tipo: 1, nombre: 1, documento: 1, telefono: 1, email: 1, estado: 1,
} };

/** HU1: registra un estudiante (el identificador U### se genera automáticamente). */
async function registrar({ nombre, documento, telefono, email }) {
  if (!/@uniautonoma\.edu\.co$/.test(String(email).toLowerCase())) {
    throw new AppError(400, 'Los estudiantes deben usar su correo @uniautonoma.edu.co.');
  }
  const usuarios = coleccion('usuarios');

  const duplicado = await usuarios.findOne({ $or: [{ documento }, { email }] }, DATOS_PUBLICOS);
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
  return coleccion('usuarios').find(filtro, DATOS_PUBLICOS).sort({ usuario_id: 1 }).toArray();
}

async function obtener(usuario_id) {
  const estudiante = await coleccion('usuarios').findOne({ usuario_id, tipo: 'estudiante' }, DATOS_PUBLICOS);
  if (!estudiante) throw new AppError(404, `No existe un estudiante con id ${usuario_id}.`);
  return estudiante;
}

module.exports = { registrar, listar, obtener };
