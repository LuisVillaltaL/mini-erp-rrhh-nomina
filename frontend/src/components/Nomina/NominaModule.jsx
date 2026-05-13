import { useState } from 'react';
import NominaLista         from './NominaLista';
import NominaFormulario    from './NominaFormulario';
import NominaDetalle       from './NominaDetalle';
import Simulador           from './Simulador';
import MovimientosMasivos  from './MovimientosMasivos';

const TABS = [
    { key: 'lista',      label: 'Nominas'           },
    { key: 'movimientos',label: 'Horas Extra / Bonos'},
    { key: 'nueva',      label: 'Nueva Nomina'      },
    { key: 'simulador',  label: 'Simulador'         },
];

const tabBtn = (activo) => ({
    padding: '8px 20px',
    border: 'none',
    cursor: 'pointer',
    borderBottom: activo ? '2px solid #1d4ed8' : '2px solid transparent',
    color: activo ? '#1d4ed8' : '#64748b',
    fontWeight: activo ? 600 : 400,
    background: 'transparent',
    fontSize: 14,
    marginBottom: -1,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
});

export default function NominaModule() {
    const [tab,      setTab]      = useState('lista');
    const [nominaId, setNominaId] = useState(null);

    const verDetalle = (id) => { setNominaId(id); setTab('detalle'); };
    const volver     = ()   => { setNominaId(null); setTab('lista'); };

    return (
        <div>
            {/* Encabezado */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Nomina
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    Gestion de salarios, deducciones y procesamiento mensual
                </p>
            </div>

            {/* Tabs */}
            {tab !== 'detalle' && (
                <div style={{
                    display: 'flex', gap: 4,
                    borderBottom: '1px solid #e2e8f0',
                    marginBottom: 24,
                    overflowX: 'auto',
                }}>
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            style={tabBtn(tab === t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Contenido */}
            {tab === 'lista'       && <NominaLista        onVerDetalle={verDetalle} />}
            {tab === 'movimientos' && <MovimientosMasivos />}
            {tab === 'nueva'       && <NominaFormulario   onCreada={() => setTab('lista')} />}
            {tab === 'simulador'   && <Simulador />}
            {tab === 'detalle'     && <NominaDetalle      nominaId={nominaId} onVolver={volver} />}
        </div>
    );
}