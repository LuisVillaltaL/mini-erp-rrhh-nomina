// backend/controllers/empleadosController.js
//
// Usa el pool centralizado de src/config/db.js.
// Columnas de la tabla empleados:
// id, codigo, nombres, apellidos, dpi, email, telefono,
// departamento_id, cargo_id, fecha_ingreso, tipo_contrato, estado

'use strict'

const db = require('../src/config/db')

// ── Helpers ───────────────────────────────────────────────────

/**
 * Genera el siguiente codigo de empleado:
 */
async function generarCodigo() {
  const { rows } = await db.query(
    "SELECT codigo FROM empleados WHERE codigo LIKE 'EMP-%' ORDER BY id DESC LIMIT 1"
  )
  if (!rows.length) return 'EMP-001'
  const ultimo = parseInt(rows[0].codigo.split('-')[1], 10)
  return `EMP-${String(ultimo + 1).padStart(3, '0')}`
}

// ── GET /api/rrhh/empleados ────────────────────────────────────
const listar = async (req, res) => {
  try {
    const { buscar, departamento_id, estado, tipo_contrato } = req.query

    const condiciones = []
    const params      = []
    let   idx         = 1

    if (buscar) {
      condiciones.push(`(
        LOWER(e.nombres)   LIKE LOWER($${idx}) OR
        LOWER(e.apellidos) LIKE LOWER($${idx}) OR
        LOWER(e.codigo)    LIKE LOWER($${idx}) OR
        LOWER(e.email)     LIKE LOWER($${idx}) OR
        e.dpi              LIKE $${idx}
      )`)
      params.push(`%${buscar}%`)
      idx++
    }

    if (departamento_id) {
      condiciones.push(`e.departamento_id = $${idx}`)
      params.push(departamento_id)
      idx++
    }

    if (estado) {
      condiciones.push(`e.estado = $${idx}`)
      params.push(estado)
      idx++
    }

    if (tipo_contrato) {
      condiciones.push(`e.tipo_contrato = $${idx}`)
      params.push(tipo_contrato)
      idx++
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''

    const { rows } = await db.query(`
      SELECT
        e.id,
        e.codigo,
        e.nombres,
        e.apellidos,
        e.nombres || ' ' || e.apellidos AS nombre_completo,
        e.dpi,
        e.email,
        e.telefono,
        e.departamento_id,
        e.cargo_id,
        e.fecha_ingreso,
        e.tipo_contrato,
        e.estado,
        d.nombre AS departamento,
        c.nombre AS cargo,
        c.salario_base
      FROM empleados e
      JOIN departamentos d ON e.departamento_id = d.id
      JOIN cargos        c ON e.cargo_id        = c.id
      ${where}
      ORDER BY e.apellidos ASC, e.nombres ASC
    `, params)

    return res.json(rows)
  } catch (err) {
    console.error('[RRHH] listar:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

// ── GET /api/rrhh/empleados/:id ────────────────────────────────
const obtenerPorId = async (req, res) => {
  const { id } = req.params

  try {
    const { rows } = await db.query(`
      SELECT
        e.id,
        e.codigo,
        e.nombres,
        e.apellidos,
        e.dpi,
        e.email,
        e.telefono,
        e.departamento_id,
        e.cargo_id,
        e.fecha_ingreso,
        e.tipo_contrato,
        e.estado,
        d.nombre AS departamento,
        c.nombre AS cargo,
        c.salario_base
      FROM empleados e
      JOIN departamentos d ON e.departamento_id = d.id
      JOIN cargos        c ON e.cargo_id        = c.id
      WHERE e.id = $1
    `, [id])

    if (!rows.length)
      return res.status(404).json({ error: 'Empleado no encontrado' })

    return res.json(rows[0])
  } catch (err) {
    console.error('[RRHH] obtenerPorId:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

// ── POST /api/rrhh/empleados ───────────────────────────────────
const crear = async (req, res) => {
  const {
    nombres,
    apellidos,
    dpi,
    email,
    telefono,
    departamento_id,
    cargo_id,
    fecha_ingreso,
    tipo_contrato,
  } = req.body

  // Validaciones mínimas
  const faltantes = []
  if (!nombres?.trim())    faltantes.push('nombres')
  if (!apellidos?.trim())  faltantes.push('apellidos')
  if (!departamento_id)    faltantes.push('departamento_id')
  if (!cargo_id)           faltantes.push('cargo_id')
  if (!fecha_ingreso)      faltantes.push('fecha_ingreso')

  if (faltantes.length)
    return res.status(400).json({
      error: `Campos requeridos faltantes: ${faltantes.join(', ')}`
    })

  try {
    const codigo = await generarCodigo()

    const { rows } = await db.query(`
      INSERT INTO empleados
        (codigo, nombres, apellidos, dpi, email, telefono,
         departamento_id, cargo_id, fecha_ingreso, tipo_contrato, estado)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'activo')
      RETURNING id, codigo
    `, [
      codigo,
      nombres.trim(),
      apellidos.trim(),
      dpi?.trim()   || null,
      email?.trim() || null,
      telefono?.trim() || null,
      departamento_id,
      cargo_id,
      fecha_ingreso,
      tipo_contrato || 'indefinido',
    ])

    return res.status(201).json({
      mensaje: 'Empleado registrado correctamente',
      id:      rows[0].id,
      codigo:  rows[0].codigo,
    })
  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint?.includes('dpi'))
        return res.status(409).json({ error: 'El DPI ya está registrado en el sistema' })
      if (err.constraint?.includes('email'))
        return res.status(409).json({ error: 'El correo ya está registrado en el sistema' })
    }
    console.error('[RRHH] crear:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

// ── PUT /api/rrhh/empleados/:id ────────────────────────────────
const actualizar = async (req, res) => {
  const { id } = req.params
  const {
    nombres,
    apellidos,
    dpi,
    email,
    telefono,
    departamento_id,
    cargo_id,
    fecha_ingreso,
    tipo_contrato,
    estado,
  } = req.body

  try {
    const { rowCount } = await db.query(`
      UPDATE empleados SET
        nombres         = COALESCE($1,  nombres),
        apellidos       = COALESCE($2,  apellidos),
        dpi             = COALESCE($3,  dpi),
        email           = COALESCE($4,  email),
        telefono        = COALESCE($5,  telefono),
        departamento_id = COALESCE($6,  departamento_id),
        cargo_id        = COALESCE($7,  cargo_id),
        fecha_ingreso   = COALESCE($8,  fecha_ingreso),
        tipo_contrato   = COALESCE($9,  tipo_contrato),
        estado          = COALESCE($10, estado),
        updated_at      = CURRENT_TIMESTAMP
      WHERE id = $11
    `, [
      nombres?.trim()    || null,
      apellidos?.trim()  || null,
      dpi?.trim()        || null,
      email?.trim()      || null,
      telefono?.trim()   || null,
      departamento_id    || null,
      cargo_id           || null,
      fecha_ingreso      || null,
      tipo_contrato      || null,
      estado             || null,
      id,
    ])

    if (!rowCount)
      return res.status(404).json({ error: 'Empleado no encontrado' })

    return res.json({ mensaje: 'Empleado actualizado correctamente' })
  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint?.includes('dpi'))
        return res.status(409).json({ error: 'El DPI ya está registrado en el sistema' })
      if (err.constraint?.includes('email'))
        return res.status(409).json({ error: 'El correo ya está registrado en el sistema' })
    }
    console.error('[RRHH] actualizar:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

// ── DELETE /api/rrhh/empleados/:id ────────────────────────────
// Baja logica: cambia estado a 'inactivo', no elimina el registro.
const desactivar = async (req, res) => {
  const { id } = req.params

  try {
    const { rowCount } = await db.query(`
      UPDATE empleados
      SET estado = 'inactivo', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND estado != 'inactivo'
    `, [id])

    if (!rowCount)
      return res.status(404).json({
        error: 'Empleado no encontrado o ya estaba inactivo'
      })

    return res.json({ mensaje: 'Empleado dado de baja correctamente' })
  } catch (err) {
    console.error('[RRHH] desactivar:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

// ── GET /api/rrhh/stats ────────────────────────────────────────
// KPIs para las tarjetas del modulo RRHH
const stats = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        COUNT(*)                                                    AS total,
        COUNT(*) FILTER (WHERE estado = 'activo')                  AS activos,
        COUNT(*) FILTER (WHERE estado = 'inactivo')                AS inactivos,
        COUNT(*) FILTER (WHERE tipo_contrato = 'indefinido'
                         AND estado = 'activo')                    AS indefinidos,
        COUNT(*) FILTER (WHERE tipo_contrato = 'temporal'
                         AND estado = 'activo')                    AS temporales,
        COUNT(*) FILTER (WHERE fecha_ingreso >= CURRENT_DATE
                         - INTERVAL '30 days'
                         AND estado = 'activo')                    AS nuevos_mes
      FROM empleados
    `)
    return res.json(rows[0])
  } catch (err) {
    console.error('[RRHH] stats:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, desactivar, stats }