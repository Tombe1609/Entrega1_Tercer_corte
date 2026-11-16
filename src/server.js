const app = require('./app');
const config = require('./config/config');
const { conectar, soportaTransacciones, cerrar } = require('./config/database');
const { indicesCuentas } = require('./services/cuentas.service');

async function iniciar() {
  try {
    const db = await conectar();
    if (config.entorno === 'production' && !soportaTransacciones()) {
      throw new Error('Producción requiere MongoDB con transacciones (replica set o clúster compatible).');
    }
    await indicesCuentas(db);
    await db.collection('idempotency_keys').createIndex(
      { scope: 1, key: 1 },
      { unique: true, name: 'idempotencia_por_actor_y_operacion' },
    );
  } catch (error) {
    console.error('No se pudo conectar con MongoDB:', error.message);
    console.error('Verifique que MongoDB esté en ejecución y que MONGODB_URI en .env sea correcta.');
    await cerrar();
    process.exitCode = 1;
    return;
  }

  console.log(`MongoDB conectado (base de datos "${config.dbName}").`);
  console.log(
    soportaTransacciones()
      ? 'Transacciones: ACTIVADAS (replica set detectado).'
      : 'Transacciones: no disponibles (servidor único). Se usa reversión manual si una operación falla.'
  );

  const servidor = app.listen(config.puerto, () => {
    console.log(`API escuchando en http://localhost:${config.puerto}`);
  });

  servidor.once('error', (error) => {
    process.exitCode = 1;
    if (error.code === 'EADDRINUSE') {
      console.error(`El puerto ${config.puerto} ya está en uso. Si la API ya está encendida, usa ese servidor.`);
      console.error(`Puedes comprobarlo en http://localhost:${config.puerto}/api/health.`);
    } else {
      console.error('No se pudo iniciar el servidor HTTP:', error.message);
    }
    cerrar().catch(() => console.error('No se pudo cerrar la conexión con MongoDB.'));
  });

  servidor.headersTimeout = 15_000;
  servidor.requestTimeout = 30_000;

  let cerrando = false;
  const apagar = () => {
    if (cerrando) return;
    cerrando = true;
    const limite = setTimeout(() => servidor.closeAllConnections(), 10_000);
    limite.unref();
    servidor.close(() => {
      clearTimeout(limite);
      cerrar().catch(() => {
        console.error('No se pudo cerrar la conexión con MongoDB.');
        process.exitCode = 1;
      });
    });
    servidor.closeIdleConnections();
  };
  process.on('SIGINT', apagar);
  process.on('SIGTERM', apagar);
}

// Un error inesperado no debe dejar el proceso en un estado indefinido.
process.on('unhandledRejection', (motivo) => console.error('Promesa rechazada sin manejar:', motivo));

iniciar();
