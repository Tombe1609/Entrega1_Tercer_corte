const { obtenerClient, soportaTransacciones } = require('../config/database');

/**
 * Ejecuta un conjunto de escrituras que deben confirmarse juntas
 * (por ejemplo: actualizar el saldo y registrar el movimiento).
 *
 *  - Si MongoDB corre como replica set (o Atlas): usa una transacción real
 *    (igual que el proyecto original). Si algo falla, se revierte todo.
 *  - Si MongoDB corre como servidor único (sin replica set): no existen
 *    transacciones; se aplica una compensación: cada paso registra con
 *    `alDeshacer` cómo revertirse y, si un paso posterior falla, se ejecutan
 *    en orden inverso.
 *
 * `trabajo` recibe { session, alDeshacer }. Debe pasar `session` en cada
 * operación de MongoDB (si es undefined, el driver la ignora).
 */
async function ejecutarAtomico(trabajo) {
  if (!soportaTransacciones()) {
    const deshacer = [];
    try {
      return await trabajo({ session: undefined, alDeshacer: (fn) => deshacer.push(fn) });
    } catch (error) {
      for (const revertir of deshacer.reverse()) {
        try {
          await revertir();
        } catch (errorReversion) {
          console.error('No se pudo revertir un paso de la operación:', errorReversion.message);
        }
      }
      throw error;
    }
  }

  const session = obtenerClient().startSession();
  let resultado;
  try {
    await session.withTransaction(async () => {
      resultado = await trabajo({ session, alDeshacer: () => {} });
    });
    return resultado;
  } finally {
    await session.endSession();
  }
}

module.exports = { ejecutarAtomico };
