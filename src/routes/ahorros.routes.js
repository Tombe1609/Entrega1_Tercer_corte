const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const c = require('../controllers/ahorros.controller');
const requireRole = require('../middlewares/requireRole');
const { requireArea } = require('../middlewares/requireArea');
const { requireOwnerOrStaff, requireSelfBodyOrStaff } = require('../middlewares/requireOwnerOrStaff');

router.post('/', requireSelfBodyOrStaff(), asyncHandler(c.crearCuenta));
router.get('/', requireArea('finanzas'), asyncHandler(c.listarCuentas));
router.post('/transferencias', requireRole('estudiante'), asyncHandler(c.transferir));
router.get('/:ahorro_id', requireOwnerOrStaff({ collection: 'ahorros', idParam: 'ahorro_id', idField: 'ahorro_id', staffAreas: ['finanzas'] }), asyncHandler(c.obtenerCuenta));
router.delete('/:ahorro_id', requireRole('estudiante'), asyncHandler(c.cerrarCuenta));
router.post('/:ahorro_id/depositos', requireOwnerOrStaff({ collection: 'ahorros', idParam: 'ahorro_id', idField: 'ahorro_id', staffAreas: ['finanzas'] }), asyncHandler(c.depositar));
router.post('/:ahorro_id/retiros', requireOwnerOrStaff({ collection: 'ahorros', idParam: 'ahorro_id', idField: 'ahorro_id', staffAreas: ['finanzas'] }), asyncHandler(c.retirar));
router.get('/:ahorro_id/movimientos', requireOwnerOrStaff({ collection: 'ahorros', idParam: 'ahorro_id', idField: 'ahorro_id', staffAreas: ['finanzas'] }), asyncHandler(c.consultarMovimientos));

module.exports = router;
