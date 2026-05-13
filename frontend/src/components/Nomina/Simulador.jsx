// frontend/src/components/Nomina/Simulador.jsx
import { useState } from 'react';
import { nominaService } from '../../services/nominaService';

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

const fmt = (n) =>
    `Q ${parseFloat(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;

function Campo({ label, value, onChange, type = 'number', min = '0', step = '0.01', children }) {
    return (
        <div>
            <label style={labelStyle}>{label}</label>
            {children || (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    min={min}
                    step={step}
                    style={inputStyle}
                />
            )}
        </div>
    );
}

export default function Simulador() {
    const [form, setForm] = useState({
        salario_base:       7500,
        dias_trabajados:    30,
        horas_extra:        0,
        tipo_he:            'normal',
        bono_productividad: 0,
        descuento_prestamo: 0,
    });
    const [resultado, setResultado] = useState(null);
    const [cargando,  setCargando]  = useState(false);

    const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

    const calcular = async () => {
        setCargando(true);
        const res = await nominaService.simular(form);
        setCargando(false);
        if (res.error) { alert('Error: ' + res.error); return; }
        setResultado(res);
    };

    const porcentaje = resultado
        ? Math.round((resultado.deducciones.total / resultado.salario_bruto) * 100)
        : 0;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900 }}>

            {/* Formulario */}
            <div style={card}>
                <div style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                        Calculadora de Nomina
                    </h2>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        Simula el calculo sin afectar datos reales
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Campo label="Salario base (Q)" value={form.salario_base} onChange={set('salario_base')} />
                    <Campo label="Dias trabajados" value={form.dias_trabajados} onChange={set('dias_trabajados')} step="1" min="0" />
                    <Campo label="Horas extra" value={form.horas_extra} onChange={set('horas_extra')} step="0.5" />

                    <Campo label="Tipo de hora extra">
                        <select
                            value={form.tipo_he}
                            onChange={(e) => set('tipo_he')(e.target.value)}
                            style={{ ...inputStyle, appearance: 'none' }}
                        >
                            <option value="normal">Normal (x1.5)</option>
                            <option value="doble">Doble (x2.0)</option>
                        </select>
                    </Campo>

                    <Campo label="Bono de productividad (Q)" value={form.bono_productividad} onChange={set('bono_productividad')} />
                    <Campo label="Descuento prestamo (Q)"    value={form.descuento_prestamo} onChange={set('descuento_prestamo')} />

                    <button
                        onClick={calcular}
                        disabled={cargando}
                        style={{
                            marginTop: 4,
                            padding: '10px',
                            background: cargando ? '#93c5fd' : '#1d4ed8',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            cursor: cargando ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: 13,
                        }}
                    >
                        {cargando ? 'Calculando...' : 'Calcular Nomina'}
                    </button>
                </div>
            </div>

            {/* Resultado */}
            <div style={card}>
                <div style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                        Resultado
                    </h2>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        Desglose detallado del calculo
                    </p>
                </div>

                {!resultado ? (
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        height: 260, color: '#94a3b8',
                    }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: '#f1f5f9',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, marginBottom: 12,
                        }}>
                            Q
                        </div>
                        <p style={{ fontSize: 13, margin: 0 }}>
                            Ingresa los datos y presiona calcular
                        </p>
                    </div>
                ) : (
                    <div>
                        {/* Barra visual */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                fontSize: 11, color: '#64748b', marginBottom: 5,
                                fontWeight: 500,
                            }}>
                                <span>Salario neto</span>
                                <span>Deducciones: {porcentaje}%</span>
                            </div>
                            <div style={{
                                height: 8, background: '#f1f5f9',
                                borderRadius: 6, overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${100 - porcentaje}%`,
                                    background: '#10b981',
                                    borderRadius: 6,
                                    transition: 'width 0.4s ease',
                                }} />
                            </div>
                        </div>

                        {/* Ingresos */}
                        <p style={{
                            fontSize: 11, fontWeight: 600, color: '#15803d',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            margin: '0 0 6px',
                        }}>
                            Ingresos
                        </p>
                        {[
                            { label: 'Salario base', val: resultado.salario_base },
                            resultado.salario_proporcional !== resultado.salario_base && {
                                label: 'Salario proporcional', val: resultado.salario_proporcional,
                            },
                            resultado.horas_extra_monto > 0 && {
                                label: 'Horas extra', val: resultado.horas_extra_monto,
                            },
                            resultado.bono_productividad > 0 && {
                                label: 'Bono productividad', val: resultado.bono_productividad,
                            },
                        ].filter(Boolean).map(item => (
                            <div key={item.label} style={{
                                display: 'flex', justifyContent: 'space-between',
                                padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13,
                            }}>
                                <span style={{ color: '#374151' }}>{item.label}</span>
                                <span style={{ color: '#15803d', fontWeight: 500 }}>{fmt(item.val)}</span>
                            </div>
                        ))}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            padding: '7px 0', fontSize: 13, fontWeight: 600,
                        }}>
                            <span>Total bruto</span>
                            <span style={{ color: '#0ea5e9' }}>{fmt(resultado.salario_bruto)}</span>
                        </div>

                        {/* Deducciones */}
                        <p style={{
                            fontSize: 11, fontWeight: 600, color: '#b91c1c',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            margin: '12px 0 6px',
                        }}>
                            Deducciones
                        </p>
                        {[
                            { label: 'IGSS Laboral (4.83%)', val: resultado.deducciones.igss },
                            resultado.deducciones.isr > 0 && {
                                label: 'Retencion ISR', val: resultado.deducciones.isr,
                            },
                            resultado.deducciones.descuento_prestamo > 0 && {
                                label: 'Descuento prestamo', val: resultado.deducciones.descuento_prestamo,
                            },
                        ].filter(Boolean).map(item => (
                            <div key={item.label} style={{
                                display: 'flex', justifyContent: 'space-between',
                                padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13,
                            }}>
                                <span style={{ color: '#374151' }}>{item.label}</span>
                                <span style={{ color: '#b91c1c', fontWeight: 500 }}>- {fmt(item.val)}</span>
                            </div>
                        ))}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            padding: '7px 0', fontSize: 13, fontWeight: 600,
                        }}>
                            <span>Total deducciones</span>
                            <span style={{ color: '#dc2626' }}>- {fmt(resultado.deducciones.total)}</span>
                        </div>

                        {/* Neto */}
                        <div style={{
                            marginTop: 14,
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 10,
                            padding: '14px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <span style={{ fontWeight: 600, color: '#15803d', fontSize: 14 }}>
                                Salario Neto
                            </span>
                            <span style={{ fontWeight: 800, color: '#15803d', fontSize: 22 }}>
                                {fmt(resultado.salario_neto)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}