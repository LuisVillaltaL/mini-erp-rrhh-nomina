'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const bcrypt  = require('bcrypt');
const { soloRoles } = require('../middleware/authMiddleware');

// ── GET /api/configuracion/parametros ────────────────────────
// Lee parametros de nomina desde conceptos_nomina
router.get('/parametros', async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT id, codigo, nombre, tipo, es_fijo, descripcion, activo FROM conceptos_nomina ORDER BY tipo, nombre'
        );
        // Constantes del sistema (hardcoded pero editables en UI)
        res.json({
            conceptos: rows,
            constantes: {
                igss_porcentaje:    4.83,
                horas_mes:          240,
                dias_mes:           30,
                salario_minimo:     3324.04,
                bonificacion_incentivo: 250.00,
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/configuracion/conceptos/:id ─────────────────────
router.put('/conceptos/:id', soloRoles('administrador'), async (req, res) => {
    const { nombre, descripcion, activo } = req.body;
    try {
        await db.query(
            'UPDATE conceptos_nomina SET nombre=$1, descripcion=$2, activo=$3 WHERE id=$4',
            [nombre, descripcion, activo, req.params.id]
        );
        res.json({ mensaje: 'Concepto actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/configuracion/usuarios ──────────────────────────
router.get('/usuarios', soloRoles('administrador'), async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT u.id, u.username, u.activo, u.ultimo_login, u.created_at,
                   r.nombre AS rol,
                   COALESCE(e.nombres || ' ' || e.apellidos, '—') AS empleado
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            LEFT JOIN empleados e ON u.empleado_id = e.id
            ORDER BY u.created_at
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/configuracion/usuarios ─────────────────────────
router.post('/usuarios', soloRoles('administrador'), async (req, res) => {
    const { username, password, rol } = req.body;
    if (!username || !password || !rol)
        return res.status(400).json({ error: 'username, password y rol son requeridos' });
    if (password.length < 6)
        return res.status(400).json({ error: 'La contrasena debe tener al menos 6 caracteres' });
    try {
        const { rows: roles } = await db.query('SELECT id FROM roles WHERE nombre=$1', [rol]);
        if (!roles.length) return res.status(400).json({ error: 'Rol no valido' });
        const hash = await bcrypt.hash(password, 10);
        const { rows } = await db.query(
            'INSERT INTO usuarios (username, password_hash, rol_id) VALUES ($1,$2,$3) RETURNING id, username',
            [username.trim(), hash, roles[0].id]
        );
        res.status(201).json({ id: rows[0].id, mensaje: 'Usuario creado correctamente' });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'El usuario ya existe' });
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/configuracion/usuarios/:id ──────────────────────
router.put('/usuarios/:id', soloRoles('administrador'), async (req, res) => {
    const { rol, activo, password } = req.body;
    try {
        if (password) {
            if (password.length < 6) return res.status(400).json({ error: 'Contrasena muy corta' });
            const hash = await bcrypt.hash(password, 10);
            await db.query('UPDATE usuarios SET password_hash=$1 WHERE id=$2', [hash, req.params.id]);
        }
        if (rol) {
            const { rows } = await db.query('SELECT id FROM roles WHERE nombre=$1', [rol]);
            if (rows.length) await db.query('UPDATE usuarios SET rol_id=$1 WHERE id=$2', [rows[0].id, req.params.id]);
        }
        if (activo !== undefined) {
            await db.query('UPDATE usuarios SET activo=$1 WHERE id=$2', [activo, req.params.id]);
        }
        res.json({ mensaje: 'Usuario actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/configuracion/roles ─────────────────────────────
router.get('/roles', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM roles ORDER BY id');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

// ── GET /api/configuracion/empleados-sin-vincular ─────────────
// Lista empleados disponibles para vincular a un usuario
router.get('/empleados-disponibles', soloRoles('administrador'), async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT e.id, e.codigo,
                   e.nombres || ' ' || e.apellidos AS nombre,
                   d.nombre AS departamento
            FROM empleados e
            JOIN departamentos d ON e.departamento_id = d.id
            WHERE e.estado = 'activo'
              AND e.id NOT IN (SELECT empleado_id FROM usuarios WHERE empleado_id IS NOT NULL)
            ORDER BY e.apellidos
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/configuracion/usuarios/:id/vincular ──────────────
router.put('/usuarios/:id/vincular', soloRoles('administrador'), async (req, res) => {
    const { empleado_id } = req.body;
    try {
        await db.query(
            'UPDATE usuarios SET empleado_id = $1 WHERE id = $2',
            [empleado_id || null, req.params.id]
        );
        res.json({ mensaje: 'Empleado vinculado correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});