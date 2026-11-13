const ZONA_HORARIA_COLOMBIA = 'America/Bogota';

/** Fecha calendario usada por la cooperativa para vigencias (YYYY-MM-DD). */
function hoyColombia(ahora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA_COLOMBIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(ahora);
  const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

function fechaISOValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

function productoDentroDeVigencia(producto, hoy = hoyColombia()) {
  return (!producto.fecha_inicio || producto.fecha_inicio <= hoy)
    && (!producto.fecha_fin || producto.fecha_fin >= hoy);
}

function filtroVigenciaProducto(hoy = hoyColombia()) {
  return {
    $and: [
      { $or: [{ fecha_inicio: { $exists: false } }, { fecha_inicio: null }, { fecha_inicio: { $lte: hoy } }] },
      { $or: [{ fecha_fin: { $exists: false } }, { fecha_fin: null }, { fecha_fin: { $gte: hoy } }] },
    ],
  };
}

module.exports = { hoyColombia, fechaISOValida, productoDentroDeVigencia, filtroVigenciaProducto };
