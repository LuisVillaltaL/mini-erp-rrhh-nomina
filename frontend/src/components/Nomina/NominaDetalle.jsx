// frontend/src/components/Nomina/NominaDetalle.jsx
import { useState, useEffect } from 'react';
import { nominaService } from '../../services/nominaService';

const fmt = (n) =>
    `Q ${parseFloat(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;

const card = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
};

const KPI_CONFIG = [
    { key: 'empleados', label: 'Total empleados',    color: '#1d4ed8' },
    { key: 'bruto',     label: 'Total bruto',        color: '#0ea5e9' },
    { key: 'deduc',     label: 'Total deducciones',  color: '#dc2626' },
    { key: 'neto',      label: 'Total neto',         color: '#10b981' },
];

export default function NominaDetalle({ nominaId, onVolver }) {
    const [nomina,      setNomina]      = useState(null);
    const [detalle,     setDetalle]     = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [empSel,      setEmpSel]      = useState(null);
    const [cargando,    setCargando]    = useState(true);
    const [procesando,  setProcesando]  = useState(false);

    const cargar = async () => {
        setCargando(true);
        // Cargar lista de nominas para obtener datos de esta
        const [lista, det] = await Promise.all([
            nominaService.listar(),
            nominaService.detalle(nominaId),
        ]);
        if (Array.isArray(lista)) {
            setNomina(lista.find(n => n.id === nominaId) || null);
        }
        setDetalle(Array.isArray(det) ? det : []);
        setCargando(false);
    };

    useEffect(() => { cargar(); }, [nominaId]);

    const handleProcesar = async () => {
        if (!confirm('Procesar esta nomina? Se calcularan los salarios de todos los empleados activos.')) return;
        setProcesando(true);
        const res = await nominaService.procesar(nominaId, { procesado_por: 'Administrador' });
        setProcesando(false);
        if (res.error) { alert('Error: ' + res.error); return; }
        cargar();
    };

    const verMovimientos = async (emp) => {
        setEmpSel(emp);
        const data = await nominaService.movimientos(nominaId, emp.empleado_id);
        setMovimientos(Array.isArray(data) ? data : []);
    };

    const totalBruto = detalle.reduce((s, r) => s + parseFloat(r.total_ingresos    || 0), 0);
    const totalDeduc = detalle.reduce((s, r) => s + parseFloat(r.total_deducciones || 0), 0);
    const totalNeto  = detalle.reduce((s, r) => s + parseFloat(r.salario_neto      || 0), 0);

    const kpiVals = {
        empleados: detalle.length,
        bruto:     fmt(totalBruto),
        deduc:     fmt(totalDeduc),
        neto:      fmt(totalNeto),
    };

    if (cargando) return (
        <p style={{ color: '#64748b', fontSize: 13 }}>Cargando detalle...</p>
    );

    return (
        <div>
            {/* Encabezado */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={onVolver}
                        style={{
                            padding: '7px 14px', background: '#f8fafc',
                            border: '1px solid #e2e8f0', borderRadius: 8,
                            cursor: 'pointer', color: '#475569', fontSize: 13,
                        }}
                    >
                        Volver
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                            Detalle de Nomina
                        </h2>
                        {nomina && (
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                                Periodo: {nomina.periodo} &nbsp;|&nbsp;
                                Estado: <strong style={{ textTransform: 'capitalize' }}>{nomina.estado}</strong>
                            </p>
                        )}
                    </div>
                </div>

                {/* Boton procesar si esta en borrador */}
                {nomina?.estado === 'borrador' && (
                    <button
                        onClick={handleProcesar}
                        disabled={procesando}
                        style={{
                            padding: '9px 20px',
                            background: procesando ? '#93c5fd' : '#1d4ed8',
                            color: '#fff', border: 'none', borderRadius: 8,
                            cursor: procesando ? 'not-allowed' : 'pointer',
                            fontWeight: 600, fontSize: 13,
                        }}
                    >
                        {procesando ? 'Procesando...' : 'Procesar Nomina'}
                    </button>
                )}
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {KPI_CONFIG.map(k => (
                    <div key={k.key} style={{ ...card, padding: '16px 20px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#64748b' }}>{k.label}</p>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: k.color }}>
                            {kpiVals[k.key]}
                        </p>
                    </div>
                ))}
            </div>

            {/* Mensaje si no hay detalle */}
            {detalle.length === 0 ? (
                <div style={{ ...card, padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                    <p style={{ margin: '0 0 8px', fontWeight: 500, color: '#475569', fontSize: 14 }}>
                        Esta nomina aun no ha sido procesada
                    </p>
                    <p style={{ margin: 0, fontSize: 13 }}>
                        Presiona el boton <strong>"Procesar Nomina"</strong> para calcular
                        los salarios de todos los empleados activos.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: empSel ? '1fr 340px' : '1fr', gap: 16 }}>
                    {/* Tabla */}
                    <div style={{ ...card, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        {['Codigo', 'Empleado', 'Departamento', 'Cargo', 'Dias', 'HE', 'Bruto', 'Deducciones', 'Neto', ''].map(h => (
                                            <th key={h} style={{
                                                padding: '10px 12px', textAlign: 'left',
                                                color: '#475569', fontWeight: 600,
                                                fontSize: 11, textTransform: 'uppercase',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {detalle.map((r, i) => (
                                        <tr
                                            key={r.id}
                                            onClick={() => verMovimientos(r)}
                                            style={{
                                                borderBottom: '1px solid #f1f5f9',
                                                background: empSel?.id === r.id ? '#eff6ff' : i % 2 === 0 ? '#fff' : '#fafafa',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <td style={{ padding: '10px 12px', color: '#1d4ed8', fontWeight: 500 }}>{r.codigo}</td>
                                            <td style={{ padding: '10px 12px', fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap' }}>{r.empleado}</td>
                                            <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{r.departamento}</td>
                                            <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{r.cargo}</td>
                                            <td style={{ padding: '10px 12px', color: '#475569' }}>{r.dias_trabajados}</td>
                                            <td style={{ padding: '10px 12px', color: '#475569' }}>{r.horas_extra}</td>
                                            <td style={{ padding: '10px 12px', color: '#0ea5e9', fontWeight: 500 }}>{fmt(r.total_ingresos)}</td>
                                            <td style={{ padding: '10px 12px', color: '#dc2626' }}>{fmt(r.total_deducciones)}</td>
                                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#10b981' }}>{fmt(r.salario_neto)}</td>
                                            <td style={{ padding: '10px 12px', color: '#1d4ed8', fontSize: 11 }}>Ver</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Panel movimientos */}
                    {empSel && (
                        <div style={{ ...card, padding: 18, alignSelf: 'start' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{empSel.empleado}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>{empSel.cargo}</p>
                                </div>
                                <button
                                    onClick={() => setEmpSel(null)}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18, lineHeight: 1 }}
                                >
                                    x
                                </button>
                            </div>

                            {movimientos.length === 0 ? (
                                <p style={{ color: '#94a3b8', fontSize: 13 }}>Sin movimientos registrados.</p>
                            ) : (
                                <>
                                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Ingresos
                                    </p>
                                    {movimientos.filter(m => m.tipo === 'ingreso').map(m => (
                                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                                            <span style={{ color: '#374151' }}>{m.descripcion || m.concepto}</span>
                                            <span style={{ color: '#15803d', fontWeight: 500 }}>{fmt(m.monto)}</span>
                                        </div>
                                    ))}

                                    <p style={{ margin: '12px 0 6px', fontSize: 11, fontWeight: 600, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        Deducciones
                                    </p>
                                    {movimientos.filter(m => m.tipo === 'deduccion').map(m => (
                                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                                            <span style={{ color: '#374151' }}>{m.descripcion || m.concepto}</span>
                                            <span style={{ color: '#b91c1c', fontWeight: 500 }}>- {fmt(m.monto)}</span>
                                        </div>
                                    ))}

                                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                        <span style={{ color: '#0f172a', fontSize: 13 }}>Salario neto</span>
                                        <span style={{ color: '#10b981', fontSize: 16 }}>{fmt(empSel.salario_neto)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}