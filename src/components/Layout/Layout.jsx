import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Layout.css'

const TODOS_LOS_MODULOS = [
  { path: '/dashboard',     icon: '▣', label: 'Dashboard',     nombre: 'Dashboard' },
  { path: '/usuarios',      icon: '⊞', label: 'Usuarios',      nombre: 'Usuarios' },
  { path: '/departamentos', icon: '⌂', label: 'Departamentos', nombre: 'Departamentos' },
  { path: '/pagos',         icon: '₴', label: 'Pagos',         nombre: 'Pagos' },
  { path: '/gastos',        icon: '≡', label: 'Gastos',        nombre: 'Gastos' },
  { path: '/boletas',       icon: '◱', label: 'Boletas',       nombre: 'Boletas' },
  { path: '/reportes',      icon: '↗', label: 'Reportes',      nombre: 'Reportes' },
  { path: '/fondo',         icon: '◈', label: 'Fondo',         nombre: 'Fondo Contingencia' },
]

const MODULOS_DIRECTIVO = [
  'Dashboard','Usuarios','Departamentos','Pagos',
  'Gastos','Boletas','Reportes','Fondo Contingencia'
]
const MODULOS_RESIDENTE = ['Dashboard', 'Pagos', 'Boletas']
const ROLES_DIRECTIVOS  = ['PRESIDENTE', 'SECRETARIO', 'TESORERO']

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, permisosExtra } = useAuth()
  const navigate = useNavigate()

  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)

  // Módulos base del rol + módulos desbloqueados por permisos extra
  const modulosBase  = esDirectivo ? MODULOS_DIRECTIVO : MODULOS_RESIDENTE
  const modulosExtra = permisosExtra.map(p => p.modulo)
  const modulosVisibles = [...new Set([...modulosBase, ...modulosExtra])]

  const navItems = TODOS_LOS_MODULOS.filter(m => modulosVisibles.includes(m.nombre))

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="layout">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar glass ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">🏢</span>
          <span className="sidebar-name">Torre Blanca</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.nombre} {user?.apellido}</span>
            <span className="sidebar-user-role">{user?.rol}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Cerrar sesión">↩</button>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar glass">
          <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <span className="topbar-title">Torre Blanca</span>
          <div className="topbar-user">
            <span className="topbar-role">{user?.rol}</span>
            <span className="topbar-name">{user?.nombre}</span>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
