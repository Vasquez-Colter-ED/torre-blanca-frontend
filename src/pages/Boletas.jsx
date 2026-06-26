import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Boletas.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE','SECRETARIO','TESORERO']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const METODO_LABEL = {
  TRANSFERENCIA: 'Transferencia', DEPOSITO: 'Depósito',
  PLIN: 'Plin', EFECTIVO: 'Efectivo',
  OTRO: 'Otro', TARJETA: 'Tarjeta', TRANSFERENCIA_BANCARIA: 'Transferencia'
}

// ── Íconos ──────────────────────────────────────────────────────
const IcoCheck  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoDoc    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
const IcoPrint  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
const IcoImg    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
const IcoX      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoCard   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
const IcoBank   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
const IcoCash   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>

function MetodoIcon({ metodo }) {
  if (!metodo) return null
  const m = metodo.toUpperCase()
  if (m.includes('TARJETA') || m === 'TRANSFERENCIA_MP') return <IcoCard />
  if (m.includes('EFECTIVO')) return <IcoCash />
  return <IcoBank />
}

// ══════════════════════════════════════════════════════════════════
//  VISTA RESIDENTE — Calendario de 12 meses
// ══════════════════════════════════════════════════════════════════
function ResidenteRecibos({ user }) {
  const ahora = new Date()
  const [boletas,    setBoletas]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [anio,       setAnio]       = useState(ahora.getFullYear())
  const [mesSelec,   setMesSelec]   = useState(null) // 1-12
  const [error,      setError]      = useState('')
  const detalleRef = useRef(null)

  useEffect(() => { cargarBoletas() }, [])

  const cargarBoletas = async () => {
    setLoading(true)
    try { const r = await api.get('/api/boletas'); setBoletas(r.data) }
    catch { setError('No se pudieron cargar los recibos') }
    finally { setLoading(false) }
  }

  // Boletas del año seleccionado indexadas por mes
  const boletasPorMes = {}
  boletas.filter(b => b.anio === anio).forEach(b => { boletasPorMes[b.mes] = b })

  // Años disponibles
  const aniosDisp = [...new Set(boletas.map(b => b.anio))].sort((a,b) => b - a)
  if (!aniosDisp.includes(ahora.getFullYear())) aniosDisp.unshift(ahora.getFullYear())

  // Resumen del año
  const boletasAnio  = boletas.filter(b => b.anio === anio)
  const totalAnio    = boletasAnio.reduce((s,b) => s + Number(b.monto || 0), 0)
  const mesesPagados = boletasAnio.length

  // Recibo seleccionado
  const reciboSelec = mesSelec ? boletasPorMes[mesSelec] : null

  const handleMesClick = (mes) => {
    if (!boletasPorMes[mes]) return // mes sin recibo, no hace nada
    setMesSelec(mesSelec === mes ? null : mes)
    setTimeout(() => detalleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
  }

  const imprimir = () => window.print()

  if (loading) return (
    <div className="rb-skeleton">
      <div className="rb-skeleton-header" />
      <div className="rb-skeleton-grid">
        {[...Array(12)].map((_,i) => <div key={i} className="rb-skeleton-card" />)}
      </div>
    </div>
  )

  return (
    <div className="rb-page">

      {/* Header */}
      <div className="rb-header">
        <div>
          <h1 className="rb-titulo">Mis recibos</h1>
          <p className="rb-subtitulo">Historial de pagos verificados · {user?.nombre} {user?.apellido}</p>
        </div>
      </div>

      {error && <div className="rb-error">{error}</div>}

      {/* Selector de año */}
      <div className="rb-anio-tabs">
        {aniosDisp.map(a => (
          <button key={a} className={`rb-anio-tab ${anio === a ? 'rb-anio-tab-active' : ''}`}
            onClick={() => { setAnio(a); setMesSelec(null) }}>
            {a}
          </button>
        ))}
      </div>

      {/* Resumen del año */}
      <div className="rb-resumen">
        <div className="rb-resumen-item">
          <p className="rb-resumen-val">{mesesPagados}<span className="rb-resumen-de">/12</span></p>
          <p className="rb-resumen-lbl">Meses pagados</p>
        </div>
        <div className="rb-resumen-sep" />
        <div className="rb-resumen-item">
          <p className="rb-resumen-val">S/ {totalAnio.toFixed(2)}</p>
          <p className="rb-resumen-lbl">Total pagado {anio}</p>
        </div>
        <div className="rb-resumen-sep" />
        <div className="rb-resumen-item">
          <p className="rb-resumen-val">{12 - mesesPagados}</p>
          <p className="rb-resumen-lbl">Meses pendientes</p>
        </div>
        {/* Barra de progreso */}
        <div className="rb-resumen-progreso">
          <div className="rb-progreso-bar">
            <div className="rb-progreso-fill" style={{ width: `${(mesesPagados/12)*100}%` }} />
          </div>
          <span className="rb-progreso-pct">{Math.round((mesesPagados/12)*100)}%</span>
        </div>
      </div>

      {/* Grid de 12 meses */}
      <div className="rb-grid">
        {MESES.map((mes, i) => {
          const numMes   = i + 1
          const boleta   = boletasPorMes[numMes]
          const esPagado = !!boleta
          const esActivo = mesSelec === numMes
          const esPasado = numMes < ahora.getMonth() + 1 && anio === ahora.getFullYear()
          const esFuturo = anio > ahora.getFullYear() || (anio === ahora.getFullYear() && numMes > ahora.getMonth() + 1)

          return (
            <div
              key={numMes}
              className={`rb-mes-card
                ${esPagado ? 'rb-mes-pagado' : ''}
                ${esActivo ? 'rb-mes-activo' : ''}
                ${!esPagado && esPasado ? 'rb-mes-sin-pago' : ''}
                ${!esPagado && esFuturo ? 'rb-mes-futuro' : ''}
                ${esPagado ? 'rb-mes-clickable' : ''}
              `}
              onClick={() => handleMesClick(numMes)}
            >
              <span className="rb-mes-nombre">{MESES_CORTO[i]}</span>
              {esPagado ? (
                <>
                  <span className="rb-mes-check"><IcoCheck /></span>
                  <span className="rb-mes-monto">S/ {Number(boleta.monto).toFixed(2)}</span>
                </>
              ) : (
                <span className="rb-mes-dash">—</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Panel de detalle del recibo */}
      <div ref={detalleRef}>
        {mesSelec && reciboSelec && (
          <div className="rb-detalle">
            <div className="rb-detalle-header">
              <div>
                <h2 className="rb-detalle-titulo">Recibo de pago</h2>
                <p className="rb-detalle-periodo">{MESES[mesSelec-1]} {anio}</p>
              </div>
              <div className="rb-detalle-acciones">
                <button className="rb-btn-imprimir" onClick={imprimir}>
                  <IcoPrint /> Imprimir
                </button>
                <button className="rb-btn-cerrar" onClick={() => setMesSelec(null)}>
                  <IcoX />
                </button>
              </div>
            </div>

            <div className="rb-detalle-body">
              <div className="rb-detalle-grid">
                <div className="rb-detalle-campo">
                  <span className="rb-detalle-lbl">Período</span>
                  <span className="rb-detalle-val">{MESES[mesSelec-1]} {anio}</span>
                </div>
                <div className="rb-detalle-campo">
                  <span className="rb-detalle-lbl">Departamento</span>
                  <span className="rb-detalle-val">Depto {reciboSelec.numeroDepartamento} · Piso {reciboSelec.piso}</span>
                </div>
                <div className="rb-detalle-campo">
                  <span className="rb-detalle-lbl">Monto pagado</span>
                  <span className="rb-detalle-val rb-detalle-monto">S/ {Number(reciboSelec.monto).toFixed(2)}</span>
                </div>
                <div className="rb-detalle-campo">
                  <span className="rb-detalle-lbl">Método de pago</span>
                  <span className="rb-detalle-val rb-detalle-metodo">
                    <MetodoIcon metodo={reciboSelec.metodoPago} />
                    {METODO_LABEL[reciboSelec.metodoPago] || reciboSelec.metodoPago}
                  </span>
                </div>
                {reciboSelec.fechaPago && (
                  <div className="rb-detalle-campo">
                    <span className="rb-detalle-lbl">Fecha de pago</span>
                    <span className="rb-detalle-val">{new Date(reciboSelec.fechaPago).toLocaleDateString('es-PE', { day:'2-digit', month:'long', year:'numeric' })}</span>
                  </div>
                )}
                {reciboSelec.numeroOperacion && (
                  <div className="rb-detalle-campo">
                    <span className="rb-detalle-lbl">N° de operación</span>
                    <span className="rb-detalle-val rb-codigo">{reciboSelec.numeroOperacion}</span>
                  </div>
                )}
                <div className="rb-detalle-campo">
                  <span className="rb-detalle-lbl">Estado</span>
                  <span className="rb-badge-ok"><IcoCheck /> Verificado</span>
                </div>
                <div className="rb-detalle-campo">
                  <span className="rb-detalle-lbl">Titular</span>
                  <span className="rb-detalle-val">{reciboSelec.pagadorNombre || `${user?.nombre} ${user?.apellido}`}</span>
                </div>
              </div>

              {/* Voucher foto */}
              {reciboSelec.voucherUrl && (
                <div className="rb-voucher">
                  <p className="rb-voucher-lbl"><IcoImg /> Comprobante adjunto</p>
                  <img src={reciboSelec.voucherUrl} alt="Comprobante" className="rb-voucher-img"
                    onClick={() => window.open(reciboSelec.voucherUrl, '_blank')} />
                </div>
              )}
            </div>

            <div className="rb-detalle-footer">
              Residencial Torre Blanca · Chiclayo, Perú · Este recibo es un comprobante interno de pago.
            </div>
          </div>
        )}
      </div>

      {boletas.length === 0 && !loading && (
        <div className="rb-empty">
          <IcoDoc />
          <p className="rb-empty-t">Sin recibos aún</p>
          <p className="rb-empty-s">Cuando realices un pago verificado, aparecerá aquí.</p>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  VISTA DIRECTIVO — tabla simple con filtros
// ══════════════════════════════════════════════════════════════════
function DirectivoRecibos() {
  const [boletas,    setBoletas]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filtroMes,  setFiltroMes]  = useState('')
  const [filtroAnio, setFiltroAnio] = useState('')
  const [selected,   setSelected]   = useState(null)
  const [error,      setError]      = useState('')

  useEffect(() => {
    api.get('/api/boletas').then(r => setBoletas(r.data)).catch(() => setError('Error al cargar')).finally(() => setLoading(false))
  }, [])

  const filtradas = boletas.filter(b => {
    if (filtroMes  && b.mes  !== Number(filtroMes))  return false
    if (filtroAnio && b.anio !== Number(filtroAnio)) return false
    return true
  })

  const aniosDisp = [...new Set(boletas.map(b => b.anio))].sort((a,b) => b-a)

  return (
    <div className="rb-dir-page">
      <h1 className="rb-titulo">Recibos emitidos</h1>
      <p className="rb-subtitulo">Historial de recibos de todos los departamentos</p>

      <div className="rb-dir-toolbar">
        <select className="rb-dir-select" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
          <option value="">Todos los meses</option>
          {MESES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select className="rb-dir-select" value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}>
          <option value="">Todos los años</option>
          {aniosDisp.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="rb-dir-count">{filtradas.length} recibo{filtradas.length !== 1 ? 's' : ''}</span>
      </div>

      {error && <div className="rb-error">{error}</div>}
      {loading && <div className="rb-loading">Cargando...</div>}

      <div className="rb-dir-tabla">
        <div className="rb-dir-head">
          <span>Período</span>
          <span>Departamento</span>
          <span>Residente</span>
          <span>Monto</span>
          <span>Método</span>
          <span>Voucher</span>
        </div>
        {filtradas.map(b => (
          <div key={b.boletaId} className={`rb-dir-row ${selected?.boletaId === b.boletaId ? 'rb-dir-row-active' : ''}`}
            onClick={() => setSelected(selected?.boletaId === b.boletaId ? null : b)}>
            <span className="rb-dir-mes">{MESES[b.mes-1]} {b.anio}</span>
            <span>Depto {b.numeroDepartamento} · P{b.piso}</span>
            <span className="rb-dir-nombre">{b.pagadorNombre}</span>
            <span className="rb-dir-monto">S/ {Number(b.monto).toFixed(2)}</span>
            <span className="rb-dir-metodo">
              <MetodoIcon metodo={b.metodoPago} />
              {METODO_LABEL[b.metodoPago] || b.metodoPago}
            </span>
            <span>
              {b.voucherUrl
                ? <a href={b.voucherUrl} target="_blank" rel="noreferrer" className="rb-dir-voucher-link" onClick={e => e.stopPropagation()}>Ver</a>
                : <span className="rb-dir-sin-voucher">—</span>
              }
            </span>
          </div>
        ))}
        {filtradas.length === 0 && !loading && (
          <div className="rb-dir-empty">No hay recibos con ese filtro.</div>
        )}
      </div>

      {/* Preview voucher si está seleccionado y tiene foto */}
      {selected?.voucherUrl && (
        <div className="rb-dir-preview">
          <div className="rb-dir-preview-header">
            <span>Comprobante — Depto {selected.numeroDepartamento} · {MESES[selected.mes-1]} {selected.anio}</span>
            <button className="rb-btn-cerrar" onClick={() => setSelected(null)}><IcoX /></button>
          </div>
          <img src={selected.voucherUrl} alt="Comprobante" className="rb-dir-preview-img" />
        </div>
      )}
    </div>
  )
}

// ── Export principal ─────────────────────────────────────────────
export default function Boletas() {
  const { user } = useAuth()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)
  return esDirectivo ? <DirectivoRecibos /> : <ResidenteRecibos user={user} />
}
