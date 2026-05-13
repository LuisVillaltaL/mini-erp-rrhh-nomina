'use strict';

const db = require('../src/config/db');

const IGSS_PORCENTAJE = 0.0483;
const HORAS_MES       = 240;

function calcularDiasCalendario(fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin    = new Date(fechaFin);
    const diff   = Math.round((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
}

function calcularISR(salarioBruto) {
    const anual  = salarioBruto * 12;
    const exento = 48000;
    if (anual <= exento) return 0;
    const base     = anual - exento;
    const isrAnual = base <= 300000
        ? base * 0.05
        : 300000 * 0.05 + (base - 300000) * 0.07;
    return r2(isrAnual / 12);
}

function calcularHorasExtra(salarioBase, horas, tipo) {
    const mult = tipo === 'doble' ? 2.0 : 1.5;
    return r2((salarioBase / HORAS_MES) * mult * horas);
}

function salarioProporcional(salarioBase, dias) {
    if (dias >= 30) return r2(salarioBase);
    return r2((salarioBase / 30) * dias);
}

function r2(n) {
    return Math.round(parseFloat(n) * 100) / 100;
}

// ── GET /api/nominas ──────────────────────────────────────────
const listarNominas = async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM nominas ORDER BY periodo DESC, created_at DESC'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── POST /api/nominas ─────────────────────────────────────────
const crearNomina = async (req, res) => {
    const { periodo, fecha_inicio, fecha_fin, tipo_periodo = 'mensual' } = req.body;
    if (!periodo || !fecha_inicio || !fecha_fin)
        return res.status(400).json({ error: 'periodo, fecha_inicio y fecha_fin son requeridos' });

    try {
        const dias = calcularDiasCalendario(fecha_inicio, fecha_fin);
        const { rows } = await db.query(
            `INSERT INTO nominas (periodo, fecha_inicio, fecha_fin, tipo_periodo)
             VALUES ($1,$2,$3,$4) RETURNING *`,
            [periodo, fecha_inicio, fecha_fin, tipo_periodo]
        );
        res.status(201).json({ ...rows[0], dias_periodo: dias });
    } catch (err) {
        if (err.code === '23505')
            return res.status(409).json({
                error: 'Ya existe una nomina de tipo "' + tipo_periodo + '" para ' + periodo
            });
        res.status(500).json({ error: err.message });
    }
};

// ── POST /api/nominas/:id/procesar ────────────────────────────
const procesarNomina = async (req, res) => {
    const { id }  = req.params;
    const client  = await db.connect();

    try {
        await client.query('BEGIN');

        // 1. Obtener nomina
        const { rows: [nomina] } = await client.query(
            'SELECT * FROM nominas WHERE id=$1', [id]
        );
        if (!nomina)
            return res.status(404).json({ error: 'Nomina no encontrada' });
        if (nomina.estado !== 'borrador')
            return res.status(400).json({
                error: 'No se puede procesar una nomina en estado ' + nomina.estado
            });

        // 2. Dias reales del periodo
        const diasPeriodo = calcularDiasCalendario(nomina.fecha_inicio, nomina.fecha_fin);
        console.log('[NOMINA] ' + nomina.periodo + ': ' + diasPeriodo + ' dias');

        // 3. Empleados activos
        const { rows: empleados } = await client.query(`
            SELECT e.id, e.nombres || ' ' || e.apellidos AS nombre,
                   c.salario_base
            FROM empleados e
            JOIN cargos c ON e.cargo_id = c.id
            WHERE e.estado = 'activo'
        `);

        // 4. Conceptos disponibles
        const { rows: conceptos } = await client.query(
            'SELECT * FROM conceptos_nomina WHERE activo = true'
        );
        const getConcepto  = (codigo) => conceptos.find(c => c.codigo === codigo);
        const concIngreso  = conceptos.find(c => c.tipo === 'ingreso');  // primer concepto de ingreso
        const cIGSS        = getConcepto('IGSS');
        const cISR         = getConcepto('ISR');

        let totalIngresosGlobal    = 0;
        let totalDeduccionesGlobal = 0;

        for (const emp of empleados) {
            // 5. Salario proporcional a los dias reales
            const salProp = salarioProporcional(r2(emp.salario_base), diasPeriodo);

            // 6. Buscar o crear detalle
            const { rows: detExiste } = await client.query(
                'SELECT id FROM detalle_nomina WHERE nomina_id=$1 AND empleado_id=$2',
                [id, emp.id]
            );

            let detalleId;
            if (detExiste.length) {
                detalleId = detExiste[0].id;
                await client.query(
                    'UPDATE detalle_nomina SET salario_base=$1, dias_trabajados=$2 WHERE id=$3',
                    [salProp, diasPeriodo, detalleId]
                );
            } else {
                const { rows: [det] } = await client.query(`
                    INSERT INTO detalle_nomina
                        (nomina_id, empleado_id, salario_base, dias_trabajados,
                         horas_extra, total_ingresos, total_deducciones, salario_neto)
                    VALUES ($1,$2,$3,$4,0,0,0,0) RETURNING id
                `, [id, emp.id, salProp, diasPeriodo]);
                detalleId = det.id;
            }

            // 7. Leer movimientos pre-existentes (bonos, horas extra, prestamos)
            //    Excluye IGSS, ISR y salario base — se recalculan siempre
            const { rows: movsPrev } = await client.query(`
                SELECT mn.monto, cn.tipo, cn.codigo
                FROM movimientos_nomina mn
                JOIN conceptos_nomina cn ON mn.concepto_id = cn.id
                WHERE mn.detalle_nomina_id = $1
                  AND cn.codigo NOT IN ('IGSS','ISR')
                  AND mn.descripcion NOT LIKE 'Salario base%'
            `, [detalleId]);

            const extraIngresos    = movsPrev
                .filter(m => m.tipo === 'ingreso')
                .reduce((s, m) => s + r2(m.monto), 0);
            const extraDeducciones = movsPrev
                .filter(m => m.tipo === 'deduccion')
                .reduce((s, m) => s + r2(m.monto), 0);

            // 8. Calcular totales
            const salarioBruto = r2(salProp + extraIngresos);
            const igss         = r2(salProp * IGSS_PORCENTAJE);
            const isr          = calcularISR(salarioBruto);
            const totalDeduc   = r2(igss + isr + extraDeducciones);
            const salarioNeto  = r2(salarioBruto - totalDeduc);

            totalIngresosGlobal    += salarioBruto;
            totalDeduccionesGlobal += totalDeduc;

            // 9. Borrar y reinsertar salario base como movimiento
            await client.query(
                "DELETE FROM movimientos_nomina WHERE detalle_nomina_id=$1 AND descripcion LIKE 'Salario base%'",
                [detalleId]
            );
            if (concIngreso) {
                const descSal = diasPeriodo >= 30
                    ? 'Salario base mensual'
                    : 'Salario base proporcional (' + diasPeriodo + ' dias)';
                await client.query(
                    'INSERT INTO movimientos_nomina (detalle_nomina_id, concepto_id, descripcion, monto) VALUES ($1,$2,$3,$4)',
                    [detalleId, concIngreso.id, descSal, salProp]
                );
            }

            // 10. Borrar y reinsertar IGSS
            if (cIGSS) {
                await client.query(
                    'DELETE FROM movimientos_nomina WHERE detalle_nomina_id=$1 AND concepto_id=$2',
                    [detalleId, cIGSS.id]
                );
                await client.query(
                    'INSERT INTO movimientos_nomina (detalle_nomina_id, concepto_id, descripcion, monto) VALUES ($1,$2,$3,$4)',
                    [detalleId, cIGSS.id, 'IGSS Laboral (4.83%)', igss]
                );
            }

            // 11. Borrar y reinsertar ISR
            if (isr > 0 && cISR) {
                await client.query(
                    'DELETE FROM movimientos_nomina WHERE detalle_nomina_id=$1 AND concepto_id=$2',
                    [detalleId, cISR.id]
                );
                await client.query(
                    'INSERT INTO movimientos_nomina (detalle_nomina_id, concepto_id, descripcion, monto) VALUES ($1,$2,$3,$4)',
                    [detalleId, cISR.id, 'Retencion ISR', isr]
                );
            }

            // 12. Actualizar totales del detalle
            await client.query(
                'UPDATE detalle_nomina SET total_ingresos=$1, total_deducciones=$2, salario_neto=$3 WHERE id=$4',
                [salarioBruto, totalDeduc, salarioNeto, detalleId]
            );

            console.log(
                '[NOMINA] ' + emp.nombre +
                ': base=' + salProp +
                ' +extras=' + extraIngresos +
                ' igss=' + igss +
                ' isr=' + isr +
                ' neto=' + salarioNeto
            );
        }

        // 13. Actualizar nomina
        await client.query(`
            UPDATE nominas SET
                estado='procesada', total_ingresos=$1, total_deducciones=$2,
                total_neto=$3, procesado_por=$4,
                fecha_proceso=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
            WHERE id=$5
        `, [
            r2(totalIngresosGlobal),
            r2(totalDeduccionesGlobal),
            r2(totalIngresosGlobal - totalDeduccionesGlobal),
            req.body.procesado_por || 'Sistema',
            id,
        ]);

        await client.query('COMMIT');
        res.json({
            mensaje: 'Nomina procesada correctamente',
            dias_periodo: diasPeriodo,
            empleados_procesados: empleados.length,
            total_ingresos:    r2(totalIngresosGlobal),
            total_deducciones: r2(totalDeduccionesGlobal),
            total_neto:        r2(totalIngresosGlobal - totalDeduccionesGlobal),
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[NOMINA] Error:', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

// ── GET /api/nominas/:id/detalle ──────────────────────────────
const obtenerDetalle = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT dn.*, e.nombres || ' ' || e.apellidos AS empleado,
                   e.id AS empleado_id, e.codigo,
                   d.nombre AS departamento, c.nombre AS cargo
            FROM detalle_nomina dn
            JOIN empleados e     ON dn.empleado_id    = e.id
            JOIN departamentos d ON e.departamento_id = d.id
            JOIN cargos c        ON e.cargo_id        = c.id
            WHERE dn.nomina_id = $1
            ORDER BY d.nombre, e.apellidos
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── GET /api/nominas/:id/detalle/:empleadoId/movimientos ──────
const obtenerMovimientos = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT mn.id, mn.monto, mn.descripcion,
                   cn.nombre AS concepto, cn.tipo, cn.codigo
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

// ── PUT /api/nominas/:id/pagar ────────────────────────────────
const marcarPagada = async (req, res) => {
    try {
        const { rows: [n] } = await db.query(
            'SELECT estado FROM nominas WHERE id=$1', [req.params.id]
        );
        if (!n) return res.status(404).json({ error: 'Nomina no encontrada' });
        if (n.estado !== 'procesada')
            return res.status(400).json({ error: 'Solo se puede pagar una nomina procesada' });
        await db.query(
            "UPDATE nominas SET estado='pagada', updated_at=CURRENT_TIMESTAMP WHERE id=$1",
            [req.params.id]
        );
        await db.query(
            "UPDATE detalle_nomina SET estado='pagado' WHERE nomina_id=$1",
            [req.params.id]
        );
        res.json({ mensaje: 'Nomina marcada como pagada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── GET /api/nominas/simulacion ───────────────────────────────
const simularEmpleado = async (req, res) => {
    const {
        salario_base, dias_trabajados = 30, horas_extra = 0,
        tipo_he = 'normal', bono_productividad = 0, descuento_prestamo = 0,
    } = req.query;

    if (!salario_base)
        return res.status(400).json({ error: 'salario_base es requerido' });

    const base     = parseFloat(salario_base);
    const dias     = parseInt(dias_trabajados);
    const salProp  = salarioProporcional(base, dias);
    const montoHE  = calcularHorasExtra(base, parseFloat(horas_extra), tipo_he);
    const bono     = parseFloat(bono_productividad);
    const prestamo = parseFloat(descuento_prestamo);
    const bruto    = r2(salProp + montoHE + bono);
    const igss     = r2(salProp * IGSS_PORCENTAJE);
    const isr      = calcularISR(bruto);
    const deduc    = r2(igss + isr + prestamo);

    res.json({
        salario_base: base, dias_periodo: dias,
        salario_proporcional: salProp,
        horas_extra_monto: montoHE,
        bono_productividad: bono,
        salario_bruto: bruto,
        deducciones: { igss, isr, descuento_prestamo: prestamo, total: deduc },
        salario_neto: r2(bruto - deduc),
    });
};

module.exports = {
    listarNominas, crearNomina, procesarNomina,
    obtenerDetalle, obtenerMovimientos, marcarPagada, simularEmpleado,
};