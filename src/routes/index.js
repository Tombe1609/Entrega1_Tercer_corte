const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const { obtenerDb } = require('../config/database');
const prestamosController = require('../controllers/prestamos.controller');
const { ok } = require('../utils/respuestas');

// Comprobación de que la API y MongoDB responden.
router.get('/health', asyncHandler(async (req, res) => {
  await obtenerDb().command({ ping: 1 });
  return ok(res, { api: 'activa', mongodb: 'conectado' }, 'La API y la base de datos están disponibles.');
}));

// Login y health son públicos; todas las rutas de negocio exigen Bearer válido.
router.use('/auth', require('./auth.routes'));
router.use(require('../middlewares/requireAuth'));
router.use('/gestion-usuarios', require('./gestion-usuarios.routes'));
router.use('/estudiantes', require('./estudiantes.routes'));
router.use('/funcionarios', require('./funcionarios.routes'));
router.use('/ahorros', require('./ahorros.routes'));
router.use('/productos', require('./productos.routes'));
router.get('/fines-educativos', asyncHandler(prestamosController.listarFines));
router.use('/prestamos', require('./prestamos.routes'));
router.use('/distribucion-intereses', require('./distribucion.routes'));
router.use('/reportes', require('./reportes.routes'));

module.exports = router;
