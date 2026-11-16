const { coleccion } = require('../config/database');
const config = require('../config/config');
const AppError = require('../utils/AppError');
const { confirmarEscritura } = require('../utils/validadores');
const { siguientesIds, conReintentoDeId } = require('../utils/ids');
const { ejecutarAtomico } = require('../utils/transaccion');
const { redondear } = require('../utils/dinero');
const {
  hoyColombia, fechaISOValida, fechaVencimientoColombia, sumarMesesCalendarioColombia, productoDentroDeVigencia,
} = require('../utils/fechas');

const SIN_ID = { projection: { _id: 0 } };

function crearPlanCuotas(capital, interes, plazo, fechaPrimerPago) {
  let capitalAsignado = 0;
  let interesAsignado = 0;
  return Array.from({ length: plazo }, (_, indice) => {
    const capitalCuota = indice === plazo - 1
      ? redondear(capital - capitalAsignado)
      : redondear(capital / plazo);
    const interesCuota = indice === plazo - 1
      ? redondear(interes - interesAsignado)
      : redondear(interes / plazo);
    capitalAsignado = redondear(capitalAsignado + capitalCuota);
    interesAsignado = redondear(interesAsignado + interesCuota);

    const fechaVencimiento = fechaVencimientoColombia(sumarMesesCalendarioColombia(fechaPrimerPago, indice));
    return {
      numero: indice + 1,
      fecha_vencimiento: fechaVencimiento,
      capital: capitalCuota,
      interes: interesCuota,
      valor: redondear(capitalCuota + interesCuota),
      estado: 'pendiente',
    };
  });
}

async function listarFines() {
  return coleccion('fines_educativos').find({}, SIN_ID).sort({ fin_id: 1 }).toArray();
}

async function obtenerPrestamo(prestamo_id, session) {
  const prestamo = await coleccion('prestamos').findOne({ prestamo_id }, { session, ...SIN_ID });
  if (!prestamo) throw new AppError(404, `No existe un préstamo con id ${prestamo_id}.`);
  return prestamo;
}

/**
 * HU5: solicita un préstamo educativo.
 * Reglas: estudiante activo, finalidad educativa activa, monto > 0 y <= límite,
 * y un solo préstamo activo por estudiante. Interés inicial = capital * 5 %.
 */
async function solicitar({ usuario_id, fin_id, monto, plazo_meses = 1, fecha_primer_pago, producto_id }) {
  const estudiante = await coleccion('usuarios').findOne({ usuario_id, tipo: 'estudiante' }, SIN_ID);
  if (!estudiante) throw new AppError(404, `No existe un estudiante con id ${usuario_id}.`);
  if (estudiante.estado !== 'activo') throw new AppError(400, 'El estudiante no está activo.');

  let producto=null;
  if(producto_id){
    producto=await coleccion('productos').findOne({producto_id,estado:'activo'},SIN_ID);
    if(!producto) throw new AppError(404,'El producto no existe o ya no está disponible.');
    if(!productoDentroDeVigencia(producto,hoyColombia())) throw new AppError(409,'El producto asociado a esta financiación no está dentro de su periodo de vigencia.');
    if(producto.precio!==monto) throw new AppError(400,'El monto financiado debe coincidir con el precio vigente del producto.');
  } else {
    const fin = await coleccion('fines_educativos').findOne({ fin_id }, SIN_ID);
    if (!fin) throw new AppError(404, `No existe la finalidad educativa ${fin_id}.`);
    if (fin.estado !== 'activo') throw new AppError(400, 'La finalidad educativa no está activa.');
  }

  if (monto > config.limitePrestamo) {
    throw new AppError(400, `El monto supera el límite permitido de ${config.limitePrestamo}.`);
  }
  if (monto < 1000) throw new AppError(400, 'El monto mínimo del préstamo es 1000.');
  if (!Number.isInteger(plazo_meses) || plazo_meses < 1 || plazo_meses > 3) throw new AppError(400, 'El plazo debe ser de 1 a 3 meses.');
  if (!fechaISOValida(fecha_primer_pago) || fecha_primer_pago <= hoyColombia()) {
    throw new AppError(400, 'La fecha de la primera cuota debe ser una fecha futura válida.');
  }
  const primerPago = fechaVencimientoColombia(fecha_primer_pago);

  const prestamos = coleccion('prestamos');
  const existente = await prestamos.findOne({ usuario_id, estado: { $in: ['pendiente', 'activo'] } }, SIN_ID);
  if (existente) {
    throw new AppError(409, `El estudiante ya tiene una solicitud o préstamo activo (${existente.prestamo_id}).`);
  }

  return conReintentoDeId('prestamo_id', async () => {
    const [prestamo_id] = await siguientesIds(prestamos, 'prestamo_id', 'P');
    const interes = redondear(monto * config.tasaInteres);
    const prestamo = {
      prestamo_id,
      usuario_id,
      fin_id,
      producto_id: producto?.producto_id || null,
      producto_nombre: producto?.nombre || null,
      capital_inicial: monto,
      interes_inicial: interes,
      capital_pendiente: monto,
      interes_pendiente: interes,
      tasa_interes: config.tasaInteres,
      estado: 'pendiente',
      plazo_meses,
      fecha_primer_pago: primerPago,
      cuotas: crearPlanCuotas(monto, interes, plazo_meses, fecha_primer_pago),
      fecha_solicitud: new Date(),
    };
    confirmarEscritura(await prestamos.insertOne({ ...prestamo }), 'No se pudo registrar el préstamo.');
    return prestamo;
  });
}

/**
 * HU5: el funcionario aprueba y desembolsa una solicitud pendiente.
 * El préstamo, el saldo de ahorro y el movimiento se confirman juntos.
 */
async function aprobar(prestamo_id, funcionario_id) {
  const prestamos = coleccion('prestamos');
  const ahorros = coleccion('ahorros');
  const movimientos = coleccion('movimientos_ahorro');

  return conReintentoDeId('movimiento_id', () =>
    ejecutarAtomico(async ({ session, alDeshacer }) => {
      const solicitud = await obtenerPrestamo(prestamo_id, session);
      if (solicitud.estado !== 'pendiente') {
        throw new AppError(409, `El préstamo ${prestamo_id} ya no está pendiente de aprobación.`);
      }
      if(solicitud.producto_id){
        const producto=await coleccion('productos').findOne({producto_id:solicitud.producto_id,estado:'activo'},{session,...SIN_ID});
        if(!producto||!productoDentroDeVigencia(producto,hoyColombia())) throw new AppError(409,'El producto asociado a esta financiación ya no está vigente.');
        if(await coleccion('compras').findOne({usuario_id:solicitud.usuario_id,producto_id:solicitud.producto_id,estado:'pagada'},{session,...SIN_ID})) throw new AppError(409,'El estudiante ya compró este producto; no se desembolsó el préstamo.');
      }

      const activo = await prestamos.findOne(
        { usuario_id: solicitud.usuario_id, estado: 'activo' },
        { session, ...SIN_ID }
      );
      if (activo) throw new AppError(409, `El estudiante ya tiene un préstamo activo (${activo.prestamo_id}).`);

      const cuenta = await ahorros.findOne(
        { usuario_id: solicitud.usuario_id, estado: 'activo' },
        { session, ...SIN_ID }
      );
      if (!cuenta) throw new AppError(409, 'No se puede desembolsar: el estudiante no tiene una cuenta de ahorro activa.');

      const fecha_desembolso = new Date();
      const plazoMeses = solicitud.plazo_meses || 1;
      let fechaPrimerPago = solicitud.fecha_primer_pago;
      let cuotasProgramadas = solicitud.cuotas;
      const primeraCuota = Array.isArray(cuotasProgramadas) ? cuotasProgramadas[0] : null;
      const fechaPrimeraCuota = primeraCuota?.fecha_vencimiento ? new Date(primeraCuota.fecha_vencimiento) : null;
      if (!fechaPrimeraCuota || Number.isNaN(fechaPrimeraCuota.getTime())) {
        throw new AppError(409, 'La solicitud no tiene una primera fecha válida para el plan de cuotas.');
      }
      const diaDesembolso = hoyColombia(fecha_desembolso);
      if (hoyColombia(fechaPrimeraCuota) <= diaDesembolso) {
        const primerDiaPago = sumarMesesCalendarioColombia(diaDesembolso, 1);
        fechaPrimerPago = fechaVencimientoColombia(primerDiaPago);
        cuotasProgramadas = crearPlanCuotas(
          solicitud.capital_pendiente,
          solicitud.interes_pendiente,
          plazoMeses,
          primerDiaPago,
        );
      }
      const cambioPrestamo = await prestamos.updateOne(
        { prestamo_id, estado: 'pendiente' },
        { $set: {
          estado: 'activo', fecha_desembolso, desembolsado_por: funcionario_id,
          plazo_meses: plazoMeses, fecha_primer_pago: fechaPrimerPago, cuotas: cuotasProgramadas,
        } },
        { session }
      );
      confirmarEscritura(cambioPrestamo);
      if (cambioPrestamo.matchedCount !== 1) {
        throw new AppError(409, 'La solicitud cambió mientras se aprobaba. Actualice la pantalla e intente de nuevo.');
      }
      alDeshacer(() => prestamos.updateOne(
        { prestamo_id, estado: 'activo', fecha_desembolso },
        {
          $set: {
            estado: 'pendiente', plazo_meses: solicitud.plazo_meses,
            fecha_primer_pago: solicitud.fecha_primer_pago, cuotas: solicitud.cuotas,
          },
          $unset: { fecha_desembolso: '', desembolsado_por: '' },
        }
      ));

      const cambioSaldo = await ahorros.updateOne(
        { ahorro_id: cuenta.ahorro_id, estado: 'activo', saldo: cuenta.saldo },
        { $inc: { saldo: solicitud.capital_inicial } },
        { session }
      );
      confirmarEscritura(cambioSaldo);
      if (cambioSaldo.matchedCount !== 1) {
        throw new AppError(409, 'El saldo de ahorro cambió durante la aprobación. Actualice e intente de nuevo.');
      }
      alDeshacer(() => ahorros.updateOne(
        { ahorro_id: cuenta.ahorro_id },
        { $inc: { saldo: -solicitud.capital_inicial } }
      ));

      const [movimiento_id] = await siguientesIds(movimientos, 'movimiento_id', 'M', 1, session);
      const movimiento = {
        movimiento_id,
        ahorro_id: cuenta.ahorro_id,
        usuario_id: solicitud.usuario_id,
        tipo: 'deposito',
        valor: solicitud.capital_inicial,
        fecha: fecha_desembolso,
        descripcion: `Desembolso del préstamo ${prestamo_id}`,
      };
      confirmarEscritura(await movimientos.insertOne({ ...movimiento }, { session }), 'No se pudo guardar el movimiento de desembolso.');

      const cuentaActual = await ahorros.findOne({ ahorro_id: cuenta.ahorro_id }, { session, ...SIN_ID });
      return {
        prestamo: await obtenerPrestamo(prestamo_id, session),
        movimiento,
        saldo_anterior: cuenta.saldo,
        saldo_actual: cuentaActual.saldo,
      };
    })
  );
}

/**
 * HU6: calcula el interés del préstamo (capital * tasa) y el total a pagar.
 * Se muestran dos cálculos del TXT: sobre el capital inicial y sobre el capital pendiente.
 */
async function calcularInteres(prestamo_id) {
  const p = await obtenerPrestamo(prestamo_id);
  const interesInicial = redondear(p.capital_inicial * p.tasa_interes);
  const interesSobrePendiente = redondear(p.capital_pendiente * p.tasa_interes);
  return {
    prestamo_id: p.prestamo_id,
    usuario_id: p.usuario_id,
    estado: p.estado,
    tasa_interes: p.tasa_interes,
    sobre_capital_inicial: {
      capital_inicial: p.capital_inicial,
      interes_calculado: interesInicial,
      total_calculado: redondear(p.capital_inicial + interesInicial),
    },
    sobre_capital_pendiente: {
      capital_pendiente: p.capital_pendiente,
      interes_calculado: interesSobrePendiente,
      total_pendiente_calculado: redondear(p.capital_pendiente + interesSobrePendiente),
    },
    interes_pendiente_registrado: p.interes_pendiente,
  };
}

/** HU7: préstamos de un estudiante con su finalidad educativa y totales pendientes. */
async function consultarDeEstudiante(usuario_id, { estado } = {}) {
  const estudiante = await coleccion('usuarios').findOne({ usuario_id, tipo: 'estudiante' }, SIN_ID);
  if (!estudiante) throw new AppError(404, `No existe un estudiante con id ${usuario_id}.`);

  const filtro = { usuario_id };
  if (estado) filtro.estado = estado;
  const prestamos = await coleccion('prestamos').find(filtro, SIN_ID).sort({ prestamo_id: 1 }).toArray();

  const fines = await coleccion('fines_educativos')
    .find({ fin_id: { $in: [...new Set(prestamos.map((p) => p.fin_id))] } }, SIN_ID)
    .toArray();
  const nombreFin = Object.fromEntries(fines.map((f) => [f.fin_id, f.nombre]));

  const lista = prestamos.map((p) => ({
    prestamo_id: p.prestamo_id,
    fin_id: p.fin_id,
    finalidad: p.producto_nombre || nombreFin[p.fin_id] || null,
    capital_inicial: p.capital_inicial,
    capital_pendiente: p.capital_pendiente,
    interes_pendiente: p.interes_pendiente,
    estado: p.estado,
    fecha_solicitud: p.fecha_solicitud,
    fecha_desembolso: p.fecha_desembolso || null,
    plazo_meses: p.plazo_meses || null,
    cuotas: p.cuotas || [],
  }));

  return {
    estudiante: { usuario_id: estudiante.usuario_id, nombre: estudiante.nombre },
    cantidad_prestamos: lista.length,
    total_capital_pendiente: redondear(lista.filter((p) => p.estado === 'activo').reduce((s, p) => s + p.capital_pendiente, 0)),
    total_interes_pendiente: redondear(lista.filter((p) => p.estado === 'activo').reduce((s, p) => s + p.interes_pendiente, 0)),
    prestamos: lista,
  };
}

/** Paga una cuota desde ahorros y registra el movimiento y cuota juntos. */
async function pagarCuota(prestamo_id, numero, usuario_id) {
  const prestamos=coleccion('prestamos'), ahorros=coleccion('ahorros'), pagos=coleccion('pagos_prestamo'), movimientos=coleccion('movimientos_ahorro');
  return conReintentoDeId(['pago_id','movimiento_id'],()=>ejecutarAtomico(async({session,alDeshacer})=>{
    const p=await obtenerPrestamo(prestamo_id,session);
    if(p.usuario_id!==usuario_id) throw new AppError(403,'Este préstamo no pertenece a tu usuario.');
    if(p.estado!=='activo') throw new AppError(400,'El préstamo no está activo.');
    const cuota=p.cuotas?.find(x=>x.numero===numero);
    if(!cuota || cuota.estado!=='pendiente') throw new AppError(409,'La cuota no existe o ya fue pagada.');
    const fecha = new Date();
    const fechaVencimiento = cuota.fecha_vencimiento instanceof Date
      ? cuota.fecha_vencimiento
      : new Date(cuota.fecha_vencimiento);
    if (!cuota.fecha_vencimiento || Number.isNaN(fechaVencimiento.getTime())) {
      throw new AppError(409, `La cuota ${numero} no tiene una fecha de vencimiento válida. Contacta a un funcionario.`);
    }
    const diaVencimiento = typeof cuota.fecha_vencimiento === 'string' && fechaISOValida(cuota.fecha_vencimiento)
      ? cuota.fecha_vencimiento
      : hoyColombia(fechaVencimiento);
    if (diaVencimiento > hoyColombia(fecha)) {
      throw new AppError(409, `La cuota ${numero} estará disponible para pago el ${diaVencimiento}.`);
    }
    const cuenta=await ahorros.findOne({usuario_id,estado:'activo'},{session,...SIN_ID});
    if(!cuenta) throw new AppError(404,'No tienes una cuenta activa.');
    const debito=await ahorros.updateOne({ahorro_id:cuenta.ahorro_id,estado:'activo',saldo:{$gte:cuota.valor}},{$inc:{saldo:-cuota.valor}},{session});
    confirmarEscritura(debito); if(debito.matchedCount!==1) throw new AppError(400,'Saldo insuficiente para pagar esta cuota.');
    alDeshacer(()=>ahorros.updateOne({ahorro_id:cuenta.ahorro_id},{$inc:{saldo:cuota.valor}}));
    const cuotas=p.cuotas.map(x=>x.numero===numero?{...x,estado:'pagada',fecha_pago:fecha}:x);
    const capitalCuota=redondear(cuota.capital ?? Math.min(p.capital_pendiente, cuota.valor * p.capital_pendiente / (p.capital_pendiente + p.interes_pendiente)));
    const interesCuota=redondear(cuota.interes ?? Math.max(0, cuota.valor - capitalCuota));
    const capitalPendiente=redondear(Math.max(0,p.capital_pendiente-capitalCuota));
    const interesPendiente=redondear(Math.max(0,p.interes_pendiente-interesCuota));
    const estado=cuotas.every(x=>x.estado==='pagada')?'pagado':'activo';
    const upd=await prestamos.updateOne(
      {prestamo_id,estado:'activo',cuotas:{$elemMatch:{numero,estado:'pendiente'}}},
      {$set:{cuotas,capital_pendiente:capitalPendiente,interes_pendiente:interesPendiente,estado}},
      {session},
    );
    confirmarEscritura(upd); if(upd.matchedCount!==1) throw new AppError(409,'La cuota cambió. Actualiza e intenta otra vez.');
    alDeshacer(()=>prestamos.updateOne({prestamo_id},{$set:{cuotas:p.cuotas,capital_pendiente:p.capital_pendiente,interes_pendiente:p.interes_pendiente,estado:p.estado}}));
    const [pago_id]=await siguientesIds(pagos,'pago_id','PG',1,session); const [movimiento_id]=await siguientesIds(movimientos,'movimiento_id','M',1,session);
    const pago={pago_id,prestamo_id,usuario_id,tipo_abono:'cuota',cuota_numero:numero,valor:cuota.valor,fecha};
    const movimiento={movimiento_id,ahorro_id:cuenta.ahorro_id,usuario_id,tipo:'retiro',valor:cuota.valor,fecha,pago_id,descripcion:`Pago cuota ${numero} préstamo ${prestamo_id}`};
    confirmarEscritura(await pagos.insertOne(pago,{session})); confirmarEscritura(await movimientos.insertOne(movimiento,{session}));
    return {pago,prestamo:await obtenerPrestamo(prestamo_id,session),saldo_anterior:cuenta.saldo,saldo_actual:cuenta.saldo-cuota.valor};
  }));
}

/** HU8: historial de pagos de un préstamo. */
async function historialPagos(prestamo_id) {
  const prestamo = await obtenerPrestamo(prestamo_id);
  const pagos = await coleccion('pagos_prestamo').find({ prestamo_id }, SIN_ID).sort({ fecha: 1, pago_id: 1 }).toArray();
  return {
    prestamo: {
      prestamo_id: prestamo.prestamo_id,
      usuario_id: prestamo.usuario_id,
      capital_pendiente: prestamo.capital_pendiente,
      interes_pendiente: prestamo.interes_pendiente,
      estado: prestamo.estado,
    },
    cantidad_pagos: pagos.length,
    pagos,
  };
}

async function listarAdministracion() {
  const prestamos = await coleccion('prestamos').find({}, SIN_ID).sort({ fecha_solicitud: -1 }).limit(200).toArray();
  const ids = [...new Set(prestamos.map(p => p.usuario_id))];
  const estudiantes = await coleccion('usuarios').find({ usuario_id: { $in: ids } }, {
    projection: { _id: 0, usuario_id: 1, nombre: 1 },
  }).toArray();
  const nombres = new Map(estudiantes.map(u => [u.usuario_id, u.nombre]));
  return prestamos.map(p => ({ usuario_id: p.usuario_id, nombre: nombres.get(p.usuario_id) || p.usuario_id, prestamo: p }));
}

async function rechazar(prestamo_id, actor, motivo) {
  if (!motivo || motivo.length > 250) throw new AppError(400, 'Indica el motivo del rechazo, hasta 250 caracteres.');
  const resultado = await coleccion('prestamos').updateOne({ prestamo_id, estado: 'pendiente' }, {
    $set: { estado: 'rechazado', rechazado_por: actor, fecha_rechazo: new Date(), motivo_rechazo: motivo },
  });
  if (resultado.matchedCount !== 1) throw new AppError(409, 'El préstamo ya se atendió o no existe.');
  return { estado: 'rechazado' };
}

module.exports = { listarFines, obtenerPrestamo, solicitar, aprobar, calcularInteres, consultarDeEstudiante, pagarCuota, historialPagos, listarAdministracion, rechazar };
