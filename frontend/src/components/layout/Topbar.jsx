// frontend/src/components/layout/Topbar.jsx
import { useState } from 'react'
import { Bell, Search, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const ROL_LABEL = {
  administrador: 'Administrador',
  rrhh:          'RRHH',
  consulta:      'Solo lectura',
}

export default function Topbar({ sidebarCollapsed, onToggleSidebar }) {
  const { usuario, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  // Nombre: usa nombre completo, si no username, si no 'Usuario'
  const nombreMostrar = usuario?.nombre || usuario?.username || 'Usuario'
  const rolMostrar    = ROL_LABEL[usuario?.rol] || usuario?.rol || ''

  // Iniciales para el avatar
  const iniciales = nombreMostrar
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() || '')
    .join('')

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: sidebarCollapsed ? '64px' : 'var(--sidebar-width)',
      right: 0,
      height: 'var(--topbar-height)',
      background: 'var(--topbar-bg)',
      borderBottom: '1px solid var(--topbar-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 40,
      transition: 'left 0.25s ease',
      gap: 16,
    }}>

      {/* Izquierda: toggle + buscador */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <button
          onClick={onToggleSidebar}
          style={{
            width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: '1px solid #e2e8f0',
            borderRadius: 8, cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Menu size={16} color="#64748b" />
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: 8, padding: '7px 12px',
          maxWidth: 300, flex: 1,
        }}>
          <Search size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
          <input
            placeholder="Buscar empleados, nominas..."
            style={{
              border: 'none', background: 'transparent',
              outline: 'none', fontSize: 13, color: '#0f172a', width: '100%',
            }}
          />
        </div>
      </div>

      {/* Derecha: campana + usuario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{
          width: 36, height: 36, borderRadius: 8,
          background: '#f8fafc', border: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative', flexShrink: 0,
        }}>
          <Bell size={16} color="#64748b" />
          <span style={{
            position: 'absolute', top: 7, right: 7,
            width: 7, height: 7, borderRadius: '50%',
            background: '#ef4444', border: '1.5px solid #fff',
          }} />
        </button>

        {/* Avatar + dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(m => !m)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '5px 10px 5px 5px',
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 8, cursor: 'pointer',
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: '#1d4ed8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {iniciales || 'U'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>
                {nombreMostrar.split(' ')[0]}
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                {rolMostrar}
              </p>
            </div>
            <span style={{ color: '#94a3b8', fontSize: 10, marginLeft: 2 }}>▼</span>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: 10, boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              minWidth: 210, zIndex: 100, overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                  {nombreMostrar}
                </p>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, textTransform: 'capitalize' }}>
                  {rolMostrar}
                </p>
              </div>
              <div style={{ padding: '6px' }}>
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  style={{
                    width: '100%', padding: '8px 10px',
                    background: 'transparent', border: 'none',
                    borderRadius: 6, cursor: 'pointer',
                    textAlign: 'left', fontSize: 13,
                    color: '#ef4444', fontWeight: 500,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Cerrar sesion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 39 }}
        />
      )}
    </header>
  )
}