const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const requireRector = require('../middlewares/requireRector');
const requireRole = require('../middlewares/requireRole');
const c = require('../controllers/funcionarios.controller');

router.post('/', requireRector, asyncHandler(c.registrar));
router.get('/', requireRole('funcionario', 'rector'), asyncHandler(c.listar));
router.get('/:funcionario_id', requireRole('funcionario', 'rector'), asyncHandler(c.obtener));

module.exports = router;
