// frontend/src/components/Nomina/NominaModule.jsx
import { useState } from 'react';
import NominaLista      from './NominaLista';
import NominaFormulario from './NominaFormulario';
import NominaDetalle    from './NominaDetalle';
import Simulador        from './Simulador';

const TABS = [
  { key: 'lista',     label: 'Nóminas',    },
  { key: 'nueva',     label: 'Nueva Nómina' },
  { key: 'simulador', label: 'Simulador'   },
];

export default function NominaModule() {
  const [tab, setTab]         = useState('lista');
  const [nominaId, setNominaId] = useState(null);

  const verDetalle = (id) => {
    setNominaId(id);
    setTab('detalle');
  };

  const volver = () => {
    setNominaId(null);
    setTab('lista');
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#1e293b' }}>
          Módulo de Nómina
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
          Gestión de salarios, deducciones y procesamiento mensual
        </p>
      </div>

      {/* Tabs */}
      {tab !== 'detalle' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '8px 18px', border: 'none', cursor: 'pointer',
                borderBottom: tab === t.key ? '2px solid #6366f1' : '2px solid transparent',
                color: tab === t.key ? '#6366f1' : '#64748b',
                fontWeight: tab === t.key ? 600 : 400,
                background: 'transparent', fontSize: 14, marginBottom: -1,
              }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Contenido */}
      {tab === 'lista'     && <NominaLista     onVerDetalle={verDetalle} />}
      {tab === 'nueva'     && <NominaFormulario onCreada={() => setTab('lista')} />}
      {tab === 'simulador' && <Simulador />}
      {tab === 'detalle'   && <NominaDetalle nominaId={nominaId} onVolver={volver} />}
    </div>
  );
}
