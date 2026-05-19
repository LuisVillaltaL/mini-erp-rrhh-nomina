// frontend/src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react'
import { Users, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import {
    Chart as ChartJS, CategoryScale, LinearScale,
    BarElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { useAuth } from '../context/AuthContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const fmt    = (n) => `Q ${parseFloat(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 0 })}`
const fmtK   = (n) => { const v = parseFloat(n||0); return v >= 1000 ? `Q${(v/1000).toFixed(1)}K` : `Q${v.toFixed(0)}` }

const KPI_CONFIG = [
    { key: 'total_empleados', label: 'Total empleados',    icon: Users,          color: '#1d4ed8', bg: '#dbeafe', format: v => v ?? '—' },
    { key: 'nomina_mes',      label: 'Nomina del mes',     icon: DollarSign,     color: '#059669', bg: '#d1fae5', format: v => fmt(v)    },
    { key: 'tasa_asistencia', label: 'Asistencia mensual', icon: TrendingUp,     color: '#7c3aed', bg: '#ede9fe', format: v => `${v||0}%`},
    { key: 'dptos_riesgo',    label: 'Dptos. en riesgo',   icon: AlertTriangle,  color: '#dc2626', bg: '#fee2e2', format: v => v ?? '—'  },
]

const COLORES = ['#1d4ed8','#0ea5e9','#10b981','#f59e0b','#8b5cf6']

function KpiCard({ config, value, loading }) {
    const Icon = config.icon
    return (
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'20px 24px', boxShadow:'0 1px 3px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:config.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={22} color={config.color} />
            </div>
            <div>
                <p style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>{config.label}</p>
                <p style={{ fontSize:24, fontWeight:700, color:'#0f172a', lineHeight:1 }}>
                    {loading ? '...' : config.format(value)}
                </p>
            </div>
        </div>
    )
}

const card = { background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'20px 24px', boxShadow:'0 1px 3px rgba(0,0,0,0.07)' }

export default function DashboardPage() {
    const { authFetch } = useAuth()

    const [kpis,       setKpis]       = useState({})
    const [costoDep,   setCostoDep]   = useState([])
    const [contratos,  setContratos]  = useState([])
    const [loading,    setLoading]    = useState(true)
    const [error,      setError]      = useState(null)

    useEffect(() => {
        Promise.all([
            authFetch(`${API}/dashboard/kpis`).then(r => r.json()),
            authFetch(`${API}/reportes/costo-departamento`).then(r => r.json()),
            authFetch(`${API}/reportes/distribucion-contratos`).then(r => r.json()),
        ]).then(([k, c, ct]) => {
            if (k.error) throw new Error(k.error)
            setKpis(k)
            setCostoDep(Array.isArray(c) ? c : [])
            setContratos(Array.isArray(ct) ? ct : [])
        }).catch(err => setError(err.message))
          .finally(() => setLoading(false))
    }, [])

    // Datos Chart.js
    const dataCosto = {
        labels: costoDep.map(d => d.departamento),
        datasets: [{
            label: 'Neto acumulado',
            data: costoDep.map(d => parseFloat(d.total_neto)),
            backgroundColor: COLORES.map(c => c + 'cc'),
            borderColor: COLORES,
            borderWidth: 1.5, borderRadius: 6,
        }]
    }

    const CONT_LABEL = { indefinido:'Indefinido', temporal:'Temporal', por_proyecto:'Por proyecto' }
    const dataContratos = {
        labels: contratos.map(c => CONT_LABEL[c.tipo_contrato] || c.tipo_contrato),
        datasets: [{
            data: contratos.map(c => parseInt(c.cantidad)),
            backgroundColor: ['#1d4ed8dd','#10b981dd','#f59e0bdd'],
            borderColor: ['#fff','#fff','#fff'],
            borderWidth: 3,
        }]
    }

    const optsBase = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { bodyFont: { family:'Arial' }, titleFont: { family:'Arial' } } },
    }

    return (
        <div>
            {/* Encabezado */}
            <div style={{ marginBottom:24 }}>
                <h1 style={{ fontSize:20, fontWeight:700, color:'#0f172a', margin:0 }}>Dashboard ejecutivo</h1>
                <p style={{ color:'#64748b', marginTop:4, fontSize:13 }}>Productividad del talento — vision general</p>
            </div>

            {error && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#dc2626' }}>
                    {error} — Verifica que el backend este corriendo.
                </div>
            )}

            {/* KPIs */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16, marginBottom:24 }}>
                {KPI_CONFIG.map(cfg => (
                    <KpiCard key={cfg.key} config={cfg} value={kpis[cfg.key]} loading={loading} />
                ))}
            </div>

            {/* Graficas */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
                {/* Costo por departamento */}
                <div style={card}>
                    <p style={{ margin:'0 0 4px', fontWeight:600, fontSize:14, color:'#0f172a' }}>Costo de Nomina por Departamento</p>
                    <p style={{ margin:'0 0 16px', fontSize:12, color:'#64748b' }}>Total de salarios netos acumulados por area</p>
                    {loading ? (
                        <div style={{ height:240, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:13 }}>Cargando...</div>
                    ) : costoDep.every(d => parseFloat(d.total_neto) === 0) ? (
                        <div style={{ height:240, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:13 }}>Sin nominas procesadas aun</div>
                    ) : (
                        <div style={{ height:240 }}>
                            <Bar data={dataCosto} options={{
                                ...optsBase,
                                scales: {
                                    x: { grid:{ display:false }, ticks:{ font:{ family:'Arial', size:11 } } },
                                    y: { grid:{ color:'#f1f5f9' }, ticks:{ font:{ family:'Arial', size:11 }, callback: fmtK } }
                                }
                            }} />
                        </div>
                    )}
                </div>

                {/* Distribucion contratos */}
                <div style={card}>
                    <p style={{ margin:'0 0 4px', fontWeight:600, fontSize:14, color:'#0f172a' }}>Distribucion por Contrato</p>
                    <p style={{ margin:'0 0 12px', fontSize:12, color:'#64748b' }}>Empleados activos segun tipo de contrato</p>
                    {loading ? (
                        <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:13 }}>Cargando...</div>
                    ) : contratos.length === 0 ? (
                        <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:13 }}>Sin datos de empleados</div>
                    ) : (
                        <>
                            <div style={{ height:190 }}>
                                <Doughnut data={dataContratos} options={{
                                    ...optsBase, cutout:'65%',
                                    plugins: { ...optsBase.plugins, legend:{ display:true, position:'bottom', labels:{ font:{ family:'Arial', size:11 }, padding:10 } } }
                                }} />
                            </div>
                            <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:4 }}>
                                {contratos.map((c, i) => (
                                    <div key={c.tipo_contrato} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                                        <span style={{ color:'#475569' }}>{CONT_LABEL[c.tipo_contrato] || c.tipo_contrato}</span>
                                        <strong style={{ color:['#1d4ed8','#10b981','#f59e0b'][i] }}>{c.cantidad}</strong>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}