'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { soloRoles } = require('../middleware/authMiddleware');

// GET /api/cargos  — listar todos con filtro opcional por departamento
router.get('/', async (req, res) => {
    try {
        const { departamento_id } = req.query;
        let query = `
            SELECT c.id, c.nombre, c.nivel, c.salario_base, c.departamento_id,
                   c.activo, d.nombre AS departamento,
                   COUNT(e.id) AS empleados_asignados
            FROM cargos c
            JOIN departamentos d ON c.departamento_id = d.id
            LEFT JOIN empleados e ON e.cargo_id = c.id AND e.estado = 'activo'
            WHERE c.activo = true
        `;
        const params = [];
        if (departamento_id) {
            params.push(departamento_id);
            query += ` AND c.departamento_id = $1`;
        }
        query += ' GROUP BY c.id, c.nombre, c.nivel, c.salario_base, c.departamento_id, c.activo, d.nombre ORDER BY d.nombre, c.nombre';
        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/cargos/:id
router.get('/:id', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT c.*, d.nombre AS departamento
            FROM cargos c JOIN departamentos d ON c.departamento_id = d.id
            WHERE c.id = $1
        `, [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Cargo no encontrado' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/cargos  — crear nuevo cargo
router.post('/', soloRoles('administrador','rrhh'), async (req, res) => {
    const { nombre, nivel, salario_base, departamento_id } = req.body;
    if (!nombre || !nivel || !salario_base || !departamento_id)
        return res.status(400).json({ error: 'nombre, nivel, salario_base y departamento_id son requeridos' });

    const NIVELES = ['operativo','administrativo','gerencial'];
    if (!NIVELES.includes(nivel))
        return res.status(400).json({ error: 'nivel debe ser: operativo, administrativo o gerencial' });

    try {
        const { rows } = await db.query(`
            INSERT INTO cargos (nombre, nivel, salario_base, departamento_id)
            VALUES ($1,$2,$3,$4) RETURNING *
        `, [nombre.trim(), nivel, parseFloat(salario_base), departamento_id]);
        res.status(201).json({ mensaje: 'Cargo creado correctamente', cargo: rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/cargos/:id  — actualizar cargo
router.put('/:id', soloRoles('administrador','rrhh'), async (req, res) => {
    const { nombre, nivel, salario_base, departamento_id, activo } = req.body;
    try {
        const { rowCount } = await db.query(`
            UPDATE cargos SET
                nombre          = COALESCE($1, nombre),
                nivel           = COALESCE($2, nivel),
                salario_base    = COALESCE($3, salario_base),
                departamento_id = COALESCE($4, departamento_id),
                activo          = COALESCE($5, activo)
            WHERE id = $6
        `, [
            nombre?.trim()       || null,
            nivel                || null,
            salario_base ? parseFloat(salario_base) : null,
            departamento_id      || null,
            activo !== undefined ? activo : null,
            req.params.id
        ]);
        if (!rowCount) return res.status(404).json({ error: 'Cargo no encontrado' });
        res.json({ mensaje: 'Cargo actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/cargos/:id  — baja logica
router.delete('/:id', soloRoles('administrador'), async (req, res) => {
    try {
        // Verificar que no tenga empleados activos asignados
        const { rows } = await db.query(
            "SELECT COUNT(*) AS total FROM empleados WHERE cargo_id=$1 AND estado='activo'",
            [req.params.id]
        );
        if (parseInt(rows[0].total) > 0)
            return res.status(409).json({ error: `No se puede desactivar: hay ${rows[0].total} empleado(s) activo(s) con este cargo` });

        await db.query('UPDATE cargos SET activo=false WHERE id=$1', [req.params.id]);
        res.json({ mensaje: 'Cargo desactivado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;