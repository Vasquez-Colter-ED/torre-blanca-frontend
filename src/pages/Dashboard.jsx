import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Dashboard.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE', 'SECRETARIO', 'TESORERO']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const etiquetaMes = (mes, anio) => mes && anio ? `${MESES[mes - 1]} ${anio}` : 'Mes no especificado'

function IconCard() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
}
function IconCheck() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function IconClock() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
function IconAlert() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
}
function IconBuilding() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
}
function IconArrow() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
}

function StatusBadge({ estado }) {
  const map = {
    PAGADO:                 { label: 'Pagado',           cls: 'badge-success' },
    VERIFICADO:             { label: 'Verificado',        cls: 'badge-success' },
    PENDIENTE:              { label: 'Pendiente',         cls: 'badge-warning' },
    PENDIENTE_VERIFICACION: { label: 'En verificación',   cls: 'badge-info'    },
    VENCIDO:                { label: 'Vencido',           cls: 'badge-danger'  },
    RECHAZADO:              { label: 'Rechazado',         cls: 'badge-danger'  },
  }
  const { label, cls } = map[estado] || { label: estado, cls: 'badge-info' }
  return <span className={`db-badge ${cls}`}>{label}</span>
}

export default function Dashboard() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)

  const [cuotas,  setCuotas]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const ahora   = new Date()
  const mesActual  = ahora.getMonth() + 1
  const anioActual = ahora.getFullYear()

  useEffect(() => {
    if (!esDirectivo) cargarCuotas()
    else setLoading(false)
  }, [])

  const cargarCuotas = async () => {
    try {
      const r = await api.get('/api/pagos/mis-cuotas')
      setCuotas(r.data)
    } catch { setError('No se pudo cargar la información') }
    finally { setLoading(false) }
  }

  if (esDirectivo) {
    return (
      <div className="db-page">
        <div className="db-welcome">
          <h1 className="db-welcome-title">Bienvenido, {user?.nombre}</h1>
          <p className="db-welcome-sub">Panel de administración — Residencial Torre Blanca</p>
        </div>
        <div className="db-directivo-card">
          <div className="db-directivo-icon"><IconBuilding /></div>
          <div>
            <p className="db-directivo-titulo">Panel directivo</p>
            <p className="db-directivo-desc">Usa el menú lateral para acceder a todos los módulos de gestión del edificio.</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Clasificar cuotas ────────────────────────────────────────
  const cuotaMesActual = cuotas.find(c => {
    // la API no devuelve mes/anio directamente, lo inferimos del cuotaId o del estado
    // usamos el orden: las cuotas más recientes primero
    return c.estadoCuota === 'PENDIENTE' || c.estadoCuota === 'VENCIDO' || c.estadoCuota === 'PENDIENTE_VERIFICACION'
  }) || null

  const cuotasPagadas  = cuotas.filter(c => c.estadoCuota === 'PAGADO' || c.estadoCuota === 'VERIFICADO')
  const cuotasPendientes = cuotas.filter(c => c.estadoCuota === 'PENDIENTE' || c.estadoCuota === 'VENCIDO')
  const cuotasEnVerificacion = cuotas.filter(c => c.estadoCuota === 'PENDIENTE_VERIFICACION')

  const totalPagado   = cuotasPagadas.reduce((s, c) => s + Number(c.montoCalculado), 0)
  const totalPendiente = cuotasPendientes.reduce((s, c) => s + Number(c.montoCalculado), 0)

  return (
    <div className="db-page">

      {/* Bienvenida */}
      <div className="db-welcome">
        <h1 className="db-welcome-title">Bienvenido, {user?.nombre}</h1>
        <p className="db-welcome-sub">Aquí tienes un resumen de tu cuenta en Residencial Torre Blanca</p>
      </div>

      {error && <div className="db-error">{error}</div>}

      {loading ? (
        <div className="db-skeleton-grid">
          {[...Array(3)].map((_, i) => <div key={i} className="db-skeleton-card" />)}
        </div>
      ) : (
        <>
          {/* ── KPIs ── */}
          <div className="db-kpis">
            <div className="db-kpi db-kpi-pending">
              <div className="db-kpi-icon"><IconAlert /></div>
              <div className="db-kpi-body">
                <p className="db-kpi-value">S/ {totalPendiente.toFixed(2)}</p>
                <p className="db-kpi-label">Por pagar</p>
              </div>
            </div>
            <div className="db-kpi db-kpi-verify">
              <div className="db-kpi-icon"><IconClock /></div>
              <div className="db-kpi-body">
                <p className="db-kpi-value">{cuotasEnVerificacion.length}</p>
                <p className="db-kpi-label">En verificación</p>
              </div>
            </div>
            <div className="db-kpi db-kpi-paid">
              <div className="db-kpi-icon"><IconCheck /></div>
              <div className="db-kpi-body">
                <p className="db-kpi-value">S/ {totalPagado.toFixed(2)}</p>
                <p className="db-kpi-label">Total pagado</p>
              </div>
            </div>
          </div>

          {/* ── Cuota pendiente destacada ── */}
          {cuotasPendientes.length > 0 && (
            <div className="db-section">
              <h2 className="db-section-title">
                <IconCard />
                Cuotas pendientes de pago
              </h2>
              <div className="db-cuotas-list">
                {cuotasPendientes.map(c => (
                  <div key={c.cuotaId} className={`db-cuota-card db-cuota-urgent ${c.estadoCuota === 'VENCIDO' ? 'db-cuota-vencida' : ''}`}>
                    <div className="db-cuota-info">
                      <p className="db-cuota-mes">{etiquetaMes(c.mes, c.anio)}</p>
                      <div className="db-cuota-depto">
                        <IconBuilding />
                        <span>Departamento {c.numeroDepartamento} · Piso {c.piso}</span>
                      </div>
                      <p className="db-cuota-monto">S/ {Number(c.montoCalculado).toFixed(2)}</p>
                    </div>
                    <div className="db-cuota-right">
                      <StatusBadge estado={c.estadoCuota} />
                      <button className="btn-pagar-ahora" onClick={() => navigate('/pagos')}>
                        Ir a pagar
                        <IconArrow />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── En verificación ── */}
          {cuotasEnVerificacion.length > 0 && (
            <div className="db-section">
              <h2 className="db-section-title">
                <IconClock />
                Pagos en proceso de verificación
              </h2>
              <div className="db-cuotas-list">
                {cuotasEnVerificacion.map(c => (
                  <div key={c.cuotaId} className="db-cuota-card db-cuota-info-card">
                    <div className="db-cuota-info">
                      <p className="db-cuota-mes">{etiquetaMes(c.mes, c.anio)}</p>
                      <div className="db-cuota-depto">
                        <IconBuilding />
                        <span>Departamento {c.numeroDepartamento} · Piso {c.piso}</span>
                      </div>
                      <p className="db-cuota-monto">S/ {Number(c.montoCalculado).toFixed(2)}</p>
                    </div>
                    <div className="db-cuota-right">
                      <StatusBadge estado="PENDIENTE_VERIFICACION" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="db-verify-hint">El directivo revisará y aprobará tu pago en breve. Recibirás tu boleta automáticamente.</p>
            </div>
          )}

          {/* ── Sin deudas ── */}
          {cuotasPendientes.length === 0 && cuotasEnVerificacion.length === 0 && (
            <div className="db-al-dia">
              <div className="db-al-dia-icon"><IconCheck /></div>
              <div>
                <p className="db-al-dia-titulo">Estás al día</p>
                <p className="db-al-dia-sub">No tienes cuotas pendientes de pago en este momento.</p>
              </div>
            </div>
          )}

          {/* ── Historial ── */}
          {cuotasPagadas.length > 0 && (
            <div className="db-section">
              <div className="db-section-header">
                <h2 className="db-section-title">
                  <IconCheck />
                  Historial de pagos
                </h2>
                <button className="btn-ver-todos" onClick={() => navigate('/boletas')}>
                  Ver boletas
                  <IconArrow />
                </button>
              </div>
              <div className="db-historial">
                {cuotasPagadas.slice(0, 5).map(c => (
                  <div key={c.cuotaId} className="db-historial-row">
                    <div className="db-historial-depto">
                      <span className="db-historial-num">{etiquetaMes(c.mes, c.anio)}</span>
                      <span className="db-historial-piso">Depto {c.numeroDepartamento} · Piso {c.piso}</span>
                    </div>
                    <span className="db-historial-monto">S/ {Number(c.montoCalculado).toFixed(2)}</span>
                    <StatusBadge estado={c.estadoCuota} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {cuotas.length === 0 && !loading && (
            <div className="db-empty">
              <p>No tienes cuotas asignadas aún. Contacta al directivo del edificio.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
