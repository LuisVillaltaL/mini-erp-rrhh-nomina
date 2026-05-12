// frontend/src/components/Nomina/NominaDetalle.jsx
import { useState, useEffect } from 'react';
import { nominaService } from '../../services/nominaService';

const fmt = (n) => `Q ${parseFloat(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;

export default function NominaDetalle({ nominaId, onVolver }) {
  const [detalle, setDetalle]         = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [empSel, setEmpSel]           = useState(null);
  const [cargando, setCargando]       = useState(true);

  useEffect(() => {
    nominaService.detalle(nominaId).then(data => {
      setDetalle(Array.isArray(data) ? data : []);
      setCargando(false);
    });
  }, [nominaId]);

  const verMovimientos = async (emp) => {
    setEmpSel(emp);
    const data = await nominaService.movimientos(nominaId, emp.empleado_id);
    setMovimientos(Array.isArray(data) ? data : []);
  };

  // Totales
  const totalBruto  = detalle.reduce((s, r) => s + parseFloat(r.total_ingresos || 0), 0);
  const totalDeduc  = detalle.reduce((s, r) => s + parseFloat(r.total_deducciones || 0), 0);
  const totalNeto   = detalle.reduce((s, r) => s + parseFloat(r.salario_neto || 0), 0);

  if (cargando) return <p style={{ color: '#64748b' }}>Cargando detalle...</p>;

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onVolver}
          style={{ padding: '7px 14px', background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 14 }}>
          ← Volver
        </button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1e293b' }}>
          Detalle de Nómina
        </h2>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total empleados', val: detalle.length, color: '#6366f1' },
          { label: 'Total bruto',     val: fmt(totalBruto),  color: '#0ea5e9' },
          { label: 'Total deducciones', val: fmt(totalDeduc), color: '#f43f5e' },
          { label: 'Total neto',      val: fmt(totalNeto),  color: '#10b981' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{k.label}</p>
            <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: empSel ? '1fr 340px' : '1fr', gap: 16 }}>
        {/* Tabla */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['Código','Empleado','Departamento','Cargo','Días','HE','Bruto','Deducciones','Neto',''].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detalle.map((r, i) => (
                <tr key={r.id}
                  style={{ borderBottom: '1px solid #f1f5f9', background: empSel?.id === r.id ? '#eff6ff' : i % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer' }}
                  onClick={() => verMovimientos(r)}>
                  <td style={{ padding: '10px 12px', color: '#6366f1', fontWeight: 500 }}>{r.codigo}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 500, color: '#1e293b', whiteSpace: 'nowrap' }}>{r.empleado}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{r.departamento}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{r.cargo}</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>{r.dias_trabajados}</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>{r.horas_extra}</td>
                  <td style={{ padding: '10px 12px', color: '#0ea5e9', fontWeight: 500 }}>{fmt(r.total_ingresos)}</td>
                  <td style={{ padding: '10px 12px', color: '#f43f5e' }}>{fmt(r.total_deducciones)}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#10b981' }}>{fmt(r.salario_neto)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 11, color: '#6366f1' }}>Ver →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Panel de movimientos */}
        {empSel && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                {empSel.empleado}
              </h3>
              <button onClick={() => setEmpSel(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>×</button>
            </div>

            {movimientos.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>Sin movimientos registrados.</p>
            ) : (
              <>
                {/* Ingresos */}
                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ingresos</p>
                {movimientos.filter(m => m.tipo === 'ingreso').map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                    <span style={{ color: '#374151' }}>{m.descripcion || m.concepto}</span>
                    <span style={{ color: '#15803d', fontWeight: 500 }}>{fmt(m.monto)}</span>
                  </div>
                ))}

                {/* Deducciones */}
                <p style={{ margin: '12px 0 6px', fontSize: 12, fontWeight: 600, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deducciones</p>
                {movimientos.filter(m => m.tipo === 'deduccion').map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                    <span style={{ color: '#374151' }}>{m.descripcion || m.concepto}</span>
                    <span style={{ color: '#b91c1c', fontWeight: 500 }}>- {fmt(m.monto)}</span>
                  </div>
                ))}

                {/* Total neto */}
                <div style={{ marginTop: 12, padding: '10px 0 0', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span style={{ color: '#1e293b' }}>Salario neto</span>
                  <span style={{ color: '#10b981', fontSize: 16 }}>{fmt(empSel.salario_neto)}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
