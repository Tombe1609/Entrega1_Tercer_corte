/**
 * Inicialización de la base de datos (se ejecuta aparte de la API):  npm run seed
 *
 *  - Crea las 8 colecciones si no existen.
 *  - Crea los índices únicos del proyecto original.
 *  - Inserta los datos iniciales SOLO si no existen (se identifica cada documento
 *    por su identificador de negocio: usuario_id, ahorro_id, etc.).
 *  - NO borra ni modifica datos existentes, por lo que puede ejecutarse varias veces.
 */
const config = require('../src/config/config');
const { conectar, obtenerDb, cerrar } = require('../src/config/database');
const datos = require('./datos-iniciales');

// colección -> campo identificador de negocio
const ID_POR_COLECCION = {
  usuarios: 'usuario_id',
  funcionarios: 'funcionario_id',
  ahorros: 'ahorro_id',
  movimientos_ahorro: 'movimiento_id',
  fines_educativos: 'fin_id',
  prestamos: 'prestamo_id',
  pagos_prestamo: 'pago_id',
  distribucion_intereses: 'distribucion_id',
};

// Índices únicos definidos en el TXT original.
const INDICES = {
  usuarios: ['usuario_id', 'documento', 'email'],
  funcionarios: ['funcionario_id', 'email'],
  ahorros: ['ahorro_id', 'usuario_id'],
  movimientos_ahorro: ['movimiento_id'],
  fines_educativos: ['fin_id'],
  prestamos: ['prestamo_id'],
  pagos_prestamo: ['pago_id'],
  distribucion_intereses: ['distribucion_id'],
};

async function main() {
  console.log(`Conectando a MongoDB (base de datos "${config.dbName}")...`);
  await conectar();
  const db = obtenerDb();

  const existentes = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name);
  for (const nombre of Object.keys(ID_POR_COLECCION)) {
    if (!existentes.includes(nombre)) {
      await db.createCollection(nombre);
      console.log(`  + Colección creada: ${nombre}`);
    }
  }

  for (const [nombre, campos] of Object.entries(INDICES)) {
    for (const campo of campos) {
      await db.collection(nombre).createIndex({ [campo]: 1 }, { unique: true });
    }
  }
  console.log('  Índices únicos verificados.');

  console.log('\nColección                  insertados  ya existían  total en BD');
  for (const [nombre, campoId] of Object.entries(ID_POR_COLECCION)) {
    const col = db.collection(nombre);
    let insertados = 0;
    let yaExistian = 0;
    for (const doc of datos[nombre]) {
      const existe = await col.findOne({ [campoId]: doc[campoId] }, { projection: { _id: 1 } });
      if (existe) {
        yaExistian += 1;
        continue;
      }
      try {
        await col.insertOne({ ...doc });
        insertados += 1;
      } catch (error) {
        if (error.code === 11000) {
          // Otro documento ya usa ese documento/email: se respeta lo existente.
          console.warn(`  ! ${nombre}/${doc[campoId]} omitido: conflicto con un registro existente.`);
          yaExistian += 1;
        } else {
          throw error;
        }
      }
    }
    const total = await col.countDocuments();
    console.log(`${nombre.padEnd(26)} ${String(insertados).padStart(10)} ${String(yaExistian).padStart(12)} ${String(total).padStart(12)}`);
  }
  console.log('\nInicialización terminada.');
}

main()
  .catch((error) => {
    console.error('\nError en la inicialización:', error.message);
    console.error('Verifique que MongoDB esté en ejecución y que MONGODB_URI en .env sea correcta.');
    process.exitCode = 1;
  })
  .finally(cerrar);
