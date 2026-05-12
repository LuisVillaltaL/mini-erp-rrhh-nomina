'use strict'
 
const express = require('express')
const router  = express.Router()
const ctrl    = require('../../controllers/empleadosController')
 
// KPIs del modulo
router.get('/stats',           ctrl.stats)
 
// CRUD de empleados
router.get('/',                ctrl.listar)
router.get('/:id',             ctrl.obtenerPorId)
router.post('/',               ctrl.crear)
router.put('/:id',             ctrl.actualizar)
router.delete('/:id',          ctrl.desactivar)
 
module.exports = router