/**
 * SOLO PARA DESARROLLO LOCAL.
 * Asigna una contraseña temporal a las cuentas iniciales que aún no tengan hash.
 * No sobrescribe hashes existentes. No usar este script en producción.
 *
 * Ejecutar: npm run seed:login-demo
 * Correo: el email de la cuenta
 * Define DEMO_LOGIN_PASSWORD en el entorno antes de ejecutar este script.
 */
const { randomBytes, scryptSync } = require('node:crypto');
const { conectar, obtenerDb, cerrar } = require('../src/config/database');
const config = require('../src/config/config');

const PASSWORD_DEMO = process.env.DEMO_LOGIN_PASSWORD;

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  if (typeof PASSWORD_DEMO !== 'string' || PASSWORD_DEMO.length < 12) {
    throw new Error('Define DEMO_LOGIN_PASSWORD con al menos 12 caracteres en el entorno local.');
  }
  console.log(`Conectando a MongoDB (base "${config.dbName}")...`);
  await conectar();
  const db = obtenerDb();
  let actualizados = 0;
  let conservados = 0;

  for (const nombre of ['usuarios', 'funcionarios']) {
    const col = db.collection(nombre);
    const docs = await col.find({}).toArray();
    for (const doc of docs) {
      if (doc.password_hash) {
        conservados++;
        continue;
      }
      await col.updateOne(
        { _id: doc._id, password_hash: { $exists: false } },
        { $set: { password_hash: hashPassword(PASSWORD_DEMO) } }
      );
      actualizados++;
    }
  }

  console.log(`Contraseñas temporales creadas: ${actualizados}`);
  console.log(`Cuentas con contraseña previa conservada: ${conservados}`);
  console.log('DESARROLLO LOCAL ÚNICAMENTE. Cambia estas contraseñas antes de cualquier despliegue.');
}
main()
  .catch((error) => {
    console.error('Error creando credenciales demo:', error.message);
    process.exitCode = 1;
  })
  .finally(cerrar);
