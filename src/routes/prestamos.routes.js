const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const c = require('../controllers/prestamos.controller');
const { requireOwnerOrStaff, requireSelfBodyOrStaff } = require('../middlewares/requireOwnerOrStaff');
const requireRole = require('../middlewares/requireRole');

router.post('/', requireSelfBodyOrStaff(), asyncHandler(c.solicitar));
router.post('/:prestamo_id/aprobar', requireRole('funcionario', 'rector'), asyncHandler(c.aprobar));
router.post('/:prestamo_id/cuotas/:numero/pagar', requireRole('estudiante'), asyncHandler(c.pagarCuota));
router.get('/:prestamo_id', requireOwnerOrStaff({ collection: 'prestamos', idParam: 'prestamo_id', idField: 'prestamo_id' }), asyncHandler(c.obtener));
router.get('/:prestamo_id/interes', requireOwnerOrStaff({ collection: 'prestamos', idParam: 'prestamo_id', idField: 'prestamo_id' }), asyncHandler(c.calcularInteres));
router.get('/:prestamo_id/pagos', requireOwnerOrStaff({ collection: 'prestamos', idParam: 'prestamo_id', idField: 'prestamo_id' }), asyncHandler(c.historialPagos));

module.exports = router;
