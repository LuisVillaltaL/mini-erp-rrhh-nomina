// backend/src/routes/departamentos.js
'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT id, nombre, descripcion, presupuesto FROM departamentos WHERE activo = true ORDER BY nombre'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { nombre, descripcion, presupuesto } = req.body;
    if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
    try {
        const { rows } = await db.query(
            'INSERT INTO departamentos (nombre, descripcion, presupuesto) VALUES ($1,$2,$3) RETURNING *',
            [nombre, descripcion || null, presupuesto || 0]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;