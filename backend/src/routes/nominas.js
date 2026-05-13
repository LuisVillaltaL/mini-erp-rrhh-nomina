// backend/src/routes/nominas.js
'use strict';

const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/nominaController');
const db      = require('../config/db');

// Nominas CRUD
router.get('/',                                    ctrl.listarNominas);
router.post('/',                                   ctrl.crearNomina);
router.get('/simulacion',                          ctrl.simularEmpleado);
router.post('/:id/procesar',                       ctrl.procesarNomina);
router.put('/:id/pagar',                           ctrl.marcarPagada);
router.get('/:id/detalle',                         ctrl.obtenerDetalle);
router.get('/:id/detalle/:empleadoId/movimientos', ctrl.obtenerMovimientos);

// ── POST /api/nominas/:id/detalle ─────────────────────────────
// Crea un detalle_nomina para un empleado si no existe
router.post('/:id/detalle', async (req, res) => {
    const { empleado_id, salario_base, dias_trabajados = 30 } = req.body;
    if (!empleado_id) return res.status(400).json({ error: 'empleado_id es requerido' });

    try {
        // Verificar si ya existe
        const { rows: existe } = await db.query(
            'SELECT id FROM detalle_nomina WHERE nomina_id=$1 AND empleado_id=$2',
            [req.params.id, empleado_id]
        );
        if (existe.length) return res.json({ id: existe[0].id, mensaje: 'Ya existe' });

        const { rows } = await db.query(`
            INSERT INTO detalle_nomina
                (nomina_id, empleado_id, salario_base, dias_trabajados,
                 total_ingresos, total_deducciones, salario_neto)
            VALUES ($1,$2,$3,$4, $3, 0, $3)
            RETURNING id
        `, [req.params.id, empleado_id, salario_base, dias_trabajados]);

        res.status(201).json({ id: rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/nominas/:id/detalle/:detalleId/movimiento ───────
// Registra un movimiento individual (hora extra, bono, etc.)
router.post('/:id/detalle/:detalleId/movimiento', async (req, res) => {
    const { detalleId } = req.params;
    const { tipo, cantidad, monto, fecha, motivo, descripcion } = req.body;

    if (!monto) return res.status(400).json({ error: 'monto es requerido' });

    // Mapear tipo al concepto correcto
    const TIPO_CONCEPTO = {
        hora_extra_normal:  'HE_NORMAL',
        hora_extra_doble:   'HE_DOBLE',
        bono_productividad: 'BONO_PROD',
        bono_especial:      'BONO_PROD',
        descuento_prestamo: 'PRESTAMO',
        otro_ingreso:       'IGSS',      // fallback
        otra_deduccion:     'PRESTAMO',  // fallback
    };
    const codigo = TIPO_CONCEPTO[tipo] || 'IGSS';

    try {
        // Obtener id del concepto
        const { rows: conc } = await db.query(
            'SELECT id FROM conceptos_nomina WHERE codigo=$1 LIMIT 1', [codigo]
        );
        if (!conc.length) return res.status(400).json({ error: `Concepto '${codigo}' no encontrado` });

        const { rows } = await db.query(`
            INSERT INTO movimientos_nomina
                (detalle_nomina_id, concepto_id, descripcion, monto)
            VALUES ($1,$2,$3,$4)
            RETURNING id
        `, [detalleId, conc[0].id, descripcion || motivo, monto]);

        // Recalcular totales del detalle
        await db.query(`
            UPDATE detalle_nomina SET
                total_ingresos = (
                    SELECT COALESCE(SUM(mn.monto),0)
                    FROM movimientos_nomina mn
                    JOIN conceptos_nomina cn ON mn.concepto_id = cn.id
                    WHERE mn.detalle_nomina_id = $1 AND cn.tipo = 'ingreso'
                ),
                total_deducciones = (
                    SELECT COALESCE(SUM(mn.monto),0)
                    FROM movimientos_nomina mn
                    JOIN conceptos_nomina cn ON mn.concepto_id = cn.id
                    WHERE mn.detalle_nomina_id = $1 AND cn.tipo = 'deduccion'
                ),
                salario_neto = salario_base + (
                    SELECT COALESCE(SUM(mn.monto),0)
                    FROM movimientos_nomina mn
                    JOIN conceptos_nomina cn ON mn.concepto_id = cn.id
                    WHERE mn.detalle_nomina_id = $1 AND cn.tipo = 'ingreso'
                ) - (
                    SELECT COALESCE(SUM(mn.monto),0)
                    FROM movimientos_nomina mn
                    JOIN conceptos_nomina cn ON mn.concepto_id = cn.id
                    WHERE mn.detalle_nomina_id = $1 AND cn.tipo = 'deduccion'
                )
            WHERE id = $1
        `, [detalleId]);

        res.status(201).json({ id: rows[0].id, mensaje: 'Movimiento registrado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;