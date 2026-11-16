const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { BSON } = require('mongodb');
const { conectar, cerrar, obtenerDb, obtenerClient } = require('../src/config/database');

const APPLY = process.argv.includes('--apply');
const DATABASE_ESPERADA = 'cooperativa_universitaria';
const PRESERVAR_USUARIOS = {
  U011: { nombre: 'Ricardo Alberto Sánchez', tipo: 'rector' },
  U013: { nombre: 'Cristian David Tombe Yalanda', tipo: 'estudiante' },
  U014: { nombre: 'Laura Natalia', tipo: 'estudiante' },
};
const PRESERVAR_FUNCIONARIOS = {
  F001: { nombre: 'Diana Marcela Rojas', area: 'finanzas' },
  F002: { nombre: 'Jorge Enrique Martínez', area: 'creditos' },
  F004: { nombre: 'Miguel Ángel Ramírez', area: 'solicitudes' },
};
const COLECCIONES_FINANCIERAS = [
  'movimientos_ahorro', 'prestamos', 'pagos_prestamo', 'compras', 'distribucion_intereses',
];

function obtenerClaveCifradoProtegida(clave, proteger) {
  return new Promise((resolve, reject) => {
    const comando = proteger
      ? "Add-Type -AssemblyName System.Security;$s=[Console]::In.ReadToEnd();$b=[System.Security.Cryptography.ProtectedData]::Protect([Convert]::FromBase64String($s),$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser);[Console]::Out.Write([Convert]::ToBase64String($b))"
      : "Add-Type -AssemblyName System.Security;$s=[Console]::In.ReadToEnd();$b=[System.Security.Cryptography.ProtectedData]::Unprotect([Convert]::FromBase64String($s),$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser);[Console]::Out.Write([Convert]::ToBase64String($b))";
    const powershell = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', comando], { windowsHide: true });
    let salida = '';
    let errorSalida = '';
    powershell.stdout.setEncoding('utf8').on('data', parte => { salida += parte; });
    powershell.stderr.setEncoding('utf8').on('data', parte => { errorSalida += parte; });
    powershell.once('error', reject);
    powershell.once('close', codigo => codigo === 0
      ? resolve(Buffer.from(salida.trim(), 'base64'))
      : reject(new Error(`Windows DPAPI falló: ${errorSalida.trim() || `código ${codigo}`}`)));
    powershell.stdin.end(clave.toString('base64'));
  });
}

function serializarCopia(manifiesto, documentos) {
  const encabezado = Buffer.from(JSON.stringify(manifiesto), 'utf8');
  const tamano = Buffer.alloc(4);
  tamano.writeUInt32LE(encabezado.length, 0);
  return Buffer.concat([tamano, encabezado, ...documentos.map(d => BSON.serialize(d))]);
}

async function crearRespaldo(db) {
  const carpeta = path.join(process.env.LOCALAPPDATA || process.env.USERPROFILE, 'Cooperativa', 'backups');
  await fs.mkdir(carpeta, { recursive: true });
  const fecha = new Date().toISOString().replace(/[:.]/g, '-');
  const rutaCifrada = path.join(carpeta, `atlas-${DATABASE_ESPERADA}-${fecha}.bson.enc`);
  const rutaClave = `${rutaCifrada}.dpapi`;
  const todas = await db.listCollections().toArray();
  const colecciones = [];
  const documentos = [];
  const conteos = {};
  for (const { name } of todas) {
    const docs = await db.collection(name).find({}).toArray();
    colecciones.push({ nombre: name, cantidad: docs.length });
    conteos[name] = docs.length;
    documentos.push(...docs);
  }
  const manifiesto = {
    formato: 'Cooperativa BSON backup v1', database: db.databaseName,
    fecha: new Date().toISOString(), colecciones, sha256_documentos: null,
  };
  const bytesDocs = serializarCopia(manifiesto, documentos);
  manifiesto.sha256_documentos = crypto.createHash('sha256').update(bytesDocs).digest('hex');
  const payload = serializarCopia(manifiesto, documentos);
  const clave = crypto.randomBytes(32);
  const nonce = crypto.randomBytes(12);
  const cifrador = crypto.createCipheriv('aes-256-gcm', clave, nonce);
  const cifrado = Buffer.concat([cifrador.update(payload), cifrador.final()]);
  const archivo = Buffer.concat([Buffer.from('COOPBACKUP1'), nonce, cifrador.getAuthTag(), cifrado]);
  const claveProtegida = await obtenerClaveCifradoProtegida(clave, true);
  // La copia y su clave quedan cifradas; la clave solo se puede abrir bajo este usuario de Windows.
  await fs.writeFile(rutaCifrada, archivo, { flag: 'wx' });
  await fs.writeFile(rutaClave, claveProtegida, { flag: 'wx' });
  const claveVerificada = await obtenerClaveCifradoProtegida(claveProtegida, false);
  const descifrador = crypto.createDecipheriv('aes-256-gcm', claveVerificada, nonce);
  descifrador.setAuthTag(cifrador.getAuthTag());
  const comprobacion = Buffer.concat([descifrador.update(cifrado), descifrador.final()]);
  if (!comprobacion.equals(payload)) throw new Error('La verificación del respaldo no coincidió. Se cancela el reinicio.');
  return { rutaCifrada, rutaClave, conteos };
}

async function verificarIdentidades(db) {
  for (const [id, esperado] of Object.entries(PRESERVAR_USUARIOS)) {
    const doc = await db.collection('usuarios').findOne({ usuario_id: id }, { projection: { nombre: 1, tipo: 1, estado: 1 } });
    if (!doc || doc.nombre !== esperado.nombre || doc.tipo !== esperado.tipo || doc.estado !== 'activo') {
      throw new Error(`No coincide el usuario seleccionado ${id}; no se modifica la base de datos.`);
    }
  }
  for (const [id, esperado] of Object.entries(PRESERVAR_FUNCIONARIOS)) {
    const doc = await db.collection('funcionarios').findOne({ funcionario_id: id }, { projection: { nombre: 1, estado: 1 } });
    if (!doc || doc.nombre !== esperado.nombre || doc.estado !== 'activo') {
      throw new Error(`No coincide el funcionario seleccionado ${id}; no se modifica la base de datos.`);
    }
  }
  const cuentas = await db.collection('ahorros').find({ usuario_id: { $in: ['U013', 'U014'] } }, { projection: { _id: 1, ahorro_id: 1, usuario_id: 1 } }).toArray();
  const porUsuario = new Map();
  for (const cuenta of cuentas) porUsuario.set(cuenta.usuario_id, (porUsuario.get(cuenta.usuario_id) || 0) + 1);
  if (cuentas.length !== 2 || porUsuario.get('U013') !== 1 || porUsuario.get('U014') !== 1) {
    throw new Error('Se esperaba exactamente una cuenta para Cristian y una para Laura. Se cancela el reinicio.');
  }
}

async function plan(db) {
  const usuarios = await db.collection('usuarios').countDocuments();
  const funcionarios = await db.collection('funcionarios').countDocuments();
  const cuentas = await db.collection('ahorros').countDocuments();
  const saldos = await db.collection('ahorros').aggregate([
    { $match: { usuario_id: { $in: ['U013', 'U014'] } } },
    { $project: { _id: 0, ahorro_id: 1, usuario_id: 1, saldo: 1 } },
  ]).toArray();
  const productos = await db.collection('productos').countDocuments();
  const fines = await db.collection('fines_educativos').countDocuments();
  const finanzas = {};
  for (const name of COLECCIONES_FINANCIERAS) finanzas[name] = await db.collection(name).countDocuments();
  return { base: db.databaseName, usuariosActuales: usuarios, usuariosRestantes: Object.keys(PRESERVAR_USUARIOS),
    funcionariosActuales: funcionarios, funcionariosRestantes: Object.keys(PRESERVAR_FUNCIONARIOS),
    cuentasActuales: cuentas, cuentasRestantes: saldos, coleccionesQueSeVaciaran: finanzas,
    solicitudesCuenta: await db.collection('solicitudes_cuenta').countDocuments(),
    auditoriaCuentas: await db.collection('auditoria_cuentas').countDocuments(),
    productosQueSeConservan: productos, finesEducativosQueSeConservan: fines };
}

async function main() {
  await conectar();
  const db = obtenerDb();
  const hello = await db.command({ hello: 1 });
  if (db.databaseName !== DATABASE_ESPERADA || (!hello.setName && hello.msg !== 'isdbgrid')) {
    throw new Error('El servidor o base no coincide con Atlas esperado; no se continúa.');
  }
  await verificarIdentidades(db);
  console.log('PLAN', JSON.stringify(await plan(db)));
  if (!APPLY) {
    console.log('MODO SOLO LECTURA. Para ejecutar: node scripts/reset-demo-atlas.js --apply');
    return;
  }
  const respaldo = await crearRespaldo(db);
  console.log('RESPALDO_CIFRADO_Y_VERIFICADO', JSON.stringify({ archivo: respaldo.rutaCifrada, claveProtegidaWindows: respaldo.rutaClave, colecciones: Object.keys(respaldo.conteos).length, documentos: Object.values(respaldo.conteos).reduce((a, b) => a + b, 0) }));
  const usuarios = db.collection('usuarios');
  const funcionarios = db.collection('funcionarios');
  const ahorro = db.collection('ahorros');
  const nombresColeccion = (await db.listCollections().toArray()).map(c => c.name);
  const client = obtenerClient();
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const idsUsuarios = await usuarios.find({ usuario_id: { $in: Object.keys(PRESERVAR_USUARIOS) } }, { session, projection: { _id: 1 } }).toArray();
      const idsFuncionarios = await funcionarios.find({ funcionario_id: { $in: Object.keys(PRESERVAR_FUNCIONARIOS) } }, { session, projection: { _id: 1, funcionario_id: 1 } }).toArray();
      await usuarios.deleteMany({ _id: { $nin: idsUsuarios.map(x => x._id) } }, { session });
      await funcionarios.deleteMany({ _id: { $nin: idsFuncionarios.map(x => x._id) } }, { session });
      await usuarios.updateMany({}, { $set: { estado: 'activo' }, $inc: { version_sesion: 1 } }, { session });
      await funcionarios.updateMany({}, { $set: { estado: 'activo' }, $inc: { version_sesion: 1 } }, { session });
      for (const [id, datos] of Object.entries(PRESERVAR_FUNCIONARIOS)) {
        await funcionarios.updateOne({ funcionario_id: id }, { $set: { area: datos.area } }, { session });
      }
      await ahorro.deleteMany({ usuario_id: { $nin: ['U013', 'U014'] } }, { session });
      await ahorro.updateMany({ usuario_id: { $in: ['U013', 'U014'] } }, { $set: { saldo: 0, estado: 'activo' } }, { session });
      for (const name of COLECCIONES_FINANCIERAS) await db.collection(name).deleteMany({}, { session });
      if (nombresColeccion.includes('solicitudes_cuenta')) await db.collection('solicitudes_cuenta').deleteMany({}, { session });
      if (nombresColeccion.includes('auditoria_cuentas')) await db.collection('auditoria_cuentas').deleteMany({}, { session });
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } finally {
    await session.endSession();
  }
  const resultado = await plan(db);
  if (resultado.usuariosActuales !== 3 || resultado.funcionariosActuales !== 3 || resultado.cuentasActuales !== 2 ||
      resultado.cuentasRestantes.some(c => Number(c.saldo) !== 0) ||
      Object.values(resultado.coleccionesQueSeVaciaran).some(c => c !== 0)) {
    throw new Error('La comprobación posterior al reinicio detectó algo inesperado. Revisa el respaldo antes de usar la app.');
  }
  console.log('REINICIO_COMPLETADO', JSON.stringify(resultado));
}

main().catch(error => { console.error('RESET_CANCELADO', error.message); process.exitCode = 1; })
  .finally(async () => { await cerrar().catch(() => {}); });
