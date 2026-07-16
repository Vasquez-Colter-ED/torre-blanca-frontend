import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { formatearBadge } from '../../utils/formato'
import './Layout.css'

const NAV_ITEMS = [
  {
    path: '/dashboard', label: 'Dashboard',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  },
  {
    path: '/usuarios', label: 'Usuarios', nombre: 'Usuarios',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  },
  {
    path: '/departamentos', label: 'Departamentos', nombre: 'Departamentos',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  },
  {
    path: '/pagos', label: 'Pagos', nombre: 'Pagos',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
  },
  {
    path: '/gastos', label: 'Gastos', nombre: 'Gastos',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  },
  {
    path: '/boletas', label: 'Recibo', nombre: 'Boletas',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
  },
  {
    path: '/reportes', label: 'Reportes', nombre: 'Reportes',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  },
  {
    path: '/fondo', label: 'Fondo', nombre: 'Fondo Contingencia',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  },
]

const MODULOS_DIRECTIVO = ['Dashboard','Usuarios','Departamentos','Pagos','Gastos','Boletas','Reportes','Fondo Contingencia']
const MODULOS_RESIDENTE = ['Dashboard','Pagos','Boletas']
const ROLES_DIRECTIVOS  = ['PRESIDENTE','SECRETARIO','TESORERO']

const PAGE_TITLES = {
  '/dashboard': 'Dashboard', '/usuarios': 'Usuarios', '/departamentos': 'Departamentos',
  '/pagos': 'Pagos', '/gastos': 'Gastos', '/boletas': 'Recibo',
  '/reportes': 'Reportes', '/fondo': 'Fondo de Contingencia', '/perfil': 'Mi perfil',
}

export default function Layout() {
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [pendientesVerif, setPendientesVerif] = useState(0)
  const dropdownRef = useRef(null)

  const { user, logout, permisosExtra } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const esDirectivo    = ROLES_DIRECTIVOS.includes(user?.rol)

  // Contador de pagos pendientes de verificar — solo directivos. Se recarga
  // cada vez que cambias de página, así el número se mantiene al día sin
  // depender de que hayas entrado al módulo de Pagos para que se actualice.
  useEffect(() => {
    if (!esDirectivo) return
    api.get('/api/pagos/pendientes')
      .then(r => setPendientesVerif(r.data.length))
      .catch(() => {})
  }, [location.pathname, esDirectivo])
  const modulosBase    = esDirectivo ? MODULOS_DIRECTIVO : MODULOS_RESIDENTE
  const modulosExtra   = permisosExtra?.map(p => p.modulo) || []
  const modulosVisible = [...new Set([...modulosBase, ...modulosExtra])]
  const navItems       = NAV_ITEMS.filter(m => !m.nombre || modulosVisible.includes(m.nombre))

  const paginaActual = PAGE_TITLES[location.pathname] || 'Torre Blanca'
  const iniciales    = user ? user.nombre?.[0]?.toUpperCase() + user.apellido?.[0]?.toUpperCase() : 'U'

  const handleLogout = () => { logout(); navigate('/login') }

  // Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>

        {/* Logo */}
        <div className="sidebar-brand">
          <div className="sidebar-logo-wrap">
            <img src="/logo-base.png" alt="Torre Blanca" className="sidebar-logo" />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Torre Blanca</span>
            <span className="sidebar-brand-sub">Administración</span>
          </div>
        </div>

        {/* Navegación */}
        <nav className="sidebar-nav">
          <p className="sidebar-nav-label">Módulos</p>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
              {item.path === '/pagos' && formatearBadge(pendientesVerif) && (
                <span className="nav-badge">{formatearBadge(pendientesVerif)}</span>
              )}
            </NavLink>
          ))}
        </nav>

      </aside>

      <div className="main-wrapper">

        {/* Topbar */}
        <header className="topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Menú">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            {formatearBadge(pendientesVerif) && (
              <span className="nav-badge nav-badge-hamburger">{formatearBadge(pendientesVerif)}</span>
            )}
          </button>

          <div className="topbar-page-title">{paginaActual}</div>

          {/* Usuario con dropdown */}
          <div className="topbar-right" ref={dropdownRef}>
            <button
              className={`topbar-user-btn ${dropdownOpen ? 'topbar-user-btn-active' : ''}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="topbar-avatar">{iniciales}</div>
              <div className="topbar-user-info">
                <span className="topbar-user-name">{user?.nombre} {user?.apellido}</span>
                {ROLES_DIRECTIVOS.includes(user?.rol) && (
                  <span className="topbar-user-role">{user?.rol}</span>
                )}
              </div>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`topbar-chevron ${dropdownOpen ? 'topbar-chevron-open' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="topbar-dropdown">
                <div className="topbar-dropdown-header">
                  <p className="topbar-dd-nombre">{user?.nombre} {user?.apellido}</p>
                  <p className="topbar-dd-email">{user?.email}</p>
                </div>
                <div className="topbar-dropdown-divider" />
                <button
                  className="topbar-dd-item"
                  onClick={() => { setDropdownOpen(false); navigate('/perfil') }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Mi perfil
                </button>
                <div className="topbar-dropdown-divider" />
                <button
                  className="topbar-dd-item topbar-dd-logout"
                  onClick={() => { setDropdownOpen(false); handleLogout() }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
