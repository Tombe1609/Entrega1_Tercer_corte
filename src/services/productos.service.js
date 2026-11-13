const { coleccion } = require('../config/database');
const AppError = require('../utils/AppError');
const { confirmarEscritura } = require('../utils/validadores');
const { siguientesIds, conReintentoDeId } = require('../utils/ids');
const { ejecutarAtomico } = require('../utils/transaccion');
const { hoyColombia, productoDentroDeVigencia, filtroVigenciaProducto } = require('../utils/fechas');
const SIN_ID = { projection: { _id: 0 } };

async function listar({ admin = false } = {}) {
  const hoy = hoyColombia();
  const filtro = admin ? {} : { estado: 'activo', ...filtroVigenciaProducto(hoy) };
  return coleccion('productos').find(filtro, SIN_ID).sort({ nombre: 1 }).toArray();
}

async function crear(datos, funcionario_id) {
  const col = coleccion('productos');
  return conReintentoDeId('producto_id', async () => {
    const [producto_id] = await siguientesIds(col, 'producto_id', 'PR');
    const producto = { ...datos, producto_id, estado: 'activo', creado_por: funcionario_id, fecha_creacion: new Date() };
    confirmarEscritura(await col.insertOne(producto), 'No se pudo crear el producto.');
    return producto;
  });
}

async function actualizar(producto_id, datos, funcionario_id) {
  const productos = coleccion('productos');
  const existente = await productos.findOne({ producto_id }, SIN_ID);
  if (!existente) throw new AppError(404, `No existe el producto ${producto_id}.`);

  if (datos.precio !== existente.precio) {
    const prestamoPendiente = await coleccion('prestamos').findOne(
      { producto_id, estado: 'pendiente' },
      { projection: { _id: 0, prestamo_id: 1 } }
    );
    if (prestamoPendiente) {
      throw new AppError(409, 'No se puede cambiar el precio mientras haya una solicitud de préstamo pendiente para este producto.');
    }
  }

  const hoy = hoyColombia();
  if (datos.fecha_fin < hoy && datos.fecha_fin !== existente.fecha_fin) {
    throw new AppError(400, 'La fecha límite nueva debe ser hoy o una fecha futura.');
  }

  const actualizacion = {
    ...datos,
    fecha_actualizacion: new Date(),
    actualizado_por: funcionario_id,
  };
  const resultado = await productos.updateOne({ producto_id }, { $set: actualizacion });
  confirmarEscritura(resultado, 'No se pudo actualizar la publicación.');
  return productos.findOne({ producto_id }, SIN_ID);
}

async function cambiarEstado(producto_id, estado) {
  const productos = coleccion('productos');
  const existente = await productos.findOne({ producto_id }, SIN_ID);
  if (!existente) throw new AppError(404, `No existe el producto ${producto_id}.`);

  const hoy = hoyColombia();
  if (estado === 'activo' && !productoDentroDeVigencia(existente, hoy)) {
    throw new AppError(409, 'No se puede reactivar una publicación fuera de su periodo de vigencia.');
  }

  // Repetir la condición en la escritura evita una reactivación fuera de vigencia
  // si el periodo cambia entre la lectura y la actualización.
  const filtro = estado === 'activo'
    ? { producto_id, ...filtroVigenciaProducto(hoy) }
    : { producto_id };
  const r = await productos.updateOne(filtro, { $set: { estado } });
  if (!r.matchedCount) {
    const sigueExistiendo = await productos.findOne({ producto_id }, { projection: { _id: 1 } });
    if (!sigueExistiendo) throw new AppError(404, `No existe el producto ${producto_id}.`);
    throw new AppError(409, 'No se puede reactivar una publicación fuera de su periodo de vigencia.');
  }
  return productos.findOne({ producto_id }, SIN_ID);
}
async function comprasDe(usuario_id){ return coleccion('compras').find({usuario_id,estado:'pagada'},SIN_ID).toArray(); }

async function comprar(usuario_id, producto_id, valor) {
  const productos = coleccion('productos');
  const producto = await productos.findOne({ producto_id, estado: 'activo' }, SIN_ID);
  if (!producto) throw new AppError(404, 'El producto no existe o no está disponible.');
  const hoy = hoyColombia();
  if (!productoDentroDeVigencia(producto, hoy)) throw new AppError(409,'La vigencia del producto terminó o aún no comienza.');
  if (valor !== producto.precio) throw new AppError(400, 'El valor de compra no coincide con el precio vigente.');
  const ahorros = coleccion('ahorros'); const movimientos = coleccion('movimientos_ahorro'); const compras = coleccion('compras');
  const cuenta = await ahorros.findOne({ usuario_id, estado: 'activo' }, SIN_ID);
  if (!cuenta) throw new AppError(404, 'No tienes una cuenta de ahorro activa.');
  return conReintentoDeId(['compra_id','movimiento_id'], () => ejecutarAtomico(async ({ session, alDeshacer }) => {
    if(await compras.findOne({usuario_id,producto_id,estado:'pagada'},{session,...SIN_ID})) throw new AppError(409,'Ya compraste este producto; no se permiten compras repetidas.');
    const reserva=await productos.updateOne({producto_id,estado:'activo',usuarios_compradores:{$ne:usuario_id},...filtroVigenciaProducto(hoy)},{$addToSet:{usuarios_compradores:usuario_id}},{session});
    confirmarEscritura(reserva);
    if(reserva.matchedCount!==1) throw new AppError(409,'Ya compraste este producto o dejó de estar disponible.');
    alDeshacer(()=>productos.updateOne({producto_id},{$pull:{usuarios_compradores:usuario_id}}));
    const debito = await ahorros.updateOne({ ahorro_id: cuenta.ahorro_id, estado: 'activo', saldo: { $gte: valor } }, { $inc: { saldo: -valor } }, { session });
    confirmarEscritura(debito);
    if (debito.matchedCount !== 1) throw new AppError(400, 'Saldo insuficiente para comprar este producto.');
    alDeshacer(() => ahorros.updateOne({ ahorro_id: cuenta.ahorro_id }, { $inc: { saldo: valor } }));
    const [compra_id] = await siguientesIds(compras, 'compra_id', 'C', 1, session);
    const [movimiento_id] = await siguientesIds(movimientos, 'movimiento_id', 'M', 1, session);
    const fecha = new Date();
    const compra = { compra_id, usuario_id, producto_id, nombre_producto: producto.nombre, valor, estado: 'pagada', fecha };
    try { confirmarEscritura(await compras.insertOne(compra, { session }), 'No se pudo registrar la compra.'); }
    catch(error) { if(error.code===11000) throw new AppError(409,'Ya compraste este producto; no se permiten compras repetidas.'); throw error; }
    const movimiento = { movimiento_id, ahorro_id: cuenta.ahorro_id, usuario_id, tipo: 'retiro', valor, fecha, descripcion: `Compra ${producto.nombre} (${compra_id})` };
    confirmarEscritura(await movimientos.insertOne(movimiento, { session }), 'No se pudo guardar el movimiento de compra.');
    return { compra, movimiento, saldo_anterior: cuenta.saldo, saldo_actual: cuenta.saldo - valor };
  }));
}
module.exports = { listar, crear, actualizar, cambiarEstado, comprar, comprasDe };
