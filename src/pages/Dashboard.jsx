import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Dashboard.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE','SECRETARIO','TESORERO']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const etiquetaMes = (mes, anio) => mes && anio ? `${MESES[mes-1]} ${anio}` : '—'

// ── Íconos ──────────────────────────────────────────────────────
const IcoAlert    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IcoCheck    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoClock    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IcoUsers    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IcoDoc      = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
const IcoCard     = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
const IcoArrow    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
const IcoBuilding = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const IcoCal      = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IcoGastos   = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>

// Anillo SVG de progreso
function AnilloProgreso({ pct, size = 120, stroke = 10 }) {
  const r   = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const off  = circ * (1 - Math.min(pct, 100) / 100)
  const color = pct >= 80 ? '#059669' : pct >= 50 ? '#2563EB' : '#F59E0B'
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
      />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════════
//  DASHBOARD DIRECTIVO
// ══════════════════════════════════════════════════════════════════
function DirectivoDashboard({ user }) {
  const navigate   = useNavigate()
  const ahora      = new Date()
  const mes        = ahora.getMonth() + 1
  const anio       = ahora.getFullYear()

  const [resumen,     setResumen]     = useState(null)
  const [pendientes,  setPendientes]  = useState([])
  const [misCuotas,   setMisCuotas]  = useState([])
  const [gastos,      setGastos]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [msgVerif,    setMsgVerif]    = useState({})

  useEffect(() => { cargarTodo() }, [])

  const cargarTodo = async () => {
    setLoading(true)
    try {
      const [rResumen, rPend, rMisCuotas, rGastos] = await Promise.allSettled([
        api.get(`/api/pagos/resumen/${anio}/${mes}`),
        api.get('/api/pagos/pendientes'),
        api.get('/api/pagos/mis-cuotas'),
        api.get('/api/gastos'),
      ])
      if (rResumen.status    === 'fulfilled') setResumen(rResumen.value.data)
      if (rPend.status       === 'fulfilled') setPendientes(rPend.value.data)
      if (rMisCuotas.status  === 'fulfilled') setMisCuotas(rMisCuotas.value.data)
      if (rGastos.status     === 'fulfilled') setGastos(rGastos.value.data)
    } finally { setLoading(false) }
  }

  const verificar = async (pagoId, accion) => {
    try {
      await api.patch(`/api/pagos/${pagoId}/verificar`, { accion, observaciones: '' })
      setMsgVerif(prev => ({ ...prev, [pagoId]: accion === 'APROBAR' ? 'aprobado' : 'rechazado' }))
      setTimeout(() => {
        setPendientes(prev => prev.filter(p => p.pagoId !== pagoId))
        setMsgVerif(prev => { const n = {...prev}; delete n[pagoId]; return n })
        cargarTodo()
      }, 1200)
    } catch { alert('No se pudo procesar la acción') }
  }

  // Stats derivadas
  const pctRecaudado = resumen
    ? Math.round((resumen.totalRecaudado / (resumen.totalEsperado || 1)) * 100)
    : 0

  const gastosEsteMes = gastos.filter(g => {
    const f = new Date(g.fecha)
    return f.getMonth() + 1 === mes && f.getFullYear() === anio
  })
  const totalGastos = gastosEsteMes.reduce((s,g) => s + Number(g.monto || 0), 0)

  // Mis cuotas como residente
  const misCuotasUrgentes = misCuotas.filter(c =>
    (c.estadoCuota === 'PENDIENTE' || c.estadoCuota === 'VENCIDO') &&
    !(c.anio > anio || (c.anio === anio && c.mes > mes)) &&
    !c.pagos?.some(p => p.estado === 'PENDIENTE_VERIFICACION')
  )

  // Fecha formateada
  const fechaStr = ahora.toLocaleDateString('es-PE', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  if (loading) return (
    <div className="dbd-skeleton">
      {[...Array(5)].map((_,i) => <div key={i} className="dbd-skeleton-item" />)}
    </div>
  )

  return (
    <div className="dbd-page">

      {/* ── Header ── */}
      <div className="dbd-header">
        <div>
          <p className="dbd-fecha">{fechaStr}</p>
          <h1 className="dbd-titulo">Buenos días, {user?.nombre}</h1>
          <p className="dbd-sub">Residencial Torre Blanca · {user?.rol}</p>
        </div>
        <div className="dbd-header-badge">
          <IcoBuilding />
          Panel directivo
        </div>
      </div>

      {/* ── Recaudación del mes — tarjeta protagonista ── */}
      <div className="dbd-recaudacion">
        <div className="dbd-rec-anillo">
          <AnilloProgreso pct={pctRecaudado} size={130} stroke={11} />
          <div className="dbd-rec-pct-wrap">
            <span className="dbd-rec-pct">{pctRecaudado}%</span>
            <span className="dbd-rec-pct-lbl">recaudado</span>
          </div>
        </div>

        <div className="dbd-rec-stats">
          <div className="dbd-rec-header">
            <h2 className="dbd-rec-titulo">Recaudación — {MESES[mes-1]} {anio}</h2>
            <span className={`dbd-rec-badge ${pctRecaudado >= 80 ? 'dbd-badge-ok' : pctRecaudado >= 50 ? 'dbd-badge-mid' : 'dbd-badge-low'}`}>
              {pctRecaudado >= 80 ? 'En buen camino' : pctRecaudado >= 50 ? 'En progreso' : 'Requiere atención'}
            </span>
          </div>

          <div className="dbd-rec-grid">
            <div className="dbd-rec-stat">
              <p className="dbd-rec-stat-val">S/ {Number(resumen?.totalRecaudado || 0).toFixed(2)}</p>
              <p className="dbd-rec-stat-lbl">Recaudado</p>
            </div>
            <div className="dbd-rec-stat">
              <p className="dbd-rec-stat-val">S/ {Number(resumen?.totalEsperado || 0).toFixed(2)}</p>
              <p className="dbd-rec-stat-lbl">Esperado</p>
            </div>
            <div className="dbd-rec-stat">
              <p className="dbd-rec-stat-val">{resumen?.pagados || 0} / {resumen?.totalDepartamentos || 0}</p>
              <p className="dbd-rec-stat-lbl">Deptos pagados</p>
            </div>
            <div className="dbd-rec-stat dbd-rec-stat-pend">
              <p className="dbd-rec-stat-val">S/ {Number(resumen?.totalPendiente || 0).toFixed(2)}</p>
              <p className="dbd-rec-stat-lbl">Por cobrar</p>
            </div>
          </div>

          <button className="dbd-rec-btn" onClick={() => navigate('/pagos')}>
            Ver detalle completo <IcoArrow />
          </button>
        </div>
      </div>

      {/* ── 4 KPIs ── */}
      <div className="dbd-kpis">
        <div className={`dbd-kpi ${pendientes.length > 0 ? 'dbd-kpi-urgente' : ''}`} onClick={() => navigate('/pagos')}>
          <div className="dbd-kpi-icon-wrap dbd-ico-warn"><IcoClock /></div>
          <div>
            <p className="dbd-kpi-val">{pendientes.length}</p>
            <p className="dbd-kpi-lbl">Pendientes verificación</p>
          </div>
          {pendientes.length > 0 && <span className="dbd-kpi-alerta">{pendientes.length}</span>}
        </div>

        <div className="dbd-kpi" onClick={() => navigate('/pagos')}>
          <div className="dbd-kpi-icon-wrap dbd-ico-err"><IcoAlert /></div>
          <div>
            <p className="dbd-kpi-val">{(resumen?.totalDepartamentos || 0) - (resumen?.pagados || 0)}</p>
            <p className="dbd-kpi-lbl">Deptos con deuda</p>
          </div>
        </div>

        <div className="dbd-kpi" onClick={() => navigate('/gastos')}>
          <div className="dbd-kpi-icon-wrap dbd-ico-neutral"><IcoGastos /></div>
          <div>
            <p className="dbd-kpi-val">S/ {totalGastos.toFixed(0)}</p>
            <p className="dbd-kpi-lbl">Gastos del mes</p>
          </div>
        </div>

        <div className="dbd-kpi" onClick={() => navigate('/reportes')}>
          <div className="dbd-kpi-icon-wrap dbd-ico-blue"><IcoDoc /></div>
          <div>
            <p className="dbd-kpi-val">{resumen?.pagados || 0}</p>
            <p className="dbd-kpi-lbl">Recibos generados</p>
          </div>
        </div>
      </div>

      {/* ── Grid dos columnas ── */}
      <div className="dbd-grid-2">

        {/* Pendientes de verificación */}
        <div className="dbd-card">
          <div className="dbd-card-header">
            <h3 className="dbd-card-titulo">
              <IcoClock />
              Pendientes de verificación
              {pendientes.length > 0 && <span className="dbd-card-cnt">{pendientes.length}</span>}
            </h3>
            <button className="dbd-link" onClick={() => navigate('/pagos')}>Ver todos</button>
          </div>

          {pendientes.length === 0 ? (
            <div className="dbd-empty-sm">
              <IcoCheck />
              <p>Sin pagos pendientes de revisar</p>
            </div>
          ) : (
            <div className="dbd-pend-lista">
              {pendientes.slice(0, 4).map(p => (
                <div key={p.pagoId} className={`dbd-pend-item ${msgVerif[p.pagoId] ? 'dbd-pend-done' : ''}`}>
                  {msgVerif[p.pagoId] ? (
                    <p className={`dbd-pend-msg ${msgVerif[p.pagoId] === 'aprobado' ? 'dbd-msg-ok' : 'dbd-msg-err'}`}>
                      {msgVerif[p.pagoId] === 'aprobado' ? 'Aprobado correctamente' : 'Rechazado'}
                    </p>
                  ) : (
                    <>
                      <div className="dbd-pend-info">
                        <p className="dbd-pend-nombre">{p.pagadorNombre}</p>
                        <p className="dbd-pend-sub">Depto {p.numeroDepartamento} · {p.metodoPago}</p>
                        {p.voucherUrl && (
                          <a href={p.voucherUrl} target="_blank" rel="noreferrer" className="dbd-pend-voucher">
                            Ver comprobante
                          </a>
                        )}
                      </div>
                      <div className="dbd-pend-der">
                        <span className="dbd-pend-monto">S/ {Number(p.monto).toFixed(2)}</span>
                        <div className="dbd-pend-btns">
                          <button className="dbd-btn-aprobar" onClick={() => verificar(p.pagoId, 'APROBAR')}>
                            <IcoCheck /> Aprobar
                          </button>
                          <button className="dbd-btn-rechazar" onClick={() => verificar(p.pagoId, 'RECHAZAR')}>
                            Rechazar
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {pendientes.length > 4 && (
                <button className="dbd-link-more" onClick={() => navigate('/pagos')}>
                  Ver {pendientes.length - 4} más
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mi estado personal como residente */}
        <div className="dbd-card">
          <div className="dbd-card-header">
            <h3 className="dbd-card-titulo"><IcoUsers /> Mi estado como residente</h3>
          </div>

          {misCuotasUrgentes.length === 0 ? (
            <div className="dbd-mi-estado-ok">
              <div className="dbd-mi-estado-icon"><IcoCheck /></div>
              <div>
                <p className="dbd-mi-ok-t">Estás al día</p>
                <p className="dbd-mi-ok-s">No tienes cuotas pendientes como residente.</p>
              </div>
            </div>
          ) : (
            <div className="dbd-mi-deudas">
              <div className="dbd-mi-deuda-aviso">
                <IcoAlert />
                <p>Tienes {misCuotasUrgentes.length} cuota{misCuotasUrgentes.length > 1 ? 's' : ''} pendiente{misCuotasUrgentes.length > 1 ? 's' : ''}</p>
              </div>
              {misCuotasUrgentes.map(c => (
                <div key={c.cuotaId} className="dbd-mi-cuota">
                  <div>
                    <p className="dbd-mi-cuota-mes">{etiquetaMes(c.mes, c.anio)}</p>
                    <p className="dbd-mi-cuota-depto">Depto {c.numeroDepartamento}</p>
                  </div>
                  <span className="dbd-mi-cuota-monto">S/ {Number(c.montoCalculado).toFixed(2)}</span>
                </div>
              ))}
              <button className="dbd-btn-ir-pagar" onClick={() => navigate('/pagos')}>
                Ir a pagar <IcoArrow />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Accesos rápidos ── */}
      <div className="dbd-accesos">
        <p className="dbd-accesos-titulo">Accesos rápidos</p>
        <div className="dbd-accesos-grid">
          {[
            { label: 'Registrar pago', sub: 'Módulo de pagos', icon: <IcoCard />, path: '/pagos', color: 'dbd-ac-blue' },
            { label: 'Configurar mes', sub: 'Generar cuotas', icon: <IcoCal />,  path: '/pagos', color: 'dbd-ac-navy' },
            { label: 'Registrar gasto', sub: 'Módulo de gastos', icon: <IcoGastos />, path: '/gastos', color: 'dbd-ac-amber' },
            { label: 'Ver reportes', sub: 'Análisis del edificio', icon: <IcoDoc />, path: '/reportes', color: 'dbd-ac-green' },
          ].map(a => (
            <button key={a.label} className={`dbd-acceso ${a.color}`} onClick={() => navigate(a.path)}>
              <div className="dbd-acceso-icon">{a.icon}</div>
              <span className="dbd-acceso-label">{a.label}</span>
              <span className="dbd-acceso-sub">{a.sub}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  DASHBOARD RESIDENTE (sin cambios)
// ══════════════════════════════════════════════════════════════════
function ResidenteDashboard({ user }) {
  const navigate   = useNavigate()
  const ahora      = new Date()
  const mesActual  = ahora.getMonth() + 1
  const anioActual = ahora.getFullYear()

  const [cuotas,        setCuotas]        = useState([])
  const [loading,       setLoading]       = useState(true)
  const [verMasFuturas, setVerMasFuturas] = useState(false)
  const [error,         setError]         = useState('')

  useEffect(() => {
    api.get('/api/pagos/mis-cuotas').then(r => setCuotas(r.data)).catch(() => setError('No se pudo cargar la información')).finally(() => setLoading(false))
  }, [])

  const esFuturo = c => c.anio > anioActual || (c.anio === anioActual && c.mes > mesActual)
  const tienePagoPendiente   = c => c.pagos?.some(p => p.estado === 'PENDIENTE_VERIFICACION')
  const cuotasPagadas        = cuotas.filter(c => c.estadoCuota === 'PAGADO' || c.estadoCuota === 'VERIFICADO')
  const cuotasEnVerificacion = cuotas.filter(tienePagoPendiente)
  const cuotasUrgentes       = cuotas.filter(c => (c.estadoCuota === 'PENDIENTE' || c.estadoCuota === 'VENCIDO') && !esFuturo(c) && !tienePagoPendiente(c))
  const todasCuotasFuturas   = cuotas.filter(c => c.estadoCuota === 'PENDIENTE' && esFuturo(c) && !tienePagoPendiente(c)).sort((a,b) => a.anio !== b.anio ? a.anio - b.anio : a.mes - b.mes)
  const cuotasFuturas        = verMasFuturas ? todasCuotasFuturas : todasCuotasFuturas.slice(0,3)
  const totalPagado          = cuotasPagadas.reduce((s,c) => s + Number(c.montoCalculado), 0)
  const totalPendiente       = cuotasUrgentes.reduce((s,c) => s + Number(c.montoCalculado), 0)
  const totalEnVerificacion  = cuotasEnVerificacion.reduce((s,c) => {
    const pagoPend = c.pagos.find(p => p.estado === 'PENDIENTE_VERIFICACION')
    return s + Number(pagoPend?.monto || 0)
  }, 0)

  return (
    <div className="db-page">
      <div className="db-welcome">
        <h1 className="db-welcome-title">Bienvenido, {user?.nombre}</h1>
        <p className="db-welcome-sub">Aquí tienes un resumen de tu cuenta en Residencial Torre Blanca</p>
      </div>
      {error && <div className="db-error">{error}</div>}
      {loading ? (
        <div className="db-skeleton-grid">{[...Array(3)].map((_,i) => <div key={i} className="db-skeleton-card" />)}</div>
      ) : (
        <>
          <div className="db-kpis">
            <div className="db-kpi db-kpi-pending"><div className="db-kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><div className="db-kpi-body"><p className="db-kpi-value">S/ {totalPendiente.toFixed(2)}</p><p className="db-kpi-label">Por pagar</p></div></div>
            <div className="db-kpi db-kpi-verify"><div className="db-kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div className="db-kpi-body"><p className="db-kpi-value">S/ {totalEnVerificacion.toFixed(2)}</p><p className="db-kpi-label">En verificación{cuotasEnVerificacion.length > 0 ? ` (${cuotasEnVerificacion.length})` : ''}</p></div></div>
            <div className="db-kpi db-kpi-paid"><div className="db-kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><div className="db-kpi-body"><p className="db-kpi-value">S/ {totalPagado.toFixed(2)}</p><p className="db-kpi-label">Total pagado</p></div></div>
          </div>

          {cuotasUrgentes.length > 0 && (
            <div className="db-section">
              <h2 className="db-section-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Pendientes de pago</h2>
              <div className="db-cuotas-list">
                {cuotasUrgentes.map(c => (
                  <div key={c.cuotaId} className={`db-cuota-card db-cuota-urgent ${c.estadoCuota==='VENCIDO'?'db-cuota-vencida':''}`}>
                    <div className="db-cuota-info"><p className="db-cuota-mes">{etiquetaMes(c.mes,c.anio)}</p><div className="db-cuota-depto"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Departamento {c.numeroDepartamento} · Piso {c.piso}</span></div><p className="db-cuota-monto">S/ {Number(c.montoCalculado).toFixed(2)}</p></div>
                    <div className="db-cuota-right"><span className={`db-badge ${c.estadoCuota==='VENCIDO'?'badge-danger':'badge-warning'}`}>{c.estadoCuota==='VENCIDO'?'Vencido':'Pendiente'}</span><button className="btn-pagar-ahora" onClick={() => navigate('/pagos')}>Ir a pagar <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cuotasEnVerificacion.length > 0 && (
            <div className="db-section">
              <h2 className="db-section-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Pagos en proceso de verificación</h2>
              <div className="db-cuotas-list">
                {cuotasEnVerificacion.map(c => (
                  <div key={c.cuotaId} className="db-cuota-card db-cuota-info-card">
                    <div className="db-cuota-info"><p className="db-cuota-mes">{etiquetaMes(c.mes,c.anio)}</p><p className="db-cuota-monto">S/ {Number(c.montoCalculado).toFixed(2)}</p></div>
                    <div className="db-cuota-right"><span className="db-badge badge-info">En verificación</span></div>
                  </div>
                ))}
              </div>
              <p className="db-verify-hint">El directivo revisará tu pago en breve.</p>
            </div>
          )}

          {cuotasUrgentes.length === 0 && cuotasEnVerificacion.length === 0 && (
            <div className="db-al-dia">
              <div className="db-al-dia-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
              <div><p className="db-al-dia-titulo">Estás al día</p><p className="db-al-dia-sub">No tienes cuotas del mes actual pendientes de pago.</p></div>
            </div>
          )}

          {todasCuotasFuturas.length > 0 && (
            <div className="db-section">
              <div className="db-section-header">
                <h2 className="db-section-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Próximas cuotas</h2>
                <button className="btn-pagar-varios" onClick={() => navigate('/pagos')}>Pagar varios meses <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button>
              </div>
              <p className="db-futuras-hint">Estas cuotas aún no están vencidas. Puedes adelantar el pago si lo deseas.</p>
              <div className="db-cuotas-list">
                {cuotasFuturas.map(c => (
                  <div key={c.cuotaId} className="db-cuota-card db-cuota-futura">
                    <div className="db-cuota-info"><p className="db-cuota-mes">{etiquetaMes(c.mes,c.anio)}</p><p className="db-cuota-monto">S/ {Number(c.montoCalculado).toFixed(2)}</p></div>
                    <div className="db-cuota-right"><span className="db-badge badge-neutral">Próxima</span><button className="btn-adelantar" onClick={() => navigate('/pagos')}>Adelantar <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button></div>
                  </div>
                ))}
              </div>
              {todasCuotasFuturas.length > 3 && (
                <button className="btn-ver-mas" onClick={() => setVerMasFuturas(!verMasFuturas)}>
                  {verMasFuturas ? 'Ver menos' : `Ver ${todasCuotasFuturas.length-3} más`}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Export principal ─────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)
  return esDirectivo
    ? <DirectivoDashboard user={user} />
    : <ResidenteDashboard user={user} />
}
