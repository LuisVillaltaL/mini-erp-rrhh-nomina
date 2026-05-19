import { useState, useEffect, useRef } from 'react'
import { Bell, Search, Menu, X, Users, DollarSign, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const ROL_LABEL = {
    administrador: 'Administrador',
    rrhh:          'RRHH',
    consulta:      'Solo lectura',
}

// Notificaciones estaticas contextuales del sistema
const NOTIFICACIONES_BASE = [
    { id: 1, tipo: 'info',    icon: Users,     titulo: 'Modulo RRHH activo',    desc: 'Puedes gestionar empleados y expedientes.', leida: false },
    { id: 2, tipo: 'success', icon: DollarSign, titulo: 'Modulo Nomina activo', desc: 'Crea y procesa nominas mensuales o quincenales.', leida: false },
    { id: 3, tipo: 'warning', icon: Bell,       titulo: 'Revision periodica',   desc: 'Recuerda mantener actualizados los expedientes.', leida: true  },
]

const TIPO_COLOR = {
    info:    { bg:'#eff6ff', border:'#bfdbfe', icon:'#1d4ed8' },
    success: { bg:'#f0fdf4', border:'#bbf7d0', icon:'#15803d' },
    warning: { bg:'#fffbeb', border:'#fde68a', icon:'#d97706' },
    error:   { bg:'#fef2f2', border:'#fecaca', icon:'#dc2626' },
}

export default function Topbar({ sidebarCollapsed, onToggleSidebar }) {
    const { usuario, logout } = useAuth()
    const navigate = useNavigate()

    const [menuOpen,    setMenuOpen]    = useState(false)
    const [notifOpen,   setNotifOpen]   = useState(false)
    const [notifs,      setNotifs]      = useState(NOTIFICACIONES_BASE)
    const [busqueda,    setBusqueda]    = useState('')
    const [resultados,  setResultados]  = useState([])
    const [buscando,    setBuscando]    = useState(false)
    const [searchOpen,  setSearchOpen]  = useState(false)
    const searchRef = useRef(null)
    const timerRef  = useRef(null)

    const sinLeer  = notifs.filter(n => !n.leida).length
    const iniciales = (usuario?.nombre || 'U').split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()

    // ── Busqueda global con debounce ──────────────────────────
    useEffect(() => {
        if (!busqueda.trim() || busqueda.length < 2) {
            setResultados([])
            setSearchOpen(false)
            return
        }
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(async () => {
            setBuscando(true)
            const token = localStorage.getItem('erp_token') || ''
            try {
                const [empRes, nomRes] = await Promise.all([
                    fetch(`${API}/rrhh?buscar=${encodeURIComponent(busqueda)}&estado=activo`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).then(r => r.json()),
                    fetch(`${API}/nominas`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).then(r => r.json()),
                ])

                const empleados = (Array.isArray(empRes) ? empRes : []).slice(0, 5).map(e => ({
                    tipo: 'empleado',
                    id: e.id,
                    titulo: `${e.nombres} ${e.apellidos}`,
                    sub: `${e.codigo} — ${e.departamento}`,
                    ruta: '/rrhh',
                }))

                const q = busqueda.toLowerCase()
                const nominas = (Array.isArray(nomRes) ? nomRes : [])
                    .filter(n => n.periodo.includes(q) || n.estado.includes(q))
                    .slice(0, 3)
                    .map(n => ({
                        tipo: 'nomina',
                        id: n.id,
                        titulo: `Nomina ${n.periodo}`,
                        sub: `${n.tipo_periodo || 'mensual'} — ${n.estado}`,
                        ruta: '/nomina',
                    }))

                setResultados([...empleados, ...nominas])
                setSearchOpen(empleados.length > 0 || nominas.length > 0)
            } catch { setResultados([]) }
            finally   { setBuscando(false) }
        }, 350)
    }, [busqueda])

    const irA = (ruta) => {
        setSearchOpen(false)
        setBusqueda('')
        // Pequeño delay para que React procese el cierre antes de navegar
        setTimeout(() => navigate(ruta), 50)
    }

    const marcarLeida = (id) =>
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))

    const marcarTodasLeidas = () =>
        setNotifs(prev => prev.map(n => ({ ...n, leida: true })))

    return (
        <header style={{
            position:'fixed', top:0,
            left: sidebarCollapsed ? '64px' : 'var(--sidebar-width)',
            right:0, height:'var(--topbar-height)',
            background:'var(--topbar-bg)', borderBottom:'1px solid var(--topbar-border)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'0 24px', zIndex:40, transition:'left 0.25s ease', gap:16,
        }}>

            {/* Izquierda: hamburger + buscador */}
            <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, position:'relative' }}>
                <button
                    onClick={onToggleSidebar}
                    title={sidebarCollapsed ? 'Expandir menu' : 'Colapsar menu'}
                    style={{ width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', flexShrink:0 }}
                >
                    <Menu size={16} color="#64748b" />
                </button>

                {/* Buscador con resultados */}
                <div style={{ position:'relative', flex:1, maxWidth:360 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f8fafc', border:`1px solid ${searchOpen ? '#1d4ed8' : '#e2e8f0'}`, borderRadius:8, padding:'7px 12px', transition:'border-color 0.15s' }}>
                        {buscando
                            ? <div style={{ width:14, height:14, border:'2px solid #94a3b8', borderTopColor:'#1d4ed8', borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink:0 }} />
                            : <Search size={14} color="#94a3b8" style={{ flexShrink:0 }} />
                        }
                        <input
                            ref={searchRef}
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            placeholder="Buscar empleados, nominas..."
                            style={{ border:'none', background:'transparent', outline:'none', fontSize:13, color:'#0f172a', width:'100%' }}
                        />
                        {busqueda && (
                            <button onClick={() => { setBusqueda(''); setSearchOpen(false) }}
                                style={{ border:'none', background:'none', cursor:'pointer', color:'#94a3b8', padding:0, flexShrink:0 }}>
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Dropdown resultados */}
                    {searchOpen && resultados.length > 0 && (
                        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, boxShadow:'0 10px 25px rgba(0,0,0,0.1)', zIndex:200, overflow:'hidden' }}>
                            {resultados.map((r, i) => (
                                <button key={i} onClick={() => irA(r.ruta)}
                                    style={{ width:'100%', padding:'10px 14px', background:'transparent', border:'none', borderBottom:'1px solid #f1f5f9', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}
                                    onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                                >
                                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                        <span style={{ fontSize:10, padding:'2px 7px', borderRadius:20, background: r.tipo==='empleado' ? '#dbeafe' : '#dcfce7', color: r.tipo==='empleado' ? '#1d4ed8' : '#15803d', fontWeight:600, textTransform:'uppercase' }}>
                                            {r.tipo==='empleado' ? 'Empleado' : 'Nomina'}
                                        </span>
                                        <div>
                                            <p style={{ margin:0, fontSize:13, fontWeight:500, color:'#0f172a' }}>{r.titulo}</p>
                                            <p style={{ margin:0, fontSize:11, color:'#64748b' }}>{r.sub}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={13} color="#94a3b8" />
                                </button>
                            ))}
                            <div style={{ padding:'8px 14px', background:'#f8fafc', borderTop:'1px solid #f1f5f9' }}>
                                <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>
                                    {resultados.length} resultado(s) para "{busqueda}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Derecha: notificaciones + usuario */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>

                {/* Campana con panel */}
                <div style={{ position:'relative' }}>
                    <button
                        onClick={() => { setNotifOpen(o => !o); setMenuOpen(false) }}
                        style={{ width:36, height:36, borderRadius:8, background:'#f8fafc', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative', flexShrink:0 }}
                    >
                        <Bell size={16} color="#64748b" />
                        {sinLeer > 0 && (
                            <span style={{ position:'absolute', top:6, right:6, width:8, height:8, borderRadius:'50%', background:'#ef4444', border:'1.5px solid #fff' }} />
                        )}
                    </button>

                    {notifOpen && (
                        <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, width:320, background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, boxShadow:'0 10px 30px rgba(0,0,0,0.12)', zIndex:200, overflow:'hidden' }}>
                            <div style={{ padding:'14px 16px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <div>
                                    <p style={{ margin:0, fontWeight:700, fontSize:14, color:'#0f172a' }}>Notificaciones</p>
                                    <p style={{ margin:0, fontSize:11, color:'#64748b' }}>{sinLeer} sin leer</p>
                                </div>
                                {sinLeer > 0 && (
                                    <button onClick={marcarTodasLeidas}
                                        style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#1d4ed8', fontWeight:500 }}>
                                        Marcar todas leidas
                                    </button>
                                )}
                            </div>
                            <div style={{ maxHeight:320, overflowY:'auto' }}>
                                {notifs.map(n => {
                                    const col = TIPO_COLOR[n.tipo]
                                    const Icon = n.icon
                                    return (
                                        <div key={n.id}
                                            onClick={() => marcarLeida(n.id)}
                                            style={{ padding:'12px 16px', borderBottom:'1px solid #f8fafc', background: n.leida ? '#fff' : col.bg, cursor:'pointer', display:'flex', gap:12, alignItems:'flex-start' }}
                                        >
                                            <div style={{ width:32, height:32, borderRadius:8, background: n.leida ? '#f1f5f9' : col.bg, border:`1px solid ${col.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                <Icon size={14} color={n.leida ? '#94a3b8' : col.icon} />
                                            </div>
                                            <div style={{ flex:1 }}>
                                                <p style={{ margin:'0 0 2px', fontSize:13, fontWeight: n.leida ? 400 : 600, color: n.leida ? '#475569' : '#0f172a' }}>
                                                    {n.titulo}
                                                </p>
                                                <p style={{ margin:0, fontSize:12, color:'#64748b', lineHeight:1.5 }}>{n.desc}</p>
                                            </div>
                                            {!n.leida && (
                                                <div style={{ width:7, height:7, borderRadius:'50%', background:'#1d4ed8', flexShrink:0, marginTop:4 }} />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Avatar + dropdown */}
                <div style={{ position:'relative' }}>
                    <button
                        onClick={() => { setMenuOpen(m => !m); setNotifOpen(false) }}
                        style={{ display:'flex', alignItems:'center', gap:9, padding:'5px 10px 5px 5px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer' }}
                    >
                        <div style={{ width:30, height:30, borderRadius:7, background:'#1d4ed8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
                            {iniciales}
                        </div>
                        <div style={{ textAlign:'left' }}>
                            <p style={{ fontSize:12, fontWeight:600, color:'#0f172a', lineHeight:1 }}>
                                {usuario?.nombre?.split(' ')[0] || 'Usuario'}
                            </p>
                            <p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>
                                {ROL_LABEL[usuario?.rol] || usuario?.rol}
                            </p>
                        </div>
                        <span style={{ color:'#94a3b8', fontSize:10, marginLeft:2 }}>▼</span>
                    </button>

                    {menuOpen && (
                        <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, boxShadow:'0 10px 25px rgba(0,0,0,0.1)', minWidth:210, zIndex:200, overflow:'hidden' }}>
                            <div style={{ padding:'14px 16px', borderBottom:'1px solid #f1f5f9' }}>
                                <p style={{ fontSize:13, fontWeight:600, color:'#0f172a', margin:0 }}>{usuario?.nombre}</p>
                                {usuario?.email && <p style={{ fontSize:12, color:'#64748b', margin:'3px 0 0' }}>{usuario.email}</p>}
                                {usuario?.departamento && <p style={{ fontSize:12, color:'#94a3b8', margin:'2px 0 0' }}>{usuario.departamento}</p>}
                                <span style={{ display:'inline-block', marginTop:6, fontSize:11, padding:'2px 8px', borderRadius:20, background:'#dbeafe', color:'#1d4ed8', fontWeight:600 }}>
                                    {ROL_LABEL[usuario?.rol] || usuario?.rol}
                                </span>
                            </div>
                            <div style={{ padding:'6px' }}>
                                <button
                                    onClick={() => { setMenuOpen(false); logout() }}
                                    style={{ width:'100%', padding:'8px 10px', background:'transparent', border:'none', borderRadius:6, cursor:'pointer', textAlign:'left', fontSize:13, color:'#ef4444', fontWeight:500 }}
                                    onMouseEnter={e => e.currentTarget.style.background='#fef2f2'}
                                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                                >
                                    Cerrar sesion
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Overlay para cerrar dropdowns */}
            {(menuOpen || notifOpen || searchOpen) && (
                <div
                    onClick={() => { setMenuOpen(false); setNotifOpen(false); setSearchOpen(false) }}
                    style={{ position:'fixed', inset:0, zIndex:39 }}
                />
            )}

            {/* Keyframe spin para el loader del buscador */}
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </header>
    )
}