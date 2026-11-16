const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const c = require('../controllers/prestamos.controller');
const { requireOwnerOrStaff, requireSelfBodyOrStaff } = require('../middlewares/requireOwnerOrStaff');
const requireRole = require('../middlewares/requireRole');
const { requireArea } = require('../middlewares/requireArea');
const accesoPrestamo = requireOwnerOrStaff({
  collection: 'prestamos', idParam: 'prestamo_id', idField: 'prestamo_id', staffAreas: ['creditos'],
});

router.post('/', requireSelfBodyOrStaff(), asyncHandler(c.solicitar));
router.get('/', requireArea('creditos'), asyncHandler(c.listar));
router.post('/:prestamo_id/aprobar', requireArea('creditos'), asyncHandler(c.aprobar));
router.post('/:prestamo_id/rechazar', requireArea('creditos'), asyncHandler(c.rechazar));
router.post('/:prestamo_id/cuotas/:numero/pagar', requireRole('estudiante'), asyncHandler(c.pagarCuota));
router.get('/:prestamo_id', accesoPrestamo, asyncHandler(c.obtener));
router.get('/:prestamo_id/interes', accesoPrestamo, asyncHandler(c.calcularInteres));
router.get('/:prestamo_id/pagos', accesoPrestamo, asyncHandler(c.historialPagos));

module.exports = router;
