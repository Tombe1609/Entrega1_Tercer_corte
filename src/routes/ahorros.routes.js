const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const c = require('../controllers/ahorros.controller');
const requireRole = require('../middlewares/requireRole');
const { requireOwnerOrStaff, requireSelfBodyOrStaff } = require('../middlewares/requireOwnerOrStaff');

router.post('/', requireSelfBodyOrStaff(), asyncHandler(c.crearCuenta));
router.get('/', requireRole('funcionario', 'rector'), asyncHandler(c.listarCuentas));
router.post('/transferencias', requireRole('estudiante'), asyncHandler(c.transferir));
router.get('/:ahorro_id', requireOwnerOrStaff({ collection: 'ahorros', idParam: 'ahorro_id', idField: 'ahorro_id' }), asyncHandler(c.obtenerCuenta));
router.post('/:ahorro_id/depositos', requireOwnerOrStaff({ collection: 'ahorros', idParam: 'ahorro_id', idField: 'ahorro_id' }), asyncHandler(c.depositar));
router.post('/:ahorro_id/retiros', requireOwnerOrStaff({ collection: 'ahorros', idParam: 'ahorro_id', idField: 'ahorro_id' }), asyncHandler(c.retirar));
router.get('/:ahorro_id/movimientos', requireOwnerOrStaff({ collection: 'ahorros', idParam: 'ahorro_id', idField: 'ahorro_id' }), asyncHandler(c.consultarMovimientos));

module.exports = router;
