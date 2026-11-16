const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const c = require('../controllers/reportes.controller');
const { requireArea } = require('../middlewares/requireArea');

router.get('/estadisticas', requireArea('finanzas'), asyncHandler(c.estadisticas));

module.exports = router;
