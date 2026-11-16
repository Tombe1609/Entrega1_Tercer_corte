const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { conectar, cerrar, obtenerDb, obtenerClient } = require('../src/config/database');

const APPLY = process.argv.includes('--apply');
const BASE_ESPERADA = 'cooperativa_universitaria';
const DOMINIO = '@uniautonoma.edu.co';

function protegerDPAPI(bytes) {
  return new Promise((resolve, reject) => {
    const ps = "Add-Type -AssemblyName System.Security;$s=[Console]::In.ReadToEnd();$b=[System.Security.Cryptography.ProtectedData]::Protect([Convert]::FromBase64String($s),$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser);[Console]::Out.Write([Convert]::ToBase64String($b))";
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.setEncoding('utf8').on('data', x => stdout += x);
    child.stderr.setEncoding('utf8').on('data', x => stderr += x);
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve(Buffer.from(stdout.trim(), 'base64')) : reject(new Error(stderr.trim() || `DPAPI ${code}`)));
    child.stdin.end(bytes.toString('base64'));
  });
}

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

async function guardarRespaldo(cambios) {
  const dir = path.join(process.env.LOCALAPPDATA || os.homedir(), 'Cooperativa', 'backups');
  await fs.mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `atlas-email-migration-${stamp}.json.enc`);
  const keyFile = `${file}.dpapi`;
  const payload = Buffer.from(JSON.stringify({ base: BASE_ESPERADA, createdAt: new Date().toISOString(), changes: cambios.map(({ collection, id, email, version_sesion }) => ({ collection, id, email, version_sesion })) }));
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const protectedKey = await protegerDPAPI(key);
  await fs.writeFile(file, Buffer.concat([Buffer.from('COOPEMAIL1'), iv, cipher.getAuthTag(), encrypted]), { flag: 'wx' });
  await fs.writeFile(keyFile, protectedKey, { flag: 'wx' });
  const recoveredKey = await desprotegerDPAPI(protectedKey);
  if (!recoveredKey.equals(key)) throw new Error('No se pudo verificar la clave DPAPI de la copia.');
  const verify = crypto.createDecipheriv('aes-256-gcm', recoveredKey, iv);
  verify.setAuthTag(cipher.getAuthTag());
  if (!Buffer.concat([verify.update(encrypted), verify.final()]).equals(payload)) throw new Error('No se pudo verificar la copia cifrada.');
  return { file, keyFile };
}

async function main() {
  await conectar();
  const db = obtenerDb();
  const hello = await db.command({ hello: 1 });
  if (db.databaseName !== BASE_ESPERADA || (!hello.setName && hello.msg !== 'isdbgrid')) throw new Error('La conexión no corresponde al Atlas esperado; no se modifica nada.');

  const personas = [];
  for (const collection of ['usuarios', 'funcionarios']) {
    const rows = await db.collection(collection).find({}, { projection: { _id: 1, usuario_id: 1, funcionario_id: 1, email: 1, version_sesion: 1 } }).toArray();
    for (const row of rows) {
      const id = row.usuario_id || row.funcionario_id;
      if (typeof row.email !== 'string' || !row.email.includes('@')) throw new Error(`Correo no válido en ${collection}/${id}.`);
      const [local] = row.email.toLowerCase().split('@');
      const nuevo = `${local}${DOMINIO}`;
      personas.push({ collection, _id: row._id, id, email: row.email, nuevo, version_sesion: row.version_sesion ?? 0 });
    }
  }
  const cambiados = personas.filter(p => p.email.toLowerCase() !== p.nuevo);
  const destino = new Map();
  for (const p of personas) {
    const target = p.nuevo;
    const prev = destino.get(target);
    if (prev && prev._id.toString() !== p._id.toString()) throw new Error(`El correo destino ${target} colisiona entre registros.`);
    destino.set(target, p);
    if (p.email.toLowerCase() !== target && personas.some(other => other._id.toString() !== p._id.toString() && other.email.toLowerCase() === target)) {
      throw new Error(`El correo destino ${target} ya pertenece a otra cuenta.`);
    }
  }
  console.log('PLAN', JSON.stringify({ base: db.databaseName, total: personas.length, actualizar: cambiados.length, correosDestino: cambiados.map(({ collection, id, nuevo }) => ({ collection, id, nuevo })) }));
  if (!APPLY) { console.log('SOLO_LECTURA. Agrega --apply para actualizar tras guardar un respaldo cifrado.'); return; }
  if (!cambiados.length) { console.log('SIN_CAMBIOS'); return; }

  const backup = await guardarRespaldo(cambiados);
  console.log('RESPALDO_CIFRADO', JSON.stringify(backup));
  const session = obtenerClient().startSession();
  try {
    await session.withTransaction(async () => {
      for (const p of cambiados) {
        const result = await db.collection(p.collection).updateOne(
          { _id: p._id, email: p.email },
          { $set: { email: p.nuevo }, $inc: { version_sesion: 1 } },
          { session },
        );
        if (result.matchedCount !== 1) throw new Error(`El registro ${p.collection}/${p.id} cambió durante la actualización.`);
      }
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } finally { await session.endSession(); }

  const restantes = await Promise.all(['usuarios', 'funcionarios'].map(collection => db.collection(collection).countDocuments({ email: { $not: /@uniautonoma\.edu\.co$/i } })));
  if (restantes.some(Boolean)) throw new Error('La verificación detectó correos fuera del dominio esperado.');
  console.log('MIGRACION_COMPLETADA', JSON.stringify({ actualizados: cambiados.length, dominio: DOMINIO }));
}

main().catch(error => { console.error('MIGRACION_CANCELADA', error.message); process.exitCode = 1; })
  .finally(async () => { await cerrar().catch(() => {}); });
