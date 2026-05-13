// Permite registrar horas extra y bonos a un departamento completo
// o a un empleado individual, vinculados a una nomina en borrador.
import { useState, useEffect } from 'react';

const API = 'http://localhost:3001/api';

function token() {
    return localStorage.getItem('erp_token') || '';
}

function authFetch(url, options = {}) {
    return fetch(`${API}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token()}`,
            ...(options.headers || {}),
        },
    }).then(r => r.json());
}

// ── Estilos ───────────────────────────────────────────────────

const card = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    padding: '24px 28px',
};

const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 13,
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fff',
};

const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 5,
};

const TIPO_MOVIMIENTO = [
    { value: 'hora_extra_normal', label: 'Hora extra normal (x1.5)' },
    { value: 'hora_extra_doble',  label: 'Hora extra doble (x2.0)'  },
    { value: 'bono_productividad',label: 'Bono de productividad'     },
    { value: 'bono_especial',     label: 'Bono especial'             },
    { value: 'descuento_prestamo',label: 'Descuento prestamo'        },
    { value: 'otro_ingreso',      label: 'Otro ingreso'              },
    { value: 'otra_deduccion',    label: 'Otra deduccion'            },
];

// ── Sub-componente: tabla de empleados con check ──────────────

function TablaEmpleados({ empleados, seleccionados, onToggle, onToggleAll }) {
    const todosSeleccionados =
        empleados.length > 0 && empleados.every(e => seleccionados.has(e.id));

    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '9px 12px', width: 40 }}>
                            <input
                                type="checkbox"
                                checked={todosSeleccionados}
                                onChange={() => onToggleAll(empleados, !todosSeleccionados)}
                                style={{ cursor: 'pointer' }}
                            />
                        </th>
                        {['Codigo', 'Nombre', 'Departamento', 'Cargo', 'Salario base'].map(h => (
                            <th key={h} style={{
                                padding: '9px 12px', textAlign: 'left',
                                color: '#475569', fontWeight: 600,
                                fontSize: 11, textTransform: 'uppercase',
                            }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {empleados.length === 0 ? (
                        <tr>
                            <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                                No hay empleados en este departamento
                            </td>
                        </tr>
                    ) : (
                        empleados.map((emp, i) => (
                            <tr
                                key={emp.id}
                                onClick={() => onToggle(emp.id)}
                                style={{
                                    borderBottom: '1px solid #f1f5f9',
                                    background: seleccionados.has(emp.id)
                                        ? '#eff6ff'
                                        : i % 2 === 0 ? '#fff' : '#fafafa',
                                    cursor: 'pointer',
                                }}
                            >
                                <td style={{ padding: '9px 12px' }}>
                                    <input
                                        type="checkbox"
                                        checked={seleccionados.has(emp.id)}
                                        onChange={() => onToggle(emp.id)}
                                        onClick={e => e.stopPropagation()}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </td>
                                <td style={{ padding: '9px 12px', color: '#1d4ed8', fontWeight: 500 }}>{emp.codigo}</td>
                                <td style={{ padding: '9px 12px', fontWeight: 500, color: '#0f172a' }}>
                                    {emp.apellidos}, {emp.nombres}
                                </td>
                                <td style={{ padding: '9px 12px', color: '#64748b' }}>{emp.departamento}</td>
                                <td style={{ padding: '9px 12px', color: '#64748b' }}>{emp.cargo}</td>
                                <td style={{ padding: '9px 12px', color: '#0f172a' }}>
                                    Q {parseFloat(emp.salario_base || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────

export default function MovimientosMasivos() {
    // Datos externos
    const [nominas,       setNominas]       = useState([]);
    const [departamentos, setDepartamentos] = useState([]);
    const [empleados,     setEmpleados]     = useState([]);

    // Filtros
    const [nominaId,    setNominaId]    = useState('');
    const [modoBusqueda, setModoBusqueda] = useState('departamento'); // 'departamento' | 'empleado'
    const [deptoId,     setDeptoId]     = useState('');
    const [buscarEmp,   setBuscarEmp]   = useState('');

    // Seleccion
    const [seleccionados, setSeleccionados] = useState(new Set());

    // Formulario del movimiento
    const [tipo,    setTipo]    = useState('hora_extra_normal');
    const [cantidad, setCantidad] = useState('');
    const [monto,   setMonto]   = useState('');
    const [fecha,   setFecha]   = useState(new Date().toISOString().slice(0, 10));
    const [motivo,  setMotivo]  = useState('');

    // Estado UI
    const [guardando, setGuardando] = useState(false);
    const [resultado, setResultado] = useState(null); // { ok: [], errores: [] }
    const [error,     setError]     = useState('');

    // ── Carga inicial ─────────────────────────────────────────

    useEffect(() => {
        Promise.all([
            authFetch('/nominas'),
            authFetch('/departamentos'),
        ]).then(([nom, dep]) => {
            // Solo nominas en borrador o procesada (no pagadas)
            const activas = Array.isArray(nom)
                ? nom.filter(n => n.estado === 'borrador' || n.estado === 'procesada')
                : [];
            setNominas(activas);
            setDepartamentos(Array.isArray(dep) ? dep : []);
        });
    }, []);

    // ── Cargar empleados segun filtro ─────────────────────────

    useEffect(() => {
        setSeleccionados(new Set());
        setEmpleados([]);

        if (modoBusqueda === 'departamento' && deptoId) {
            authFetch(`/rrhh?departamento_id=${deptoId}&estado=activo`).then(data => {
                setEmpleados(Array.isArray(data) ? data : []);
            });
        } else if (modoBusqueda === 'empleado' && buscarEmp.length >= 2) {
            authFetch(`/rrhh?buscar=${encodeURIComponent(buscarEmp)}&estado=activo`).then(data => {
                setEmpleados(Array.isArray(data) ? data : []);
            });
        }
    }, [modoBusqueda, deptoId, buscarEmp]);

    // ── Logica de seleccion ───────────────────────────────────

    const toggleEmp = (id) => {
        setSeleccionados(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = (lista, seleccionar) => {
        setSeleccionados(prev => {
            const next = new Set(prev);
            lista.forEach(e => seleccionar ? next.add(e.id) : next.delete(e.id));
            return next;
        });
    };

    // ── Determinar si el tipo requiere cantidad o monto ───────

    const requiereCantidad = tipo === 'hora_extra_normal' || tipo === 'hora_extra_doble';
    const tipoLabel = TIPO_MOVIMIENTO.find(t => t.value === tipo)?.label || '';

    // ── Aplicar movimientos ───────────────────────────────────

    const handleAplicar = async () => {
        if (!nominaId) { setError('Selecciona una nomina'); return; }
        if (seleccionados.size === 0) { setError('Selecciona al menos un empleado'); return; }
        if (requiereCantidad && !cantidad) { setError('Ingresa la cantidad de horas'); return; }
        if (!requiereCantidad && !monto) { setError('Ingresa el monto'); return; }
        if (!motivo.trim()) { setError('Ingresa el motivo'); return; }

        setError('');
        setGuardando(true);
        setResultado(null);

        const ok      = [];
        const errores = [];

        const empSeleccionados = empleados.filter(e => seleccionados.has(e.id));

        for (const emp of empSeleccionados) {
            try {
                // Calculamos el monto si son horas extra
                let montoFinal = parseFloat(monto) || 0;
                if (requiereCantidad) {
                    const horas       = parseFloat(cantidad);
                    const valorHora   = parseFloat(emp.salario_base) / 240;
                    const multiplicador = tipo === 'hora_extra_doble' ? 2.0 : 1.5;
                    montoFinal = Math.round(valorHora * multiplicador * horas * 100) / 100;
                }

                // Buscar o crear detalle_nomina para este empleado
                const detalleRes = await authFetch(`/nominas/${nominaId}/detalle`);
                const detalle    = Array.isArray(detalleRes) ? detalleRes : [];
                let   det        = detalle.find(d => d.empleado_id === emp.id);

                // Si no existe detalle aun, lo creamos
                if (!det) {
                    const crearDet = await authFetch(`/nominas/${nominaId}/detalle`, {
                        method: 'POST',
                        body: JSON.stringify({
                            empleado_id:     emp.id,
                            salario_base:    emp.salario_base,
                            dias_trabajados: 30,
                        }),
                    });
                    if (crearDet.error) throw new Error(crearDet.error);
                    det = { id: crearDet.id };
                }

                // Registrar el movimiento
                const movRes = await authFetch(`/nominas/${nominaId}/detalle/${det.id}/movimiento`, {
                    method: 'POST',
                    body: JSON.stringify({
                        tipo,
                        cantidad:    requiereCantidad ? parseFloat(cantidad) : null,
                        monto:       montoFinal,
                        fecha,
                        motivo:      motivo.trim(),
                        descripcion: `${tipoLabel} - ${motivo.trim()}`,
                    }),
                });

                if (movRes.error) throw new Error(movRes.error);

                ok.push({
                    nombre: `${emp.nombres} ${emp.apellidos}`,
                    monto:  montoFinal,
                });
            } catch (err) {
                errores.push({
                    nombre: `${emp.nombres} ${emp.apellidos}`,
                    error:  err.message,
                });
            }
        }

        setGuardando(false);
        setResultado({ ok, errores });
        if (ok.length > 0) {
            setSeleccionados(new Set());
            setCantidad('');
            setMonto('');
            setMotivo('');
        }
    };

    // ── Render ────────────────────────────────────────────────

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Fila superior: Nomina + Tipo movimiento */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* Seleccion de nomina */}
                <div style={card}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        1. Selecciona la nomina
                    </h3>
                    <div>
                        <label style={labelStyle}>Nomina activa</label>
                        <select
                            value={nominaId}
                            onChange={e => setNominaId(e.target.value)}
                            style={{ ...inputStyle, appearance: 'none' }}
                        >
                            <option value="">Seleccionar nomina...</option>
                            {nominas.map(n => (
                                <option key={n.id} value={n.id}>
                                    {n.periodo} — {n.estado}
                                </option>
                            ))}
                        </select>
                        {nominas.length === 0 && (
                            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                                No hay nominas en borrador o procesadas.
                            </p>
                        )}
                    </div>
                </div>

                {/* Tipo y datos del movimiento */}
                <div style={card}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        2. Datos del movimiento
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Tipo de movimiento</label>
                            <select
                                value={tipo}
                                onChange={e => { setTipo(e.target.value); setCantidad(''); setMonto(''); }}
                                style={{ ...inputStyle, appearance: 'none' }}
                            >
                                {TIPO_MOVIMIENTO.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {requiereCantidad ? (
                                <div>
                                    <label style={labelStyle}>Cantidad de horas</label>
                                    <input
                                        type="number" min="0.5" step="0.5"
                                        value={cantidad}
                                        onChange={e => setCantidad(e.target.value)}
                                        placeholder="Ej: 4.5"
                                        style={inputStyle}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label style={labelStyle}>Monto (Q)</label>
                                    <input
                                        type="number" min="0" step="0.01"
                                        value={monto}
                                        onChange={e => setMonto(e.target.value)}
                                        placeholder="0.00"
                                        style={inputStyle}
                                    />
                                </div>
                            )}
                            <div>
                                <label style={labelStyle}>Fecha</label>
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={e => setFecha(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Motivo</label>
                            <input
                                type="text"
                                value={motivo}
                                onChange={e => setMotivo(e.target.value)}
                                placeholder="Ej: Cobertura turno nocturno semana 18"
                                style={inputStyle}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Seleccion de empleados */}
            <div style={card}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    3. Selecciona empleados
                </h3>

                {/* Modo de busqueda */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {[
                        { key: 'departamento', label: 'Por departamento' },
                        { key: 'empleado',     label: 'Empleado individual' },
                    ].map(m => (
                        <button
                            key={m.key}
                            onClick={() => { setModoBusqueda(m.key); setDeptoId(''); setBuscarEmp(''); }}
                            style={{
                                padding: '7px 16px',
                                background: modoBusqueda === m.key ? '#1d4ed8' : '#f8fafc',
                                color: modoBusqueda === m.key ? '#fff' : '#475569',
                                border: '1px solid ' + (modoBusqueda === m.key ? '#1d4ed8' : '#e2e8f0'),
                                borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                            }}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                {/* Filtro segun modo */}
                {modoBusqueda === 'departamento' ? (
                    <div style={{ maxWidth: 320, marginBottom: 4 }}>
                        <label style={labelStyle}>Departamento</label>
                        <select
                            value={deptoId}
                            onChange={e => setDeptoId(e.target.value)}
                            style={{ ...inputStyle, appearance: 'none' }}
                        >
                            <option value="">Seleccionar departamento...</option>
                            {departamentos.map(d => (
                                <option key={d.id} value={d.id}>{d.nombre}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div style={{ maxWidth: 380, marginBottom: 4 }}>
                        <label style={labelStyle}>Buscar empleado</label>
                        <input
                            type="text"
                            value={buscarEmp}
                            onChange={e => setBuscarEmp(e.target.value)}
                            placeholder="Nombre, codigo o DPI..."
                            style={inputStyle}
                        />
                        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                            Escribe al menos 2 caracteres para buscar
                        </p>
                    </div>
                )}

                {/* Contador */}
                {empleados.length > 0 && (
                    <p style={{ fontSize: 12, color: '#64748b', margin: '8px 0 0' }}>
                        {empleados.length} empleado(s) encontrado(s) &nbsp;|&nbsp;
                        <strong style={{ color: '#1d4ed8' }}>{seleccionados.size} seleccionado(s)</strong>
                    </p>
                )}

                {/* Tabla de empleados */}
                {(deptoId || buscarEmp.length >= 2) && (
                    <TablaEmpleados
                        empleados={empleados}
                        seleccionados={seleccionados}
                        onToggle={toggleEmp}
                        onToggleAll={toggleAll}
                    />
                )}
            </div>

            {/* Preview del monto si son horas extra */}
            {requiereCantidad && cantidad && seleccionados.size > 0 && (
                <div style={{
                    background: '#f0f9ff', border: '1px solid #bae6fd',
                    borderRadius: 8, padding: '12px 16px',
                }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#0369a1', fontWeight: 500 }}>
                        Vista previa del calculo
                    </p>
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {empleados
                            .filter(e => seleccionados.has(e.id))
                            .map(emp => {
                                const horas  = parseFloat(cantidad) || 0;
                                const vh     = parseFloat(emp.salario_base) / 240;
                                const mult   = tipo === 'hora_extra_doble' ? 2.0 : 1.5;
                                const monto  = Math.round(vh * mult * horas * 100) / 100;
                                return (
                                    <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#0f172a' }}>
                                        <span>{emp.nombres} {emp.apellidos}</span>
                                        <strong style={{ color: '#0369a1' }}>
                                            Q {monto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                        </strong>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#dc2626',
                }}>
                    {error}
                </div>
            )}

            {/* Resultado */}
            {resultado && (
                <div style={card}>
                    <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        Resultado del registro
                    </h3>
                    {resultado.ok.length > 0 && (
                        <>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#15803d', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Registrados correctamente ({resultado.ok.length})
                            </p>
                            {resultado.ok.map((r, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                                    <span style={{ color: '#374151' }}>{r.nombre}</span>
                                    <span style={{ color: '#15803d', fontWeight: 500 }}>
                                        Q {r.monto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </>
                    )}
                    {resultado.errores.length > 0 && (
                        <>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#b91c1c', margin: '12px 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Con errores ({resultado.errores.length})
                            </p>
                            {resultado.errores.map((r, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                                    <span style={{ color: '#374151' }}>{r.nombre}</span>
                                    <span style={{ color: '#b91c1c', fontSize: 12 }}>{r.error}</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* Boton aplicar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                    onClick={() => {
                        setSeleccionados(new Set());
                        setCantidad('');
                        setMonto('');
                        setMotivo('');
                        setResultado(null);
                        setError('');
                    }}
                    style={{
                        padding: '10px 20px', background: '#f8fafc',
                        border: '1px solid #e2e8f0', borderRadius: 8,
                        cursor: 'pointer', fontSize: 13, color: '#475569',
                    }}
                >
                    Limpiar
                </button>
                <button
                    onClick={handleAplicar}
                    disabled={guardando || seleccionados.size === 0 || !nominaId}
                    style={{
                        padding: '10px 28px',
                        background: (guardando || seleccionados.size === 0 || !nominaId)
                            ? '#93c5fd' : '#1d4ed8',
                        color: '#fff', border: 'none', borderRadius: 8,
                        cursor: (guardando || seleccionados.size === 0 || !nominaId)
                            ? 'not-allowed' : 'pointer',
                        fontWeight: 600, fontSize: 13,
                    }}
                >
                    {guardando
                        ? `Aplicando (${seleccionados.size})...`
                        : `Aplicar a ${seleccionados.size} empleado(s)`}
                </button>
            </div>
        </div>
    );
}