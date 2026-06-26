import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { textoLibreEstricto, sinNegativos } from '../utils/validaciones'
import PagoTarjeta from '../components/PagoTarjeta'
import './Pagos.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE','SECRETARIO','TESORERO']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const METODOS = ['TRANSFERENCIA','DEPOSITO','PLIN','EFECTIVO','OTRO']
const CAMPOS_METODO = {
  TRANSFERENCIA: [
    { key:'numeroOperacion', label:'N° de operación', placeholder:'Ej: 123456789' },
    { key:'bancoOrigen',     label:'Banco de origen', placeholder:'Ej: BCP, Interbank…' },
    { key:'voucherUrl',      label:'URL del voucher', placeholder:'https://…' },
  ],
  DEPOSITO: [
    { key:'numeroOperacion', label:'N° de operación', placeholder:'Ej: 123456789' },
    { key:'bancoOrigen',     label:'Banco donde depositó', placeholder:'Ej: BCP…' },
    { key:'voucherUrl',      label:'URL del voucher', placeholder:'https://…' },
  ],
  PLIN: [
    { key:'numeroOperacion', label:'N° de operación Plin', placeholder:'Código de la transacción' },
    { key:'voucherUrl',      label:'URL del voucher', placeholder:'https://…' },
  ],
  EFECTIVO: [
    { key:'observaciones', label:'Observaciones', placeholder:'Ej: Entregado al tesorero' },
  ],
  OTRO: [
    { key:'numeroOperacion', label:'N° de operación', placeholder:'Opcional' },
    { key:'observaciones',   label:'Observaciones',   placeholder:'Describe el método' },
    { key:'voucherUrl',      label:'URL del voucher', placeholder:'https://…' },
  ],
}

const etiquetaMes = (mes, anio) =>
  mes && anio ? `${MESES[mes - 1]} ${anio}` : '—'

// ── Íconos ──────────────────────────────────────────────────────
const IcoAlert  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IcoCal    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IcoHist   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IcoCheck  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoCard   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
const IcoDoc    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
const IcoChevDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
const IcoX      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

function StatusBadge({ estado }) {
  const map = {
    PAGADO:                 { label:'Pagado',          cls:'badge-ok'   },
    VERIFICADO:             { label:'Verificado',       cls:'badge-ok'   },
    PENDIENTE:              { label:'Pendiente',        cls:'badge-warn' },
    PENDIENTE_VERIFICACION: { label:'En verificación',  cls:'badge-info' },
    VENCIDO:                { label:'Vencido',          cls:'badge-err'  },
    RECHAZADO:              { label:'Rechazado',        cls:'badge-err'  },
  }
  const { label, cls } = map[estado] || { label: estado, cls:'badge-info' }
  return <span className={`pg-badge ${cls}`}>{label}</span>
}

// ══════════════════════════════════════════════════════════════════
//  VISTA RESIDENTE
// ══════════════════════════════════════════════════════════════════
function ResidentePagos({ user }) {
  const ahora      = new Date()
  const mesActual  = ahora.getMonth() + 1
  const anioActual = ahora.getFullYear()

  const [cuotas,          setCuotas]          = useState([])
  const [loading,         setLoading]         = useState(true)
  const [tab,             setTab]             = useState('pendientes')
  const [pagandoId,       setPagandoId]       = useState(null)   // cuotaId con panel abierto
  const [seleccionadas,   setSeleccionadas]   = useState(new Set())
  const [pagandoMultiple, setPagandoMultiple] = useState(false)
  const [verMasFuturas,   setVerMasFuturas]   = useState(false)
  const [anioHistorial,   setAnioHistorial]   = useState(anioActual)
  const [msg,             setMsg]             = useState('')
  const [error,           setError]           = useState('')

  useEffect(() => { cargarCuotas() }, [])

  const cargarCuotas = async () => {
    setLoading(true)
    try {
      const r = await api.get('/api/pagos/mis-cuotas')
      setCuotas(r.data)
    } catch { setError('No se pudo cargar la información') }
    finally { setLoading(false) }
  }

  const esFuturo = c =>
    c.anio > anioActual || (c.anio === anioActual && c.mes > mesActual)

  // Clasificar
  const deudas       = cuotas.filter(c => (c.estadoCuota === 'PENDIENTE' || c.estadoCuota === 'VENCIDO') && !esFuturo(c))
  const enVerif      = cuotas.filter(c => c.estadoCuota === 'PENDIENTE_VERIFICACION')
  const todasFuturas = cuotas.filter(c => c.estadoCuota === 'PENDIENTE' && esFuturo(c))
    .sort((a,b) => a.anio !== b.anio ? a.anio - b.anio : a.mes - b.mes)
  const futuras      = verMasFuturas ? todasFuturas : todasFuturas.slice(0,3)
  const pagadas      = cuotas.filter(c => c.estadoCuota === 'PAGADO' || c.estadoCuota === 'VERIFICADO')

  // KPIs
  const totalDeuda    = deudas.reduce((s,c) => s + Number(c.montoCalculado), 0)
  const totalPagadoAnio = pagadas.filter(c => c.anio === anioActual).reduce((s,c) => s + Number(c.montoCalculado), 0)

  // Historial filtrado por año
  const historialAnio = pagadas.filter(c => c.anio === anioHistorial)
  const aniosDisp     = [...new Set(pagadas.map(c => c.anio))].sort((a,b) => b - a)

  // Toggle checkbox
  const toggleSel = cuotaId => {
    setSeleccionadas(prev => {
      const s = new Set(prev)
      s.has(cuotaId) ? s.delete(cuotaId) : s.add(cuotaId)
      return s
    })
  }

  const totalSeleccionado = cuotas
    .filter(c => seleccionadas.has(c.cuotaId))
    .reduce((s,c) => s + Number(c.montoCalculado), 0)

  const handleExitoPago = () => {
    setPagandoId(null)
    setPagandoMultiple(false)
    setSeleccionadas(new Set())
    setMsg('Pago procesado correctamente. Tu boleta fue generada.')
    cargarCuotas()
    setTimeout(() => setMsg(''), 5000)
  }

  const cuotasSelArray = cuotas.filter(c => seleccionadas.has(c.cuotaId))

  if (loading) return (
    <div className="pg-skeleton">
      {[...Array(4)].map((_,i) => <div key={i} className="pg-skeleton-item" />)}
    </div>
  )

  return (
    <div className="pg-page">

      {/* Header */}
      <div className="pg-header">
        <div>
          <h1 className="pg-titulo">Mis pagos</h1>
          <p className="pg-subtitulo">Residencial Torre Blanca · {user?.nombre} {user?.apellido}</p>
        </div>
      </div>

      {msg   && <div className="pg-alert pg-alert-ok"><IcoCheck /> {msg}</div>}
      {error && <div className="pg-alert pg-alert-err">{error}</div>}

      {/* KPIs */}
      <div className="pg-kpis">
        <div className="pg-kpi">
          <div className="pg-kpi-icon pg-kpi-icon-err"><IcoAlert /></div>
          <div>
            <p className="pg-kpi-val">S/ {totalDeuda.toFixed(2)}</p>
            <p className="pg-kpi-lbl">Deuda pendiente</p>
          </div>
        </div>
        <div className="pg-kpi">
          <div className="pg-kpi-icon pg-kpi-icon-ok"><IcoCheck /></div>
          <div>
            <p className="pg-kpi-val">S/ {totalPagadoAnio.toFixed(2)}</p>
            <p className="pg-kpi-lbl">Pagado en {anioActual}</p>
          </div>
        </div>
        <div className="pg-kpi">
          <div className="pg-kpi-icon pg-kpi-icon-info"><IcoCal /></div>
          <div>
            <p className="pg-kpi-val">{todasFuturas.length}</p>
            <p className="pg-kpi-lbl">Cuotas futuras disponibles</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pg-tabs">
        {[
          { id:'pendientes', label:'Deudas', icon:<IcoAlert />, count: deudas.length + enVerif.length },
          { id:'proximas',   label:'Próximas', icon:<IcoCal />,  count: todasFuturas.length },
          { id:'historial',  label:'Historial', icon:<IcoHist />, count: pagadas.length },
        ].map(t => (
          <button key={t.id} className={`pg-tab ${tab===t.id?'pg-tab-active':''}`} onClick={() => { setTab(t.id); setPagandoId(null) }}>
            {t.icon}
            {t.label}
            {t.count > 0 && <span className="pg-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── TAB: Pendientes/Deudas ── */}
      {tab === 'pendientes' && (
        <div className="pg-tab-content">
          {deudas.length === 0 && enVerif.length === 0 && (
            <div className="pg-empty-state">
              <div className="pg-empty-icon"><IcoCheck /></div>
              <p className="pg-empty-title">Sin deudas pendientes</p>
              <p className="pg-empty-sub">Estás al día con tus pagos del mes actual.</p>
            </div>
          )}

          {deudas.length > 0 && (
            <>
              <div className="pg-section-label">
                <IcoAlert />
                Cuotas por pagar
                {deudas.some(c => seleccionadas.has(c.cuotaId)) && (
                  <button className="pg-link-sel-all" onClick={() => {
                    const todasDeuda = deudas.map(c => c.cuotaId)
                    setSeleccionadas(prev => {
                      const s = new Set(prev)
                      todasDeuda.forEach(id => s.add(id))
                      return s
                    })
                  }}>Seleccionar todas</button>
                )}
              </div>
              <div className="pg-cuotas">
                {deudas.map(c => (
                  <CuotaCard
                    key={c.cuotaId}
                    cuota={c}
                    seleccionada={seleccionadas.has(c.cuotaId)}
                    onToggle={() => toggleSel(c.cuotaId)}
                    pagandoEste={pagandoId === c.cuotaId}
                    onPagar={() => { setPagandoId(pagandoId === c.cuotaId ? null : c.cuotaId); setPagandoMultiple(false) }}
                    onExito={handleExitoPago}
                    user={user}
                  />
                ))}
              </div>
            </>
          )}

          {enVerif.length > 0 && (
            <>
              <div className="pg-section-label pg-section-label-info"><IcoHist /> En verificación</div>
              <div className="pg-cuotas">
                {enVerif.map(c => (
                  <div key={c.cuotaId} className="pg-cuota-row pg-cuota-verif">
                    <div className="pg-cuota-main">
                      <p className="pg-cuota-mes">{etiquetaMes(c.mes, c.anio)}</p>
                      <p className="pg-cuota-depto">Depto {c.numeroDepartamento} · Piso {c.piso}</p>
                    </div>
                    <div className="pg-cuota-right">
                      <span className="pg-cuota-monto">S/ {Number(c.montoCalculado).toFixed(2)}</span>
                      <StatusBadge estado="PENDIENTE_VERIFICACION" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="pg-verif-hint">El directivo revisará y aprobará en breve. Recibirás tu boleta automáticamente.</p>
            </>
          )}
        </div>
      )}

      {/* ── TAB: Próximas ── */}
      {tab === 'proximas' && (
        <div className="pg-tab-content">
          {todasFuturas.length === 0 ? (
            <div className="pg-empty-state">
              <div className="pg-empty-icon"><IcoCal /></div>
              <p className="pg-empty-title">Sin cuotas futuras</p>
              <p className="pg-empty-sub">El directivo aún no ha configurado los próximos meses.</p>
            </div>
          ) : (
            <>
              <div className="pg-section-label">
                <IcoCal />
                Cuotas disponibles para adelantar
                <span className="pg-section-hint">Selecciona una o varias para pagar</span>
              </div>
              <div className="pg-cuotas">
                {futuras.map(c => (
                  <CuotaCard
                    key={c.cuotaId}
                    cuota={c}
                    futura
                    seleccionada={seleccionadas.has(c.cuotaId)}
                    onToggle={() => toggleSel(c.cuotaId)}
                    pagandoEste={pagandoId === c.cuotaId}
                    onPagar={() => { setPagandoId(pagandoId === c.cuotaId ? null : c.cuotaId); setPagandoMultiple(false) }}
                    onExito={handleExitoPago}
                    user={user}
                  />
                ))}
              </div>
              {todasFuturas.length > 3 && (
                <button className="pg-btn-ver-mas" onClick={() => setVerMasFuturas(!verMasFuturas)}>
                  {verMasFuturas ? 'Ver menos' : `Ver ${todasFuturas.length - 3} cuota${todasFuturas.length-3>1?'s':''} más`}
                  <IcoChevDown />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB: Historial ── */}
      {tab === 'historial' && (
        <div className="pg-tab-content">
          <div className="pg-historial-header">
            <div className="pg-section-label" style={{margin:0}}><IcoHist /> Historial de pagos</div>
            <div className="pg-anio-filter">
              <span className="pg-anio-label">Año</span>
              <select className="pg-anio-select" value={anioHistorial} onChange={e => setAnioHistorial(Number(e.target.value))}>
                {aniosDisp.length === 0 && <option value={anioActual}>{anioActual}</option>}
                {aniosDisp.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {historialAnio.length === 0 ? (
            <div className="pg-empty-state">
              <div className="pg-empty-icon"><IcoDoc /></div>
              <p className="pg-empty-title">Sin pagos en {anioHistorial}</p>
              <p className="pg-empty-sub">No registramos pagos verificados en este año.</p>
            </div>
          ) : (
            <div className="pg-historial-tabla">
              <div className="pg-historial-head">
                <span>Período</span>
                <span>Departamento</span>
                <span>Monto</span>
                <span>Estado</span>
                <span>Boleta</span>
              </div>
              {historialAnio.map(c => (
                <div key={c.cuotaId} className="pg-historial-row">
                  <span className="pg-hist-mes">{etiquetaMes(c.mes, c.anio)}</span>
                  <span className="pg-hist-depto">Depto {c.numeroDepartamento} · Piso {c.piso}</span>
                  <span className="pg-hist-monto">S/ {Number(c.montoCalculado).toFixed(2)}</span>
                  <StatusBadge estado={c.estadoCuota} />
                  <button className="pg-btn-boleta" onClick={() => window.open(`/boletas`, '_self')}>
                    <IcoDoc /> Ver
                  </button>
                </div>
              ))}
              <div className="pg-historial-total">
                <span>Total pagado {anioHistorial}</span>
                <span className="pg-hist-total-val">
                  S/ {historialAnio.reduce((s,c) => s + Number(c.montoCalculado), 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Barra fija de pago múltiple (estilo Google Drive) ── */}
      {seleccionadas.size > 0 && (
        <div className="pg-barra-multiple">
          <button className="pg-barra-close" onClick={() => setSeleccionadas(new Set())}><IcoX /></button>
          <div className="pg-barra-info">
            <span className="pg-barra-count">{seleccionadas.size} cuota{seleccionadas.size>1?'s':''} seleccionada{seleccionadas.size>1?'s':''}</span>
            <span className="pg-barra-meses">
              {cuotasSelArray.map(c => etiquetaMes(c.mes, c.anio)).join(' · ')}
            </span>
          </div>
          <div className="pg-barra-total">
            <span className="pg-barra-total-lbl">Total</span>
            <span className="pg-barra-total-val">S/ {totalSeleccionado.toFixed(2)}</span>
          </div>
          <button className="pg-barra-btn" onClick={() => { setPagandoMultiple(true); setPagandoId(null) }}>
            <IcoCard />
            Pagar {seleccionadas.size > 1 ? 'todo' : 'ahora'}
          </button>
        </div>
      )}

      {/* Panel de pago múltiple inline */}
      {pagandoMultiple && cuotasSelArray.length > 0 && (
        <div className="pg-panel-multiple">
          <div className="pg-panel-header">
            <h3 className="pg-panel-titulo">Pago de {cuotasSelArray.length} cuota{cuotasSelArray.length>1?'s':''}</h3>
            <button className="pg-panel-close" onClick={() => setPagandoMultiple(false)}><IcoX /></button>
          </div>
          <div className="pg-panel-resumen">
            {cuotasSelArray.map(c => (
              <div key={c.cuotaId} className="pg-panel-resumen-row">
                <span>{etiquetaMes(c.mes, c.anio)}</span>
                <span>S/ {Number(c.montoCalculado).toFixed(2)}</span>
              </div>
            ))}
            <div className="pg-panel-resumen-total">
              <span>Total</span>
              <span>S/ {totalSeleccionado.toFixed(2)}</span>
            </div>
          </div>
          <PagoTarjeta
            cuota={{ ...cuotasSelArray[0], montoCalculado: totalSeleccionado }}
            residentesDepto={[]}
            esDirectivo={false}
            onExito={handleExitoPago}
            onCancelar={() => setPagandoMultiple(false)}
          />
        </div>
      )}
    </div>
  )
}

// ── Tarjeta de cuota con panel inline ───────────────────────────
function CuotaCard({ cuota, seleccionada, onToggle, pagandoEste, onPagar, onExito, user, futura }) {
  return (
    <div className={`pg-cuota-wrap ${pagandoEste ? 'pg-cuota-wrap-open' : ''}`}>
      <div className={`pg-cuota-row ${futura ? 'pg-cuota-futura' : cuota.estadoCuota === 'VENCIDO' ? 'pg-cuota-vencida' : 'pg-cuota-pendiente'}`}>
        <label className="pg-checkbox-wrap" onClick={e => e.stopPropagation()}>
          <input type="checkbox" checked={seleccionada} onChange={onToggle} className="pg-checkbox" />
          <span className="pg-checkbox-custom">{seleccionada && <IcoCheck />}</span>
        </label>
        <div className="pg-cuota-main">
          <p className="pg-cuota-mes">{etiquetaMes(cuota.mes, cuota.anio)}</p>
          <p className="pg-cuota-depto">Depto {cuota.numeroDepartamento} · Piso {cuota.piso}</p>
        </div>
        <div className="pg-cuota-right">
          <span className="pg-cuota-monto">S/ {Number(cuota.montoCalculado).toFixed(2)}</span>
          <StatusBadge estado={futura ? 'PENDIENTE' : cuota.estadoCuota} />
          <button className={`pg-btn-pagar ${pagandoEste ? 'pg-btn-pagar-active' : ''}`} onClick={onPagar}>
            {pagandoEste ? 'Cancelar' : 'Pagar'}
            {!pagandoEste && <IcoCard />}
          </button>
        </div>
      </div>

      {/* Panel inline de pago — se expande debajo */}
      <div className={`pg-inline-panel ${pagandoEste ? 'pg-inline-panel-open' : ''}`}>
        {pagandoEste && (
          <PagoTarjeta
            cuota={cuota}
            residentesDepto={[]}
            esDirectivo={false}
            onExito={onExito}
            onCancelar={onPagar}
          />
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  VISTA DIRECTIVO — sin cambios funcionales, solo limpieza
// ══════════════════════════════════════════════════════════════════
function DirectivoPagos({ user }) {
  const ahora = new Date()
  const [mes,        setMes]        = useState(ahora.getMonth() + 1)
  const [anio,       setAnio]       = useState(ahora.getFullYear())
  const [resumen,    setResumen]    = useState(null)
  const [pendientes, setPendientes] = useState([])
  const [configs,    setConfigs]    = useState([])
  const [loading,    setLoading]    = useState(false)
  const [tab,        setTab]        = useState('resumen')
  const [modal,      setModal]      = useState(null)
  const [selected,   setSelected]   = useState(null)
  const [form,       setForm]       = useState({})
  const [msg,        setMsg]        = useState('')
  const [error,      setError]      = useState('')
  const [residentesDepto, setResidentesDepto] = useState([])

  useEffect(() => { cargarDatos() }, [mes, anio, tab])

  const cargarDatos = async () => {
    setLoading(true); setError('')
    try {
      if (tab === 'resumen')    { const r = await api.get(`/api/pagos/resumen/${anio}/${mes}`); setResumen(r.data) }
      if (tab === 'pendientes') { const r = await api.get('/api/pagos/pendientes'); setPendientes(r.data) }
      if (tab === 'configurar') { const r = await api.get('/api/pagos/configuraciones'); setConfigs(r.data) }
    } catch (e) {
      setError(e.response?.status === 400 ? e.response.data : 'Error al cargar datos')
    } finally { setLoading(false) }
  }

  const abrirPago = async (cuota) => {
    setSelected(cuota)
    setForm({ monto: cuota.montoCalculado, metodoPago:'TRANSFERENCIA', numeroOperacion:'', bancoOrigen:'', voucherUrl:'', observaciones:'', pagadorId:'' })
    setModal('pago'); setMsg(''); setError('')
    if (cuota.departamentoId) {
      try { const r = await api.get(`/api/pagos/departamento/${cuota.departamentoId}/residentes`); setResidentesDepto(r.data) }
      catch { setResidentesDepto([]) }
    }
  }

  const guardarPago = async () => {
    if (!form.pagadorId) { setError('Selecciona quién realizó el pago'); return }
    if (!form.monto || Number(form.monto) <= 0) { setError('El monto debe ser mayor a cero'); return }
    try {
      const obs = form.bancoOrigen ? 'Banco ' + form.bancoOrigen + (form.observaciones ? ' ' + form.observaciones : '') : form.observaciones
      await api.post('/api/pagos/registrar', { cuotaId: selected.cuotaId, monto: Number(form.monto), metodoPago: form.metodoPago, numeroOperacion: form.numeroOperacion || null, voucherUrl: form.voucherUrl || null, observaciones: obs || null, pagadorId: Number(form.pagadorId) })
      setMsg('Pago registrado. Pendiente de verificación.'); cargarDatos(); setTimeout(() => { setModal(null); setMsg('') }, 1500)
    } catch (e) { setError(e.response?.data || 'Error al registrar pago') }
  }

  const verificarPago = async (pagoId, accion) => {
    const obs = accion === 'RECHAZAR' ? prompt('Motivo del rechazo (opcional):') : ''
    try { await api.patch(`/api/pagos/${pagoId}/verificar`, { accion, observaciones: obs || '' }); cargarDatos() }
    catch (e) { alert(e.response?.data || 'Error') }
  }

  const guardarConfig = async () => {
    try {
      const r = await api.post('/api/pagos/configurar-mes', { mes: Number(form.mes), anio: Number(form.anio), costoPorM2: Number(form.costoPorM2), totalGastosEstimados: form.totalGastosEstimados ? Number(form.totalGastosEstimados) : null, observaciones: form.observaciones || null })
      setMsg(r.data.mensaje); cargarDatos(); setTimeout(() => { setModal(null); setMsg('') }, 1500)
    } catch (e) { setError(e.response?.data || 'Error') }
  }

  const guardarEditConfig = async () => {
    try {
      await api.put(`/api/pagos/configuraciones/${selected.id}`, { costoPorM2: Number(form.costoPorM2), totalGastosEstimados: form.totalGastosEstimados ? Number(form.totalGastosEstimados) : null, observaciones: form.observaciones || null })
      setMsg('Actualizado'); cargarDatos(); setTimeout(() => { setModal(null); setMsg('') }, 1500)
    } catch (e) { setError(e.response?.data || 'Error') }
  }

  const eliminarConfig = async (c) => {
    if (!confirm(`¿Eliminar configuración de ${MESES[c.mes-1]} ${c.anio}?`)) return
    try { await api.delete('/api/pagos/configuraciones/' + c.id); cargarDatos() }
    catch (e) { alert(e.response?.data || 'Error') }
  }

  const estadoColor = e => ({ PAGADO:'pill-success', VERIFICADO:'pill-success', VENCIDO:'pill-danger', RECHAZADO:'pill-danger', PENDIENTE_VERIFICACION:'pill-warning' }[e] || 'pill-neutral')
  const estadoLabel = e => ({ PENDIENTE:'Pendiente', PAGADO:'Pagado', VENCIDO:'Vencido', EXONERADO:'Exonerado', PENDIENTE_VERIFICACION:'En verificación', VERIFICADO:'Verificado', RECHAZADO:'Rechazado' }[e] || e)
  const camposActuales = CAMPOS_METODO[form.metodoPago] || []

  return (
    <div className="pagos-page">
      <h1 className="page-title">Pagos</h1>
      <p className="page-subtitle">Control de pagos de mantenimiento mensual</p>

      <div className="pagos-tabs">
        {[['resumen','Resumen del mes'],['pendientes','Pendientes de verificación'],['configurar','Configurar mes']].map(([k,l]) => (
          <button key={k} className={'pagos-tab ' + (tab===k?'pagos-tab-active':'')} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'resumen' && (
        <div>
          <div className="mes-selector">
            <select className="mes-select" value={mes} onChange={e => setMes(Number(e.target.value))}>
              {MESES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select className="mes-select" value={anio} onChange={e => setAnio(Number(e.target.value))}>
              {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          {loading && <div className="loading-msg">Cargando...</div>}
          {error && <div className="alert-error">{error}</div>}
          {resumen && (
            <>
              <div className="resumen-grid">
                <div className="resumen-card rc-blue"><p className="rc-value">S/ {resumen.totalEsperado?.toFixed(2)}</p><p className="rc-label">Total esperado</p></div>
                <div className="resumen-card rc-green"><p className="rc-value">S/ {resumen.totalRecaudado?.toFixed(2)}</p><p className="rc-label">Recaudado</p></div>
                <div className="resumen-card rc-red"><p className="rc-value">S/ {resumen.totalPendiente?.toFixed(2)}</p><p className="rc-label">Por cobrar</p></div>
                <div className="resumen-card rc-neutral"><p className="rc-value">{resumen.pagados} / {resumen.totalDepartamentos}</p><p className="rc-label">Deptos pagados</p></div>
              </div>
              <div className="cuotas-lista">
                {resumen.cuotas?.map(c => (
                  <div key={c.cuotaId} className="cuota-card">
                    <div className="cuota-depto"><span className="depto-num">{c.numeroDepartamento}</span><span className="depto-piso">Piso {c.piso}</span></div>
                    <div className="cuota-info">
                      {c.residentesNombres?.length > 0
                        ? c.residentesNombres.map((n,i) => <p key={i} className="cuota-responsable">{n}</p>)
                        : <p className="cuota-responsable sin-residente">Sin residentes</p>}
                    </div>
                    <div className="cuota-monto">S/ {c.montoCalculado?.toFixed(2)}</div>
                    <span className={'pill ' + estadoColor(c.estadoCuota)}>{estadoLabel(c.estadoCuota)}</span>
                    {c.estadoCuota !== 'PAGADO' && <button className="btn btn-ghost btn-sm" onClick={() => abrirPago(c)}>Registrar pago</button>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'pendientes' && (
        <div>
          {loading && <div className="loading-msg">Cargando...</div>}
          {pendientes.length === 0 && !loading && <div className="empty-state">No hay pagos pendientes de verificación.</div>}
          <div className="pendientes-lista">
            {pendientes.map(p => (
              <div key={p.pagoId} className="pendiente-card">
                <div className="pendiente-depto"><span className="depto-num">{p.numeroDepartamento}</span><span className="depto-piso">Piso {p.piso}</span></div>
                <div className="pendiente-info">
                  <p className="pendiente-pagador">{p.pagadorNombre}</p>
                  <p className="pendiente-meta">{p.metodoPago}{p.numeroOperacion ? ' · Op: ' + p.numeroOperacion : ''}</p>
                  {p.observaciones && <p className="pendiente-obs">{p.observaciones}</p>}
                  {p.voucherUrl && <a href={p.voucherUrl} target="_blank" rel="noreferrer" className="voucher-link">Ver voucher</a>}
                </div>
                <div className="pendiente-monto">S/ {p.monto?.toFixed(2)}</div>
                <div className="pendiente-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => verificarPago(p.pagoId,'APROBAR')}>Aprobar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => verificarPago(p.pagoId,'RECHAZAR')}>Rechazar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'configurar' && (
        <div>
          <div style={{marginBottom:16}}>
            <button className="btn btn-primary" onClick={() => { setForm({ mes: ahora.getMonth()+1, anio: ahora.getFullYear(), costoPorM2:'', totalGastosEstimados:'', observaciones:'' }); setModal('configurar'); setMsg(''); setError('') }}>Configurar nuevo mes</button>
          </div>
          <div className="configs-lista">
            {configs.length === 0 && <div className="empty-state">No hay configuraciones registradas.</div>}
            {configs.map(c => (
              <div key={c.id} className="config-card">
                <div><p className="config-periodo">{MESES[c.mes-1]} {c.anio}</p><p className="config-costo">S/ {c.costoPorM2} por m²</p>{c.observaciones && <p className="config-obs">{c.observaciones}</p>}</div>
                <div className="config-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(c); setForm({ costoPorM2:c.costoPorM2, totalGastosEstimados:c.totalGastosEstimados||'', observaciones:c.observaciones||'' }); setModal('editarConfig'); setMsg(''); setError('') }}>Editar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => eliminarConfig(c)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modales directivo */}
      {modal === 'pago' && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">Registrar pago manual</h3>
            <p className="modal-sub">Depto <strong>{selected?.numeroDepartamento}</strong> · S/ {selected?.montoCalculado?.toFixed(2)}</p>
            <div className="modal-scroll"><div className="modal-form">
              <div className="form-group"><label>Monto (S/)</label><input type="number" min="0" step="0.01" value={form.monto||''} onChange={e => setForm({...form,monto:sinNegativos(e.target.value)})} /></div>
              <div className="form-group"><label>Pagador</label>
                <select value={form.pagadorId||''} onChange={e => setForm({...form,pagadorId:e.target.value})}>
                  <option value="">-- Selecciona el residente --</option>
                  {residentesDepto.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.tipo==='PROPIETARIO'?'Propietario':'Inquilino'})</option>)}
                </select>
                {residentesDepto.length===0 && <p className="label-hint">Sin residentes registrados</p>}
              </div>
              <div className="form-group"><label>Método</label>
                <div className="metodos-grid">{METODOS.map(m => <button key={m} type="button" className={'metodo-btn '+(form.metodoPago===m?'metodo-active':'')} onClick={() => setForm({...form,metodoPago:m,numeroOperacion:'',bancoOrigen:'',voucherUrl:'',observaciones:''})}>{m}</button>)}</div>
              </div>
              {camposActuales.map(campo => (
                <div className="form-group" key={campo.key}><label>{campo.label}</label>
                  <input value={form[campo.key]||''} onChange={e => { const v = campo.key==='voucherUrl'?e.target.value:textoLibreEstricto(e.target.value); setForm({...form,[campo.key]:v}) }} placeholder={campo.placeholder} />
                </div>
              ))}
            </div></div>
            {msg   && <p className="modal-success">{msg}</p>}
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarPago}>Registrar</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'configurar' && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">Configurar mes</h3>
            <div className="modal-scroll"><div className="modal-form">
              <div className="form-group"><label>Mes</label><select value={form.mes} onChange={e => setForm({...form,mes:e.target.value})}>{MESES.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select></div>
              <div className="form-group"><label>Año</label><select value={form.anio} onChange={e => setForm({...form,anio:e.target.value})}>{[2024,2025,2026].map(a=><option key={a} value={a}>{a}</option>)}</select></div>
              <div className="form-group"><label>Costo por m²</label><input type="number" min="0" step="0.01" value={form.costoPorM2||''} onChange={e => setForm({...form,costoPorM2:sinNegativos(e.target.value)})} /></div>
              <div className="form-group"><label>Total gastos estimados</label><input type="number" min="0" step="0.01" value={form.totalGastosEstimados||''} onChange={e => setForm({...form,totalGastosEstimados:sinNegativos(e.target.value)})} /></div>
              <div className="form-group"><label>Observaciones</label><input value={form.observaciones||''} onChange={e => setForm({...form,observaciones:textoLibreEstricto(e.target.value)})} /></div>
            </div></div>
            {msg   && <p className="modal-success">{msg}</p>}
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarConfig}>Generar cuotas</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'editarConfig' && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">Editar configuración</h3>
            <p className="modal-sub">{MESES[selected?.mes-1]} {selected?.anio}</p>
            <div className="modal-form" style={{marginTop:14}}>
              <div className="form-group"><label>Costo por m²</label><input type="number" min="0" step="0.01" value={form.costoPorM2||''} onChange={e => setForm({...form,costoPorM2:sinNegativos(e.target.value)})} /></div>
              <div className="form-group"><label>Total gastos estimados</label><input type="number" min="0" step="0.01" value={form.totalGastosEstimados||''} onChange={e => setForm({...form,totalGastosEstimados:sinNegativos(e.target.value)})} /></div>
              <div className="form-group"><label>Observaciones</label><input value={form.observaciones||''} onChange={e => setForm({...form,observaciones:textoLibreEstricto(e.target.value)})} /></div>
            </div>
            {msg   && <p className="modal-success">{msg}</p>}
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarEditConfig}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  EXPORT PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function Pagos() {
  const { user } = useAuth()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)
  return esDirectivo ? <DirectivoPagos user={user} /> : <ResidentePagos user={user} />
}
