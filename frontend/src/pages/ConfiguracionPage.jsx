// frontend/src/pages/ConfiguracionPage.jsx
import { useState, useEffect } from 'react';
import { Settings, Users, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function token() { return localStorage.getItem('erp_token') || ''; }
function authFetch(url, opts = {}) {
    return fetch(`${API}${url}`, {
        ...opts,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(opts.headers || {}) }
    }).then(r => r.json());
}

const card  = { background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, boxShadow:'0 1px 3px rgba(0,0,0,0.07)' };
const input = { width:'100%', padding:'9px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, color:'#0f172a', outline:'none', boxSizing:'border-box', background:'#fff' };
const label = { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:5 };
const btnPrimary = (dis) => ({ padding:'9px 20px', background: dis ? '#93c5fd' : '#1d4ed8', color:'#fff', border:'none', borderRadius:8, cursor: dis ? 'not-allowed' : 'pointer', fontWeight:600, fontSize:13 });
const btnSecondary = { padding:'9px 16px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', fontSize:13, color:'#475569' };

const ROL_BADGE = {
    administrador: { bg:'#dbeafe', color:'#1d4ed8' },
    rrhh:          { bg:'#dcfce7', color:'#15803d' },
    consulta:      { bg:'#f3e8ff', color:'#7c3aed' },
};

// ── Seccion colapsable ────────────────────────────────────────
function Seccion({ titulo, sub, icon: Icon, children }) {
    const [abierta, setAbierta] = useState(true);
    return (
        <div style={{ ...card, marginBottom:16, overflow:'hidden' }}>
            <button onClick={() => setAbierta(a => !a)}
                style={{ width:'100%', padding:'18px 24px', background:'none', border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: abierta ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Icon size={18} color="#1d4ed8" />
                    </div>
                    <div style={{ textAlign:'left' }}>
                        <p style={{ margin:0, fontWeight:700, fontSize:14, color:'#0f172a' }}>{titulo}</p>
                        <p style={{ margin:0, fontSize:12, color:'#64748b' }}>{sub}</p>
                    </div>
                </div>
                {abierta ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
            </button>
            {abierta && <div style={{ padding:'20px 24px' }}>{children}</div>}
        </div>
    );
}

// ── Gestion de usuarios ───────────────────────────────────────
function GestionUsuarios() {
    const [usuarios,  setUsuarios]  = useState([]);
    const [roles,     setRoles]     = useState([]);
    const [form,      setForm]      = useState({ username:'', password:'', rol:'rrhh' });
    const [showPass,  setShowPass]  = useState(false);
    const [editando,  setEditando]  = useState(null); // { id, campo }
    const [editVal,   setEditVal]   = useState('');
    const [guardando, setGuardando] = useState(false);
    const [msg,       setMsg]       = useState('');
    const [error,     setError]     = useState('');

    const cargar = () => Promise.all([
        authFetch('/configuracion/usuarios'),
        authFetch('/configuracion/roles'),
    ]).then(([u, r]) => {
        setUsuarios(Array.isArray(u) ? u : []);
        setRoles(Array.isArray(r) ? r : []);
    });

    useEffect(() => { cargar(); }, []);

    const crearUsuario = async () => {
        if (!form.username || !form.password) { setError('Usuario y contrasena requeridos'); return; }
        setGuardando(true); setError(''); setMsg('');
        const res = await authFetch('/configuracion/usuarios', { method:'POST', body: JSON.stringify(form) });
        setGuardando(false);
        if (res.error) { setError(res.error); return; }
        setMsg('Usuario creado correctamente');
        setForm({ username:'', password:'', rol:'rrhh' });
        cargar();
    };

    const toggleActivo = async (u) => {
        await authFetch(`/configuracion/usuarios/${u.id}`, { method:'PUT', body: JSON.stringify({ activo: !u.activo }) });
        cargar();
    };

    const cambiarRol = async (id, rol) => {
        await authFetch(`/configuracion/usuarios/${id}`, { method:'PUT', body: JSON.stringify({ rol }) });
        cargar();
    };

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {/* Tabla de usuarios */}
            <div>
                <p style={{ margin:'0 0 12px', fontSize:13, fontWeight:600, color:'#374151' }}>Usuarios registrados</p>
                <div style={{ border:'1px solid #e2e8f0', borderRadius:8, overflow:'hidden' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                        <thead>
                            <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                                {['Usuario','Empleado vinculado','Rol','Estado','Ultimo acceso','Acciones'].map(h => (
                                    <th key={h} style={{ padding:'9px 14px', textAlign:'left', color:'#475569', fontWeight:600, fontSize:11, textTransform:'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map((u, i) => {
                                const badge = ROL_BADGE[u.rol] || ROL_BADGE.consulta;
                                return (
                                    <tr key={u.id} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0 ? '#fff' : '#fafafa' }}>
                                        <td style={{ padding:'10px 14px', fontWeight:600, color:'#0f172a', fontFamily:'monospace' }}>{u.username}</td>
                                        <td style={{ padding:'10px 14px', color:'#64748b' }}>{u.empleado}</td>
                                        <td style={{ padding:'10px 14px' }}>
                                            <select value={u.rol}
                                                onChange={e => cambiarRol(u.id, e.target.value)}
                                                style={{ padding:'4px 8px', border:'1px solid #e2e8f0', borderRadius:6, fontSize:12, background: badge.bg, color: badge.color, fontWeight:600, cursor:'pointer' }}>
                                                {roles.map(r => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ padding:'10px 14px' }}>
                                            <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background: u.activo ? '#dcfce7' : '#fee2e2', color: u.activo ? '#15803d' : '#b91c1c' }}>
                                                {u.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td style={{ padding:'10px 14px', color:'#94a3b8', fontSize:12 }}>
                                            {u.ultimo_login ? new Date(u.ultimo_login).toLocaleString('es-GT') : 'Nunca'}
                                        </td>
                                        <td style={{ padding:'10px 14px' }}>
                                            <button onClick={() => toggleActivo(u)}
                                                style={{ padding:'4px 12px', background: u.activo ? '#fef2f2' : '#f0fdf4', border:`1px solid ${u.activo ? '#fecaca' : '#bbf7d0'}`, borderRadius:6, cursor:'pointer', fontSize:12, color: u.activo ? '#dc2626' : '#15803d', fontWeight:500 }}>
                                                {u.activo ? 'Desactivar' : 'Activar'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Crear nuevo usuario */}
            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'18px 20px' }}>
                <p style={{ margin:'0 0 14px', fontSize:13, fontWeight:600, color:'#374151' }}>Crear nuevo usuario</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:12, alignItems:'flex-end' }}>
                    <div>
                        <label style={label}>Nombre de usuario</label>
                        <input style={input} value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} placeholder="juan.perez" />
                    </div>
                    <div>
                        <label style={label}>Contrasena</label>
                        <div style={{ position:'relative' }}>
                            <input type={showPass ? 'text' : 'password'} style={{ ...input, paddingRight:36 }}
                                value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="Min. 6 caracteres" />
                            <button onClick={() => setShowPass(s => !s)}
                                style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>
                                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label style={label}>Rol</label>
                        <select style={{ ...input, appearance:'none' }} value={form.rol} onChange={e => setForm(f => ({...f, rol: e.target.value}))}>
                            {roles.map(r => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
                        </select>
                    </div>
                    <button onClick={crearUsuario} disabled={guardando} style={btnPrimary(guardando)}>
                        {guardando ? 'Creando...' : 'Crear'}
                    </button>
                </div>
                {error && <p style={{ margin:'10px 0 0', fontSize:12, color:'#dc2626' }}>{error}</p>}
                {msg   && <p style={{ margin:'10px 0 0', fontSize:12, color:'#15803d' }}>{msg}</p>}
            </div>
        </div>
    );
}

// ── Parametros de nomina ──────────────────────────────────────
function ParametrosNomina() {
    const [conceptos,   setConceptos]   = useState([]);
    const [constantes,  setConstantes]  = useState({});
    const [editId,      setEditId]      = useState(null);
    const [editNombre,  setEditNombre]  = useState('');
    const [guardando,   setGuardando]   = useState(false);

    useEffect(() => {
        authFetch('/configuracion/parametros').then(data => {
            setConceptos(data.conceptos || []);
            setConstantes(data.constantes || {});
        });
    }, []);

    const guardar = async (id) => {
        setGuardando(true);
        await authFetch(`/configuracion/conceptos/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ nombre: editNombre, descripcion: conceptos.find(c=>c.id===id)?.descripcion, activo: true })
        });
        setConceptos(prev => prev.map(c => c.id === id ? { ...c, nombre: editNombre } : c));
        setEditId(null);
        setGuardando(false);
    };

    const TIPO_BADGE = {
        ingreso:   { bg:'#dcfce7', color:'#15803d' },
        deduccion: { bg:'#fee2e2', color:'#b91c1c' },
    };

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {/* Constantes del sistema */}
            <div>
                <p style={{ margin:'0 0 12px', fontSize:13, fontWeight:600, color:'#374151' }}>Constantes de calculo (Guatemala)</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:10 }}>
                    {[
                        { label:'IGSS Laboral',          val:`${constantes.igss_porcentaje}%`,        note:'Fijo por ley' },
                        { label:'Horas por mes',          val:`${constantes.horas_mes} hrs`,           note:'30 dias x 8 horas' },
                        { label:'Dias base de calculo',   val:`${constantes.dias_mes} dias`,           note:'Base mensual' },
                        { label:'Salario minimo',         val:`Q ${constantes.salario_minimo}`,        note:'Acuerdo gubernativo' },
                        { label:'Bonificacion incentivo', val:`Q ${constantes.bonificacion_incentivo}`,note:'Decreto 78-89' },
                    ].map(item => (
                        <div key={item.label} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'12px 14px' }}>
                            <p style={{ margin:'0 0 4px', fontSize:11, color:'#64748b' }}>{item.label}</p>
                            <p style={{ margin:'0 0 2px', fontSize:18, fontWeight:700, color:'#0f172a' }}>{item.val}</p>
                            <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>{item.note}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Catalogo de conceptos */}
            <div>
                <p style={{ margin:'0 0 12px', fontSize:13, fontWeight:600, color:'#374151' }}>Catalogo de conceptos de nomina</p>
                <div style={{ border:'1px solid #e2e8f0', borderRadius:8, overflow:'hidden' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                        <thead>
                            <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                                {['Codigo','Nombre','Tipo','Fijo','Estado','Acciones'].map(h => (
                                    <th key={h} style={{ padding:'9px 14px', textAlign:'left', color:'#475569', fontWeight:600, fontSize:11, textTransform:'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {conceptos.map((c, i) => {
                                const badge = TIPO_BADGE[c.tipo] || TIPO_BADGE.ingreso;
                                return (
                                    <tr key={c.id} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0 ? '#fff' : '#fafafa' }}>
                                        <td style={{ padding:'10px 14px', fontFamily:'monospace', color:'#1d4ed8', fontWeight:600 }}>{c.codigo}</td>
                                        <td style={{ padding:'10px 14px', color:'#0f172a' }}>
                                            {editId === c.id ? (
                                                <input style={{ ...input, padding:'5px 8px' }} value={editNombre}
                                                    onChange={e => setEditNombre(e.target.value)} autoFocus />
                                            ) : c.nombre}
                                        </td>
                                        <td style={{ padding:'10px 14px' }}>
                                            <span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:badge.bg, color:badge.color }}>
                                                {c.tipo}
                                            </span>
                                        </td>
                                        <td style={{ padding:'10px 14px', color:'#64748b' }}>{c.es_fijo ? 'Si' : 'No'}</td>
                                        <td style={{ padding:'10px 14px' }}>
                                            <span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600, background: c.activo ? '#dcfce7' : '#f1f5f9', color: c.activo ? '#15803d' : '#94a3b8' }}>
                                                {c.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td style={{ padding:'10px 14px' }}>
                                            {editId === c.id ? (
                                                <div style={{ display:'flex', gap:6 }}>
                                                    <button onClick={() => guardar(c.id)} disabled={guardando}
                                                        style={{ padding:'4px 12px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:500 }}>
                                                        {guardando ? '...' : 'Guardar'}
                                                    </button>
                                                    <button onClick={() => setEditId(null)}
                                                        style={{ padding:'4px 10px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, cursor:'pointer', fontSize:12 }}>
                                                        Cancelar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setEditId(c.id); setEditNombre(c.nombre); }}
                                                    style={{ padding:'4px 12px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:6, cursor:'pointer', fontSize:12, color:'#1d4ed8', fontWeight:500 }}>
                                                    Editar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ── Pagina principal ──────────────────────────────────────────
export default function ConfiguracionPage() {
    return (
        <div>
            <div style={{ marginBottom:24 }}>
                <h1 style={{ fontSize:20, fontWeight:700, color:'#0f172a', margin:0 }}>Configuracion</h1>
                <p style={{ fontSize:13, color:'#64748b', marginTop:4 }}>Administracion del sistema, usuarios y parametros de nomina</p>
            </div>

            <Seccion titulo="Gestion de Usuarios" sub="Crear, activar/desactivar y cambiar roles de acceso" icon={Users}>
                <GestionUsuarios />
            </Seccion>

            <Seccion titulo="Parametros de Nomina" sub="Conceptos de calculo y constantes legales de Guatemala" icon={Settings}>
                <ParametrosNomina />
            </Seccion>
        </div>
    );
}