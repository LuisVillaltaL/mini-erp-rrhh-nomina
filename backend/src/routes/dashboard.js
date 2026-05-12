// backend/src/routes/dashboard.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// GET /api/dashboard/kpis
router.get('/kpis', async (req, res) => {
  try {
    const { rows: [emp] }  = await db.query(
      `SELECT COUNT(*) AS total_empleados FROM empleados WHERE estado='activo'`
    );
    const { rows: [nom] }  = await db.query(
      `SELECT COALESCE(SUM(salario_neto),0) AS nomina_mes
       FROM detalle_nomina dn
       JOIN nominas n ON dn.nomina_id = n.id
       WHERE n.periodo = TO_CHAR(NOW(),'YYYY-MM')`
    );
    const { rows: [asis] } = await db.query(
      `SELECT ROUND(
         COUNT(*) FILTER (WHERE tipo='normal') * 100.0 / NULLIF(COUNT(*),0), 1
       ) AS tasa_asistencia
       FROM asistencia
       WHERE TO_CHAR(fecha,'YYYY-MM') = TO_CHAR(NOW(),'YYYY-MM')`
    );
    const { rows: [riesgo] } = await db.query(
      `SELECT COUNT(*) AS dptos_riesgo FROM v_resumen_empleados
       WHERE contratos_temporales > contratos_indefinidos`
    );
    res.json({
      total_empleados: emp.total_empleados,
      nomina_mes:      nom.nomina_mes,
      tasa_asistencia: asis.tasa_asistencia || 0,
      dptos_riesgo:    riesgo.dptos_riesgo
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/costo-departamento?periodo=2025-05
router.get('/costo-departamento', async (req, res) => {
  try {
    const periodo = req.query.periodo || new Date().toISOString().slice(0, 7);
    const { rows } = await db.query(
      `SELECT * FROM v_costo_nomina_departamento WHERE periodo = $1`, [periodo]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/asistencia-departamento?mes=2025-05
router.get('/asistencia-departamento', async (req, res) => {
  try {
    const mes = req.query.mes || new Date().toISOString().slice(0, 7);
    const { rows } = await db.query(
      `SELECT * FROM v_asistencia_mensual WHERE mes = $1 ORDER BY departamento`, [mes]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/resumen-empleados
router.get('/resumen-empleados', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM v_resumen_empleados ORDER BY total_empleados DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
