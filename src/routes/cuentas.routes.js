const router = require('express').Router();
const { rateLimit } = require('express-rate-limit');
const asyncHandler = require('../utils/asyncHandler');
const { ok, creado } = require('../utils/respuestas');
const { requireArea } = require('../middlewares/requireArea');
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');
const { coleccion } = require('../config/database');
const cuentas = require('../services/cuentas.service');

const limitar = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { success: false, message: 'Demasiadas solicitudes. Inténtalo en unos minutos.' } });

router.post('/solicitudes-cuenta', limitar, asyncHandler(async (req, res) =>
  creado(res, await cuentas.solicitar(req.body), 'Solicitud enviada para revisión.')));
router.get('/solicitudes-cuenta', requireAuth, requireArea('solicitudes'), asyncHandler(async (req, res) =>
  ok(res, { solicitudes: await cuentas.listarSolicitudes() })));
router.patch('/solicitudes-cuenta/:id', requireAuth, requireArea('solicitudes'), asyncHandler(async (req, res) =>
  ok(res, await cuentas.decidirSolicitud(req.params.id, req.body, req.auth))));
router.patch('/mi-perfil', requireAuth, requireRole('estudiante'), limitar, asyncHandler(async (req, res) =>
  ok(res, await cuentas.editarPerfil(req.body, req.auth))));
router.get('/auditoria-cuentas', requireAuth, requireArea('finanzas'), asyncHandler(async (req, res) => {
  const eventos = await coleccion('auditoria_cuentas').find({}, { projection: {
    _id: 0, fecha: 1, actor_id: 1, actor_rol: 1, usuario_id: 1, accion: 1, campos: 1, cambios: 1,
  } }).sort({ fecha: -1 }).limit(100).toArray();
  return ok(res, { eventos });
}));

module.exports = router;
