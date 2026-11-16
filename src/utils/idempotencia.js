const crypto = require('node:crypto');
const AppError = require('./AppError');
const { coleccion } = require('../config/database');
const { ejecutarAtomico } = require('./transaccion');

function ordenar(valor) {
  if (Array.isArray(valor)) return valor.map(ordenar);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.keys(valor).sort().map((clave) => [clave, ordenar(valor[clave])]));
  }
  return valor;
}

function crearContextoIdempotencia(req) {
  const key = req.get('Idempotency-Key')?.trim();
  if (!key || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    throw new AppError(400, 'Envía un Idempotency-Key UUID para esta operación financiera.');
  }
  const ruta = req.originalUrl.split('?')[0];
  const scope = `${req.auth.id}:${req.method}:${ruta}`;
  const contenido = JSON.stringify(ordenar({ method: req.method, path: ruta, body: req.body ?? {} }));
  const request_hash = crypto.createHash('sha256').update(contenido).digest('hex');
  return { scope, key, request_hash };
}

function crearEjecutorIdempotente({ obtenerColeccion = () => coleccion('idempotency_keys'), ejecutarAtomico: atomico = ejecutarAtomico } = {}) {
  return async function ejecutarIdempotente(contexto, trabajo) {
    if (!contexto?.scope || !contexto?.key || !contexto?.request_hash) {
      throw new AppError(400, 'Falta la clave de idempotencia para esta operación.');
    }
    const registros = obtenerColeccion();
    const recuperar = async (session) => {
      const previo = await registros.findOne(
        { scope: contexto.scope, key: contexto.key },
        { session, projection: { _id: 0, request_hash: 1, estado: 1, resultado: 1 } },
      );
      if (!previo) return null;
      if (previo.request_hash !== contexto.request_hash) {
        throw new AppError(409, 'Esta clave ya se usó con datos diferentes. Genera una clave nueva para una operación distinta.');
      }
      if (previo.estado === 'completada') return previo.resultado;
      throw new AppError(409, 'La operación con esta clave está en proceso o requiere verificación. Consulta el saldo y el historial antes de intentar otra vez.');
    };

    try {
      return await atomico(async ({ session, alDeshacer }) => {
        const resultadoPrevio = await recuperar(session);
        if (resultadoPrevio !== null) return resultadoPrevio;

        await registros.insertOne({
          scope: contexto.scope,
          key: contexto.key,
          request_hash: contexto.request_hash,
          estado: 'en_proceso',
          creado_en: new Date(),
        }, { session });
        alDeshacer(() => registros.deleteOne({ scope: contexto.scope, key: contexto.key }));

        const resultado = await trabajo({ session, alDeshacer });
        const guardado = await registros.updateOne(
          { scope: contexto.scope, key: contexto.key, estado: 'en_proceso' },
          { $set: { estado: 'completada', resultado, completada_en: new Date() } },
          { session },
        );
        if (guardado.matchedCount !== 1) throw new AppError(409, 'No se pudo confirmar el registro de esta operación.');
        return resultado;
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      const resultadoPrevio = await recuperar();
      if (resultadoPrevio !== null) return resultadoPrevio;
      throw error;
    }
  };
}

const ejecutarIdempotente = crearEjecutorIdempotente();

module.exports = { crearContextoIdempotencia, crearEjecutorIdempotente, ejecutarIdempotente };
