const servicio = require('../services/productos.service');
const v = require('../utils/validadores');
const { ok, creado } = require('../utils/respuestas');
const { hoyColombia, fechaISOValida } = require('../utils/fechas');
async function listar(req, res) { const productos = await servicio.listar({ admin: ['funcionario','rector'].includes(req.auth.rol) }); return ok(res, { cantidad: productos.length, productos }); }
async function crear(req, res) {
  const body = v.exigirCuerpo(req.body); const errores = [];
  const nombre = v.texto(body, 'nombre', errores, { max: 100 });
  const categoria = v.texto(body, 'categoria', errores, { max: 60 });
  const descripcion = v.textoOpcional(body, 'descripcion', errores, { max: 300, porDefecto: '' });
  const precio = v.montoPositivo(body, 'precio', errores, { max: 5000000 });
  const fecha_inicio=fecha(body.fecha_inicio,'fecha_inicio',errores);
  const fecha_fin=fecha(body.fecha_fin,'fecha_fin',errores);
  if(!fecha_fin) errores.push('La fecha límite de permanencia es obligatoria.');
  if(fecha_inicio&&fecha_fin&&fecha_fin<fecha_inicio) errores.push('La fecha límite debe ser igual o posterior a la fecha de inicio.');
  if(fecha_fin&&fecha_fin<hoyColombia()) errores.push('La fecha límite debe ser hoy o una fecha futura.');
  if (precio !== undefined && precio < 1000) errores.push('El precio mínimo es 1000.');
  v.lanzarSiHayErrores(errores);
  return creado(res, await servicio.crear({ nombre, categoria, descripcion, precio, fecha_inicio, fecha_fin }, req.auth.id), 'Producto publicado correctamente.');
}
async function actualizar(req, res) {
  const body = v.exigirCuerpo(req.body); const errores = [];
  const nombre = v.texto(body, 'nombre', errores, { max: 100 });
  const categoria = v.texto(body, 'categoria', errores, { max: 60 });
  const descripcion = v.textoOpcional(body, 'descripcion', errores, { max: 300, porDefecto: '' });
  const precio = v.montoPositivo(body, 'precio', errores, { max: 5000000 });
  const fecha_inicio = fecha(body.fecha_inicio, 'fecha_inicio', errores);
  const fecha_fin = fecha(body.fecha_fin, 'fecha_fin', errores);
  if (!fecha_fin) errores.push('La fecha límite de permanencia es obligatoria.');
  if (fecha_inicio && fecha_fin && fecha_fin < fecha_inicio) errores.push('La fecha límite debe ser igual o posterior a la fecha de inicio.');
  if (precio !== undefined && precio < 1000) errores.push('El precio mínimo es 1000.');
  v.lanzarSiHayErrores(errores);
  const producto = await servicio.actualizar(req.params.producto_id, {
    nombre, categoria, descripcion, precio, fecha_inicio, fecha_fin,
  }, req.auth.id);
  return ok(res, producto, 'Publicación actualizada correctamente.');
}
function fecha(value,campo,errores){
  if(value===undefined||value===null||value==="") return null;
  if(!fechaISOValida(value)){errores.push(`La fecha ${campo} no es válida.`);return null;}
  return value;
}
async function cambiarEstado(req, res) {
  const errores=[]; const estado=v.enumerado(req.body?.estado,'estado',['activo','inactivo'],errores,{obligatorio:true}); v.lanzarSiHayErrores(errores);
  return ok(res, await servicio.cambiarEstado(req.params.producto_id, estado), 'Estado del producto actualizado.');
}
async function comprar(req, res) {
  const body=v.exigirCuerpo(req.body); const errores=[];
  const producto_id=v.texto(body,'producto_id',errores,{max:20}); const valor=v.montoPositivo(body,'valor',errores,{max:5000000});
  v.lanzarSiHayErrores(errores);
  return creado(res, await servicio.comprar(req.auth.id,producto_id,valor), 'Compra pagada desde el saldo de ahorros.');
}
async function misCompras(req,res){const compras=await servicio.comprasDe(req.auth.id);return ok(res,{cantidad:compras.length,compras},'Compras consultadas correctamente.');}
module.exports={listar,crear,actualizar,cambiarEstado,comprar,misCompras};
