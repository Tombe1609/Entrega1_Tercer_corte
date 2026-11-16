const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const requireRector = require('../middlewares/requireRector');
const c = require('../controllers/funcionarios.controller');

router.post('/', requireRector, asyncHandler(c.registrar));
router.get('/', requireRector, asyncHandler(c.listar));
router.get('/:funcionario_id', requireRector, asyncHandler(c.obtener));

module.exports = router;
