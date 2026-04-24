import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

const STATS = [
  { icon: '🏠', label: 'Departamentos',   value: '32',  color: '#1B4F8A' },
  { icon: '👥', label: 'Residentes',      value: '19',  color: '#2E7D52' },
  { icon: '💳', label: 'Pagos este mes',  value: '—',   color: '#C8973A' },
  { icon: '⚠️', label: 'Pagos pendientes',value: '—',   color: '#C0392B' },
]

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="dashboard">
      <h1 className="page-title">Bienvenido, {user?.nombre} 👋</h1>
      <p className="page-subtitle">Panel de control — Residencial Torre Blanca</p>

      <div className="stats-grid">
        {STATS.map(s => (
          <div key={s.label} className="stat-card glass">
            <span className="stat-icon">{s.icon}</span>
            <div>
              <p className="stat-value" style={{ color: s.color }}>{s.value}</p>
              <p className="stat-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-modules glass">
        <h2 className="modules-title">Módulos del sistema</h2>
        <p className="modules-sub">Selecciona un módulo desde el menú lateral para comenzar.</p>
        <div className="modules-grid">
          {[
            { icon: '👥', name: 'Usuarios',       desc: 'Gestión de residentes y directiva', active: true  },
            { icon: '🏠', name: 'Departamentos',  desc: 'Registro de los 32 departamentos',  active: false },
            { icon: '💳', name: 'Pagos',          desc: 'Control de pagos mensuales',        active: false },
            { icon: '🧾', name: 'Gastos',         desc: 'Registro de gastos del edificio',   active: false },
            { icon: '📄', name: 'Boletas',        desc: 'Emisión de boletas virtuales',      active: false },
            { icon: '💰', name: 'Fondo',          desc: 'Fondo de contingencia',             active: false },
          ].map(m => (
            <div key={m.name} className={`module-chip ${m.active ? 'module-active' : 'module-coming'}`}>
              <span>{m.icon}</span>
              <div>
                <p className="module-name">{m.name}</p>
                <p className="module-desc">{m.desc}</p>
              </div>
              {!m.active && <span className="module-badge">Próximamente</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
