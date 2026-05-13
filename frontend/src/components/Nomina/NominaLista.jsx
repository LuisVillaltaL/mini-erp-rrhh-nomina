// frontend/src/components/Nomina/NominaLista.jsx
import { useState, useEffect } from 'react';
import { nominaService } from '../../services/nominaService';

const fmt = (n) => {
    const num = parseFloat(n);
    if (isNaN(num)) return 'Q 0.00';
    return `Q ${num.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
};

const ESTADO_STYLE = {
    borrador:  { bg: '#f1f5f9', color: '#475569' },
    procesada: { bg: '#dbeafe', color: '#1d4ed8' },
    pagada:    { bg: '#dcfce7', color: '#15803d' },
    anulada:   { bg: '#fee2e2', color: '#b91c1c' },
};

const card = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    overflow: 'hidden',
};

export default function NominaLista({ onVerDetalle }) {
    const [nominas,    setNominas]    = useState([]);
    const [cargando,   setCargando]   = useState(true);
    const [procesando, setProcesando] = useState(null);
    const [error,      setError]      = useState('');

    const cargar = async () => {
        setCargando(true);
        setError('');
        const data = await nominaService.listar();
        if (data.error) {
            setError(data.error);
        } else {
            setNominas(Array.isArray(data) ? data : []);
        }
        setCargando(false);
    };

    useEffect(() => { cargar(); }, []);

    const handleProcesar = async (nomina) => {
        if (!confirm(`Procesar nomina ${nomina.periodo}?\n\nSe calcularan los salarios de todos los empleados activos.`)) return;
        setProcesando(nomina.id);
        const res = await nominaService.procesar(nomina.id, { procesado_por: 'Administrador' });
        setProcesando(null);
        if (res.error) {
            alert('Error al procesar: ' + res.error);
            return;
        }
        alert(
            `Nomina procesada correctamente\n` +
            `Empleados: ${res.empleados_procesados}\n` +
            `Total neto: ${fmt(res.total_neto)}`
        );
        cargar();
    };

    const handlePagar = async (nomina) => {
        if (!confirm(`Marcar nomina ${nomina.periodo} como pagada?`)) return;
        const res = await nominaService.marcarPagada(nomina.id);
        if (res.error) { alert('Error: ' + res.error); return; }
        cargar();
    };

    if (cargando) return (
        <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            Cargando nominas...
        </div>
    );

    if (error) return (
        <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 13,
        }}>
            {error}
        </div>
    );

    if (nominas.length === 0) return (
        <div style={{ ...card, padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{
                width: 48, height: 48, borderRadius: 12, background: '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px', fontSize: 20,
            }}>
                N
            </div>
            <p style={{ margin: '0 0 4px', fontWeight: 500, color: '#475569' }}>
                No hay nominas registradas
            </p>
            <p style={{ margin: 0, fontSize: 12 }}>
                Crea una nueva nomina desde la pestana "Nueva Nomina"
            </p>
        </div>
    );

    return (
        <div style={card}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            {['Periodo', 'Fecha inicio', 'Fecha fin', 'Total ingresos', 'Deducciones', 'Neto', 'Estado', 'Acciones'].map(h => (
                                <th key={h} style={{
                                    padding: '10px 14px', textAlign: 'left',
                                    color: '#475569', fontWeight: 600,
                                    fontSize: 11, textTransform: 'uppercase',
                                    letterSpacing: '0.05em', whiteSpace: 'nowrap',
                                }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {nominas.map((n, i) => {
                            const est = ESTADO_STYLE[n.estado] || ESTADO_STYLE.borrador;
                            return (
                                <tr key={n.id} style={{
                                    borderBottom: '1px solid #f1f5f9',
                                    background: i % 2 === 0 ? '#fff' : '#fafafa',
                                }}>
                                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                                        {n.periodo}
                                    </td>
                                    <td style={{ padding: '12px 14px', color: '#475569', whiteSpace: 'nowrap' }}>
                                        {n.fecha_inicio?.slice(0, 10)}
                                    </td>
                                    <td style={{ padding: '12px 14px', color: '#475569', whiteSpace: 'nowrap' }}>
                                        {n.fecha_fin?.slice(0, 10)}
                                    </td>
                                    <td style={{ padding: '12px 14px', color: '#15803d', fontWeight: 500 }}>
                                        {fmt(n.total_ingresos)}
                                    </td>
                                    <td style={{ padding: '12px 14px', color: '#b91c1c' }}>
                                        {fmt(n.total_deducciones)}
                                    </td>
                                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                                        {fmt(n.total_neto)}
                                    </td>
                                    <td style={{ padding: '12px 14px' }}>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: 20,
                                            fontSize: 11, fontWeight: 600,
                                            background: est.bg, color: est.color,
                                        }}>
                                            {n.estado}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 14px' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                onClick={() => onVerDetalle(n.id)}
                                                style={btn('#f1f5f9', '#1d4ed8', '1px solid #e2e8f0')}
                                            >
                                                Ver detalle
                                            </button>
                                            {n.estado === 'borrador' && (
                                                <button
                                                    onClick={() => handleProcesar(n)}
                                                    disabled={procesando === n.id}
                                                    style={btn('#1d4ed8', '#fff')}
                                                >
                                                    {procesando === n.id ? 'Procesando...' : 'Procesar'}
                                                </button>
                                            )}
                                            {n.estado === 'procesada' && (
                                                <button
                                                    onClick={() => handlePagar(n)}
                                                    style={btn('#10b981', '#fff')}
                                                >
                                                    Marcar pagada
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const btn = (bg, color, border) => ({
    padding: '5px 12px',
    background: bg,
    color: color,
    border: border || 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    whiteSpace: 'nowrap',
});