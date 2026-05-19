import { useState, useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

const API = 'http://localhost:3001/api';

function token() { return localStorage.getItem('erp_token') || ''; }
function authFetch(url) {
    return fetch(`${API}${url}`, {
        headers: { Authorization: `Bearer ${token()}` }
    }).then(r => r.json());
}

const fmt = (n) =>
    `Q ${parseFloat(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;

const fmtK = (n) => {
    const v = parseFloat(n || 0);
    return v >= 1000 ? `Q ${(v / 1000).toFixed(1)}K` : `Q ${v.toFixed(0)}`;
};

// ── Paleta de colores ─────────────────────────────────────────
const COLORES = [
    '#1d4ed8','#0ea5e9','#10b981','#f59e0b',
    '#8b5cf6','#ef4444','#06b6d4','#84cc16',
];

const COLORES_ALPHA = COLORES.map(c => c + 'cc');

// ── Estilos ───────────────────────────────────────────────────
const card = {
    background: '#fff', border: '1px solid #e2e8f0',
    borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    padding: '20px 24px',
};

const kpiCard = (color, bg) => ({
    ...card,
    display: 'flex', alignItems: 'center', gap: 14,
});

// ── Opciones base de Chart.js ─────────────────────────────────
const optsBase = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Arial', size: 12 }, padding: 16 } },
        tooltip: { bodyFont: { family: 'Arial' }, titleFont: { family: 'Arial' } },
    },
};

const optsBarras = {
    ...optsBase,
    plugins: {
        ...optsBase.plugins,
        legend: { display: false },
    },
    scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Arial', size: 11 } } },
        y: {
            grid: { color: '#f1f5f9' },
            ticks: {
                font: { family: 'Arial', size: 11 },
                callback: (v) => fmtK(v),
            }
        }
    }
};

// ── Componente KPI card ───────────────────────────────────────
function KPI({ label, value, color, bg, sub }) {
    return (
        <div style={kpiCard(color, bg)}>
            <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: color }} />
            </div>
            <div>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
                    {value}
                </p>
                {sub && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>{sub}</p>}
            </div>
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────
export default function ReportesPage() {
    const [resumen,      setResumen]      = useState(null);
    const [historico,    setHistorico]    = useState([]);
    const [costoDep,     setCostoDep]     = useState([]);
    const [contratos,    setContratos]    = useState([]);
    const [headcount,    setHeadcount]    = useState([]);
    const [topSalarios,  setTopSalarios]  = useState([]);
    const [cargando,     setCargando]     = useState(true);
    const [error,        setError]        = useState('');

    useEffect(() => {
        Promise.all([
            authFetch('/reportes/resumen-general'),
            authFetch('/reportes/nomina-historico'),
            authFetch('/reportes/costo-departamento'),
            authFetch('/reportes/distribucion-contratos'),
            authFetch('/reportes/headcount-departamento'),
            authFetch('/reportes/top-salarios'),
        ]).then(([res, hist, cost, cont, head, top]) => {
            if (res.error)  { setError(res.error); setCargando(false); return; }
            setResumen(res);
            setHistorico(Array.isArray(hist) ? hist : []);
            setCostoDep(Array.isArray(cost) ? cost : []);
            setContratos(Array.isArray(cont) ? cont : []);
            setHeadcount(Array.isArray(head) ? head : []);
            setTopSalarios(Array.isArray(top) ? top : []);
            setCargando(false);
        }).catch(() => {
            setError('No se pudo conectar con el servidor');
            setCargando(false);
        });
    }, []);

    if (cargando) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8', fontSize: 14 }}>
            Cargando reportes...
        </div>
    );

    if (error) return (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '14px 18px', color: '#dc2626', fontSize: 13 }}>
            {error}
        </div>
    );

    // ── Datos para graficas ───────────────────────────────────

    // Historico de nomina (linea)
    const dataHistorico = {
        labels: historico.map(h => h.periodo + (h.tipo_periodo !== 'mensual' ? ` (${h.tipo_periodo})` : '')),
        datasets: [
            {
                label: 'Total bruto',
                data: historico.map(h => parseFloat(h.total_ingresos)),
                borderColor: '#1d4ed8', backgroundColor: '#1d4ed820',
                fill: true, tension: 0.4, pointRadius: 5,
            },
            {
                label: 'Total neto',
                data: historico.map(h => parseFloat(h.total_neto)),
                borderColor: '#10b981', backgroundColor: '#10b98120',
                fill: true, tension: 0.4, pointRadius: 5,
            },
            {
                label: 'Deducciones',
                data: historico.map(h => parseFloat(h.total_deducciones)),
                borderColor: '#ef4444', backgroundColor: '#ef444420',
                fill: true, tension: 0.4, pointRadius: 5,
            },
        ]
    };

    // Costo por departamento (barras horizontales)
    const dataCostoDep = {
        labels: costoDep.map(d => d.departamento),
        datasets: [{
            label: 'Total neto',
            data: costoDep.map(d => parseFloat(d.total_neto)),
            backgroundColor: COLORES_ALPHA,
            borderColor: COLORES,
            borderWidth: 1.5,
            borderRadius: 6,
        }]
    };

    // Distribucion de contratos (dona)
    const CONT_LABELS = {
        indefinido:   'Indefinido',
        temporal:     'Temporal',
        por_proyecto: 'Por proyecto',
    };
    const dataContratos = {
        labels: contratos.map(c => CONT_LABELS[c.tipo_contrato] || c.tipo_contrato),
        datasets: [{
            data: contratos.map(c => parseInt(c.cantidad)),
            backgroundColor: [COLORES[0] + 'dd', COLORES[2] + 'dd', COLORES[3] + 'dd'],
            borderColor: ['#fff','#fff','#fff'],
            borderWidth: 3,
        }]
    };

    // Headcount por departamento (barras apiladas)
    const dataHeadcount = {
        labels: headcount.map(d => d.departamento),
        datasets: [
            {
                label: 'Activos',
                data: headcount.map(d => parseInt(d.activos)),
                backgroundColor: '#10b98199',
                borderColor: '#10b981',
                borderWidth: 1.5, borderRadius: 4,
            },
            {
                label: 'Inactivos',
                data: headcount.map(d => parseInt(d.inactivos)),
                backgroundColor: '#ef444499',
                borderColor: '#ef4444',
                borderWidth: 1.5, borderRadius: 4,
            },
        ]
    };

    return (
        <div>
            {/* Encabezado */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Reportes
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    Analisis de datos de RRHH y Nomina
                    {resumen?.ultimo_periodo && ` — Ultimo periodo procesado: ${resumen.ultimo_periodo}`}
                </p>
            </div>

            {/* KPIs generales */}
            {resumen && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                    <KPI label="Empleados activos"  value={resumen.empleados_activos}  color="#1d4ed8" bg="#dbeafe" />
                    <KPI label="Departamentos"      value={resumen.departamentos}       color="#8b5cf6" bg="#ede9fe" />
                    <KPI label="Nominas procesadas" value={resumen.total_nominas}       color="#0ea5e9" bg="#e0f2fe" />
                    <KPI label="Gasto total acumulado" value={fmt(resumen.gasto_total)} color="#10b981" bg="#dcfce7" />
                </div>
            )}

            {/* Fila 1: Historico + Dona contratos */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={card}>
                    <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                        Evolucion de Nomina
                    </p>
                    <p style={{ margin: '-12px 0 12px', fontSize: 12, color: '#64748b' }}>
                        Bruto, neto y deducciones por periodo
                    </p>
                    {historico.length === 0 ? (
                        <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                            Sin nominas procesadas aun
                        </div>
                    ) : (
                        <div style={{ height: 260 }}>
                            <Line data={dataHistorico} options={{
                                ...optsBase,
                                scales: {
                                    x: { grid: { display: false }, ticks: { font: { family: 'Arial', size: 11 } } },
                                    y: { grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Arial', size: 11 }, callback: fmtK } }
                                }
                            }} />
                        </div>
                    )}
                </div>

                <div style={card}>
                    <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                        Distribucion por Contrato
                    </p>
                    <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b' }}>
                        Empleados activos segun tipo
                    </p>
                    {contratos.length === 0 ? (
                        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                            Sin datos
                        </div>
                    ) : (
                        <>
                            <div style={{ height: 200 }}>
                                <Doughnut data={dataContratos} options={{
                                    ...optsBase,
                                    cutout: '65%',
                                    plugins: { ...optsBase.plugins, legend: { position: 'bottom', labels: { font: { family: 'Arial', size: 11 }, padding: 10 } } }
                                }} />
                            </div>
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {contratos.map((c, i) => (
                                    <div key={c.tipo_contrato} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                        <span style={{ color: '#475569' }}>{CONT_LABELS[c.tipo_contrato] || c.tipo_contrato}</span>
                                        <strong style={{ color: COLORES[i] }}>{c.cantidad} empleados</strong>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Fila 2: Costo por depto + Headcount */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={card}>
                    <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                        Costo de Nomina por Departamento
                    </p>
                    <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b' }}>
                        Total acumulado de salarios netos
                    </p>
                    {costoDep.every(d => parseFloat(d.total_neto) === 0) ? (
                        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                            Sin nominas procesadas aun
                        </div>
                    ) : (
                        <div style={{ height: 240 }}>
                            <Bar data={dataCostoDep} options={optsBarras} />
                        </div>
                    )}
                </div>

                <div style={card}>
                    <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                        Headcount por Departamento
                    </p>
                    <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b' }}>
                        Empleados activos e inactivos
                    </p>
                    {headcount.length === 0 ? (
                        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                            Sin datos
                        </div>
                    ) : (
                        <div style={{ height: 240 }}>
                            <Bar data={dataHeadcount} options={{
                                ...optsBarras,
                                plugins: { ...optsBarras.plugins, legend: { display: true, position: 'bottom', labels: { font: { family: 'Arial', size: 11 }, padding: 12 } } },
                                scales: {
                                    ...optsBarras.scales,
                                    x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Arial', size: 11 } } },
                                    y: { stacked: true, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Arial', size: 11 }, stepSize: 1 } }
                                }
                            }} />
                        </div>
                    )}
                </div>
            </div>

            {/* Fila 3: Tabla top salarios */}
            <div style={card}>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                    Top 10 — Salarios Netos
                </p>
                <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b' }}>
                    Empleados con mayor salario en la ultima nomina procesada
                </p>

                {topSalarios.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                        Sin nominas procesadas aun
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    {['#', 'Codigo', 'Empleado', 'Departamento', 'Cargo', 'Bruto', 'Deducciones', 'Neto'].map(h => (
                                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {topSalarios.map((emp, i) => (
                                    <tr key={emp.codigo} style={{ borderBottom: '1px solid #f1f5f9', background: i === 0 ? '#fefce8' : i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <td style={{ padding: '10px 12px', fontWeight: 700, color: i < 3 ? '#f59e0b' : '#94a3b8' }}>
                                            {i + 1}
                                        </td>
                                        <td style={{ padding: '10px 12px', color: '#1d4ed8', fontWeight: 500, fontFamily: 'monospace' }}>
                                            {emp.codigo}
                                        </td>
                                        <td style={{ padding: '10px 12px', fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap' }}>
                                            {emp.empleado}
                                        </td>
                                        <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                            {emp.departamento}
                                        </td>
                                        <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                            {emp.cargo}
                                        </td>
                                        <td style={{ padding: '10px 12px', color: '#0ea5e9', fontWeight: 500 }}>
                                            {fmt(emp.total_ingresos)}
                                        </td>
                                        <td style={{ padding: '10px 12px', color: '#ef4444' }}>
                                            {fmt(emp.total_deducciones)}
                                        </td>
                                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#10b981' }}>
                                            {fmt(emp.salario_neto)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* Totales */}
                            <tfoot>
                                <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                                    <td colSpan={5} style={{ padding: '10px 12px', fontWeight: 700, color: '#374151', fontSize: 12 }}>
                                        TOTALES (top {topSalarios.length})
                                    </td>
                                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0ea5e9' }}>
                                        {fmt(topSalarios.reduce((s, e) => s + parseFloat(e.total_ingresos || 0), 0))}
                                    </td>
                                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#ef4444' }}>
                                        {fmt(topSalarios.reduce((s, e) => s + parseFloat(e.total_deducciones || 0), 0))}
                                    </td>
                                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#10b981' }}>
                                        {fmt(topSalarios.reduce((s, e) => s + parseFloat(e.salario_neto || 0), 0))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Fila 4: Tabla headcount detallada */}
            <div style={{ ...card, marginTop: 16 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                    Resumen de Plantilla por Departamento
                </p>
                <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b' }}>
                    Detalle de empleados y salario promedio por area
                </p>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                {['Departamento', 'Activos', 'Inactivos', 'Total', 'Salario promedio'].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {headcount.map((d, i) => (
                                <tr key={d.departamento} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <td style={{ padding: '10px 14px', fontWeight: 500, color: '#0f172a' }}>{d.departamento}</td>
                                    <td style={{ padding: '10px 14px' }}>
                                        <span style={{ padding: '2px 10px', borderRadius: 20, background: '#dcfce7', color: '#15803d', fontWeight: 600, fontSize: 12 }}>
                                            {d.activos}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                        <span style={{ padding: '2px 10px', borderRadius: 20, background: '#fee2e2', color: '#b91c1c', fontWeight: 600, fontSize: 12 }}>
                                            {d.inactivos}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#374151' }}>{d.total}</td>
                                    <td style={{ padding: '10px 14px', color: '#0ea5e9', fontWeight: 500 }}>
                                        {d.salario_promedio ? fmt(d.salario_promedio) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}