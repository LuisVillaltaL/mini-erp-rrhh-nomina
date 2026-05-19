// backend/src/routes/reportes.js
'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ── GET /api/reportes/nomina-historico ────────────────────────
// Costo de nomina por mes (ultimos 6 periodos procesados)
router.get('/nomina-historico', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT
                n.periodo,
                n.tipo_periodo,
                COALESCE(SUM(dn.total_ingresos), 0)    AS total_ingresos,
                COALESCE(SUM(dn.total_deducciones), 0) AS total_deducciones,
                COALESCE(SUM(dn.salario_neto), 0)      AS total_neto,
                COUNT(DISTINCT dn.empleado_id)          AS empleados
            FROM nominas n
            LEFT JOIN detalle_nomina dn ON dn.nomina_id = n.id
            WHERE n.estado IN ('procesada','pagada')
            GROUP BY n.periodo, n.tipo_periodo
            ORDER BY n.periodo DESC
            LIMIT 12
        `);
        res.json(rows.reverse()); // cronologico
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/reportes/costo-departamento ─────────────────────
// Costo por departamento de todas las nominas procesadas
router.get('/costo-departamento', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT
                d.nombre                              AS departamento,
                COUNT(DISTINCT e.id)                  AS empleados,
                COALESCE(SUM(dn.total_ingresos), 0)   AS total_ingresos,
                COALESCE(SUM(dn.salario_neto), 0)     AS total_neto,
                ROUND(AVG(dn.salario_neto)::NUMERIC,2) AS promedio_neto
            FROM departamentos d
            JOIN empleados e     ON e.departamento_id = d.id
            LEFT JOIN detalle_nomina dn ON dn.empleado_id = e.id
            LEFT JOIN nominas n         ON dn.nomina_id   = n.id
                AND n.estado IN ('procesada','pagada')
            WHERE d.activo = true
            GROUP BY d.id, d.nombre
            ORDER BY total_neto DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/reportes/distribucion-contratos ─────────────────
// Cuantos empleados hay por tipo de contrato
router.get('/distribucion-contratos', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT
                tipo_contrato,
                COUNT(*) AS cantidad
            FROM empleados
            WHERE estado = 'activo'
            GROUP BY tipo_contrato
            ORDER BY cantidad DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/reportes/headcount-departamento ─────────────────
// Empleados activos por departamento
router.get('/headcount-departamento', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT
                d.nombre AS departamento,
                COUNT(e.id) AS total,
                COUNT(*) FILTER (WHERE e.estado = 'activo')   AS activos,
                COUNT(*) FILTER (WHERE e.estado = 'inactivo') AS inactivos,
                ROUND(AVG(c.salario_base)::NUMERIC, 2)        AS salario_promedio
            FROM departamentos d
            LEFT JOIN empleados e ON e.departamento_id = d.id
            LEFT JOIN cargos c    ON e.cargo_id        = c.id
            WHERE d.activo = true
            GROUP BY d.id, d.nombre
            ORDER BY activos DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/reportes/top-salarios ───────────────────────────
// Top 10 empleados por salario neto en la ultima nomina procesada
router.get('/top-salarios', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT
                e.nombres || ' ' || e.apellidos AS empleado,
                e.codigo,
                d.nombre  AS departamento,
                c.nombre  AS cargo,
                dn.salario_base,
                dn.total_ingresos,
                dn.total_deducciones,
                dn.salario_neto
            FROM detalle_nomina dn
            JOIN nominas n      ON dn.nomina_id      = n.id
            JOIN empleados e    ON dn.empleado_id    = e.id
            JOIN departamentos d ON e.departamento_id = d.id
            JOIN cargos c       ON e.cargo_id        = c.id
            WHERE n.id = (
                SELECT id FROM nominas
                WHERE estado IN ('procesada','pagada')
                ORDER BY periodo DESC, created_at DESC
                LIMIT 1
            )
            ORDER BY dn.salario_neto DESC
            LIMIT 10
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/reportes/resumen-general ────────────────────────
// Datos generales para el encabezado del reporte
router.get('/resumen-general', async (req, res) => {
    try {
        const { rows: [emp] } = await db.query(
            `SELECT COUNT(*) AS total FROM empleados WHERE estado='activo'`
        );
        const { rows: [nom] } = await db.query(`
            SELECT
                COUNT(*)                AS total_nominas,
                COALESCE(SUM(total_neto),0)  AS gasto_total,
                MAX(periodo)            AS ultimo_periodo
            FROM nominas WHERE estado IN ('procesada','pagada')
        `);
        const { rows: [dep] } = await db.query(
            `SELECT COUNT(*) AS total FROM departamentos WHERE activo=true`
        );
        res.json({
            empleados_activos: emp.total,
            total_nominas:     nom.total_nominas,
            gasto_total:       nom.gasto_total,
            ultimo_periodo:    nom.ultimo_periodo,
            departamentos:     dep.total,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;