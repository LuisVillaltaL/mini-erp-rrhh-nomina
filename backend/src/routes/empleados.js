// backend/src/routes/empleados.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// GET /api/empleados
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT e.*, d.nombre AS departamento, c.nombre AS cargo, c.salario_base
      FROM empleados e
      JOIN departamentos d ON e.departamento_id = d.id
      JOIN cargos c        ON e.cargo_id        = c.id
      WHERE e.estado = 'activo'
      ORDER BY e.apellidos, e.nombres
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/empleados/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT e.*, d.nombre AS departamento, c.nombre AS cargo, c.salario_base
      FROM empleados e
      JOIN departamentos d ON e.departamento_id = d.id
      JOIN cargos c        ON e.cargo_id        = c.id
      WHERE e.id = $1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Empleado no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/empleados
router.post('/', async (req, res) => {
  const { codigo, nombres, apellidos, dpi, email, telefono,
          direccion, departamento_id, cargo_id, fecha_ingreso, tipo_contrato } = req.body;
  try {
    const { rows } = await db.query(`
      INSERT INTO empleados
        (codigo, nombres, apellidos, dpi, email, telefono, direccion,
         departamento_id, cargo_id, fecha_ingreso, tipo_contrato)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id
    `, [codigo, nombres, apellidos, dpi, email, telefono, direccion,
        departamento_id, cargo_id, fecha_ingreso, tipo_contrato]);
    res.status(201).json({ id: rows[0].id, mensaje: 'Empleado creado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/empleados/:id
router.put('/:id', async (req, res) => {
  const { nombres, apellidos, email, telefono, direccion,
          departamento_id, cargo_id, tipo_contrato, estado } = req.body;
  try {
    await db.query(`
      UPDATE empleados SET
        nombres=$1, apellidos=$2, email=$3, telefono=$4, direccion=$5,
        departamento_id=$6, cargo_id=$7, tipo_contrato=$8, estado=$9,
        updated_at=CURRENT_TIMESTAMP
      WHERE id=$10
    `, [nombres, apellidos, email, telefono, direccion,
        departamento_id, cargo_id, tipo_contrato, estado, req.params.id]);
    res.json({ mensaje: 'Empleado actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/empleados/:id (baja lógica)
router.delete('/:id', async (req, res) => {
  try {
    await db.query(
      `UPDATE empleados SET estado='inactivo', updated_at=CURRENT_TIMESTAMP WHERE id=$1`,
      [req.params.id]
    );
    res.json({ mensaje: 'Empleado dado de baja correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
