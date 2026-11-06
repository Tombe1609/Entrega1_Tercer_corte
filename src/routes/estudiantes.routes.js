const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const requireRector = require('../middlewares/requireRector');
const requireRole = require('../middlewares/requireRole');
const { requireSelfOrStaff } = require('../middlewares/requireOwnerOrStaff');
const c = require('../controllers/estudiantes.controller');

router.post('/', requireRector, asyncHandler(c.registrar));
router.get('/', requireRole('funcionario', 'rector'), asyncHandler(c.listar));
router.get('/:usuario_id/prestamos', requireSelfOrStaff(), asyncHandler(c.consultarPrestamos));
router.get('/:usuario_id', requireSelfOrStaff(), asyncHandler(c.obtener));

module.exports = router;
