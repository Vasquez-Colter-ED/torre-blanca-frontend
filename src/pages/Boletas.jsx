import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import ReciboDetalle from '../components/ReciboDetalle'
import './Boletas.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE','SECRETARIO','TESORERO']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const METODO_LABEL = {
  TRANSFERENCIA: 'Transferencia', DEPOSITO: 'Depósito',
  YAPE: 'Yape', PLIN: 'Plin', EFECTIVO: 'Efectivo',
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
  const [mesSelec,   setMesSelec]   = useState(null)
  const [reciboOpen, setReciboOpen] = useState(null) // boleta para mostrar en ReciboDetalle
  const [error,      setError]      = useState('')
  const detalleRef = useRef()

  useEffect(() => { cargarBoletas() }, [])

  const cargarBoletas = async () => {
    setLoading(true)
    try { const r = await api.get('/api/boletas'); setBoletas(r.data) }
    catch { setError('No se pudieron cargar los recibos') }
    finally { setLoading(false) }
  }

  // Boletas del año seleccionado, agrupadas por mes (un mes puede tener
  // más de un recibo si hubo pago parcial + saldo, por ejemplo)
  const boletasPorMes = {}
  boletas.filter(b => b.anio === anio).forEach(b => {
    if (!boletasPorMes[b.mes]) boletasPorMes[b.mes] = []
    boletasPorMes[b.mes].push(b)
  })
  Object.values(boletasPorMes).forEach(lista => lista.sort((a, b) => new Date(a.fechaPago) - new Date(b.fechaPago)))

  // Años disponibles
  const aniosDisp = [...new Set(boletas.map(b => b.anio))].sort((a,b) => b - a)
  if (!aniosDisp.includes(ahora.getFullYear())) aniosDisp.unshift(ahora.getFullYear())

  // Resumen del año
  const boletasAnio  = boletas.filter(b => b.anio === anio)
  const totalAnio    = boletasAnio.reduce((s,b) => s + Number(b.monto || 0), 0)
  const mesesPagados = Object.keys(boletasPorMes).length

  // Recibos del mes seleccionado
  const recibosDelMes = mesSelec ? (boletasPorMes[mesSelec] || []) : []

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
          const recibosMes = boletasPorMes[numMes] || []
          const esPagado = recibosMes.length > 0
          const montoMes = recibosMes.reduce((s, b) => s + Number(b.monto || 0), 0)
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
                  <span className="rb-mes-monto">S/ {montoMes.toFixed(2)}</span>
                  {recibosMes.length > 1 && <span className="rb-mes-multi">{recibosMes.length} pagos</span>}
                </>
              ) : (
                <span className="rb-mes-dash">—</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Panel de detalle del recibo (uno o varios, si el mes tuvo más de un pago) */}
      <div ref={detalleRef}>
        {mesSelec && recibosDelMes.length > 0 && (
          <div className="rb-detalle">
            <div className="rb-detalle-header">
              <div>
                <h2 className="rb-detalle-titulo">
                  {recibosDelMes.length > 1 ? `Recibos de pago (${recibosDelMes.length})` : 'Recibo de pago'}
                </h2>
                <p className="rb-detalle-periodo">{MESES[mesSelec-1]} {anio}</p>
              </div>
              <button className="rb-btn-cerrar" onClick={() => setMesSelec(null)}>
                <IcoX />
              </button>
            </div>

            {recibosDelMes.map((recibo, idx) => (
              <div key={recibo.id || idx} className="rb-detalle-body">
                {recibosDelMes.length > 1 && (
                  <p className="rb-detalle-subtitulo">Pago {idx + 1} de {recibosDelMes.length}</p>
                )}
                <div className="rb-detalle-grid">
                  <div className="rb-detalle-campo">
                    <span className="rb-detalle-lbl">Período</span>
                    <span className="rb-detalle-val">{MESES[mesSelec-1]} {anio}</span>
                  </div>
                  <div className="rb-detalle-campo">
                    <span className="rb-detalle-lbl">Departamento</span>
                    <span className="rb-detalle-val">Depto {recibo.numeroDepartamento} · Piso {recibo.piso}</span>
                  </div>
                  <div className="rb-detalle-campo">
                    <span className="rb-detalle-lbl">Monto pagado</span>
                    <span className="rb-detalle-val rb-detalle-monto">S/ {Number(recibo.monto).toFixed(2)}</span>
                  </div>
                  <div className="rb-detalle-campo">
                    <span className="rb-detalle-lbl">Método de pago</span>
                    <span className="rb-detalle-val rb-detalle-metodo">
                      <MetodoIcon metodo={recibo.metodoPago} />
                      {METODO_LABEL[recibo.metodoPago] || recibo.metodoPago}
                    </span>
                  </div>
                  {recibo.fechaPago && (
                    <div className="rb-detalle-campo">
                      <span className="rb-detalle-lbl">Fecha de pago</span>
                      <span className="rb-detalle-val">{new Date(recibo.fechaPago).toLocaleDateString('es-PE', { day:'2-digit', month:'long', year:'numeric' })}</span>
                    </div>
                  )}
                  {recibo.numeroOperacion && (
                    <div className="rb-detalle-campo">
                      <span className="rb-detalle-lbl">N° de operación</span>
                      <span className="rb-detalle-val rb-codigo">{recibo.numeroOperacion}</span>
                    </div>
                  )}
                  <div className="rb-detalle-campo">
                    <span className="rb-detalle-lbl">Estado</span>
                    <span className="rb-badge-ok"><IcoCheck /> Verificado</span>
                  </div>
                  <div className="rb-detalle-campo">
                    <span className="rb-detalle-lbl">Titular</span>
                    <span className="rb-detalle-val">{recibo.pagadorNombre || `${user?.nombre} ${user?.apellido}`}</span>
                  </div>
                </div>

                {recibo.pagadoJuntoCon?.length > 0 && (
                  <p className="rb-lote-nota">Este comprobante también cubre: {recibo.pagadoJuntoCon.join(' · ')}</p>
                )}

                {/* Voucher foto */}
                {recibo.voucherUrl && (
                  <div className="rb-voucher">
                    <p className="rb-voucher-lbl"><IcoImg /> Comprobante adjunto</p>
                    <img src={recibo.voucherUrl} alt="Comprobante" className="rb-voucher-img"
                      onClick={() => window.open(recibo.voucherUrl, '_blank')} />
                  </div>
                )}

                <button className="rb-btn-ver-recibo" onClick={() => setReciboOpen(recibo)}>
                  <IcoDoc /> Ver recibo completo
                </button>

                {idx < recibosDelMes.length - 1 && <div className="rb-detalle-sep" />}
              </div>
            ))}

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

      {/* Recibo completo con descarga PDF */}
      {reciboOpen && (
        <ReciboDetalle
          boleta={reciboOpen}
          anio={anio}
          onCerrar={() => setReciboOpen(null)}
        />
      )}
    </div>
  )
}

// Método de pago → color + ícono, mismo lenguaje visual que las
// categorías de Gastos (chip con color, sin emojis)
const METODO_META = {
  TRANSFERENCIA: { color: '#2563EB', bg: '#EFF6FF', Icon: IcoBank },
  DEPOSITO:      { color: '#2563EB', bg: '#EFF6FF', Icon: IcoBank },
  YAPE:          { color: '#7C3AED', bg: '#F5F3FF', Icon: IcoCash },
  PLIN:          { color: '#0D9488', bg: '#F0FDFA', Icon: IcoCash },
  EFECTIVO:      { color: '#059669', bg: '#F0FDF4', Icon: IcoCash },
  TARJETA:       { color: '#DB2777', bg: '#FDF2F8', Icon: IcoCard },
  OTRO:          { color: '#475569', bg: '#F1F5F9', Icon: IcoBank },
}
const metodoMeta = (m) => METODO_META[m] || METODO_META['OTRO']

const IcoSearch = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>

// ══════════════════════════════════════════════════════════════════
//  VISTA DIRECTIVO — tabla con filtros
// ══════════════════════════════════════════════════════════════════
function DirectivoRecibos() {
  const ahora = new Date()

  const [boletas,      setBoletas]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filtroMes,    setFiltroMes]    = useState(ahora.getMonth() + 1)  // mes actual por defecto
  const [filtroAnio,   setFiltroAnio]   = useState(ahora.getFullYear())   // año actual por defecto
  const [filtroMetodo, setFiltroMetodo] = useState('')
  const [busqueda,      setBusqueda]    = useState('')
  const [selected,     setSelected]     = useState(null)
  const [reciboOpen,   setReciboOpen]   = useState(null)
  const [error,        setError]        = useState('')

  useEffect(() => {
    api.get('/api/boletas').then(r => setBoletas(r.data)).catch(() => setError('Error al cargar')).finally(() => setLoading(false))
  }, [])

  const filtradas = boletas.filter(b => {
    if (filtroMes    !== '' && b.mes         !== Number(filtroMes))  return false
    if (filtroAnio   !== '' && b.anio        !== Number(filtroAnio)) return false
    if (filtroMetodo !== '' && b.metodoPago  !== filtroMetodo)       return false
    if (busqueda && !`${b.pagadorNombre} ${b.numeroDepartamento}`.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  }).sort((a, b) => (b.anio - a.anio) || (b.mes - a.mes) || Number(a.numeroDepartamento) - Number(b.numeroDepartamento))

  // Rango de años: 5 atrás, el actual, y 5 adelante — independiente de qué años tengan datos
  const anioActual = ahora.getFullYear()
  const aniosDisp = Array.from({ length: 11 }, (_, i) => anioActual - 5 + i)

  // Métodos de pago realmente presentes en los recibos, para no mostrar opciones vacías
  const metodosDisp = [...new Set(boletas.map(b => b.metodoPago))].sort()

  return (
    <div className="rb-dir-page">
      <div className="rb-dir-header">
        <div>
          <h1 className="rb-titulo">Recibos emitidos</h1>
          <p className="rb-subtitulo">Historial de recibos verificados de todos los departamentos</p>
        </div>
      </div>

      {error && <div className="rb-error">{error}</div>}

      <div className="rb-dir-toolbar">
        <div className="rb-dir-search-wrap">
          <IcoSearch />
          <input className="rb-dir-search" placeholder="Buscar por residente o departamento..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <select className="rb-dir-select" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
          <option value="">Todos los meses</option>
          {MESES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select className="rb-dir-select" value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}>
          <option value="">Todos los años</option>
          {aniosDisp.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="rb-dir-select" value={filtroMetodo} onChange={e => setFiltroMetodo(e.target.value)}>
          <option value="">Todos los métodos</option>
          {metodosDisp.map(m => <option key={m} value={m}>{METODO_LABEL[m] || m}</option>)}
        </select>
      </div>

      <div className="rb-dir-tabla-bar">
        <span className="rb-dir-count">{filtradas.length} recibo{filtradas.length !== 1 ? 's' : ''}</span>
        {filtroMes && filtroAnio && (
          <span className="rb-dir-periodo-actual">{MESES[Number(filtroMes) - 1]} {filtroAnio}</span>
        )}
      </div>

      {loading ? (
        <div className="rb-dir-skeleton">
          {[...Array(5)].map((_, i) => <div key={i} className="rb-dir-skeleton-row" />)}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="rb-empty">
          <IcoDoc />
          <p className="rb-empty-t">No hay recibos con ese filtro</p>
          <p className="rb-empty-s">Prueba cambiando el mes, el año o el método de pago.</p>
        </div>
      ) : (
        <div className="rb-dir-tabla-wrap">
          <table className="rb-dir-tabla">
            <thead>
              <tr>
                <th>Período</th>
                <th>Departamento</th>
                <th>Residente</th>
                <th>Método</th>
                <th className="rb-th-monto">Monto</th>
                <th className="rb-th-accion">Recibo</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(b => {
                const { Icon, color, bg } = metodoMeta(b.metodoPago)
                const activa = selected?.boletaId === b.boletaId
                return (
                  <tr key={b.boletaId} className={activa ? 'rb-dir-row-active' : ''}
                    onClick={() => setSelected(activa ? null : b)}>
                    <td className="rb-dir-mes">{MESES[b.mes-1]} {b.anio}</td>
                    <td className="rb-td-muted">Depto {b.numeroDepartamento} · Piso {b.piso}</td>
                    <td className="rb-dir-nombre">{b.pagadorNombre}</td>
                    <td>
                      <span className="rb-metodo-chip" style={{ background: bg, color }}>
                        <Icon /> {METODO_LABEL[b.metodoPago] || b.metodoPago}
                      </span>
                    </td>
                    <td className="rb-td-monto">S/ {Number(b.monto).toFixed(2)}</td>
                    <td className="rb-td-accion">
                      <button className="rb-btn-ver-recibo-fila" onClick={e => { e.stopPropagation(); setReciboOpen(b) }}>
                        <IcoDoc /> Ver recibo
                      </button>
                      {b.voucherUrl && (
                        <a href={b.voucherUrl} target="_blank" rel="noreferrer" className="rb-dir-voucher-link" onClick={e => e.stopPropagation()}>
                          Voucher
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview del voucher, se abre debajo de la tabla al hacer clic en la fila */}
      {selected?.voucherUrl && (
        <div className="rb-dir-preview">
          <div className="rb-dir-preview-header">
            <span>Comprobante — Depto {selected.numeroDepartamento} · {MESES[selected.mes-1]} {selected.anio}</span>
            <button className="rb-btn-cerrar" onClick={() => setSelected(null)}><IcoX /></button>
          </div>
          <img src={selected.voucherUrl} alt="Comprobante" className="rb-dir-preview-img" />
        </div>
      )}

      {/* Recibo oficial completo, con descarga en PDF — mismo componente que usa el residente */}
      {reciboOpen && (
        <ReciboDetalle
          boleta={reciboOpen}
          anio={reciboOpen.anio}
          onCerrar={() => setReciboOpen(null)}
        />
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
