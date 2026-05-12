// frontend/src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, DollarSign, ClipboardList,
  Settings, ChevronRight, Building2
} from 'lucide-react'

const NAV_ITEMS = [
  {
    group: 'Principal',
    items: [
      { to: '/',         icon: LayoutDashboard, label: 'Dashboard'  },
    ]
  },
  {
    group: 'Módulos',
    items: [
      { to: '/rrhh',     icon: Users,           label: 'Recursos Humanos' },
      { to: '/nomina',   icon: DollarSign,       label: 'Nómina'           },
      { to: '/reportes', icon: ClipboardList,    label: 'Reportes'         },
    ]
  },
  {
    group: 'Sistema',
    items: [
      { to: '/configuracion', icon: Settings,   label: 'Configuración'    },
    ]
  }
]

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      style={{
        width: collapsed ? '64px' : 'var(--sidebar-width)',
        background: 'var(--sidebar-bg)',
        height: '100vh',
        position: 'fixed',
        top: 0, left: 0,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        zIndex: 50,
        borderRight: '1px solid var(--sidebar-border)',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        height: 'var(--topbar-height)',
        display: 'flex',
        alignItems: 'center',
        padding: collapsed ? '0 18px' : '0 20px',
        borderBottom: '1px solid #1e293b',
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--sidebar-active)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Building2 size={18} color="#fff" />
        </div>
        {!collapsed && (
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1 }}>Mini ERP</p>
            <p style={{ color: 'var(--sidebar-text)', fontSize: 11, marginTop: 2 }}>RRHH & Nómina</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {NAV_ITEMS.map(group => (
          <div key={group.group} style={{ marginBottom: 8 }}>
            {!collapsed && (
              <p style={{
                color: '#475569', fontSize: 10, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '8px 20px 4px',
              }}>
                {group.group}
              </p>
            )}
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: collapsed ? '10px 18px' : '10px 20px',
                  color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                  background: isActive ? 'var(--sidebar-active)' : 'transparent',
                  borderRadius: 8,
                  margin: '2px 8px',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                })}
                onMouseEnter={e => {
                  if (!e.currentTarget.dataset.active)
                    e.currentTarget.style.background = 'var(--sidebar-hover)'
                }}
                onMouseLeave={e => {
                  if (!e.currentTarget.dataset.active)
                    e.currentTarget.style.background = ''
                }}
              >
                <item.icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Toggle button */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #1e293b' }}>
        <button
          onClick={onToggle}
          style={{
            width: '100%', padding: '8px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end',
            color: 'var(--sidebar-text)',
            borderRadius: 6,
            transition: 'all 0.15s',
          }}
        >
          <ChevronRight
            size={16}
            style={{
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.25s ease',
            }}
          />
        </button>
      </div>
    </aside>
  )
}
