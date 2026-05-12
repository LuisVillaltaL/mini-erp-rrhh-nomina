// frontend/src/pages/PlaceholderPage.jsx
// Paginas temporales para modulos aun no desarrollados.
// RRHHPage fue removida — ya existe en pages/RRHHPage.jsx

export function NominaPage() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Nomina</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Calculo de salarios, deducciones y pagos</p>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 40, textAlign: 'center', color: '#94a3b8' }}>
        <p>Modulo Nomina — en construccion</p>
      </div>
    </div>
  )
}

export function ReportesPage() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Reportes</h1>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 40, textAlign: 'center', color: '#94a3b8' }}>
        <p>Modulo Reportes — proximo</p>
      </div>
    </div>
  )
}

export function ConfiguracionPage() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Configuracion</h1>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 40, textAlign: 'center', color: '#94a3b8' }}>
        <p>Configuracion del sistema</p>
      </div>
    </div>
  )
}