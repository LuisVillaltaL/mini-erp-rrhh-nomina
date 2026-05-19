// frontend/src/pages/RRHHPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { Users, UserPlus, UserCheck, Search, X, ChevronDown, Briefcase, Plus } from 'lucide-react'

const API = 'http://localhost:3001/api'

function token() { return localStorage.getItem('erp_token') || '' }
function authFetch(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(options.headers || {}) }
    })
}

const fmt = (n) => `Q ${parseFloat(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-GT') : '—'

const card = { background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, boxShadow:'0 1px 3px rgba(0,0,0,0.07)' }
const inputStyle = { width:'100%', padding:'9px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, color:'#0f172a', outline:'none', boxSizing:'border-box', background:'#fff' }
const labelStyle = { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:5 }

const ESTADO_BADGE  = { activo:{bg:'#dcfce7',color:'#15803d'}, inactivo:{bg:'#fee2e2',color:'#b91c1c'}, suspendido:{bg:'#fef9c3',color:'#854d0e'} }
const CONTRATO_BADGE = { indefinido:{bg:'#dbeafe',color:'#1d4ed8'}, temporal:{bg:'#fce7f3',color:'#9d174d'}, por_proyecto:{bg:'#f3e8ff',color:'#7e22ce'} }
const NIVEL_BADGE    = { operativo:{bg:'#f1f5f9',color:'#475569'}, administrativo:{bg:'#fef3c7',color:'#92400e'}, gerencial:{bg:'#dbeafe',color:'#1d4ed8'} }

// ── KPI Card ──────────────────────────────────────────────────
function KpiCard({ icon:Icon, label, value, color, bg, loading }) {
    return (
        <div style={{ ...card, padding:'20px 24px', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:46, height:46, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={20} color={color} />
            </div>
            <div>
                <p style={{ margin:'0 0 3px', fontSize:12, color:'#64748b' }}>{label}</p>
                <p style={{ margin:0, fontSize:22, fontWeight:700, color:'#0f172a', lineHeight:1 }}>{loading ? '...' : value}</p>
            </div>
        </div>
    )
}

// ── Modal Empleado ────────────────────────────────────────────
function EmpleadoModal({ empleado, departamentos, cargos, onCerrar, onGuardado }) {
    const esEdicion = Boolean(empleado?.id)
    const vacio = { nombres:'', apellidos:'', dpi:'', email:'', telefono:'', departamento_id:'', cargo_id:'', fecha_ingreso:'', tipo_contrato:'indefinido' }
    const [form, setForm]           = useState(esEdicion ? { ...empleado } : vacio)
    const [errores, setErrores]     = useState({})
    const [guardando, setGuardando] = useState(false)
    const [apiError, setApiError]   = useState('')

    const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setErrores(er => ({ ...er, [k]:'' })) }

    const validar = () => {
        const e = {}
        if (!form.nombres?.trim())  e.nombres = 'Requerido'
        if (!form.apellidos?.trim()) e.apellidos = 'Requerido'
        if (!form.departamento_id)  e.departamento_id = 'Requerido'
        if (!form.cargo_id)         e.cargo_id = 'Requerido'
        if (!form.fecha_ingreso)    e.fecha_ingreso = 'Requerido'
        return e
    }

    const handleGuardar = async () => {
        const e = validar()
        if (Object.keys(e).length) { setErrores(e); return }
        setGuardando(true); setApiError('')
        const url    = esEdicion ? `${API}/rrhh/${empleado.id}` : `${API}/rrhh`
        const method = esEdicion ? 'PUT' : 'POST'
        const res    = await authFetch(url, { method, body: JSON.stringify(form) })
        const data   = await res.json()
        setGuardando(false)
        if (!res.ok) { setApiError(data.error || 'Error al guardar'); return }
        onGuardado()
    }

    const cargosFiltrados = form.departamento_id
        ? cargos.filter(c => String(c.departamento_id) === String(form.departamento_id))
        : cargos

    return (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.5)', padding:16 }}>
            <div style={{ ...card, width:'100%', maxWidth:640, maxHeight:'90vh', overflowY:'auto', padding:'28px 32px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                    <div>
                        <h2 style={{ fontSize:17, fontWeight:700, color:'#0f172a', margin:'0 0 4px' }}>{esEdicion ? 'Editar empleado' : 'Nuevo empleado'}</h2>
                        <p style={{ fontSize:12, color:'#64748b', margin:0 }}>{esEdicion ? `Codigo: ${empleado.codigo}` : 'Completa los datos del expediente'}</p>
                    </div>
                    <button onClick={onCerrar} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:22, lineHeight:1 }}>×</button>
                </div>
                {apiError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#dc2626' }}>{apiError}</div>}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 20px' }}>
                    {[['nombres','Nombres','Ana Lucia'],['apellidos','Apellidos','Garcia Perez']].map(([k,lbl,ph]) => (
                        <div key={k}>
                            <label style={labelStyle}>{lbl} <span style={{color:'#ef4444'}}>*</span></label>
                            <input style={{ ...inputStyle, borderColor: errores[k] ? '#fca5a5' : '#e2e8f0' }} value={form[k]||''} onChange={set(k)} placeholder={ph} />
                            {errores[k] && <p style={{ fontSize:11, color:'#dc2626', marginTop:3 }}>{errores[k]}</p>}
                        </div>
                    ))}
                    <div>
                        <label style={labelStyle}>DPI</label>
                        <input style={inputStyle} value={form.dpi||''} onChange={set('dpi')} placeholder="1234567890101" maxLength={13} />
                    </div>
                    <div>
                        <label style={labelStyle}>Telefono</label>
                        <input style={inputStyle} value={form.telefono||''} onChange={set('telefono')} placeholder="5555-0000" />
                    </div>
                    <div style={{ gridColumn:'1 / -1' }}>
                        <label style={labelStyle}>Correo electronico</label>
                        <input style={inputStyle} type="email" value={form.email||''} onChange={set('email')} placeholder="nombre@empresa.com" />
                    </div>
                    <div>
                        <label style={labelStyle}>Departamento <span style={{color:'#ef4444'}}>*</span></label>
                        <select style={{ ...inputStyle, borderColor: errores.departamento_id ? '#fca5a5' : '#e2e8f0', appearance:'none' }}
                            value={form.departamento_id}
                            onChange={e => { setForm(f => ({...f, departamento_id: e.target.value, cargo_id:''})); setErrores(er => ({...er, departamento_id:''})) }}>
                            <option value="">Seleccionar...</option>
                            {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                        </select>
                        {errores.departamento_id && <p style={{ fontSize:11, color:'#dc2626', marginTop:3 }}>{errores.departamento_id}</p>}
                    </div>
                    <div>
                        <label style={labelStyle}>Cargo <span style={{color:'#ef4444'}}>*</span></label>
                        <select style={{ ...inputStyle, borderColor: errores.cargo_id ? '#fca5a5' : '#e2e8f0', appearance:'none' }}
                            value={form.cargo_id} onChange={set('cargo_id')} disabled={!form.departamento_id}>
                            <option value="">{form.departamento_id ? 'Seleccionar...' : 'Elige departamento primero'}</option>
                            {cargosFiltrados.map(c => <option key={c.id} value={c.id}>{c.nombre} — {fmt(c.salario_base)}</option>)}
                        </select>
                        {errores.cargo_id && <p style={{ fontSize:11, color:'#dc2626', marginTop:3 }}>{errores.cargo_id}</p>}
                    </div>
                    <div>
                        <label style={labelStyle}>Fecha de ingreso <span style={{color:'#ef4444'}}>*</span></label>
                        <input type="date" style={{ ...inputStyle, borderColor: errores.fecha_ingreso ? '#fca5a5' : '#e2e8f0' }}
                            value={form.fecha_ingreso?.slice(0,10)||''} onChange={set('fecha_ingreso')} />
                        {errores.fecha_ingreso && <p style={{ fontSize:11, color:'#dc2626', marginTop:3 }}>{errores.fecha_ingreso}</p>}
                    </div>
                    <div>
                        <label style={labelStyle}>Tipo de contrato</label>
                        <select style={{ ...inputStyle, appearance:'none' }} value={form.tipo_contrato} onChange={set('tipo_contrato')}>
                            <option value="indefinido">Indefinido</option>
                            <option value="temporal">Temporal</option>
                            <option value="por_proyecto">Por proyecto</option>
                        </select>
                    </div>
                    {esEdicion && (
                        <div>
                            <label style={labelStyle}>Estado</label>
                            <select style={{ ...inputStyle, appearance:'none' }} value={form.estado} onChange={set('estado')}>
                                <option value="activo">Activo</option>
                                <option value="suspendido">Suspendido</option>
                                <option value="inactivo">Inactivo</option>
                            </select>
                        </div>
                    )}
                </div>
                <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:24, paddingTop:20, borderTop:'1px solid #f1f5f9' }}>
                    <button onClick={onCerrar} style={{ padding:'9px 20px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', fontSize:13, color:'#475569' }}>Cancelar</button>
                    <button onClick={handleGuardar} disabled={guardando}
                        style={{ padding:'9px 24px', background: guardando ? '#93c5fd' : '#1d4ed8', color:'#fff', border:'none', borderRadius:8, cursor: guardando ? 'not-allowed' : 'pointer', fontWeight:600, fontSize:13 }}>
                        {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Registrar empleado'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Modal Cargo (Puesto de trabajo) ───────────────────────────
function CargoModal({ cargo, departamentos, onCerrar, onGuardado }) {
    const esEdicion = Boolean(cargo?.id)
    const vacio = { nombre:'', nivel:'operativo', salario_base:'', departamento_id:'' }
    const [form, setForm]           = useState(esEdicion ? { ...cargo, salario_base: cargo.salario_base } : vacio)
    const [errores, setErrores]     = useState({})
    const [guardando, setGuardando] = useState(false)
    const [apiError, setApiError]   = useState('')

    const set = (k) => (e) => { setForm(f => ({...f, [k]: e.target.value})); setErrores(er => ({...er, [k]:''})) }

    const handleGuardar = async () => {
        const e = {}
        if (!form.nombre?.trim())    e.nombre = 'Requerido'
        if (!form.departamento_id)   e.departamento_id = 'Requerido'
        if (!form.salario_base || isNaN(parseFloat(form.salario_base))) e.salario_base = 'Ingresa un monto valido'
        if (Object.keys(e).length) { setErrores(e); return }

        setGuardando(true); setApiError('')
        const url    = esEdicion ? `${API}/cargos/${cargo.id}` : `${API}/cargos`
        const method = esEdicion ? 'PUT' : 'POST'
        const res    = await authFetch(url, { method, body: JSON.stringify(form) })
        const data   = await res.json()
        setGuardando(false)
        if (!res.ok) { setApiError(data.error || 'Error al guardar'); return }
        onGuardado()
    }

    return (
        <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.5)', padding:16 }}>
            <div style={{ ...card, width:'100%', maxWidth:480, padding:'28px 32px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                    <div>
                        <h2 style={{ fontSize:17, fontWeight:700, color:'#0f172a', margin:'0 0 4px' }}>{esEdicion ? 'Editar puesto' : 'Nuevo puesto de trabajo'}</h2>
                        <p style={{ fontSize:12, color:'#64748b', margin:0 }}>Define el cargo, nivel y salario base</p>
                    </div>
                    <button onClick={onCerrar} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:22, lineHeight:1 }}>×</button>
                </div>
                {apiError && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#dc2626' }}>{apiError}</div>}
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    <div>
                        <label style={labelStyle}>Nombre del puesto <span style={{color:'#ef4444'}}>*</span></label>
                        <input style={{ ...inputStyle, borderColor: errores.nombre ? '#fca5a5' : '#e2e8f0' }}
                            value={form.nombre} onChange={set('nombre')} placeholder="Ej: Desarrollador Senior" />
                        {errores.nombre && <p style={{ fontSize:11, color:'#dc2626', marginTop:3 }}>{errores.nombre}</p>}
                    </div>
                    <div>
                        <label style={labelStyle}>Departamento <span style={{color:'#ef4444'}}>*</span></label>
                        <select style={{ ...inputStyle, borderColor: errores.departamento_id ? '#fca5a5' : '#e2e8f0', appearance:'none' }}
                            value={form.departamento_id} onChange={set('departamento_id')}>
                            <option value="">Seleccionar...</option>
                            {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                        </select>
                        {errores.departamento_id && <p style={{ fontSize:11, color:'#dc2626', marginTop:3 }}>{errores.departamento_id}</p>}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <div>
                            <label style={labelStyle}>Nivel</label>
                            <select style={{ ...inputStyle, appearance:'none' }} value={form.nivel} onChange={set('nivel')}>
                                <option value="operativo">Operativo</option>
                                <option value="administrativo">Administrativo</option>
                                <option value="gerencial">Gerencial</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Salario base (Q) <span style={{color:'#ef4444'}}>*</span></label>
                            <input type="number" min="0" step="0.01"
                                style={{ ...inputStyle, borderColor: errores.salario_base ? '#fca5a5' : '#e2e8f0' }}
                                value={form.salario_base} onChange={set('salario_base')} placeholder="0.00" />
                            {errores.salario_base && <p style={{ fontSize:11, color:'#dc2626', marginTop:3 }}>{errores.salario_base}</p>}
                        </div>
                    </div>
                    {/* Preview IGSS */}
                    {form.salario_base && !isNaN(parseFloat(form.salario_base)) && (
                        <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#0369a1' }}>
                            IGSS estimado: <strong>Q {(parseFloat(form.salario_base) * 0.0483).toFixed(2)}</strong> /mes
                            &nbsp;|&nbsp; Neto aprox: <strong>Q {(parseFloat(form.salario_base) * (1-0.0483)).toFixed(2)}</strong>
                        </div>
                    )}
                </div>
                <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:24, paddingTop:20, borderTop:'1px solid #f1f5f9' }}>
                    <button onClick={onCerrar} style={{ padding:'9px 20px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', fontSize:13, color:'#475569' }}>Cancelar</button>
                    <button onClick={handleGuardar} disabled={guardando}
                        style={{ padding:'9px 24px', background: guardando ? '#93c5fd' : '#1d4ed8', color:'#fff', border:'none', borderRadius:8, cursor: guardando ? 'not-allowed' : 'pointer', fontWeight:600, fontSize:13 }}>
                        {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear puesto'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Componente principal ──────────────────────────────────────
export default function RRHHPage() {
    const [tab, setTab] = useState('empleados') // 'empleados' | 'puestos'

    const [empleados,     setEmpleados]     = useState([])
    const [cargos,        setCargos]        = useState([])
    const [departamentos, setDepartamentos] = useState([])
    const [stats,         setStats]         = useState({})
    const [cargando,      setCargando]      = useState(true)
    const [error,         setError]         = useState('')

    const [buscar,    setBuscar]    = useState('')
    const [filtroDep, setFiltroDep] = useState('')
    const [filtroEst, setFiltroEst] = useState('activo')

    const [modal,      setModal]      = useState(null) // null | { tipo:'empleado'|'cargo', data? }

    const cargarTodo = useCallback(async () => {
        setCargando(true); setError('')
        try {
            const params = new URLSearchParams()
            if (buscar)    params.set('buscar', buscar)
            if (filtroDep) params.set('departamento_id', filtroDep)
            if (filtroEst && tab === 'empleados') params.set('estado', filtroEst)

            const [resEmp, resStats, resDeps, resCargos] = await Promise.all([
                authFetch(`${API}/rrhh?${params}`).then(r => r.json()),
                authFetch(`${API}/rrhh/stats`).then(r => r.json()),
                authFetch(`${API}/departamentos`).then(r => r.json()),
                authFetch(`${API}/cargos`).then(r => r.json()),
            ])
            setEmpleados(Array.isArray(resEmp)    ? resEmp    : [])
            setStats(resStats.error ? {} : resStats)
            setDepartamentos(Array.isArray(resDeps)   ? resDeps   : [])
            setCargos(Array.isArray(resCargos) ? resCargos : [])
        } catch { setError('No se pudo conectar con el servidor') }
        finally { setCargando(false) }
    }, [buscar, filtroDep, filtroEst, tab])

    useEffect(() => {
        const t = setTimeout(cargarTodo, buscar ? 400 : 0)
        return () => clearTimeout(t)
    }, [cargarTodo])

    const handleDesactivar = async (emp) => {
        if (!confirm(`Dar de baja a ${emp.nombres} ${emp.apellidos}?`)) return
        const res = await authFetch(`${API}/rrhh/${emp.id}`, { method:'DELETE' })
        const data = await res.json()
        if (!res.ok) { alert(data.error); return }
        cargarTodo()
    }

    const handleDesactivarCargo = async (cargo) => {
        if (!confirm(`Desactivar el puesto "${cargo.nombre}"?`)) return
        const res = await authFetch(`${API}/cargos/${cargo.id}`, { method:'DELETE' })
        const data = await res.json()
        if (!res.ok) { alert(data.error); return }
        cargarTodo()
    }

    const tabBtn = (t) => ({
        padding:'8px 20px', border:'none', cursor:'pointer',
        borderBottom: tab===t ? '2px solid #1d4ed8' : '2px solid transparent',
        color: tab===t ? '#1d4ed8' : '#64748b',
        fontWeight: tab===t ? 600 : 400,
        background:'transparent', fontSize:14, marginBottom:-1,
    })

    // Cargos filtrados por departamento seleccionado
    const cargosFiltrados = filtroDep
        ? cargos.filter(c => String(c.departamento_id) === String(filtroDep))
        : cargos

    return (
        <div>
            {/* Encabezado */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
                <div>
                    <h1 style={{ fontSize:20, fontWeight:700, color:'#0f172a', margin:0 }}>Recursos Humanos</h1>
                    <p style={{ fontSize:13, color:'#64748b', marginTop:4 }}>Gestion de expedientes y puestos de trabajo</p>
                </div>
                <button
                    onClick={() => setModal({ tipo: tab === 'empleados' ? 'empleado' : 'cargo', data: null })}
                    style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', background:'#1d4ed8', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#fff' }}>
                    <Plus size={15} />
                    {tab === 'empleados' ? 'Nuevo empleado' : 'Nuevo puesto'}
                </button>
            </div>

            {/* KPIs */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:14, marginBottom:24 }}>
                <KpiCard icon={Users}     label="Total empleados"    value={stats.total      ?? '—'} color="#1d4ed8" bg="#dbeafe" loading={cargando} />
                <KpiCard icon={UserCheck} label="Activos"            value={stats.activos    ?? '—'} color="#059669" bg="#d1fae5" loading={cargando} />
                <KpiCard icon={UserPlus}  label="Nuevas altas (30d)" value={stats.nuevos_mes ?? '—'} color="#7c3aed" bg="#ede9fe" loading={cargando} />
                <KpiCard icon={Briefcase} label="Puestos definidos"  value={cargos.length}           color="#f59e0b" bg="#fef3c7" loading={cargando} />
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:4, borderBottom:'1px solid #e2e8f0', marginBottom:20 }}>
                <button style={tabBtn('empleados')} onClick={() => setTab('empleados')}>Empleados</button>
                <button style={tabBtn('puestos')}   onClick={() => setTab('puestos')}>Puestos de trabajo</button>
            </div>

            {/* Barra de filtros */}
            <div style={{ ...card, padding:'14px 20px', marginBottom:16, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:200, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 12px' }}>
                    <Search size={14} color="#94a3b8" />
                    <input placeholder={tab==='empleados' ? 'Buscar por nombre, DPI, correo...' : 'Buscar puesto...'}
                        value={buscar} onChange={e => setBuscar(e.target.value)}
                        style={{ border:'none', background:'transparent', outline:'none', fontSize:13, color:'#0f172a', width:'100%' }} />
                    {buscar && <button onClick={() => setBuscar('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0 }}><X size={13} /></button>}
                </div>
                <div style={{ position:'relative' }}>
                    <select value={filtroDep} onChange={e => setFiltroDep(e.target.value)}
                        style={{ ...inputStyle, width:'auto', paddingRight:32, appearance:'none', minWidth:170 }}>
                        <option value="">Todos los departamentos</option>
                        {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                    </select>
                    <ChevronDown size={13} color="#94a3b8" style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                </div>
                {tab === 'empleados' && (
                    <div style={{ position:'relative' }}>
                        <select value={filtroEst} onChange={e => setFiltroEst(e.target.value)}
                            style={{ ...inputStyle, width:'auto', paddingRight:32, appearance:'none', minWidth:130 }}>
                            <option value="">Todos los estados</option>
                            <option value="activo">Activos</option>
                            <option value="inactivo">Inactivos</option>
                            <option value="suspendido">Suspendidos</option>
                        </select>
                        <ChevronDown size={13} color="#94a3b8" style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    </div>
                )}
                <p style={{ fontSize:12, color:'#94a3b8', whiteSpace:'nowrap' }}>
                    {cargando ? 'Cargando...' : `${tab==='empleados' ? empleados.length : cargosFiltrados.length} registro(s)`}
                </p>
            </div>

            {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#dc2626' }}>{error}</div>}

            {/* ── TAB EMPLEADOS ── */}
            {tab === 'empleados' && (
                <div style={{ ...card, overflow:'hidden' }}>
                    <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                            <thead>
                                <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                                    {['Codigo','Nombre completo','DPI','Departamento','Cargo','Salario base','Ingreso','Contrato','Estado','Acciones'].map(h => (
                                        <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr><td colSpan={10} style={{ padding:'32px', textAlign:'center', color:'#94a3b8', fontSize:13 }}>Cargando empleados...</td></tr>
                                ) : empleados.length === 0 ? (
                                    <tr><td colSpan={10} style={{ padding:'48px', textAlign:'center', color:'#94a3b8' }}>
                                        <Users size={32} color="#e2e8f0" style={{ margin:'0 auto 10px', display:'block' }} />
                                        No se encontraron empleados con los filtros aplicados.
                                    </td></tr>
                                ) : empleados.map((emp, i) => {
                                    const estBadge = ESTADO_BADGE[emp.estado]       || ESTADO_BADGE.inactivo
                                    const conBadge = CONTRATO_BADGE[emp.tipo_contrato] || CONTRATO_BADGE.indefinido
                                    return (
                                        <tr key={emp.id} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0 ? '#fff' : '#fafafa' }}>
                                            <td style={{ padding:'11px 14px', fontWeight:600, color:'#1d4ed8', whiteSpace:'nowrap' }}>{emp.codigo}</td>
                                            <td style={{ padding:'11px 14px', color:'#0f172a', fontWeight:500, whiteSpace:'nowrap' }}>{emp.apellidos}, {emp.nombres}</td>
                                            <td style={{ padding:'11px 14px', color:'#64748b', fontFamily:'monospace', fontSize:12 }}>{emp.dpi||'—'}</td>
                                            <td style={{ padding:'11px 14px', color:'#475569', whiteSpace:'nowrap' }}>{emp.departamento}</td>
                                            <td style={{ padding:'11px 14px', color:'#475569', whiteSpace:'nowrap' }}>{emp.cargo}</td>
                                            <td style={{ padding:'11px 14px', color:'#059669', fontWeight:500, whiteSpace:'nowrap' }}>{fmt(emp.salario_base)}</td>
                                            <td style={{ padding:'11px 14px', color:'#64748b', whiteSpace:'nowrap' }}>{fmtFecha(emp.fecha_ingreso)}</td>
                                            <td style={{ padding:'11px 14px' }}>
                                                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:conBadge.bg, color:conBadge.color, whiteSpace:'nowrap' }}>{emp.tipo_contrato}</span>
                                            </td>
                                            <td style={{ padding:'11px 14px' }}>
                                                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:estBadge.bg, color:estBadge.color }}>{emp.estado}</span>
                                            </td>
                                            <td style={{ padding:'11px 14px', whiteSpace:'nowrap' }}>
                                                <div style={{ display:'flex', gap:6 }}>
                                                    <button onClick={() => setModal({ tipo:'empleado', data: emp })}
                                                        style={{ padding:'4px 12px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:6, cursor:'pointer', fontSize:12, color:'#1d4ed8', fontWeight:500 }}>
                                                        Editar
                                                    </button>
                                                    {emp.estado === 'activo' && (
                                                        <button onClick={() => handleDesactivar(emp)}
                                                            style={{ padding:'4px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, cursor:'pointer', fontSize:12, color:'#dc2626', fontWeight:500 }}>
                                                            Baja
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── TAB PUESTOS ── */}
            {tab === 'puestos' && (
                <div style={{ ...card, overflow:'hidden' }}>
                    <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                            <thead>
                                <tr style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
                                    {['Puesto de trabajo','Departamento','Nivel','Salario base','IGSS estimado','Neto aprox.','Empleados asignados','Acciones'].map(h => (
                                        <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr><td colSpan={8} style={{ padding:'32px', textAlign:'center', color:'#94a3b8' }}>Cargando puestos...</td></tr>
                                ) : cargosFiltrados.length === 0 ? (
                                    <tr><td colSpan={8} style={{ padding:'48px', textAlign:'center', color:'#94a3b8' }}>
                                        <Briefcase size={32} color="#e2e8f0" style={{ margin:'0 auto 10px', display:'block' }} />
                                        No hay puestos definidos. Crea el primero.
                                    </td></tr>
                                ) : cargosFiltrados.map((c, i) => {
                                    const igss = (parseFloat(c.salario_base) * 0.0483).toFixed(2)
                                    const neto = (parseFloat(c.salario_base) * (1-0.0483)).toFixed(2)
                                    const nBadge = NIVEL_BADGE[c.nivel] || NIVEL_BADGE.operativo
                                    return (
                                        <tr key={c.id} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0 ? '#fff' : '#fafafa' }}>
                                            <td style={{ padding:'11px 14px', fontWeight:600, color:'#0f172a' }}>{c.nombre}</td>
                                            <td style={{ padding:'11px 14px', color:'#475569' }}>{c.departamento}</td>
                                            <td style={{ padding:'11px 14px' }}>
                                                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:nBadge.bg, color:nBadge.color, textTransform:'capitalize' }}>{c.nivel}</span>
                                            </td>
                                            <td style={{ padding:'11px 14px', fontWeight:600, color:'#059669' }}>{fmt(c.salario_base)}</td>
                                            <td style={{ padding:'11px 14px', color:'#dc2626' }}>Q {igss}</td>
                                            <td style={{ padding:'11px 14px', color:'#0f172a', fontWeight:500 }}>Q {neto}</td>
                                            <td style={{ padding:'11px 14px', textAlign:'center' }}>
                                                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600, background: parseInt(c.empleados_asignados)>0 ? '#dbeafe' : '#f1f5f9', color: parseInt(c.empleados_asignados)>0 ? '#1d4ed8' : '#94a3b8' }}>
                                                    {c.empleados_asignados}
                                                </span>
                                            </td>
                                            <td style={{ padding:'11px 14px' }}>
                                                <div style={{ display:'flex', gap:6 }}>
                                                    <button onClick={() => setModal({ tipo:'cargo', data: c })}
                                                        style={{ padding:'4px 12px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:6, cursor:'pointer', fontSize:12, color:'#1d4ed8', fontWeight:500 }}>
                                                        Editar
                                                    </button>
                                                    <button onClick={() => handleDesactivarCargo(c)}
                                                        style={{ padding:'4px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, cursor:'pointer', fontSize:12, color:'#dc2626', fontWeight:500 }}>
                                                        Desactivar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modales */}
            {modal?.tipo === 'empleado' && (
                <EmpleadoModal
                    empleado={modal.data}
                    departamentos={departamentos}
                    cargos={cargos}
                    onCerrar={() => setModal(null)}
                    onGuardado={() => { setModal(null); cargarTodo() }}
                />
            )}
            {modal?.tipo === 'cargo' && (
                <CargoModal
                    cargo={modal.data}
                    departamentos={departamentos}
                    onCerrar={() => setModal(null)}
                    onGuardado={() => { setModal(null); cargarTodo() }}
                />
            )}
        </div>
    )
}