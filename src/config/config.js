// Configuración central. Los valores sensibles vienen de variables de entorno (.env).
require('dotenv').config({ quiet: true });

const mongoUriBase = process.env.MONGODB_URI?.trim();
const mongoPassword = process.env.MONGODB_PASSWORD;
if (!mongoUriBase) {
  throw new Error('MONGODB_URI es obligatoria. Configure la cadena de conexión de MongoDB Atlas en .env.');
}
if (mongoUriBase.includes('<db_password>') && !mongoPassword) {
  throw new Error('Configure MONGODB_PASSWORD en .env con la contraseña del usuario de Atlas.');
}
const mongoUri = mongoUriBase.includes('<db_password>')
  ? mongoUriBase.replace('<db_password>', encodeURIComponent(mongoPassword))
  : mongoUriBase;

const entorno = process.env.NODE_ENV || 'development';
const tokenSecret = process.env.AUTH_TOKEN_SECRET?.trim();
if (entorno === 'production' && (
  !tokenSecret || Buffer.byteLength(tokenSecret) < 32 ||
  tokenSecret === 'CAMBIAR_POR_UN_SECRETO_ALEATORIO_LARGO'
)) {
  throw new Error('Configura AUTH_TOKEN_SECRET con un secreto aleatorio de al menos 32 bytes.');
}

module.exports = {
  puerto: Number(process.env.PORT) || 3000,
  mongoUri,
  dbName: process.env.DB_NAME || 'cooperativa_universitaria',
  entorno,
  tokenSecret: tokenSecret || 'solo-desarrollo-cambiar-antes-de-produccion',
  proxiesConfiables: (process.env.TRUSTED_PROXIES || '').split(',').map((proxy) => proxy.trim()).filter(Boolean),
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),

  // Regla del proyecto original: tasa fija del 5 %.
  tasaInteres: 0.05,
  // Regla de ejemplo del TXT (HU5): monto máximo por préstamo = $5.000.000.
  limitePrestamo: Number(process.env.LIMITE_PRESTAMO) || 5000000,
};
