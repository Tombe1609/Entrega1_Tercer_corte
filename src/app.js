const express = require('express');
const routes = require('./routes');
const { rutaNoEncontrada, manejadorErrores } = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de la Cooperativa Universitaria de Ahorro y Crédito Educativo.',
    data: { documentacion: 'Consulte README.md', health: '/api/health' },
  });
});

app.use('/api', routes);
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

module.exports = app;
