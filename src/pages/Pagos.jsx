import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { textoLibreEstricto, sinNegativos } from '../utils/validaciones'
import PagoTarjeta from '../components/PagoTarjeta'
import SubirFoto   from '../components/SubirFoto'
import './Pagos.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE','SECRETARIO','TESORERO']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const METODOS_PAGO = ['TRANSFERENCIA','DEPOSITO','PLIN','EFECTIVO','OTRO']

const etiquetaMes = (mes, anio) =>
  mes && anio ? `${MESES[mes - 1]} ${anio}` : '—'

// ── Íconos SVG ──────────────────────────────────────────────────
const IcoCard  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
const IcoBank  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
const IcoCash  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
const IcoCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoX     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoAlert = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IcoCal   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IcoImg   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>

function StatusBadge({ estado }) {
  const map = {
    PAGADO:                 { l:'Pagado',          c:'badge-ok'   },
    VERIFICADO:             { l:'Verificado',       c:'badge-ok'   },
    PARCIAL:                { l:'Parcial',          c:'badge-warn' },
    PENDIENTE:              { l:'Pendiente',        c:'badge-warn' },
    PENDIENTE_VERIFICACION: { l:'En verificación',  c:'badge-info' },
    VENCIDO:                { l:'Vencido',          c:'badge-err'  },
    RECHAZADO:              { l:'Rechazado',        c:'badge-err'  },
  }
  const { l, c } = map[estado] || { l: estado, c:'badge-info' }
  return <span className={`pg-badge ${c}`}>{l}</span>
}

// ══════════════════════════════════════════════════════════════════
//  FORMULARIO DE PAGO — Transferencia / Efectivo
// ══════════════════════════════════════════════════════════════════
function FormPagoManual({ cuota, metodo, onExito, onCancelar }) {
  const saldoPendiente = cuota.saldoPendiente != null ? Number(cuota.saldoPendiente) : Number(cuota.montoCalculado)
  const [monto,       setMonto]       = useState(saldoPendiente.toFixed(2))
  const [voucherUrl,  setVoucherUrl]  = useState('')
  const [obs,         setObs]         = useState('')
  const [guardando,   setGuardando]   = useState(false)
  const [error,       setError]       = useState('')

  const esTransferencia = metodo === 'TRANSFERENCIA' || metodo === 'DEPOSITO' || metodo === 'PLIN'
  const fotoObligatoria = esTransferencia
  const montoNum = Number(monto)
  const esParcial = montoNum > 0 && montoNum < saldoPendiente

  const handleMonto = (v) => {
    // Solo números y un punto decimal — nunca negativos
    let limpio = v.replace(/[^0-9.]/g, '')
    const partes = limpio.split('.')
    if (partes.length > 2) limpio = partes[0] + '.' + partes.slice(1).join('')
    setMonto(limpio)
  }

  const enviar = async () => {
    if (!montoNum || montoNum <= 0) { setError('Ingresa un monto válido mayor a cero'); return }
    if (montoNum > saldoPendiente) { setError(`El monto no puede superar el saldo pendiente de S/ ${saldoPendiente.toFixed(2)}`); return }
    if (fotoObligatoria && !voucherUrl) { setError('La foto del comprobante es obligatoria'); return }
    setGuardando(true); setError('')
    try {
      await api.post('/api/pagos/registrar', {
        cuotaId:         cuota.cuotaId,
        monto:           montoNum,
        metodoPago:      metodo,
        voucherUrl:      voucherUrl || null,
        observaciones:   obs || null,
      })
      onExito()
    } catch (e) { setError(e.response?.data || 'Error al registrar el pago') }
    finally { setGuardando(false) }
  }

  return (
    <div className="pm-form">
      <div className="pm-field">
        <label className="pm-label">Monto a pagar (S/)</label>
        <div className="pm-monto-wrap">
          <span className="pm-monto-prefix">S/</span>
          <input
            className="pm-input pm-input-monto"
            value={monto}
            onChange={e => handleMonto(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
          />
        </div>
        <p className="pm-monto-hint">
          Saldo pendiente de esta cuota: <strong>S/ {saldoPendiente.toFixed(2)}</strong>
        </p>
        {esParcial && (
          <p className="pm-monto-parcial">
            Pago parcial — quedará un saldo de <strong>S/ {(saldoPendiente - montoNum).toFixed(2)}</strong> después de este pago
          </p>
        )}
      </div>
      <SubirFoto
        onSubida={url => setVoucherUrl(url)}
        obligatorio={fotoObligatoria}
        label={metodo === 'EFECTIVO' ? 'Foto del recibo (opcional)' : 'Foto del comprobante'}
      />
      <div className="pm-field">
        <label className="pm-label">Observaciones (opcional)</label>
        <input
          className="pm-input"
          value={obs}
          onChange={e => setObs(textoLibreEstricto(e.target.value))}
          placeholder={metodo === 'EFECTIVO' ? 'Ej: Entregado al tesorero' : 'Ej: Transferencia BCP'}
          maxLength={200}
        />
      </div>
      {error && <p className="pm-error">{error}</p>}
      <div className="pm-acciones">
        <button className="pm-btn-cancelar" onClick={onCancelar} disabled={guardando}>Cancelar</button>
        <button className="pm-btn-enviar" onClick={enviar} disabled={guardando}>
          {guardando ? 'Enviando...' : `Enviar S/ ${montoNum > 0 ? montoNum.toFixed(2) : '0.00'} para verificación`}
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  SELECTOR DE MÉTODO DE PAGO (se expande dentro de la cuota)
// ══════════════════════════════════════════════════════════════════
function PanelPago({ cuota, onExito, onCancelar }) {
  const [metodo, setMetodo] = useState(null)

  if (!metodo) return (
    <div className="pp-selector">
      <p className="pp-selector-titulo">¿Cómo vas a pagar?</p>
      <div className="pp-metodos">
        <button className="pp-metodo" onClick={() => setMetodo('TARJETA')}>
          <div className="pp-metodo-icon pp-icon-blue"><IcoCard /></div>
          <span className="pp-metodo-nombre">Tarjeta</span>
          <span className="pp-metodo-sub">Pago inmediato</span>
        </button>
        <button className="pp-metodo" onClick={() => setMetodo('TRANSFERENCIA')}>
          <div className="pp-metodo-icon pp-icon-green"><IcoBank /></div>
          <span className="pp-metodo-nombre">Transferencia</span>
          <span className="pp-metodo-sub">Sube tu voucher</span>
        </button>
        <button className="pp-metodo" onClick={() => setMetodo('EFECTIVO')}>
          <div className="pp-metodo-icon pp-icon-amber"><IcoCash /></div>
          <span className="pp-metodo-nombre">Efectivo</span>
          <span className="pp-metodo-sub">Pendiente verificación</span>
        </button>
      </div>
      <button className="pp-cancelar" onClick={onCancelar}>Cancelar</button>
    </div>
  )

  return (
    <div className="pp-form-wrap">
      <div className="pp-form-header">
        <button className="pp-back" onClick={() => setMetodo(null)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver
        </button>
        <span className="pp-form-metodo">
          {metodo === 'TARJETA' && <><IcoCard /> Pago con tarjeta</>}
          {metodo === 'TRANSFERENCIA' && <><IcoBank /> Transferencia bancaria</>}
          {metodo === 'EFECTIVO' && <><IcoCash /> Pago en efectivo</>}
        </span>
      </div>
      <div className="pp-monto-ref">
        {cuota.estadoCuota === 'PARCIAL'
          ? <>Saldo pendiente: <strong>S/ {Number(cuota.saldoPendiente).toFixed(2)}</strong> de S/ {Number(cuota.montoCalculado).toFixed(2)} · {etiquetaMes(cuota.mes, cuota.anio)}</>
          : <>Cuota a pagar: <strong>S/ {Number(cuota.montoCalculado).toFixed(2)}</strong> · {etiquetaMes(cuota.mes, cuota.anio)}</>
        }
      </div>

      {metodo === 'TARJETA' && (
        <PagoTarjeta cuota={cuota} residentesDepto={[]} esDirectivo={false} onExito={onExito} onCancelar={() => setMetodo(null)} />
      )}
      {(metodo === 'TRANSFERENCIA' || metodo === 'EFECTIVO') && (
        <FormPagoManual cuota={cuota} metodo={metodo} onExito={onExito} onCancelar={() => setMetodo(null)} />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  TARJETA DE CUOTA
// ══════════════════════════════════════════════════════════════════
function CuotaCard({ cuota, seleccionada, onToggle, pagandoEste, onPagar, onExito, futura }) {
  const estaVencida = cuota.estadoCuota === 'VENCIDO'
  const esParcial   = cuota.estadoCuota === 'PARCIAL'
  return (
    <div className={`pgr-cuota ${futura ? 'pgr-cuota-futura' : estaVencida ? 'pgr-cuota-vencida' : esParcial ? 'pgr-cuota-parcial' : 'pgr-cuota-pendiente'} ${pagandoEste ? 'pgr-cuota-abierta' : ''}`}>
      <div className="pgr-cuota-fila">
        <label className="pgr-checkbox-wrap" onClick={e => e.stopPropagation()}>
          <input type="checkbox" checked={seleccionada || false} onChange={onToggle} className="pgr-checkbox" />
          <span className="pgr-checkbox-custom">{seleccionada && <IcoCheck />}</span>
        </label>
        <div className="pgr-cuota-info">
          <p className="pgr-cuota-mes">{etiquetaMes(cuota.mes, cuota.anio)}</p>
          <p className="pgr-cuota-depto">Depto {cuota.numeroDepartamento} · Piso {cuota.piso}</p>
          {esParcial && (
            <p className="pgr-cuota-saldo">
              Pagaste S/ {Number(cuota.montoPagado).toFixed(2)} de S/ {Number(cuota.montoCalculado).toFixed(2)} · Saldo: <strong>S/ {Number(cuota.saldoPendiente).toFixed(2)}</strong>
            </p>
          )}
        </div>
        <div className="pgr-cuota-der">
          <span className="pgr-cuota-monto">S/ {Number(esParcial ? cuota.saldoPendiente : cuota.montoCalculado).toFixed(2)}</span>
          <StatusBadge estado={futura ? 'PENDIENTE' : cuota.estadoCuota} />
          <button
            className={`pgr-btn-pagar ${pagandoEste ? 'pgr-btn-cancelar-pago' : ''}`}
            onClick={onPagar}
          >
            {pagandoEste ? <IcoX /> : 'Pagar'}
            {pagandoEste ? ' Cancelar' : ''}
          </button>
        </div>
      </div>

      {/* Panel de pago inline — acordeón */}
      <div className={`pgr-panel ${pagandoEste ? 'pgr-panel-open' : ''}`}>
        {pagandoEste && (
          <PanelPago cuota={cuota} onExito={onExito} onCancelar={onPagar} />
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  VISTA RESIDENTE
// ══════════════════════════════════════════════════════════════════
function ResidentePagos({ user }) {
  const ahora      = new Date()
  const mesActual  = ahora.getMonth() + 1
  const anioActual = ahora.getFullYear()

  const [cuotas,        setCuotas]        = useState([])
  const [loading,       setLoading]       = useState(true)
  const [tab,           setTab]           = useState('pendientes')
  const [pagandoId,     setPagandoId]     = useState(null)
  const [seleccionadas, setSeleccionadas] = useState(new Set())
  const [pagMultiple,   setPagMultiple]   = useState(false)
  const [verMas,        setVerMas]        = useState(false)
  const [msg,           setMsg]           = useState('')
  const [error,         setError]         = useState('')

  useEffect(() => { cargarCuotas() }, [])

  const cargarCuotas = async () => {
    setLoading(true)
    try { const r = await api.get('/api/pagos/mis-cuotas'); setCuotas(r.data) }
    catch { setError('No se pudo cargar la información') }
    finally { setLoading(false) }
  }

  const esFuturo = c => c.anio > anioActual || (c.anio === anioActual && c.mes > mesActual)

  const deudas       = cuotas.filter(c => (c.estadoCuota === 'PENDIENTE' || c.estadoCuota === 'VENCIDO' || c.estadoCuota === 'PARCIAL') && !esFuturo(c))
  const enVerif      = cuotas.filter(c => c.estadoCuota === 'PENDIENTE_VERIFICACION')
  const todasFuturas = cuotas.filter(c => c.estadoCuota === 'PENDIENTE' && esFuturo(c))
    .sort((a,b) => a.anio !== b.anio ? a.anio - b.anio : a.mes - b.mes)
  const futuras      = verMas ? todasFuturas : todasFuturas.slice(0, 3)
  const pagadas      = cuotas.filter(c => c.estadoCuota === 'PAGADO' || c.estadoCuota === 'VERIFICADO')

  const totalDeuda     = deudas.reduce((s,c) => s + Number(c.saldoPendiente != null ? c.saldoPendiente : c.montoCalculado), 0)
  const pagadasAnio    = pagadas.filter(c => c.anio === anioActual).length
  const totalMesesAnio = cuotas.filter(c => c.anio === anioActual).length || 12
  const pctProgreso    = Math.round((pagadasAnio / totalMesesAnio) * 100)

  const iniciales = user ? user.nombre?.[0]?.toUpperCase() + user.apellido?.[0]?.toUpperCase() : 'U'

  const handleExito = (msg) => {
    setPagandoId(null); setPagMultiple(false); setSeleccionadas(new Set())
    setMsg(msg || 'Pago registrado correctamente.')
    cargarCuotas()
    setTimeout(() => setMsg(''), 5000)
  }

  const toggleSel = id => {
    setSeleccionadas(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const cuotasSelArray = cuotas.filter(c => seleccionadas.has(c.cuotaId))
  const totalSel = cuotasSelArray.reduce((s,c) => s + Number(c.montoCalculado), 0)

  if (loading) return (
    <div className="pgr-skeleton-wrap">
      <div className="pgr-skeleton-col" />
      <div className="pgr-skeleton-main">
        {[...Array(3)].map((_,i) => <div key={i} className="pgr-skeleton-item" />)}
      </div>
    </div>
  )

  return (
    <div className="pgr-layout">

      {/* ── Columna izquierda — resumen de cuenta ── */}
      <aside className="pgr-aside">
        <div className="pgr-aside-avatar">{iniciales}</div>
        <h2 className="pgr-aside-nombre">{user?.nombre} {user?.apellido}</h2>

        {cuotas[0]?.numeroDepartamento && (
          <div className="pgr-aside-depto">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Depto {cuotas[0].numeroDepartamento} · Piso {cuotas[0].piso}
          </div>
        )}

        <div className={`pgr-aside-deuda ${totalDeuda > 0 ? 'pgr-deuda-pendiente' : 'pgr-deuda-ok'}`}>
          <p className="pgr-deuda-lbl">{totalDeuda > 0 ? 'Deuda actual' : 'Sin deuda'}</p>
          <p className="pgr-deuda-monto">S/ {totalDeuda.toFixed(2)}</p>
        </div>

        <div className="pgr-aside-progreso">
          <div className="pgr-progreso-header">
            <span>Meses pagados {anioActual}</span>
            <span className="pgr-progreso-cnt">{pagadasAnio}/{totalMesesAnio}</span>
          </div>
          <div className="pgr-progreso-bar">
            <div className="pgr-progreso-fill" style={{ width: `${pctProgreso}%` }} />
          </div>
        </div>

        <div className={`pgr-aside-estado ${totalDeuda === 0 && enVerif.length === 0 ? 'pgr-estado-ok' : 'pgr-estado-warn'}`}>
          {totalDeuda === 0 && enVerif.length === 0
            ? <><IcoCheck /> Al día</>
            : <><IcoAlert /> Requiere atención</>
          }
        </div>

        {enVerif.length > 0 && (
          <div className="pgr-aside-verif">
            <p className="pgr-verif-txt">{enVerif.length} pago{enVerif.length > 1 ? 's' : ''} en verificación</p>
            <p className="pgr-verif-sub">El directivo revisará en breve</p>
          </div>
        )}
      </aside>

      {/* ── Columna derecha — tabs ── */}
      <div className="pgr-main">

        {msg   && <div className="pgr-alert pgr-alert-ok"><IcoCheck /> {msg}</div>}
        {error && <div className="pgr-alert pgr-alert-err">{error}</div>}

        {/* Tabs */}
        <div className="pgr-tabs">
          <button className={`pgr-tab ${tab === 'pendientes' ? 'pgr-tab-active' : ''}`} onClick={() => { setTab('pendientes'); setPagandoId(null) }}>
            <IcoAlert />
            Deudas
            {(deudas.length + enVerif.length) > 0 && <span className="pgr-tab-cnt">{deudas.length + enVerif.length}</span>}
          </button>
          <button className={`pgr-tab ${tab === 'proximas' ? 'pgr-tab-active' : ''}`} onClick={() => { setTab('proximas'); setPagandoId(null) }}>
            <IcoCal />
            Próximas
            {todasFuturas.length > 0 && <span className="pgr-tab-cnt">{todasFuturas.length}</span>}
          </button>
        </div>

        {/* ── Tab: Deudas ── */}
        {tab === 'pendientes' && (
          <div className="pgr-tab-body">
            {deudas.length === 0 && enVerif.length === 0 && (
              <div className="pgr-empty">
                <div className="pgr-empty-icon"><IcoCheck /></div>
                <p className="pgr-empty-t">Sin deudas pendientes</p>
                <p className="pgr-empty-s">Estás al día con tus pagos.</p>
              </div>
            )}

            {deudas.length > 0 && (
              <>
                <p className="pgr-sec-lbl">Por pagar</p>
                {deudas.map(c => (
                  <CuotaCard key={c.cuotaId} cuota={c}
                    seleccionada={seleccionadas.has(c.cuotaId)}
                    onToggle={() => toggleSel(c.cuotaId)}
                    pagandoEste={pagandoId === c.cuotaId}
                    onPagar={() => setPagandoId(pagandoId === c.cuotaId ? null : c.cuotaId)}
                    onExito={() => handleExito('Pago enviado. Quedará confirmado una vez verificado.')}
                  />
                ))}
              </>
            )}

            {enVerif.length > 0 && (
              <>
                <p className="pgr-sec-lbl pgr-sec-lbl-info" style={{marginTop: deudas.length > 0 ? 20 : 8}}>En verificación</p>
                {enVerif.map(c => (
                  <div key={c.cuotaId} className="pgr-cuota pgr-cuota-verif">
                    <div className="pgr-cuota-fila">
                      <div className="pgr-cuota-info">
                        <p className="pgr-cuota-mes">{etiquetaMes(c.mes, c.anio)}</p>
                        <p className="pgr-cuota-depto">Depto {c.numeroDepartamento} · Piso {c.piso}</p>
                      </div>
                      <div className="pgr-cuota-der">
                        <span className="pgr-cuota-monto">S/ {Number(c.montoCalculado).toFixed(2)}</span>
                        <StatusBadge estado="PENDIENTE_VERIFICACION" />
                        {c.pagos?.[0]?.voucherUrl && (
                          <a href={c.pagos[0].voucherUrl} target="_blank" rel="noreferrer" className="pgr-btn-voucher">
                            <IcoImg /> Voucher
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <p className="pgr-verif-hint">El directivo aprobará tu pago en breve y recibirás tu recibo automáticamente.</p>
              </>
            )}
          </div>
        )}

        {/* ── Tab: Próximas ── */}
        {tab === 'proximas' && (
          <div className="pgr-tab-body">
            {todasFuturas.length === 0 ? (
              <div className="pgr-empty">
                <div className="pgr-empty-icon"><IcoCal /></div>
                <p className="pgr-empty-t">Sin cuotas futuras</p>
                <p className="pgr-empty-s">El directivo aún no configuró los próximos meses.</p>
              </div>
            ) : (
              <>
                <p className="pgr-sec-lbl">Disponibles para adelantar</p>
                {futuras.map(c => (
                  <CuotaCard key={c.cuotaId} cuota={c} futura
                    seleccionada={seleccionadas.has(c.cuotaId)}
                    onToggle={() => toggleSel(c.cuotaId)}
                    pagandoEste={pagandoId === c.cuotaId}
                    onPagar={() => setPagandoId(pagandoId === c.cuotaId ? null : c.cuotaId)}
                    onExito={() => handleExito('Pago adelantado enviado para verificación.')}
                  />
                ))}
                {todasFuturas.length > 3 && (
                  <button className="pgr-btn-ver-mas" onClick={() => setVerMas(!verMas)}>
                    {verMas ? 'Ver menos' : `Ver ${todasFuturas.length - 3} cuota${todasFuturas.length - 3 > 1 ? 's' : ''} más`}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Barra de pago múltiple */}
        {seleccionadas.size > 0 && (
          <div className="pgr-barra">
            <button className="pgr-barra-close" onClick={() => setSeleccionadas(new Set())}><IcoX /></button>
            <div className="pgr-barra-info">
              <span className="pgr-barra-cnt">{seleccionadas.size} cuota{seleccionadas.size > 1 ? 's' : ''}</span>
              <span className="pgr-barra-meses">{cuotasSelArray.map(c => etiquetaMes(c.mes, c.anio)).join(' · ')}</span>
            </div>
            <span className="pgr-barra-total">S/ {totalSel.toFixed(2)}</span>
            <button className="pgr-barra-btn" onClick={() => setPagMultiple(true)}>
              <IcoCard /> Pagar todo
            </button>
          </div>
        )}

        {/* Panel pago múltiple */}
        {pagMultiple && cuotasSelArray.length > 0 && (
          <div className="pgr-panel-multiple">
            <div className="pgr-pm-header">
              <h3 className="pgr-pm-titulo">Pago de {cuotasSelArray.length} cuota{cuotasSelArray.length > 1 ? 's' : ''}</h3>
              <button className="pgr-pm-close" onClick={() => setPagMultiple(false)}><IcoX /></button>
            </div>
            <div className="pgr-pm-resumen">
              {cuotasSelArray.map(c => (
                <div key={c.cuotaId} className="pgr-pm-fila">
                  <span>{etiquetaMes(c.mes, c.anio)}</span>
                  <span>S/ {Number(c.montoCalculado).toFixed(2)}</span>
                </div>
              ))}
              <div className="pgr-pm-fila pgr-pm-total">
                <span>Total cuotas</span>
                <span>S/ {totalSel.toFixed(2)}</span>
              </div>
            </div>
            <PagoTarjeta
              cuota={{
                cuotaId:          cuotasSelArray[0].cuotaId,
                montoCalculado:   totalSel,
                numeroDepartamento: cuotasSelArray[0].numeroDepartamento,
                piso:             cuotasSelArray[0].piso,
              }}
              cuotaIds={cuotasSelArray.map(c => c.cuotaId)}
              esMultiple={true}
              residentesDepto={[]}
              esDirectivo={false}
              onExito={() => handleExito('Pago múltiple procesado correctamente.')}
              onCancelar={() => setPagMultiple(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  VISTA DIRECTIVO
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
    } catch (e) { setError(e.response?.status === 400 ? e.response.data : 'Error al cargar datos') }
    finally { setLoading(false) }
  }

  const abrirPago = async (cuota) => {
    setSelected(cuota)
    const saldo = cuota.saldoPendiente != null ? cuota.saldoPendiente : cuota.montoCalculado
    setForm({ monto: saldo, metodoPago:'TRANSFERENCIA', numeroOperacion:'', bancoOrigen:'', voucherUrl:'', observaciones:'', pagadorId:'' })
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
      await api.post('/api/pagos/registrar', {
        cuotaId: selected.cuotaId, monto: Number(form.monto),
        metodoPago: form.metodoPago, numeroOperacion: form.numeroOperacion || null,
        voucherUrl: form.voucherUrl || null, observaciones: form.observaciones || null,
        pagadorId: Number(form.pagadorId)
      })
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

  const estadoColor = e => ({ PAGADO:'pill-success', VERIFICADO:'pill-success', PARCIAL:'pill-warning', VENCIDO:'pill-danger', RECHAZADO:'pill-danger', PENDIENTE_VERIFICACION:'pill-warning' }[e] || 'pill-neutral')
  const estadoLabel = e => ({ PENDIENTE:'Pendiente', PARCIAL:'Parcial', PAGADO:'Pagado', VENCIDO:'Vencido', EXONERADO:'Exonerado', PENDIENTE_VERIFICACION:'En verificación', VERIFICADO:'Verificado', RECHAZADO:'Rechazado' }[e] || e)

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
                {resumen.parciales > 0 && (
                  <div className="resumen-card rc-amber"><p className="rc-value">{resumen.parciales}</p><p className="rc-label">Pagos parciales</p></div>
                )}
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
                    <div className="cuota-monto">
                      {c.estadoCuota === 'PARCIAL'
                        ? <>S/ {Number(c.saldoPendiente).toFixed(2)} <span className="cuota-monto-total">de S/ {c.montoCalculado?.toFixed(2)}</span></>
                        : <>S/ {c.montoCalculado?.toFixed(2)}</>}
                    </div>
                    <span className={'pill ' + estadoColor(c.estadoCuota)}>{estadoLabel(c.estadoCuota)}</span>
                    {c.estadoCuota !== 'PAGADO' && <button className="btn btn-ghost btn-sm" onClick={() => abrirPago(c)}>Registrar pago</button>}
                    {c.pagos?.some(p => p.voucherUrl) && (
                      <a href={c.pagos.find(p => p.voucherUrl)?.voucherUrl} target="_blank" rel="noreferrer" className="pgr-btn-voucher">
                        <IcoImg /> Ver voucher
                      </a>
                    )}
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
                  {p.voucherUrl && (
                    <div className="pendiente-voucher">
                      <a href={p.voucherUrl} target="_blank" rel="noreferrer" className="voucher-link">Ver comprobante</a>
                      <img src={p.voucherUrl} alt="Comprobante" className="pendiente-voucher-thumb" />
                    </div>
                  )}
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

      {/* Modal registrar pago directivo */}
      {modal === 'pago' && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">Registrar pago manual</h3>
            <p className="modal-sub">
              Depto <strong>{selected?.numeroDepartamento}</strong> · Saldo pendiente: S/ {Number(selected?.saldoPendiente != null ? selected.saldoPendiente : selected?.montoCalculado).toFixed(2)}
              {selected?.estadoCuota === 'PARCIAL' && <span className="modal-sub-parcial"> (de S/ {Number(selected?.montoCalculado).toFixed(2)} total)</span>}
            </p>
            <div className="modal-scroll">
              <div className="modal-form">
                <div className="form-group"><label>Monto (S/)</label><input type="number" min="0" step="0.01" value={form.monto||''} onChange={e => setForm({...form,monto:sinNegativos(e.target.value)})} /></div>
                <div className="form-group"><label>Pagador</label>
                  <select value={form.pagadorId||''} onChange={e => setForm({...form,pagadorId:e.target.value})}>
                    <option value="">-- Selecciona el residente --</option>
                    {residentesDepto.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.tipo==='PROPIETARIO'?'Propietario':'Inquilino'})</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Método</label>
                  <div className="metodos-grid">{METODOS_PAGO.map(m => <button key={m} type="button" className={'metodo-btn '+(form.metodoPago===m?'metodo-active':'')} onClick={() => setForm({...form,metodoPago:m})}>{m}</button>)}</div>
                </div>
                <div className="form-group"><label>N° de operación</label><input value={form.numeroOperacion||''} onChange={e => setForm({...form,numeroOperacion:textoLibreEstricto(e.target.value)})} /></div>
                <SubirFoto onSubida={url => setForm({...form,voucherUrl:url})} obligatorio={false} label="Foto del comprobante (opcional)" />
                <div className="form-group"><label>Observaciones</label><input value={form.observaciones||''} onChange={e => setForm({...form,observaciones:textoLibreEstricto(e.target.value)})} /></div>
              </div>
            </div>
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
            {msg && <p className="modal-success">{msg}</p>}
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
            {msg && <p className="modal-success">{msg}</p>}
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

// ── Export principal ─────────────────────────────────────────────
export default function Pagos() {
  const { user } = useAuth()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)
  return esDirectivo ? <DirectivoPagos user={user} /> : <ResidentePagos user={user} />
}
