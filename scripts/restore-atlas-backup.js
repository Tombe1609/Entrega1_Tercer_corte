const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const { spawn } = require('node:child_process');
const { BSON } = require('mongodb');
const { conectar, cerrar, obtenerDb, obtenerClient } = require('../src/config/database');

const archivo = process.argv[2];
const APPLY = process.argv.includes('--apply');
const DATABASE_ESPERADA = 'cooperativa_universitaria';
function dpapiUnprotect(bytes) {
  return new Promise((resolve, reject) => {
    const comando = "Add-Type -AssemblyName System.Security;$s=[Console]::In.ReadToEnd();$b=[System.Security.Cryptography.ProtectedData]::Unprotect([Convert]::FromBase64String($s),$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser);[Console]::Out.Write([Convert]::ToBase64String($b))";
    const ps = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', comando], { windowsHide: true });
    let stdout = '', stderr = '';
    ps.stdout.setEncoding('utf8').on('data', x => stdout += x);
    ps.stderr.setEncoding('utf8').on('data', x => stderr += x);
    ps.once('error', reject);
    ps.once('close', code => code === 0 ? resolve(Buffer.from(stdout.trim(), 'base64')) : reject(new Error(stderr.trim() || `DPAPI ${code}`)));
    ps.stdin.end(bytes.toString('base64'));
  });
}
function empaquetar(manifiesto, docs) {
  const json = Buffer.from(JSON.stringify(manifiesto), 'utf8');
  const n = Buffer.alloc(4); n.writeUInt32LE(json.length, 0);
  return Buffer.concat([n, json, ...docs.map(doc => BSON.serialize(doc))]);
}
async function main() {
  if (!archivo) throw new Error('Uso: node scripts/restore-atlas-backup.js <archivo.bson.enc> [--apply]');
  const contenido = await fs.readFile(archivo);
  if (contenido.subarray(0, 11).toString('utf8') !== 'COOPBACKUP1') throw new Error('No es una copia Cooperativa BSON v1.');
  const nonce = contenido.subarray(11, 23);
  const tag = contenido.subarray(23, 39);
  const claveDpapi = await fs.readFile(`${archivo}.dpapi`);
  const clave = await dpapiUnprotect(claveDpapi);
  const descifrador = crypto.createDecipheriv('aes-256-gcm', clave, nonce);
  descifrador.setAuthTag(tag);
  const payload = Buffer.concat([descifrador.update(contenido.subarray(39)), descifrador.final()]);
  const tamanoManifiesto = payload.readUInt32LE(0);
  const manifiesto = JSON.parse(payload.subarray(4, 4 + tamanoManifiesto).toString('utf8'));
  if (manifiesto.database !== DATABASE_ESPERADA) throw new Error('La copia no corresponde a la base esperada.');
  let offset = 4 + tamanoManifiesto;
  const porColeccion = new Map();
  const todos = [];
  for (const c of manifiesto.colecciones) {
    const docs = [];
    for (let i = 0; i < c.cantidad; i++) {
      const tamano = payload.readInt32LE(offset);
      if (tamano < 5 || offset + tamano > payload.length) throw new Error(`Documento BSON truncado en ${c.nombre}.`);
      const doc = BSON.deserialize(payload.subarray(offset, offset + tamano));
      docs.push(doc); todos.push(doc); offset += tamano;
    }
    porColeccion.set(c.nombre, docs);
  }
  if (offset !== payload.length) throw new Error('La copia tiene bytes adicionales no reconocidos.');
  const paraHash = empaquetar({ ...manifiesto, sha256_documentos: null }, todos);
  const hash = crypto.createHash('sha256').update(paraHash).digest('hex');
  if (hash !== manifiesto.sha256_documentos) throw new Error('La comprobación SHA-256 de los documentos falló.');
  console.log('COPIA_VERIFICADA', JSON.stringify({ base: manifiesto.database, fecha: manifiesto.fecha,
    colecciones: manifiesto.colecciones.length, documentos: todos.length,
    conteos: Object.fromEntries(manifiesto.colecciones.map(c => [c.nombre, c.cantidad])) }));
  if (!APPLY) { console.log('MODO SOLO LECTURA. Para restaurar toda la base: agrega --apply.'); return; }
  await conectar();
  const db = obtenerDb();
  const hello = await db.command({ hello: 1 });
  if (db.databaseName !== DATABASE_ESPERADA || (!hello.setName && hello.msg !== 'isdbgrid')) throw new Error('El destino no es el Atlas esperado.');
  const actuales = (await db.listCollections().toArray()).map(x => x.name);
  const sesion = obtenerClient().startSession();
  try {
    await sesion.withTransaction(async () => {
      for (const nombre of actuales) await db.collection(nombre).deleteMany({}, { session: sesion });
      for (const [nombre, docs] of porColeccion) {
        if (docs.length) await db.collection(nombre).insertMany(docs, { session: sesion });
      }
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } finally { await sesion.endSession(); }
  console.log('RESTAURACION_COMPLETADA', manifiesto.fecha);
}
main().catch(e => { console.error('RESTAURACION_CANCELADA', e.message); process.exitCode = 1; })
  .finally(async () => { await cerrar().catch(() => {}); });
