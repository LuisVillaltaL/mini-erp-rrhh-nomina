// frontend/src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react'
import { Users, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const KPI_CONFIG = [
  {
    key: 'total_empleados',
    label: 'Total empleados',
    icon: Users,
    color: '#1d4ed8',
    bg: '#dbeafe',
    suffix: '',
    format: v => v,
  },
  {
    key: 'nomina_mes',
    label: 'Nómina del mes',
    icon: DollarSign,
    color: '#059669',
    bg: '#d1fae5',
    suffix: '',
    format: v => `Q ${parseFloat(v || 0).toLocaleString('es-GT', { minimumFractionDigits: 0 })}`,
  },
  {
    key: 'tasa_asistencia',
    label: 'Asistencia mensual',
    icon: TrendingUp,
    color: '#7c3aed',
    bg: '#ede9fe',
    suffix: '%',
    format: v => `${v || 0}%`,
  },
  {
    key: 'dptos_riesgo',
    label: 'Dptos. en riesgo',
    icon: AlertTriangle,
    color: '#dc2626',
    bg: '#fee2e2',
    suffix: '',
    format: v => v,
  },
]

function KpiCard({ config, value, loading }) {
  const Icon = config.icon
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: 12,
      padding: '20px 24px',
      boxShadow: 'var(--card-shadow)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: config.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} color={config.color} />
      </div>
      <div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{config.label}</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
          {loading ? '—' : config.format(value)}
        </p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [kpis, setKpis]       = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/dashboard/kpis`)
      .then(r => r.json())
      .then(data => { setKpis(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Encabezado */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
          Dashboard ejecutivo
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 13 }}>
          Productividad del talento — visión general
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {KPI_CONFIG.map(cfg => (
          <KpiCard key={cfg.key} config={cfg} value={kpis[cfg.key]} loading={loading} />
        ))}
      </div>

      {/* Placeholder para gráficas (Fase 4) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 16,
      }}>
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: 12, padding: 24, boxShadow: 'var(--card-shadow)',
          minHeight: 260,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>📊 Gráfica: Costo nómina por departamento</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Disponible en Fase 4</p>
        </div>
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: 12, padding: 24, boxShadow: 'var(--card-shadow)',
          minHeight: 260,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>🍩 Distribución por contrato</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Disponible en Fase 4</p>
        </div>
      </div>
    </div>
  )
}
