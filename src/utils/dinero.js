/** Redondea valores monetarios a 2 decimales. */
function redondear(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

module.exports = { redondear };
