const app = require('./app');
const config = require('./config/config');
const { conectar, soportaTransacciones, cerrar } = require('./config/database');

async function iniciar() {
  try {
    await conectar();
  } catch (error) {
    console.error('No se pudo conectar con MongoDB:', error.message);
    console.error('Verifique que MongoDB esté en ejecución y que MONGODB_URI en .env sea correcta.');
    process.exit(1);
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

  const apagar = async () => {
    servidor.close();
    await cerrar();
    process.exit(0);
  };
  process.on('SIGINT', apagar);
  process.on('SIGTERM', apagar);
}

// Un error inesperado no debe dejar el proceso en un estado indefinido.
process.on('unhandledRejection', (motivo) => console.error('Promesa rechazada sin manejar:', motivo));

iniciar();
