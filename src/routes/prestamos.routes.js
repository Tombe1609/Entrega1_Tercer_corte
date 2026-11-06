const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const c = require('../controllers/prestamos.controller');
const { requireOwnerOrStaff, requireSelfBodyOrStaff } = require('../middlewares/requireOwnerOrStaff');

router.post('/', requireSelfBodyOrStaff(), asyncHandler(c.solicitar));
router.get('/:prestamo_id', requireOwnerOrStaff({ collection: 'prestamos', idParam: 'prestamo_id', idField: 'prestamo_id' }), asyncHandler(c.obtener));
router.get('/:prestamo_id/interes', requireOwnerOrStaff({ collection: 'prestamos', idParam: 'prestamo_id', idField: 'prestamo_id' }), asyncHandler(c.calcularInteres));
router.post('/:prestamo_id/pagos', requireOwnerOrStaff({ collection: 'prestamos', idParam: 'prestamo_id', idField: 'prestamo_id' }), asyncHandler(c.registrarPago));
router.get('/:prestamo_id/pagos', requireOwnerOrStaff({ collection: 'prestamos', idParam: 'prestamo_id', idField: 'prestamo_id' }), asyncHandler(c.historialPagos));

module.exports = router;
