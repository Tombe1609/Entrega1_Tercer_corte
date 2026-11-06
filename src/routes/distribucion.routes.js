const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const c = require('../controllers/distribucion.controller');
const requireRole = require('../middlewares/requireRole');

router.get('/calculo', requireRole('funcionario', 'rector'), asyncHandler(c.calcular));
router.post('/', requireRole('rector'), asyncHandler(c.registrar));
router.get('/', requireRole('funcionario', 'rector'), asyncHandler(c.consultar));

module.exports = router;
