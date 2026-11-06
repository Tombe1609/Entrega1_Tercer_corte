const { coleccion } = require('../config/database');
const { redondear } = require('../utils/dinero');

/** Suma un campo con $match + $group (un solo acumulador por consulta). */
async function sumar(col, campo, filtro = {}) {
  const r = await col.aggregate([{ $match: filtro }, { $group: { _id: null, total: { $sum: `$${campo}` } } }]).toArray();
  return r[0] ? r[0].total : 0;
}

/** Agrupa por un campo y aplica un $sum (1 = contar). Devuelve { clave: valor }. */
async function sumarPorGrupo(col, grupo, expresion) {
  const r = await col.aggregate([{ $group: { _id: `$${grupo}`, valor: { $sum: expresion } } }]).toArray();
  return Object.fromEntries(r.map((x) => [x._id, x.valor]));
}

/**
 * HU10: estadísticas para el rector. Cada indicador corresponde a una consulta
 * del TXT original (aggregate con $match y $group). Los nombres de estudiantes
 * se unen con una segunda consulta (equivalente al $lookup del TXT) y los
 * promedios se calculan como total / cantidad (equivalente a $avg).
 */
async function estadisticas() {
  const usuarios = coleccion('usuarios');
  const ahorros = coleccion('ahorros');
  const prestamos = coleccion('prestamos');
  const pagos = coleccion('pagos_prestamo');
  const distribucion = coleccion('distribucion_intereses');
  const activos = { estado: 'activo' };

  const [
    cantidadEstudiantes,
    totalAhorrado,
    cantidadPrestamos,
    totalPrestado,
    totalInteresesGenerados,
    capitalPendiente,
    interesPendiente,
    prestamosPorEstado,
    pagosCantidad,
    pagosTotal,
    distribuidoCantidad,
    distribuidoTotal,
    mayoresAhorros,
    prestamosActivos,
  ] = await Promise.all([
    usuarios.countDocuments({ tipo: 'estudiante' }),
    sumar(ahorros, 'saldo', activos),
    prestamos.countDocuments({}),
    sumar(prestamos, 'capital_inicial'),
    sumar(prestamos, 'interes_inicial'),
    sumar(prestamos, 'capital_pendiente', activos),
    sumar(prestamos, 'interes_pendiente', activos),
    sumarPorGrupo(prestamos, 'estado', 1),
    sumarPorGrupo(pagos, 'tipo_abono', 1),
    sumarPorGrupo(pagos, 'tipo_abono', '$valor'),
    sumarPorGrupo(distribucion, 'periodo', 1),
    sumarPorGrupo(distribucion, 'periodo', '$interes_recibido'),
    ahorros.find(activos, { projection: { _id: 0, usuario_id: 1, saldo: 1 } }).sort({ saldo: -1 }).limit(5).toArray(),
    prestamos
      .find(activos, { projection: { _id: 0, prestamo_id: 1, usuario_id: 1, capital_pendiente: 1, interes_pendiente: 1 } })
      .sort({ capital_pendiente: -1 })
      .toArray(),
  ]);

  const ids = [...new Set([...mayoresAhorros, ...prestamosActivos].map((d) => d.usuario_id))];
  const personas = await usuarios.find({ usuario_id: { $in: ids } }, { projection: { _id: 0, usuario_id: 1, nombre: 1 } }).toArray();
  const nombre = Object.fromEntries(personas.map((u) => [u.usuario_id, u.nombre]));

  const tiposDePago = Object.keys(pagosCantidad).sort();
  const periodos = Object.keys(distribuidoCantidad).sort();

  return {
    estudiantes: { cantidad: cantidadEstudiantes },
    ahorros: { total_ahorrado: totalAhorrado },
    prestamos: {
      cantidad: cantidadPrestamos,
      total_prestado: totalPrestado,
      total_intereses_generados: totalInteresesGenerados,
      total_capital_pendiente: capitalPendiente,
      total_intereses_pendientes: interesPendiente,
      por_estado: Object.keys(prestamosPorEstado).sort().map((estado) => ({ estado, cantidad: prestamosPorEstado[estado] })),
    },
    pagos: {
      cantidad_pagos: tiposDePago.reduce((s, t) => s + pagosCantidad[t], 0),
      total_pagado: redondear(tiposDePago.reduce((s, t) => s + pagosTotal[t], 0)),
      por_tipo: tiposDePago.map((tipo) => ({
        tipo_abono: tipo,
        cantidad_pagos: pagosCantidad[tipo],
        total: pagosTotal[tipo],
        promedio_pago: redondear(pagosTotal[tipo] / pagosCantidad[tipo]),
      })),
    },
    // Los intereses distribuidos pertenecen a los estudiantes ahorradores: no son ganancia de la cooperativa.
    intereses_distribuidos_a_ahorradores: periodos.map((periodo) => ({
      periodo,
      cantidad_ahorradores: distribuidoCantidad[periodo],
      total_intereses_distribuidos: redondear(distribuidoTotal[periodo]),
    })),
    estudiantes_con_mayor_ahorro: mayoresAhorros.map((a) => ({ usuario_id: a.usuario_id, nombre: nombre[a.usuario_id] || null, saldo: a.saldo })),
    estudiantes_con_prestamo_activo: prestamosActivos.map((p) => ({ ...p, nombre: nombre[p.usuario_id] || null })),
  };
}

module.exports = { estadisticas };
