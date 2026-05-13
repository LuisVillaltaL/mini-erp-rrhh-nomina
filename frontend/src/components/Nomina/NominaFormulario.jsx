import { useState } from 'react';
import { nominaService } from '../../services/nominaService';

const card = {
    background: '#fff', border: '1px solid #e2e8f0',
    borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    padding: '28px 32px',
};
const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none',
    boxSizing: 'border-box', background: '#fff',
};
const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 500,
    color: '#374151', marginBottom: 5,
};

const TIPOS = [
    { value: 'mensual',      label: 'Mensual completo (30 dias)'   },
    { value: 'quincenal_1',  label: 'Primera quincena (1 al 15)'   },
    { value: 'quincenal_2',  label: 'Segunda quincena (16 al fin)'  },
    { value: 'personalizado',label: 'Periodo personalizado'         },
];

export default function NominaFormulario({ onCreada }) {
    const hoy    = new Date();
    const anio   = hoy.getFullYear();
    const mes    = String(hoy.getMonth() + 1).padStart(2, '0');
    const periodo = `${anio}-${mes}`;

    // Fechas del mes actual
    const primerDia  = `${anio}-${mes}-01`;
    const ultimoDia  = new Date(anio, hoy.getMonth() + 1, 0)
        .toISOString().slice(0, 10);
    const dia15      = `${anio}-${mes}-15`;
    const dia16      = `${anio}-${mes}-16`;

    const [tipoPeriodo, setTipoPeriodo] = useState('mensual');
    const [form, setForm] = useState({
        periodo,
        fecha_inicio: primerDia,
        fecha_fin:    ultimoDia,
    });
    const [error,     setError]     = useState('');
    const [guardando, setGuardando] = useState(false);

    // Al cambiar tipo, ajustar fechas automaticamente
    const handleTipo = (tipo) => {
        setTipoPeriodo(tipo);
        const p = form.periodo || periodo;
        const [y, m] = p.split('-');
        const ultimo = new Date(parseInt(y), parseInt(m), 0)
            .toISOString().slice(0, 10);
        const d15  = `${y}-${m}-15`;
        const d16  = `${y}-${m}-16`;
        const d01  = `${y}-${m}-01`;

        if (tipo === 'mensual')      setForm(f => ({ ...f, fecha_inicio: d01,  fecha_fin: ultimo }));
        if (tipo === 'quincenal_1')  setForm(f => ({ ...f, fecha_inicio: d01,  fecha_fin: d15    }));
        if (tipo === 'quincenal_2')  setForm(f => ({ ...f, fecha_inicio: d16,  fecha_fin: ultimo }));
        // personalizado: el usuario elige las fechas
    };

    // Al cambiar el periodo (mes), recalcular fechas segun tipo
    const handlePeriodo = (valor) => {
        const [y, m] = valor.split('-');
        if (!y || !m) { setForm(f => ({ ...f, periodo: valor })); return; }
        const ultimo = new Date(parseInt(y), parseInt(m), 0).toISOString().slice(0, 10);
        const d01    = `${y}-${m}-01`;
        const d15    = `${y}-${m}-15`;
        const d16    = `${y}-${m}-16`;

        let fi = d01, ff = ultimo;
        if (tipoPeriodo === 'quincenal_1') { fi = d01; ff = d15; }
        if (tipoPeriodo === 'quincenal_2') { fi = d16; ff = ultimo; }

        setForm({ periodo: valor, fecha_inicio: fi, fecha_fin: ff });
    };

    // Calcular dias del periodo seleccionado
    const diasPeriodo = (() => {
        if (!form.fecha_inicio || !form.fecha_fin) return 0;
        const ini = new Date(form.fecha_inicio);
        const fin = new Date(form.fecha_fin);
        return Math.round((fin - ini) / (1000 * 60 * 60 * 24)) + 1;
    })();

    const handleSubmit = async () => {
        if (!form.periodo || !form.fecha_inicio || !form.fecha_fin) {
            setError('Todos los campos son requeridos'); return;
        }
        setGuardando(true); setError('');
        const res = await nominaService.crear({ ...form, tipo_periodo: tipoPeriodo });
        setGuardando(false);
        if (res.error) { setError(res.error); return; }
        onCreada();
    };

    return (
        <div style={{ maxWidth: 560 }}>
            <div style={card}>
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                        Nueva Nomina
                    </h2>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        Define el tipo y el periodo de la nomina
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Tipo de periodo */}
                    <div>
                        <label style={labelStyle}>Tipo de periodo</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {TIPOS.map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => handleTipo(t.value)}
                                    type="button"
                                    style={{
                                        padding: '10px 12px',
                                        background: tipoPeriodo === t.value ? '#eff6ff' : '#f8fafc',
                                        border: `1.5px solid ${tipoPeriodo === t.value ? '#1d4ed8' : '#e2e8f0'}`,
                                        borderRadius: 8, cursor: 'pointer',
                                        fontSize: 12, fontWeight: tipoPeriodo === t.value ? 600 : 400,
                                        color: tipoPeriodo === t.value ? '#1d4ed8' : '#475569',
                                        textAlign: 'left',
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mes / Periodo */}
                    <div>
                        <label style={labelStyle}>Mes del periodo</label>
                        <input
                            type="month"
                            value={form.periodo}
                            onChange={e => handlePeriodo(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    {/* Fechas — editables solo en modo personalizado */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Fecha inicio</label>
                            <input
                                type="date"
                                value={form.fecha_inicio}
                                onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                                disabled={tipoPeriodo !== 'personalizado'}
                                style={{ ...inputStyle, background: tipoPeriodo !== 'personalizado' ? '#f8fafc' : '#fff', color: '#475569' }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Fecha fin</label>
                            <input
                                type="date"
                                value={form.fecha_fin}
                                onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))}
                                disabled={tipoPeriodo !== 'personalizado'}
                                style={{ ...inputStyle, background: tipoPeriodo !== 'personalizado' ? '#f8fafc' : '#fff', color: '#475569' }}
                            />
                        </div>
                    </div>

                    {/* Resumen del periodo */}
                    {diasPeriodo > 0 && (
                        <div style={{
                            background: '#f0fdf4', border: '1px solid #bbf7d0',
                            borderRadius: 8, padding: '10px 14px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <span style={{ fontSize: 13, color: '#15803d' }}>
                                Dias del periodo
                            </span>
                            <strong style={{ fontSize: 16, color: '#15803d' }}>
                                {diasPeriodo} dias
                            </strong>
                        </div>
                    )}

                    {/* Info */}
                    <div style={{
                        background: '#f0f9ff', border: '1px solid #bae6fd',
                        borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#0369a1',
                    }}>
                        El salario se calculara proporcionalmente a los <strong>{diasPeriodo} dias</strong> del periodo.
                        Podras crear una segunda nomina del mismo mes eligiendo un tipo diferente.
                    </div>

                    {error && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626',
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                        <button
                            onClick={handleSubmit}
                            disabled={guardando}
                            style={{
                                padding: '9px 24px',
                                background: guardando ? '#93c5fd' : '#1d4ed8',
                                color: '#fff', border: 'none', borderRadius: 8,
                                cursor: guardando ? 'not-allowed' : 'pointer',
                                fontWeight: 600, fontSize: 13,
                            }}
                        >
                            {guardando ? 'Creando...' : 'Crear Nomina'}
                        </button>
                        <button
                            onClick={onCreada}
                            style={{
                                padding: '9px 20px', background: '#f8fafc',
                                border: '1px solid #e2e8f0', borderRadius: 8,
                                cursor: 'pointer', fontSize: 13, color: '#475569',
                            }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}