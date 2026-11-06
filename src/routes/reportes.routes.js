const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const c = require('../controllers/reportes.controller');
const requireRole = require('../middlewares/requireRole');

router.get('/estadisticas', requireRole('funcionario', 'rector'), asyncHandler(c.estadisticas));

module.exports = router;
