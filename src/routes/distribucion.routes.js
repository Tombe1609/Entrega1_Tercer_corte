const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const c = require('../controllers/distribucion.controller');
const requireRole = require('../middlewares/requireRole');
const { requireArea } = require('../middlewares/requireArea');

router.get('/calculo', requireArea('finanzas'), asyncHandler(c.calcular));
router.post('/', requireRole('rector'), asyncHandler(c.registrar));
router.get('/', requireArea('finanzas'), asyncHandler(c.consultar));

module.exports = router;
