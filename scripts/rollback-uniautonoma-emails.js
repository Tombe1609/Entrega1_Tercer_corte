const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const { spawn } = require('node:child_process');
const { conectar, cerrar, obtenerDb, obtenerClient } = require('../src/config/database');

const archivo = process.argv[2];
const APPLY = process.argv.includes('--apply');
const BASE = 'cooperativa_universitaria';

function desprotegerDPAPI(bytes) {
  return new Promise((resolve, reject) => {
    const ps = "Add-Type -AssemblyName System.Security;$s=[Console]::In.ReadToEnd();$b=[System.Security.Cryptography.ProtectedData]::Unprotect([Convert]::FromBase64String($s),$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser);[Console]::Out.Write([Convert]::ToBase64String($b))";
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.setEncoding('utf8').on('data', x => stdout += x);
    child.stderr.setEncoding('utf8').on('data', x => stderr += x);
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve(Buffer.from(stdout.trim(), 'base64')) : reject(new Error(stderr.trim() || `DPAPI ${code}`)));
    child.stdin.end(bytes.toString('base64'));
  });
}

async function leerCopia() {
  if (!archivo) throw new Error('Indica el archivo .json.enc de la migración.');
  const content = await fs.readFile(archivo);
  if (content.subarray(0, 10).toString('utf8') !== 'COOPEMAIL1') throw new Error('La copia no es de la migración de correos.');
  const iv = content.subarray(10, 22);
  const tag = content.subarray(22, 38);
  const key = await desprotegerDPAPI(await fs.readFile(`${archivo}.dpapi`));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const value = JSON.parse(Buffer.concat([decipher.update(content.subarray(38)), decipher.final()]).toString('utf8'));
  if (value.base !== BASE || !Array.isArray(value.changes)) throw new Error('El archivo no corresponde a la base de datos esperada.');
  return value;
}

async function main() {
  const copy = await leerCopia();
  await conectar();
  const db = obtenerDb();
  const hello = await db.command({ hello: 1 });
  if (db.databaseName !== BASE || (!hello.setName && hello.msg !== 'isdbgrid')) throw new Error('La conexión no es el Atlas esperado.');
  const plan = [];
  for (const item of copy.changes) {
    const current = await db.collection(item.collection).findOne({ [item.collection === 'usuarios' ? 'usuario_id' : 'funcionario_id']: item.id }, { projection: { _id: 1, email: 1 } });
    if (!current) throw new Error(`No se encuentra ${item.collection}/${item.id}.`);
    const [local] = item.email.toLowerCase().split('@');
    const migrated = `${local}@uniautonoma.edu.co`;
    if (current.email.toLowerCase() !== migrated) throw new Error(`El correo de ${item.id} cambió después de la migración; se cancela.`);
    plan.push({ collection: item.collection, _id: current._id, id: item.id, emailActual: current.email, emailAnterior: item.email });
  }
  console.log('PLAN_REVERSIÓN', JSON.stringify({ base: db.databaseName, origen: copy.createdAt, cuentas: plan.map(({ collection, id, emailAnterior }) => ({ collection, id, emailAnterior })) }));
  if (!APPLY) { console.log('SOLO_LECTURA. Agrega --apply para restaurar los correos del respaldo.'); return; }
  const session = obtenerClient().startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of plan) {
        const result = await db.collection(item.collection).updateOne(
          { _id: item._id, email: item.emailActual },
          { $set: { email: item.emailAnterior }, $inc: { version_sesion: 1 } },
          { session },
        );
        if (result.matchedCount !== 1) throw new Error(`No se pudo restaurar ${item.collection}/${item.id}.`);
      }
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } finally { await session.endSession(); }
  console.log('REVERSIÓN_COMPLETADA', JSON.stringify({ restaurados: plan.length }));
}

main().catch(error => { console.error('REVERSIÓN_CANCELADA', error.message); process.exitCode = 1; })
  .finally(async () => { await cerrar().catch(() => {}); });
