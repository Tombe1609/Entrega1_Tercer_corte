const { coleccion } = require('../config/database');
const AppError = require('../utils/AppError');
const { confirmarEscritura } = require('../utils/validadores');
const { siguientesIds, conReintentoDeId } = require('../utils/ids');

const SIN_ID = { projection: { _id: 0 } };

// Cargos permitidos según la HU2 del proyecto original.
const CARGOS_PERMITIDOS = [
  'Director financiero',
  'Asesor de créditos',
  'Tesorero',
  'Auxiliar administrativo',
  'Analista financiero',
  'Coordinador de cartera',
];
const ESTADOS_PERMITIDOS = ['activo', 'inactivo'];

/** HU2: el rector registra un funcionario con su cargo. */
async function registrar({ nombre, cargo, telefono, email, estado }) {
  const funcionarios = coleccion('funcionarios');

  const duplicado = await funcionarios.findOne({ email }, SIN_ID);
  if (duplicado) throw new AppError(409, 'No se registró: ya existe un funcionario con ese email.');

  return conReintentoDeId('funcionario_id', async () => {
    const [funcionario_id] = await siguientesIds(funcionarios, 'funcionario_id', 'F');
    const funcionario = { funcionario_id, nombre, cargo, telefono, email, estado };
    confirmarEscritura(await funcionarios.insertOne({ ...funcionario }), 'No se pudo registrar el funcionario.');
    return funcionario;
  });
}

async function listar({ cargo, estado } = {}) {
  const filtro = {};
  if (cargo) filtro.cargo = cargo;
  if (estado) filtro.estado = estado;
  return coleccion('funcionarios').find(filtro, SIN_ID).sort({ funcionario_id: 1 }).toArray();
}

async function obtener(funcionario_id) {
  const funcionario = await coleccion('funcionarios').findOne({ funcionario_id }, SIN_ID);
  if (!funcionario) throw new AppError(404, `No existe un funcionario con id ${funcionario_id}.`);
  return funcionario;
}

module.exports = { registrar, listar, obtener, CARGOS_PERMITIDOS, ESTADOS_PERMITIDOS };
