// frontend/src/components/layout/MainLayout.jsx
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)

  const contentLeft = collapsed ? '64px' : 'var(--sidebar-width)'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--body-bg)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div style={{
        marginLeft: contentLeft,
        flex: 1,
        transition: 'margin-left 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <Topbar sidebarCollapsed={collapsed} />

        <main style={{
          marginTop: 'var(--topbar-height)',
          padding: '24px',
          flex: 1,
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
