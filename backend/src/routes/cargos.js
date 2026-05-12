// backend/src/routes/cargos.js
'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const { departamento_id } = req.query;
        let query  = `
            SELECT c.id, c.nombre, c.nivel, c.salario_base, c.departamento_id,
                   d.nombre AS departamento
            FROM cargos c
            JOIN departamentos d ON c.departamento_id = d.id
            WHERE c.activo = true
        `;
        const params = [];
        if (departamento_id) {
            params.push(departamento_id);
            query += ` AND c.departamento_id = $1`;
        }
        query += ' ORDER BY c.nombre';
        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;