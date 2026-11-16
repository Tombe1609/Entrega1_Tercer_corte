const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const requireRector = require('../middlewares/requireRector');
const { requireArea } = require('../middlewares/requireArea');
const { requireSelfOrStaff } = require('../middlewares/requireOwnerOrStaff');
const c = require('../controllers/estudiantes.controller');

router.post('/', requireRector, asyncHandler(c.registrar));
router.get('/', requireArea('finanzas'), asyncHandler(c.listar));
router.get('/:usuario_id/prestamos', requireSelfOrStaff('usuario_id', 'creditos'), asyncHandler(c.consultarPrestamos));
router.get('/:usuario_id', requireSelfOrStaff('usuario_id', 'finanzas'), asyncHandler(c.obtener));

module.exports = router;
