// backend/src/routes/nominas.js
// nominaController ahora esta en backend/controllers/ (fuera de src)
// por eso sube dos niveles: routes -> src -> backend, luego entra a controllers/

'use strict';

const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/nominaController');

router.get('/',                                   ctrl.listarNominas);
router.post('/',                                  ctrl.crearNomina);
router.get('/simulacion',                         ctrl.simularEmpleado);
router.post('/:id/procesar',                      ctrl.procesarNomina);
router.put('/:id/pagar',                          ctrl.marcarPagada);
router.get('/:id/detalle',                        ctrl.obtenerDetalle);
router.get('/:id/detalle/:empleadoId/movimientos',ctrl.obtenerMovimientos);

module.exports = router;