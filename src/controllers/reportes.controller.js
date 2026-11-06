const servicio = require('../services/reportes.service');
const { ok } = require('../utils/respuestas');

/** GET /api/reportes/estadisticas  (HU10) */
async function estadisticas(req, res) {
  return ok(res, await servicio.estadisticas(), 'Estadísticas de la cooperativa consultadas correctamente.');
}

module.exports = { estadisticas };
