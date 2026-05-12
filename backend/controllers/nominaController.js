// backend/controllers/nominaController.js
// MOVIDO a backend/controllers/ junto con authController y empleadosController
// Reglas Guatemala:
//   IGSS laboral      : 4.83% del salario base
//   ISR               : escala progresiva mensual simplificada
//   Hora extra normal : salario_hora x 1.5
//   Hora extra doble  : salario_hora x 2.0
//   Dias trabajados   : proporcional si < 30

'use strict';

// Path correcto: sube un nivel desde controllers/ hasta backend/, luego entra a src/config/
const db = require('../src/config/db');

const IGSS_PORCENTAJE = 0.0483;
const HORAS_MES       = 240;

function calcularISR(salarioBrutoMensual) {
  const anual  = salarioBrutoMensual * 12;
  const exento = 48000;
  if (anual <= exento) return 0;
  const base = anual - exento;
  const isrAnual = base <= 300000
    ? base * 0.05
    : 300000 * 0.05 + (base - 300000) * 0.07;
  return Math.round((isrAnual / 12) * 100) / 100;
}

function calcularHorasExtra(salarioBase, horasExtra, tipo = 'normal') {
  const valorHora     = salarioBase / HORAS_MES;
  const multiplicador = tipo === 'doble' ? 2.0 : 1.5;
  return Math.round(valorHora * multiplicador * horasExtra * 100) / 100;
}

function calcularSalarioProporcional(salarioBase, diasTrabajados) {
  if (diasTrabajados >= 30) return salarioBase;
  return Math.round((salarioBase / 30) * diasTrabajados * 100) / 100;
}

const listarNominas = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM nominas ORDER BY periodo DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const crearNomina = async (req, res) => {
  const { periodo, fecha_inicio, fecha_fin } = req.body;
  if (!periodo || !fecha_inicio || !fecha_fin)
    return res.status(400).json({ error: 'periodo, fecha_inicio y fecha_fin son requeridos' });
  try {
    const { rows } = await db.query(
      `INSERT INTO nominas (periodo, fecha_inicio, fecha_fin) VALUES ($1,$2,$3) RETURNING *`,
      [periodo, fecha_inicio, fecha_fin]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: `Ya existe una nomina para el periodo ${periodo}` });
    res.status(500).json({ error: err.message });
  }
};

const procesarNomina = async (req, res) => {
  const { id } = req.params;
  const client  = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows: [nomina] } = await client.query(
      'SELECT * FROM nominas WHERE id=$1', [id]
    );
    if (!nomina) return res.status(404).json({ error: 'Nomina no encontrada' });
    if (nomina.estado !== 'borrador')
      return res.status(400).json({ error: `No se puede procesar una nomina en estado '${nomina.estado}'` });

    const { rows: empleados } = await client.query(`
      SELECT e.id, e.nombres || ' ' || e.apellidos AS nombre,
             c.salario_base, e.departamento_id
      FROM empleados e
      JOIN cargos c ON e.cargo_id = c.id
      WHERE e.estado = 'activo'
    `);

    const { rows: conceptos } = await client.query(
      `SELECT * FROM conceptos_nomina WHERE activo = true`
    );
    const concepto = (codigo) => conceptos.find(c => c.codigo === codigo);

    let totalIngresosGlobal    = 0;
    let totalDeduccionesGlobal = 0;

    for (const emp of empleados) {
      const diasTrabajados = req.body.dias_trabajados?.[emp.id] ?? 30;
      const horasExtra     = req.body.horas_extra?.[emp.id]     ?? 0;
      const tipoHE         = req.body.tipo_he?.[emp.id]         ?? 'normal';
      const bonoProd       = req.body.bono_productividad?.[emp.id] ?? 0;
      const descPrestamo   = req.body.descuento_prestamo?.[emp.id] ?? 0;

      const salarioProp  = calcularSalarioProporcional(emp.salario_base, diasTrabajados);
      const montoHE      = calcularHorasExtra(emp.salario_base, horasExtra, tipoHE);
      const salarioBruto = salarioProp + montoHE + bonoProd;
      const igss         = Math.round(salarioProp * IGSS_PORCENTAJE * 100) / 100;
      const isr          = calcularISR(salarioBruto);
      const totalDeduc   = igss + isr + descPrestamo;
      const salarioNeto  = Math.round((salarioBruto - totalDeduc) * 100) / 100;

      totalIngresosGlobal    += salarioBruto;
      totalDeduccionesGlobal += totalDeduc;

      const { rows: [detalle] } = await client.query(`
        INSERT INTO detalle_nomina
          (nomina_id, empleado_id, salario_base, dias_trabajados, horas_extra,
           total_ingresos, total_deducciones, salario_neto)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (nomina_id, empleado_id) DO UPDATE SET
          salario_base=$3, dias_trabajados=$4, horas_extra=$5,
          total_ingresos=$6, total_deducciones=$7, salario_neto=$8
        RETURNING id
      `, [id, emp.id, emp.salario_base, diasTrabajados, horasExtra,
          salarioBruto, totalDeduc, salarioNeto]);

      const detalleId = detalle.id;
      await client.query(
        'DELETE FROM movimientos_nomina WHERE detalle_nomina_id=$1', [detalleId]
      );

      const movs = [
        { cid: null,                         desc: 'Salario base',       monto: salarioProp },
        ...(horasExtra > 0 ? [{ cid: concepto(tipoHE === 'doble' ? 'HE_DOBLE' : 'HE_NORMAL')?.id, desc: 'Horas extra', monto: montoHE }] : []),
        ...(bonoProd   > 0 ? [{ cid: concepto('BONO_PROD')?.id,  desc: 'Bono productividad', monto: bonoProd }] : []),
        { cid: concepto('IGSS')?.id,         desc: 'IGSS Laboral (4.83%)', monto: igss },
        ...(isr        > 0 ? [{ cid: concepto('ISR')?.id,       desc: 'Retencion ISR',     monto: isr       }] : []),
        ...(descPrestamo > 0 ? [{ cid: concepto('PRESTAMO')?.id, desc: 'Descuento prestamo', monto: descPrestamo }] : []),
      ];

      for (const m of movs) {
        const conceptoId = m.cid ?? concepto('IGSS')?.id;
        await client.query(
          `INSERT INTO movimientos_nomina (detalle_nomina_id, concepto_id, descripcion, monto)
           VALUES ($1,$2,$3,$4)`,
          [detalleId, conceptoId, m.desc, m.monto]
        );
      }
    }

    const totalNeto = Math.round((totalIngresosGlobal - totalDeduccionesGlobal) * 100) / 100;
    await client.query(`
      UPDATE nominas SET
        estado='procesada', total_ingresos=$1, total_deducciones=$2,
        total_neto=$3, procesado_por=$4, fecha_proceso=CURRENT_TIMESTAMP,
        updated_at=CURRENT_TIMESTAMP
      WHERE id=$5
    `, [
      Math.round(totalIngresosGlobal * 100) / 100,
      Math.round(totalDeduccionesGlobal * 100) / 100,
      totalNeto,
      req.body.procesado_por || 'Sistema',
      id,
    ]);

    await client.query('COMMIT');
    res.json({
      mensaje: 'Nomina procesada correctamente',
      empleados_procesados: empleados.length,
      total_ingresos:    Math.round(totalIngresosGlobal * 100) / 100,
      total_deducciones: Math.round(totalDeduccionesGlobal * 100) / 100,
      total_neto:        totalNeto,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const obtenerDetalle = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT dn.*, e.nombres || ' ' || e.apellidos AS empleado,
             e.codigo, d.nombre AS departamento, c.nombre AS cargo
      FROM detalle_nomina dn
      JOIN empleados e     ON dn.empleado_id     = e.id
      JOIN departamentos d ON e.departamento_id  = d.id
      JOIN cargos c        ON e.cargo_id         = c.id
      WHERE dn.nomina_id = $1
      ORDER BY d.nombre, e.apellidos
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const obtenerMovimientos = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT mn.*, cn.nombre AS concepto, cn.tipo
      FROM movimientos_nomina mn
      JOIN detalle_nomina dn   ON mn.detalle_nomina_id = dn.id
      JOIN conceptos_nomina cn ON mn.concepto_id       = cn.id
      WHERE dn.nomina_id=$1 AND dn.empleado_id=$2
      ORDER BY cn.tipo DESC, mn.monto DESC
    `, [req.params.id, req.params.empleadoId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const marcarPagada = async (req, res) => {
  try {
    const { rows: [n] } = await db.query(
      'SELECT estado FROM nominas WHERE id=$1', [req.params.id]
    );
    if (!n) return res.status(404).json({ error: 'Nomina no encontrada' });
    if (n.estado !== 'procesada')
      return res.status(400).json({ error: 'Solo se puede pagar una nomina procesada' });

    await db.query(
      `UPDATE nominas SET estado='pagada', updated_at=CURRENT_TIMESTAMP WHERE id=$1`,
      [req.params.id]
    );
    await db.query(
      `UPDATE detalle_nomina SET estado='pagado' WHERE nomina_id=$1`,
      [req.params.id]
    );
    res.json({ mensaje: 'Nomina marcada como pagada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const simularEmpleado = async (req, res) => {
  const {
    salario_base, dias_trabajados = 30, horas_extra = 0,
    tipo_he = 'normal', bono_productividad = 0, descuento_prestamo = 0,
  } = req.query;

  if (!salario_base)
    return res.status(400).json({ error: 'salario_base es requerido' });

  const base     = parseFloat(salario_base);
  const dias     = parseInt(dias_trabajados);
  const he       = parseFloat(horas_extra);
  const bono     = parseFloat(bono_productividad);
  const prestamo = parseFloat(descuento_prestamo);

  const salarioProp  = calcularSalarioProporcional(base, dias);
  const montoHE      = calcularHorasExtra(base, he, tipo_he);
  const salarioBruto = salarioProp + montoHE + bono;
  const igss         = Math.round(salarioProp * IGSS_PORCENTAJE * 100) / 100;
  const isr          = calcularISR(salarioBruto);
  const totalDeduc   = igss + isr + prestamo;
  const salarioNeto  = Math.round((salarioBruto - totalDeduc) * 100) / 100;

  res.json({
    salario_base:         base,
    salario_proporcional: salarioProp,
    horas_extra_monto:    montoHE,
    bono_productividad:   bono,
    salario_bruto:        Math.round(salarioBruto * 100) / 100,
    deducciones: {
      igss,
      isr,
      descuento_prestamo: prestamo,
      total: Math.round(totalDeduc * 100) / 100,
    },
    salario_neto: salarioNeto,
  });
};

module.exports = {
  listarNominas,
  crearNomina,
  procesarNomina,
  obtenerDetalle,
  obtenerMovimientos,
  marcarPagada,
  simularEmpleado,
};