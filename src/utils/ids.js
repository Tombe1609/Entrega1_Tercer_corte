const AppError = require('./AppError');

/**
 * Genera identificadores de negocio con el formato del proyecto original:
 * prefijo + número de 3 dígitos (U012, A011, M014, P009, PG004, DI011...).
 * Toma el mayor número existente y suma uno.
 */
async function siguientesIds(col, campo, prefijo, cantidad = 1, session) {
  const docs = await col.find({}, { projection: { [campo]: 1, _id: 0 }, session }).toArray();
  let maximo = 0;
  for (const doc of docs) {
    const numero = Number(String(doc[campo]).slice(prefijo.length));
    if (Number.isFinite(numero) && numero > maximo) maximo = numero;
  }
  return Array.from({ length: cantidad }, (_, i) => `${prefijo}${String(maximo + i + 1).padStart(3, '0')}`);
}

function esDuplicadoDeCampo(error, campo) {
  return error && error.code === 11000 && error.keyPattern && error.keyPattern[campo] !== undefined;
}

/**
 * Ejecuta `operacion`; si dos solicitudes simultáneas generaron el mismo
 * identificador (error de índice único), se reintenta con un identificador nuevo.
 */
async function conReintentoDeId(campos, operacion, intentos = 5) {
  const lista = Array.isArray(campos) ? campos : [campos];
  for (let i = 1; ; i += 1) {
    try {
      return await operacion();
    } catch (error) {
      const colision = lista.some((campo) => esDuplicadoDeCampo(error, campo));
      if (!colision) throw error;
      if (i >= intentos) throw new AppError(409, 'No se pudo generar un identificador único. Intente de nuevo.');
      await new Promise((resolver) => setTimeout(resolver, 10 + Math.random() * 40));
    }
  }
}

module.exports = { siguientesIds, conReintentoDeId };
