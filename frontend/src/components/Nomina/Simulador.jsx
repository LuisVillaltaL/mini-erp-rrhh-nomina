// frontend/src/components/Nomina/Simulador.jsx
import { useState } from 'react';
import { nominaService } from '../../services/nominaService';

const fmt = (n) => `Q ${parseFloat(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;

const INPUT = ({ label, value, onChange, type = 'number', min = '0', step = '0.01' }) => (
  <div>
    <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      min={min} step={step}
      style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
  </div>
);

export default function Simulador() {
  const [form, setForm] = useState({
    salario_base: 7500,
    dias_trabajados: 30,
    horas_extra: 0,
    tipo_he: 'normal',
    bono_productividad: 0,
    descuento_prestamo: 0,
  });
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando]   = useState(false);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const simular = async () => {
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>
      {/* Formulario */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.25rem', fontSize: 16, fontWeight: 600, color: '#1e293b' }}>
          🧮 Calculadora de Nómina
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <INPUT label="Salario base (Q)" value={form.salario_base} onChange={set('salario_base')} />
          <INPUT label="Días trabajados" value={form.dias_trabajados} onChange={set('dias_trabajados')} step="1" min="0" />
          <INPUT label="Horas extra" value={form.horas_extra} onChange={set('horas_extra')} step="0.5" />

          <div>
            <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 500, color: '#374151' }}>Tipo de hora extra</label>
            <select value={form.tipo_he} onChange={e => set('tipo_he')(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
              <option value="normal">Normal (×1.5)</option>
              <option value="doble">Doble (×2.0)</option>
            </select>
          </div>

          <INPUT label="Bono de productividad (Q)" value={form.bono_productividad} onChange={set('bono_productividad')} />
          <INPUT label="Descuento préstamo (Q)" value={form.descuento_prestamo} onChange={set('descuento_prestamo')} />

          <button onClick={simular} disabled={cargando}
            style={{ marginTop: 6, padding: '11px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            {cargando ? 'Calculando...' : 'Calcular Nómina'}
          </button>
        </div>
      </div>

      {/* Resultado */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.25rem', fontSize: 16, fontWeight: 600, color: '#1e293b' }}>
          📊 Resultado
        </h3>

        {!resultado ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💡</div>
            <p style={{ margin: 0, fontSize: 14 }}>Ingresa los datos y presiona calcular</p>
          </div>
        ) : (
          <div>
            {/* Barra visual */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                <span>Salario bruto</span>
                <span>Deducciones: {porcentaje}%</span>
              </div>
              <div style={{ height: 12, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${100 - porcentaje}%`, background: '#10b981', borderRadius: 6, transition: 'width 0.5s' }} />
              </div>
            </div>

            {/* Ingresos */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>+ Ingresos</p>
              {[
                { label: 'Salario base',          val: resultado.salario_base },
                resultado.salario_proporcional !== resultado.salario_base && { label: 'Salario proporcional', val: resultado.salario_proporcional },
                resultado.horas_extra_monto > 0 && { label: 'Horas extra', val: resultado.horas_extra_monto },
                resultado.bono_productividad  > 0 && { label: 'Bono productividad', val: resultado.bono_productividad },
              ].filter(Boolean).map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <span style={{ color: '#374151' }}>{item.label}</span>
                  <span style={{ color: '#15803d', fontWeight: 500 }}>{fmt(item.val)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, fontWeight: 600 }}>
                <span>Total bruto</span>
                <span style={{ color: '#0ea5e9' }}>{fmt(resultado.salario_bruto)}</span>
              </div>
            </div>

            {/* Deducciones */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>− Deducciones</p>
              {[
                { label: 'IGSS Laboral (4.83%)', val: resultado.deducciones.igss },
                resultado.deducciones.isr > 0 && { label: 'ISR',  val: resultado.deducciones.isr },
                resultado.deducciones.descuento_prestamo > 0 && { label: 'Préstamo', val: resultado.deducciones.descuento_prestamo },
              ].filter(Boolean).map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <span style={{ color: '#374151' }}>{item.label}</span>
                  <span style={{ color: '#b91c1c', fontWeight: 500 }}>- {fmt(item.val)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, fontWeight: 600 }}>
                <span>Total deducciones</span>
                <span style={{ color: '#f43f5e' }}>- {fmt(resultado.deducciones.total)}</span>
              </div>
            </div>

            {/* Neto final */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#15803d', fontSize: 15 }}>💵 Salario Neto</span>
              <span style={{ fontWeight: 800, color: '#15803d', fontSize: 22 }}>{fmt(resultado.salario_neto)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
