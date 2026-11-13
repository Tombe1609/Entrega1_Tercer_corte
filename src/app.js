const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const cors = require('cors');
const config = require('./config/config');
const routes = require('./routes');
const { rutaNoEncontrada, manejadorErrores } = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
// La web corre en otro puerto: permite solo los orígenes locales de desarrollo.
// En despliegue, CORS_ORIGINS debe contener únicamente el dominio web publicado.
const allowedOrigins = new Set((config.corsOrigins.length ? config.corsOrigins : [
  'http://localhost:5173', 'http://127.0.0.1:5173',
  'http://localhost:4000', 'http://127.0.0.1:4000',
]).filter(Boolean));
app.use(cors({
  origin(origin, callback) { callback(null, !origin || allowedOrigins.has(origin)); },
  methods: ['GET', 'HEAD', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  maxAge: 600,
}));

app.get('/', (req, res) => {
  const webIndex = path.resolve(__dirname, '../public/index.html');
  if (fs.existsSync(webIndex)) return res.sendFile(webIndex);
  res.json({
    success: true,
    message: 'API de la Cooperativa Universitaria de Ahorro y Crédito Educativo.',
    data: { documentacion: 'Consulte README.md', health: '/api/health' },
  });
});

app.use('/api', routes);
// En producción se sirve el build web desde el mismo origen de la API.
// En desarrollo, Vite usa un proxy /api → localhost:3000 y Android sigue usando sus URLs actuales.
const webDist = path.resolve(__dirname, '../public');
app.use(express.static(webDist));
app.get('*', (req, res, next) => {
  if (req.path === '/api' || req.path.startsWith('/api/')) return next();
  const webIndex = path.join(webDist, 'index.html');
  if (fs.existsSync(webIndex)) return res.sendFile(webIndex);
  return next();
});
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

module.exports = app;
