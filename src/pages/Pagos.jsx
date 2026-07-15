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
const METODOS_PAGO_DIRECTIVO = ['TRANSFERENCIA','EFECTIVO']

const etiquetaMes = (mes, anio) =>
  mes && anio ? `${MESES[mes - 1]} ${anio}` : '—'

// ── Íconos SVG ──────────────────────────────────────────────────
const IcoCard     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
const IcoBank     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
const IcoCash     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
const IcoCheck    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoX        = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoAlert    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IcoCal      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IcoImg      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
const IcoBuilding = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const IcoUsers    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IcoTrash    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
const IcoEdit     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcoChev     = ({ open }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}><polyline points="6 9 12 15 18 9"/></svg>
const IcoSliders  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
const IcoClipboard= () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
const IcoPlus     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>

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
//  FORMULARIO — Pago MÚLTIPLE por Transferencia / Efectivo
//  Sin monto editable (se paga el total exacto), un solo comprobante
//  para todas las cuotas seleccionadas.
// ══════════════════════════════════════════════════════════════════
function FormPagoMultipleManual({ cuotasSelArray, totalSel, metodo, onExito, onCancelar }) {
  const [numOp,      setNumOp]      = useState('')
  const [voucherUrl, setVoucherUrl] = useState('')
  const [obs,        setObs]        = useState('')
  const [guardando,  setGuardando]  = useState(false)
  const [error,      setError]      = useState('')

  const fotoObligatoria = metodo === 'TRANSFERENCIA'

  const enviar = async () => {
    if (fotoObligatoria && !voucherUrl) { setError('La foto del comprobante es obligatoria'); return }
    setGuardando(true); setError('')
    try {
      await api.post('/api/pagos/registrar-multiple', {
        cuotaIds:        cuotasSelArray.map(c => c.cuotaId),
        metodoPago:      metodo,
        numeroOperacion: numOp || null,
        voucherUrl:      voucherUrl || null,
        observaciones:   obs || null,
      })
      onExito()
    } catch (e) { setError(e.response?.data || 'Error al registrar el pago') }
    finally { setGuardando(false) }
  }

  return (
    <div className="pm-form">
      <div className="pgr-pm-resumen">
        {cuotasSelArray.map(c => (
          <div key={c.cuotaId} className="pgr-pm-fila">
            <span>{etiquetaMes(c.mes, c.anio)}</span>
            <span>S/ {Number(c.saldoPendiente != null ? c.saldoPendiente : c.montoCalculado).toFixed(2)}</span>
          </div>
        ))}
        <div className="pgr-pm-fila pgr-pm-total">
          <span>Total a pagar</span>
          <span>S/ {totalSel.toFixed(2)}</span>
        </div>
      </div>
      <p className="pm-monto-hint">
        No se admite pago parcial en pagos múltiples — este comprobante debe cubrir el total exacto de las cuotas seleccionadas.
      </p>
      <SubirFoto
        onSubida={url => setVoucherUrl(url)}
        obligatorio={fotoObligatoria}
        label={metodo === 'EFECTIVO' ? 'Foto del recibo (opcional)' : 'Foto del comprobante'}
      />
      <div className="pm-field">
        <label className="pm-label">N° de operación (opcional)</label>
        <input className="pm-input" value={numOp} onChange={e => setNumOp(textoLibreEstricto(e.target.value))} />
      </div>
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
          {guardando ? 'Enviando...' : `Enviar S/ ${totalSel.toFixed(2)} para verificación`}
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
          <StatusBadge estado={futura && cuota.estadoCuota !== 'PARCIAL' ? 'PENDIENTE' : cuota.estadoCuota} />
          <button
            className={`pgr-btn-pagar ${pagandoEste ? 'pgr-btn-cancelar-pago' : ''}`}
            onClick={onPagar}
          >
            {pagandoEste ? <IcoX /> : 'Pagar'}
            {pagandoEste ? ' Cancelar' : ''}
          </button>
        </div>
      </div>

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
  const [metodoMultiple, setMetodoMultiple] = useState(null) // null | 'TARJETA' | 'TRANSFERENCIA' | 'EFECTIVO'
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

  const tienePagoPendiente = c => (c.pagos || []).some(p => p.estado === 'PENDIENTE_VERIFICACION')

  const ordenDesc = (a, b) => b.anio !== a.anio ? b.anio - a.anio : b.mes - a.mes // reciente → antiguo
  const ordenAsc  = (a, b) => a.anio !== b.anio ? a.anio - b.anio : a.mes - b.mes // cercano → lejano

  const deudas       = cuotas.filter(c => (c.estadoCuota === 'PENDIENTE' || c.estadoCuota === 'VENCIDO' || c.estadoCuota === 'PARCIAL') && !esFuturo(c) && !tienePagoPendiente(c)).sort(ordenDesc)
  const enVerif      = cuotas.filter(c => tienePagoPendiente(c) && !esFuturo(c)).sort(ordenDesc)
  const todasFuturas = cuotas.filter(c => (c.estadoCuota === 'PENDIENTE' || c.estadoCuota === 'PARCIAL') && esFuturo(c) && !tienePagoPendiente(c))
    .sort(ordenAsc)
  const enVerifFuturas = cuotas.filter(c => tienePagoPendiente(c) && esFuturo(c)).sort(ordenAsc)
  const futuras      = verMas ? todasFuturas : todasFuturas.slice(0, 3)
  const pagadas      = cuotas.filter(c => c.estadoCuota === 'PAGADO' || c.estadoCuota === 'VERIFICADO')

  const totalDeuda     = deudas.reduce((s,c) => s + Number(c.saldoPendiente != null ? c.saldoPendiente : c.montoCalculado), 0)
  const pagadasAnio    = pagadas.filter(c => c.anio === anioActual).length
  const totalMesesAnio = cuotas.filter(c => c.anio === anioActual).length || 12
  const pctProgreso    = Math.round((pagadasAnio / totalMesesAnio) * 100)

  const iniciales = user ? user.nombre?.[0]?.toUpperCase() + user.apellido?.[0]?.toUpperCase() : 'U'

  const handleExito = (msg) => {
    setPagandoId(null); setPagMultiple(false); setMetodoMultiple(null); setSeleccionadas(new Set())
    setMsg(msg || 'Pago registrado correctamente.')
    cargarCuotas()
    setTimeout(() => setMsg(''), 5000)
  }

  const toggleSel = id => {
    setSeleccionadas(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const cuotasSelArray = cuotas.filter(c => seleccionadas.has(c.cuotaId))
  const totalSel = cuotasSelArray.reduce((s,c) => s + Number(c.saldoPendiente != null ? c.saldoPendiente : c.montoCalculado), 0)

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

      <div className="pgr-main">

        {msg   && <div className="pgr-alert pgr-alert-ok"><IcoCheck /> {msg}</div>}
        {error && <div className="pgr-alert pgr-alert-err">{error}</div>}

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
                {enVerif.map(c => {
                  const pagoPend = (c.pagos || []).find(p => p.estado === 'PENDIENTE_VERIFICACION')
                  return (
                    <div key={c.cuotaId} className="pgr-cuota pgr-cuota-verif">
                      <div className="pgr-cuota-fila">
                        <div className="pgr-cuota-info">
                          <p className="pgr-cuota-mes">{etiquetaMes(c.mes, c.anio)}</p>
                          <p className="pgr-cuota-depto">Depto {c.numeroDepartamento} · Piso {c.piso}</p>
                        </div>
                        <div className="pgr-cuota-der">
                          <span className="pgr-cuota-monto">S/ {Number(pagoPend?.monto ?? c.montoCalculado).toFixed(2)}</span>
                          <StatusBadge estado="PENDIENTE_VERIFICACION" />
                          {pagoPend?.voucherUrl && (
                            <a href={pagoPend.voucherUrl} target="_blank" rel="noreferrer" className="pgr-btn-voucher">
                              <IcoImg /> Voucher
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <p className="pgr-verif-hint">El directivo aprobará tu pago en breve y recibirás tu recibo automáticamente.</p>
              </>
            )}
          </div>
        )}

        {tab === 'proximas' && (
          <div className="pgr-tab-body">
            {todasFuturas.length === 0 && enVerifFuturas.length === 0 ? (
              <div className="pgr-empty">
                <div className="pgr-empty-icon"><IcoCal /></div>
                <p className="pgr-empty-t">Sin cuotas futuras</p>
                <p className="pgr-empty-s">El directivo aún no configuró los próximos meses.</p>
              </div>
            ) : (
              <>
                {todasFuturas.length > 0 && (
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

                {enVerifFuturas.length > 0 && (
                  <>
                    <p className="pgr-sec-lbl pgr-sec-lbl-info" style={{marginTop: todasFuturas.length > 0 ? 20 : 8}}>En verificación</p>
                    {enVerifFuturas.map(c => {
                      const pagoPend = (c.pagos || []).find(p => p.estado === 'PENDIENTE_VERIFICACION')
                      return (
                        <div key={c.cuotaId} className="pgr-cuota pgr-cuota-verif">
                          <div className="pgr-cuota-fila">
                            <div className="pgr-cuota-info">
                              <p className="pgr-cuota-mes">{etiquetaMes(c.mes, c.anio)}</p>
                              <p className="pgr-cuota-depto">Depto {c.numeroDepartamento} · Piso {c.piso}</p>
                            </div>
                            <div className="pgr-cuota-der">
                              <span className="pgr-cuota-monto">S/ {Number(pagoPend?.monto ?? c.montoCalculado).toFixed(2)}</span>
                              <StatusBadge estado="PENDIENTE_VERIFICACION" />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {seleccionadas.size > 0 && (
          <div className="pgr-barra">
            <button className="pgr-barra-close" onClick={() => setSeleccionadas(new Set())}><IcoX /></button>
            <div className="pgr-barra-info">
              <span className="pgr-barra-cnt">{seleccionadas.size} cuota{seleccionadas.size > 1 ? 's' : ''}</span>
              <span className="pgr-barra-meses">{cuotasSelArray.map(c => etiquetaMes(c.mes, c.anio)).join(' · ')}</span>
            </div>
            <span className="pgr-barra-total">S/ {totalSel.toFixed(2)}</span>
            <button className="pgr-barra-btn" onClick={() => setPagMultiple(true)}>
              Pagar
            </button>
          </div>
        )}

        {pagMultiple && cuotasSelArray.length > 0 && !metodoMultiple && (
          <div className="pgr-panel-multiple">
            <div className="pgr-pm-header">
              <h3 className="pgr-pm-titulo">¿Cómo vas a pagar {cuotasSelArray.length} cuota{cuotasSelArray.length > 1 ? 's' : ''}?</h3>
              <button className="pgr-pm-close" onClick={() => { setPagMultiple(false); setMetodoMultiple(null) }}><IcoX /></button>
            </div>
            <div className="pp-metodos">
              <button className="pp-metodo" onClick={() => setMetodoMultiple('TARJETA')}>
                <div className="pp-metodo-icon pp-icon-blue"><IcoCard /></div>
                <span className="pp-metodo-nombre">Tarjeta</span>
                <span className="pp-metodo-sub">Pago inmediato</span>
              </button>
              <button className="pp-metodo" onClick={() => setMetodoMultiple('TRANSFERENCIA')}>
                <div className="pp-metodo-icon pp-icon-green"><IcoBank /></div>
                <span className="pp-metodo-nombre">Transferencia</span>
                <span className="pp-metodo-sub">Sube tu voucher</span>
              </button>
              <button className="pp-metodo" onClick={() => setMetodoMultiple('EFECTIVO')}>
                <div className="pp-metodo-icon pp-icon-amber"><IcoCash /></div>
                <span className="pp-metodo-nombre">Efectivo</span>
                <span className="pp-metodo-sub">Pendiente verificación</span>
              </button>
            </div>
          </div>
        )}

        {pagMultiple && cuotasSelArray.length > 0 && metodoMultiple === 'TARJETA' && (
          <div className="pgr-panel-multiple">
            <div className="pgr-pm-header">
              <h3 className="pgr-pm-titulo">Pago de {cuotasSelArray.length} cuota{cuotasSelArray.length > 1 ? 's' : ''}</h3>
              <button className="pgr-pm-close" onClick={() => setMetodoMultiple(null)}><IcoX /></button>
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
              onCancelar={() => setMetodoMultiple(null)}
            />
          </div>
        )}

        {pagMultiple && cuotasSelArray.length > 0 && (metodoMultiple === 'TRANSFERENCIA' || metodoMultiple === 'EFECTIVO') && (
          <div className="pgr-panel-multiple">
            <div className="pgr-pm-header">
              <h3 className="pgr-pm-titulo">
                {metodoMultiple === 'TRANSFERENCIA' ? <><IcoBank /> Transferencia</> : <><IcoCash /> Efectivo</>}
                {' '}— {cuotasSelArray.length} cuota{cuotasSelArray.length > 1 ? 's' : ''}
              </h3>
              <button className="pgr-pm-close" onClick={() => setMetodoMultiple(null)}><IcoX /></button>
            </div>
            <FormPagoMultipleManual
              cuotasSelArray={cuotasSelArray}
              totalSel={totalSel}
              metodo={metodoMultiple}
              onExito={() => handleExito('Pago múltiple enviado para verificación.')}
              onCancelar={() => setMetodoMultiple(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  PANEL INLINE — Registrar pago manual (fila de tabla del directivo)
// ══════════════════════════════════════════════════════════════════
function PanelRegistrarPagoDirectivo({ cuota, residentes, onExito, onCancelar }) {
  const saldoPendiente = cuota.saldoPendiente != null ? Number(cuota.saldoPendiente) : Number(cuota.montoCalculado)
  const [monto,     setMonto]     = useState(saldoPendiente.toFixed(2))
  const [pagadorId, setPagadorId] = useState('')
  const [metodo,    setMetodo]    = useState('TRANSFERENCIA')
  const [numOp,     setNumOp]     = useState('')
  const [voucher,   setVoucher]   = useState('')
  const [obs,       setObs]       = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState('')

  const montoNum = Number(monto)

  const handleMonto = (v) => {
    let limpio = v.replace(/[^0-9.]/g, '')
    const partes = limpio.split('.')
    if (partes.length > 2) limpio = partes[0] + '.' + partes.slice(1).join('')
    setMonto(limpio)
  }

  const guardar = async () => {
    if (!pagadorId) { setError('Selecciona quién realizó el pago'); return }
    if (!montoNum || montoNum <= 0) { setError('Ingresa un monto válido mayor a cero'); return }
    if (montoNum > saldoPendiente) { setError(`El monto no puede superar el saldo pendiente de S/ ${saldoPendiente.toFixed(2)}`); return }
    setGuardando(true); setError('')
    try {
      await api.post('/api/pagos/registrar', {
        cuotaId: cuota.cuotaId, monto: montoNum, metodoPago: metodo,
        numeroOperacion: numOp || null, voucherUrl: voucher || null,
        observaciones: obs || null, pagadorId: Number(pagadorId),
      })
      onExito()
    } catch (e) { setError(e.response?.data || 'Error al registrar el pago') }
    finally { setGuardando(false) }
  }

  return (
    <div className="drp-form">
      <p className="drp-form-titulo">Registrar pago manual</p>
      <div className="drp-form-grid">
        <div className="drp-field">
          <label className="drp-label">Pagador</label>
          <select className="drp-input" value={pagadorId} onChange={e => setPagadorId(e.target.value)}>
            <option value="">Seleccionar residente...</option>
            {residentes.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.tipo === 'PROPIETARIO' ? 'Propietario' : 'Inquilino'})</option>)}
          </select>
        </div>
        <div className="drp-field">
          <label className="drp-label">Monto a registrar (S/)</label>
          <div className="pm-monto-wrap">
            <span className="pm-monto-prefix">S/</span>
            <input className="pm-input pm-input-monto" value={monto} onChange={e => handleMonto(e.target.value)} inputMode="decimal" />
          </div>
          <p className="pm-monto-hint">Saldo pendiente: <strong>S/ {saldoPendiente.toFixed(2)}</strong></p>
        </div>
        <div className="drp-field drp-field-full">
          <label className="drp-label">Método de pago</label>
          <div className="metodos-grid">
            {METODOS_PAGO_DIRECTIVO.map(m => (
              <button key={m} type="button" className={`metodo-btn ${metodo === m ? 'metodo-active' : ''}`} onClick={() => setMetodo(m)}>{m}</button>
            ))}
          </div>
        </div>
        <div className="drp-field">
          <label className="drp-label">N° de operación (opcional)</label>
          <input className="drp-input" value={numOp} onChange={e => setNumOp(textoLibreEstricto(e.target.value))} />
        </div>
        <div className="drp-field drp-field-full">
          <SubirFoto onSubida={url => setVoucher(url)} obligatorio={false} label="Foto del comprobante (opcional)" />
        </div>
        <div className="drp-field drp-field-full">
          <label className="drp-label">Observaciones (opcional)</label>
          <input className="drp-input" value={obs} onChange={e => setObs(textoLibreEstricto(e.target.value))} maxLength={200} />
        </div>
      </div>
      {error && <p className="pm-error">{error}</p>}
      <div className="drp-form-footer">
        <button className="pm-btn-cancelar" onClick={onCancelar} disabled={guardando}>Cancelar</button>
        <button className="pm-btn-enviar" onClick={guardar} disabled={guardando}>
          {guardando ? 'Registrando...' : 'Registrar pago'}
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  PANEL INLINE — Pago pendiente bloqueado, aprobar/rechazar directo
// ══════════════════════════════════════════════════════════════════
function PanelPagoBloqueado({ pago, onResuelto }) {
  const [procesando, setProcesando] = useState(false)

  const resolver = async (accion) => {
    setProcesando(true)
    try {
      if (pago.loteId) {
        await api.patch(`/api/pagos/lote/${pago.loteId}/verificar`, { accion, observaciones: '' })
      } else {
        await api.patch(`/api/pagos/${pago.pagoId}/verificar`, { accion, observaciones: '' })
      }
      onResuelto()
    } catch (e) { alert(e.response?.data || 'Error') }
    finally { setProcesando(false) }
  }

  return (
    <div className="drp-bloqueo">
      <div className="drp-bloqueo-aviso">
        <IcoAlert />
        <p>
          {pago.loteId
            ? 'Este departamento tiene un pago múltiple esperando revisión (cubre varias cuotas con el mismo comprobante). Apruébalo o recházalo para poder registrar uno nuevo.'
            : 'Este departamento tiene un pago esperando revisión. Apruébalo o recházalo para poder registrar uno nuevo.'}
        </p>
      </div>
      <div className="drp-bloqueo-info">
        <div className="drp-bloqueo-fila"><span>Pagador</span><strong>{pago.pagadorNombre}</strong></div>
        <div className="drp-bloqueo-fila"><span>Monto</span><strong>S/ {Number(pago.monto).toFixed(2)}</strong></div>
        <div className="drp-bloqueo-fila">
          <span>Método</span>
          <strong>{pago.metodoPago}{pago.numeroOperacion ? ' · Op: ' + pago.numeroOperacion : ''}</strong>
        </div>
        {pago.loteId && <div className="drp-bloqueo-fila"><span>Pago múltiple</span><strong>Se aprobará/rechazará junto a las demás cuotas de este comprobante</strong></div>}
        {pago.voucherUrl && (
          <a href={pago.voucherUrl} target="_blank" rel="noreferrer" className="voucher-link">Ver comprobante</a>
        )}
      </div>
      <div className="drp-form-footer">
        <button className="btn-rechazar-inline" onClick={() => resolver('RECHAZAR')} disabled={procesando}>Rechazar</button>
        <button className="pm-btn-enviar" onClick={() => resolver('APROBAR')} disabled={procesando}>
          {procesando ? 'Procesando...' : 'Aprobar pago'}
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  TABLA DE CUOTAS DEL MES — fila expandible (sin modales)
// ══════════════════════════════════════════════════════════════════
function FilaCuota({ cuota, abierto, onToggle, residentes, cargandoResidentes, onExito }) {
  const pagoPend = (cuota.pagos || []).find(p => p.estado === 'PENDIENTE_VERIFICACION')
  const esParcial = cuota.estadoCuota === 'PARCIAL'
  const esPagado  = cuota.estadoCuota === 'PAGADO'

  return (
    <div className={`drp-fila-wrap ${abierto ? 'drp-fila-wrap-open' : ''}`}>
      <button className={`drp-fila ${abierto ? 'drp-fila-active' : ''}`} onClick={onToggle}>
        <div className="drp-col-depto">
          <div className="drp-depto-avatar"><IcoBuilding /></div>
          <div>
            <p className="drp-depto-num">Depto {cuota.numeroDepartamento}</p>
            <p className="drp-depto-piso">Piso {cuota.piso}</p>
          </div>
        </div>
        <div className="drp-col-residentes">
          {cuota.residentesNombres?.length > 0
            ? cuota.residentesNombres.slice(0, 2).map((n, i) => <p key={i} className="drp-residente-nombre">{n}</p>)
            : <p className="drp-residente-vacio">Sin residentes</p>}
        </div>
        <div className="drp-col-monto">
          {esParcial
            ? <><span className="drp-monto-principal">S/ {Number(cuota.saldoPendiente).toFixed(2)}</span><span className="drp-monto-sub">de S/ {Number(cuota.montoCalculado).toFixed(2)}</span></>
            : <span className="drp-monto-principal">S/ {Number(cuota.montoCalculado).toFixed(2)}</span>}
        </div>
        <div className="drp-col-estado">
          <StatusBadge estado={pagoPend ? 'PENDIENTE_VERIFICACION' : cuota.estadoCuota} />
        </div>
        <div className="drp-col-chev"><IcoChev open={abierto} /></div>
      </button>

      <div className={`drp-panel ${abierto ? 'drp-panel-open' : ''}`}>
        {abierto && (
          <div className="drp-panel-body">
            {pagoPend ? (
              <PanelPagoBloqueado pago={pagoPend} onResuelto={onExito} />
            ) : esPagado ? (
              <div className="drp-historial">
                <p className="drp-historial-titulo">Historial de pagos</p>
                {(cuota.pagos || []).filter(p => p.estado === 'VERIFICADO').map(p => (
                  <div key={p.pagoId} className="drp-historial-item">
                    <span>{p.pagadorNombre}</span>
                    <span>S/ {Number(p.monto).toFixed(2)}</span>
                    <span className="drp-historial-fecha">{p.fechaVerificacion ? new Date(p.fechaVerificacion).toLocaleDateString('es-PE') : ''}</span>
                  </div>
                ))}
              </div>
            ) : cargandoResidentes ? (
              <p className="drp-cargando">Cargando residentes...</p>
            ) : (
              <PanelRegistrarPagoDirectivo cuota={cuota} residentes={residentes} onExito={onExito} onCancelar={onToggle} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  PANEL INLINE — Configurar mes nuevo
// ══════════════════════════════════════════════════════════════════
function PanelConfigurarMes({ onExito, onCancelar }) {
  const ahora = new Date()
  const [mes,           setMes]           = useState(ahora.getMonth() + 1)
  const [anio,          setAnio]          = useState(ahora.getFullYear())
  const [tipoCalculo,   setTipoCalculo]   = useState('PORCENTAJE')
  const [costoPorM2,    setCostoPorM2]    = useState('')
  const [totalMensual,  setTotalMensual]  = useState('')
  const [montoFijo,     setMontoFijo]     = useState('')
  const [gastosEst,     setGastosEst]     = useState('')
  const [obs,           setObs]           = useState('')
  const [guardando,     setGuardando]     = useState(false)
  const [error,         setError]         = useState('')

  // Solo dígitos y un punto decimal — nunca signos ni letras
  const soloMonto = (v) => {
    let limpio = v.replace(/[^0-9.]/g, '')
    const partes = limpio.split('.')
    if (partes.length > 2) limpio = partes[0] + '.' + partes.slice(1).join('')
    return limpio
  }

  const guardar = async () => {
    setError('')
    if (tipoCalculo === 'PORCENTAJE' && (!totalMensual || Number(totalMensual) <= 0)) {
      setError('Ingresa el monto total mensual a recaudar'); return
    }
    if (tipoCalculo === 'COSTO_M2' && (!costoPorM2 || Number(costoPorM2) <= 0)) {
      setError('Ingresa el costo por metro cuadrado'); return
    }
    if (tipoCalculo === 'MONTO_FIJO' && (!montoFijo || Number(montoFijo) <= 0)) {
      setError('Ingresa el monto fijo que pagará cada departamento'); return
    }
    setGuardando(true)
    try {
      const r = await api.post('/api/pagos/configurar-mes', {
        mes: Number(mes), anio: Number(anio), tipoCalculo,
        costoPorM2: costoPorM2 ? Number(costoPorM2) : null,
        totalMensual: totalMensual ? Number(totalMensual) : null,
        montoFijo: montoFijo ? Number(montoFijo) : null,
        totalGastosEstimados: gastosEst ? Number(gastosEst) : null,
        observaciones: obs || null,
      })
      onExito(r.data.mensaje)
    } catch (e) { setError(e.response?.data || 'Error al configurar el mes') }
    finally { setGuardando(false) }
  }

  return (
    <div className="drp-config-panel">
      <p className="drp-form-titulo">Configurar nuevo mes</p>

      <div className="drp-form-grid">
        <div className="drp-field">
          <label className="drp-label">Mes</label>
          <select className="drp-input" value={mes} onChange={e => setMes(e.target.value)}>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="drp-field">
          <label className="drp-label">Año</label>
          <select className="drp-input" value={anio} onChange={e => setAnio(e.target.value)}>
            {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <p className="drp-sec-lbl">Método de cálculo</p>
      <div className="drp-metodo-calculo drp-metodo-calculo-3">
        <button
          type="button"
          className={`drp-calculo-opt ${tipoCalculo === 'PORCENTAJE' ? 'drp-calculo-opt-active' : ''}`}
          onClick={() => setTipoCalculo('PORCENTAJE')}
        >
          <p className="drp-calculo-nombre">Por alícuota</p>
          <p className="drp-calculo-desc">% de participación × monto total a recaudar. Incluye cocheras automáticamente.</p>
        </button>
        <button
          type="button"
          className={`drp-calculo-opt ${tipoCalculo === 'COSTO_M2' ? 'drp-calculo-opt-active' : ''}`}
          onClick={() => setTipoCalculo('COSTO_M2')}
        >
          <p className="drp-calculo-nombre">Por metro cuadrado</p>
          <p className="drp-calculo-desc">Costo fijo por m² × área de cada departamento.</p>
        </button>
        <button
          type="button"
          className={`drp-calculo-opt ${tipoCalculo === 'MONTO_FIJO' ? 'drp-calculo-opt-active' : ''}`}
          onClick={() => setTipoCalculo('MONTO_FIJO')}
        >
          <p className="drp-calculo-nombre">Cuota fija</p>
          <p className="drp-calculo-desc">Todos los departamentos pagan exactamente el mismo monto.</p>
        </button>
      </div>

      <div className="drp-form-grid">
        {tipoCalculo === 'PORCENTAJE' && (
          <div className="drp-field drp-field-full">
            <label className="drp-label">Monto total mensual a recaudar (S/)</label>
            <input className="drp-input" inputMode="decimal" value={totalMensual} onChange={e => setTotalMensual(soloMonto(e.target.value))} placeholder="Ej: 5120.40" />
          </div>
        )}
        {tipoCalculo === 'COSTO_M2' && (
          <div className="drp-field drp-field-full">
            <label className="drp-label">Costo por m² (S/)</label>
            <input className="drp-input" inputMode="decimal" value={costoPorM2} onChange={e => setCostoPorM2(soloMonto(e.target.value))} />
          </div>
        )}
        {tipoCalculo === 'MONTO_FIJO' && (
          <div className="drp-field drp-field-full">
            <label className="drp-label">Monto fijo por departamento (S/)</label>
            <input className="drp-input" inputMode="decimal" value={montoFijo} onChange={e => setMontoFijo(soloMonto(e.target.value))} placeholder="Ej: 150.00" />
          </div>
        )}
        <div className="drp-field drp-field-full">
          <label className="drp-label">Total de gastos estimados (opcional)</label>
          <input className="drp-input" inputMode="decimal" value={gastosEst} onChange={e => setGastosEst(soloMonto(e.target.value))} />
        </div>
        <div className="drp-field drp-field-full">
          <label className="drp-label">Observaciones (opcional)</label>
          <input className="drp-input" value={obs} onChange={e => setObs(textoLibreEstricto(e.target.value))} placeholder="Ej: Incluye aumento de personal de mantenimiento" />
        </div>
      </div>

      {error && <p className="pm-error">{error}</p>}
      <div className="drp-form-footer">
        <button className="pm-btn-cancelar" onClick={onCancelar} disabled={guardando}>Cancelar</button>
        <button className="pm-btn-enviar" onClick={guardar} disabled={guardando}>
          {guardando ? 'Generando...' : 'Generar cuotas del mes'}
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  PANEL INLINE — Editar configuración existente
// ══════════════════════════════════════════════════════════════════
function PanelEditarConfig({ config, onExito, onCancelar }) {
  const [tipoCalculo,  setTipoCalculo]  = useState(config.tipoCalculo || 'COSTO_M2')
  const [costoPorM2,   setCostoPorM2]   = useState(config.costoPorM2 || '')
  const [totalMensual, setTotalMensual] = useState(config.totalMensual || '')
  const [montoFijo,    setMontoFijo]    = useState(config.montoFijo || '')
  const [gastosEst,    setGastosEst]    = useState(config.totalGastosEstimados || '')
  const [obs,          setObs]          = useState(config.observaciones || '')
  const [guardando,    setGuardando]    = useState(false)
  const [error,        setError]        = useState('')

  const soloMonto = (v) => {
    let limpio = v.replace(/[^0-9.]/g, '')
    const partes = limpio.split('.')
    if (partes.length > 2) limpio = partes[0] + '.' + partes.slice(1).join('')
    return limpio
  }

  const guardar = async () => {
    setError('')
    if (tipoCalculo === 'PORCENTAJE' && (!totalMensual || Number(totalMensual) <= 0)) {
      setError('Ingresa el monto total mensual a recaudar'); return
    }
    if (tipoCalculo === 'COSTO_M2' && (!costoPorM2 || Number(costoPorM2) <= 0)) {
      setError('Ingresa el costo por metro cuadrado'); return
    }
    if (tipoCalculo === 'MONTO_FIJO' && (!montoFijo || Number(montoFijo) <= 0)) {
      setError('Ingresa el monto fijo que pagará cada departamento'); return
    }
    setGuardando(true)
    try {
      await api.put(`/api/pagos/configuraciones/${config.id}`, {
        tipoCalculo,
        costoPorM2: costoPorM2 ? Number(costoPorM2) : null,
        totalMensual: totalMensual ? Number(totalMensual) : null,
        montoFijo: montoFijo ? Number(montoFijo) : null,
        totalGastosEstimados: gastosEst ? Number(gastosEst) : null,
        observaciones: obs || null,
      })
      onExito()
    } catch (e) { setError(e.response?.data || 'Error al actualizar') }
    finally { setGuardando(false) }
  }

  return (
    <div className="drp-config-panel">
      <p className="drp-form-titulo">Editar {MESES[config.mes - 1]} {config.anio}</p>

      <p className="drp-sec-lbl">Método de cálculo</p>
      <div className="drp-metodo-calculo drp-metodo-calculo-3">
        <button
          type="button"
          className={`drp-calculo-opt ${tipoCalculo === 'PORCENTAJE' ? 'drp-calculo-opt-active' : ''}`}
          onClick={() => setTipoCalculo('PORCENTAJE')}
        >
          <p className="drp-calculo-nombre">Por alícuota</p>
          <p className="drp-calculo-desc">% de participación × monto total a recaudar. Incluye cocheras automáticamente.</p>
        </button>
        <button
          type="button"
          className={`drp-calculo-opt ${tipoCalculo === 'COSTO_M2' ? 'drp-calculo-opt-active' : ''}`}
          onClick={() => setTipoCalculo('COSTO_M2')}
        >
          <p className="drp-calculo-nombre">Por metro cuadrado</p>
          <p className="drp-calculo-desc">Costo fijo por m² × área de cada departamento.</p>
        </button>
        <button
          type="button"
          className={`drp-calculo-opt ${tipoCalculo === 'MONTO_FIJO' ? 'drp-calculo-opt-active' : ''}`}
          onClick={() => setTipoCalculo('MONTO_FIJO')}
        >
          <p className="drp-calculo-nombre">Cuota fija</p>
          <p className="drp-calculo-desc">Todos los departamentos pagan exactamente el mismo monto.</p>
        </button>
      </div>

      <div className="drp-form-grid">
        {tipoCalculo === 'PORCENTAJE' && (
          <div className="drp-field drp-field-full">
            <label className="drp-label">Monto total mensual a recaudar (S/)</label>
            <input className="drp-input" inputMode="decimal" value={totalMensual} onChange={e => setTotalMensual(soloMonto(e.target.value))} />
          </div>
        )}
        {tipoCalculo === 'COSTO_M2' && (
          <div className="drp-field drp-field-full">
            <label className="drp-label">Costo por m² (S/)</label>
            <input className="drp-input" inputMode="decimal" value={costoPorM2} onChange={e => setCostoPorM2(soloMonto(e.target.value))} />
          </div>
        )}
        {tipoCalculo === 'MONTO_FIJO' && (
          <div className="drp-field drp-field-full">
            <label className="drp-label">Monto fijo por departamento (S/)</label>
            <input className="drp-input" inputMode="decimal" value={montoFijo} onChange={e => setMontoFijo(soloMonto(e.target.value))} />
          </div>
        )}
        <div className="drp-field drp-field-full">
          <label className="drp-label">Total de gastos estimados</label>
          <input className="drp-input" inputMode="decimal" value={gastosEst} onChange={e => setGastosEst(soloMonto(e.target.value))} />
        </div>
        <div className="drp-field drp-field-full">
          <label className="drp-label">Observaciones</label>
          <input className="drp-input" value={obs} onChange={e => setObs(textoLibreEstricto(e.target.value))} />
        </div>
      </div>

      <p className="drp-edit-aviso">Al guardar se recalcularán automáticamente los montos de todas las cuotas de este mes según la fórmula seleccionada.</p>

      {error && <p className="pm-error">{error}</p>}
      <div className="drp-form-footer">
        <button className="pm-btn-cancelar" onClick={onCancelar} disabled={guardando}>Cancelar</button>
        <button className="pm-btn-enviar" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
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
  const [msg,        setMsg]        = useState('')
  const [error,      setError]      = useState('')

  const [expandedId,    setExpandedId]    = useState(null)
  const [residentesPorDepto, setResidentesPorDepto] = useState({})
  const [cargandoResidentes, setCargandoResidentes]  = useState(false)

  const [crearConfigOpen, setCrearConfigOpen] = useState(false)
  const [editConfigId,    setEditConfigId]    = useState(null)

  useEffect(() => { cargarDatos() }, [mes, anio, tab])

  const cargarDatos = async () => {
    setLoading(true); setError('')
    try {
      if (tab === 'resumen')        { const r = await api.get(`/api/pagos/resumen/${anio}/${mes}`); setResumen(r.data) }
      if (tab === 'verificaciones') { const r = await api.get('/api/pagos/pendientes'); setPendientes(r.data) }
      if (tab === 'configuracion')  { const r = await api.get('/api/pagos/configuraciones'); setConfigs(r.data) }
    } catch (e) { setError(e.response?.status === 400 ? e.response.data : 'Error al cargar datos') }
    finally { setLoading(false) }
  }

  const toggleFila = async (cuota) => {
    if (expandedId === cuota.cuotaId) { setExpandedId(null); return }
    setExpandedId(cuota.cuotaId)
    const pagoPend = (cuota.pagos || []).find(p => p.estado === 'PENDIENTE_VERIFICACION')
    if (!pagoPend && cuota.estadoCuota !== 'PAGADO' && !residentesPorDepto[cuota.departamentoId]) {
      setCargandoResidentes(true)
      try {
        const r = await api.get(`/api/pagos/departamento/${cuota.departamentoId}/residentes`)
        setResidentesPorDepto(prev => ({ ...prev, [cuota.departamentoId]: r.data }))
      } catch { setResidentesPorDepto(prev => ({ ...prev, [cuota.departamentoId]: [] })) }
      finally { setCargandoResidentes(false) }
    }
  }

  const handleExitoFila = () => {
    setExpandedId(null)
    setMsg('Operación realizada correctamente.')
    cargarDatos()
    setTimeout(() => setMsg(''), 4000)
  }

  const verificarPendiente = async (pagoId, accion) => {
    try {
      await api.patch(`/api/pagos/${pagoId}/verificar`, { accion, observaciones: '' })
      cargarDatos()
    } catch (e) { alert(e.response?.data || 'Error') }
  }

  const verificarLotePendiente = async (loteId, accion) => {
    try {
      await api.patch(`/api/pagos/lote/${loteId}/verificar`, { accion, observaciones: '' })
      cargarDatos()
    } catch (e) { alert(e.response?.data || 'Error') }
  }

  // Agrupa la lista plana de pendientes por loteId (pagos múltiples),
  // dejando los pagos normales (sin lote) como grupos de 1
  const gruposPendientes = (() => {
    const grupos = []
    const vistos = new Set()
    pendientes.forEach(p => {
      if (p.loteId) {
        if (vistos.has(p.loteId)) return
        vistos.add(p.loteId)
        grupos.push({ loteId: p.loteId, items: pendientes.filter(x => x.loteId === p.loteId) })
      } else {
        grupos.push({ loteId: null, items: [p] })
      }
    })
    return grupos
  })()

  const estadoColor = e => ({ PAGADO:'pill-success', VERIFICADO:'pill-success', PARCIAL:'pill-warning', VENCIDO:'pill-danger', RECHAZADO:'pill-danger', PENDIENTE_VERIFICACION:'pill-warning' }[e] || 'pill-neutral')
  const estadoLabel = e => ({ PENDIENTE:'Pendiente', PARCIAL:'Parcial', PAGADO:'Pagado', VENCIDO:'Vencido', EXONERADO:'Exonerado', PENDIENTE_VERIFICACION:'En verificación', VERIFICADO:'Verificado', RECHAZADO:'Rechazado' }[e] || e)

  return (
    <div className="drp-page">
      <div className="drp-header">
        <div>
          <h1 className="drp-titulo">Pagos</h1>
          <p className="drp-sub">Recaudación de mantenimiento mensual · Torre Blanca</p>
        </div>
      </div>

      {msg   && <div className="pgr-alert pgr-alert-ok"><IcoCheck /> {msg}</div>}

      <div className="drp-tabs">
        <button className={`drp-tab ${tab === 'resumen' ? 'drp-tab-active' : ''}`} onClick={() => setTab('resumen')}>
          <IcoBuilding /> Resumen del mes
        </button>
        <button className={`drp-tab ${tab === 'verificaciones' ? 'drp-tab-active' : ''}`} onClick={() => setTab('verificaciones')}>
          <IcoClipboard /> Verificaciones
          {pendientes.length > 0 && <span className="drp-tab-badge">{pendientes.length}</span>}
        </button>
        <button className={`drp-tab ${tab === 'cuenta' ? 'drp-tab-active' : ''}`} onClick={() => setTab('cuenta')}>
          <IcoUsers /> Mi cuenta
        </button>
        <button className={`drp-tab ${tab === 'configuracion' ? 'drp-tab-active' : ''}`} onClick={() => setTab('configuracion')}>
          <IcoSliders /> Configuración
        </button>
      </div>

      {/* ── Resumen del mes ── */}
      {tab === 'resumen' && (
        <div className="drp-tab-content">
          <div className="drp-mes-selector">
            <select className="drp-mes-select" value={mes} onChange={e => setMes(Number(e.target.value))}>
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="drp-mes-select" value={anio} onChange={e => setAnio(Number(e.target.value))}>
              {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {loading && <div className="drp-skeleton">{[...Array(4)].map((_, i) => <div key={i} className="drp-skeleton-row" />)}</div>}
          {error && <div className="alert-error">{error}</div>}

          {resumen && !loading && (
            <>
              <div className="resumen-grid">
                <div className="resumen-card rc-blue"><p className="rc-value">S/ {resumen.totalEsperado?.toFixed(2)}</p><p className="rc-label">Total esperado</p></div>
                <div className="resumen-card rc-green"><p className="rc-value">S/ {resumen.totalRecaudado?.toFixed(2)}</p><p className="rc-label">Recaudado</p></div>
                <div className="resumen-card rc-red"><p className="rc-value">S/ {resumen.totalPendiente?.toFixed(2)}</p><p className="rc-label">Por cobrar</p></div>
                <div className="resumen-card rc-neutral"><p className="rc-value">{resumen.pagados} / {resumen.totalDepartamentos}</p><p className="rc-label">Deptos pagados</p></div>
                {resumen.parciales > 0 && (
                  <div className="resumen-card rc-amber"><p className="rc-value">{resumen.parciales}</p><p className="rc-label">Pagos parciales</p></div>
                )}
                {resumen.enVerificacion > 0 && (
                  <div className="resumen-card rc-blue-soft"><p className="rc-value">{resumen.enVerificacion}</p><p className="rc-label">En verificación</p></div>
                )}
              </div>

              <div className="drp-tabla-wrap">
                <div className="drp-tabla-head">
                  <span>Departamento</span>
                  <span>Residentes</span>
                  <span>Monto</span>
                  <span>Estado</span>
                  <span></span>
                </div>
                {resumen.cuotas?.length === 0 && <div className="us-empty">No hay cuotas configuradas para este mes.</div>}
                {resumen.cuotas?.map(c => (
                  <FilaCuota
                    key={c.cuotaId}
                    cuota={c}
                    abierto={expandedId === c.cuotaId}
                    onToggle={() => toggleFila(c)}
                    residentes={residentesPorDepto[c.departamentoId] || []}
                    cargandoResidentes={cargandoResidentes && expandedId === c.cuotaId}
                    onExito={handleExitoFila}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Verificaciones pendientes ── */}
      {tab === 'verificaciones' && (
        <div className="drp-tab-content">
          {loading && <div className="drp-skeleton">{[...Array(3)].map((_, i) => <div key={i} className="drp-skeleton-row" />)}</div>}
          {!loading && pendientes.length === 0 && (
            <div className="pgr-empty">
              <div className="pgr-empty-icon"><IcoCheck /></div>
              <p className="pgr-empty-t">Sin pagos pendientes</p>
              <p className="pgr-empty-s">Todos los pagos han sido revisados.</p>
            </div>
          )}
          <div className="pendientes-lista">
            {gruposPendientes.map(grupo => {
              if (!grupo.loteId) {
                const p = grupo.items[0]
                return (
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
                      <button className="btn-rechazar-inline" onClick={() => verificarPendiente(p.pagoId, 'RECHAZAR')}>Rechazar</button>
                      <button className="btn btn-primary btn-sm" onClick={() => verificarPendiente(p.pagoId, 'APROBAR')}>Aprobar</button>
                    </div>
                  </div>
                )
              }

              // Grupo de pago múltiple: una tarjeta con el total y los meses cubiertos
              const primero = grupo.items[0]
              const totalLote = grupo.items.reduce((s, x) => s + Number(x.monto), 0)
              return (
                <div key={grupo.loteId} className="pendiente-card pendiente-card-lote">
                  <div className="pendiente-depto"><span className="depto-num">{primero.numeroDepartamento}</span><span className="depto-piso">Piso {primero.piso}</span></div>
                  <div className="pendiente-info">
                    <p className="pendiente-pagador">{primero.pagadorNombre}</p>
                    <p className="pendiente-meta">
                      Pago múltiple · {grupo.items.length} cuotas · {primero.metodoPago}{primero.numeroOperacion ? ' · Op: ' + primero.numeroOperacion : ''}
                    </p>
                    <p className="pendiente-lote-meses">
                      Cubre: {grupo.items.map(x => etiquetaMes(x.mes, x.anio)).join(' · ')}
                    </p>
                    {primero.observaciones && <p className="pendiente-obs">{primero.observaciones}</p>}
                    {primero.voucherUrl && (
                      <div className="pendiente-voucher">
                        <a href={primero.voucherUrl} target="_blank" rel="noreferrer" className="voucher-link">Ver comprobante</a>
                        <img src={primero.voucherUrl} alt="Comprobante" className="pendiente-voucher-thumb" />
                      </div>
                    )}
                  </div>
                  <div className="pendiente-monto">S/ {totalLote.toFixed(2)}</div>
                  <div className="pendiente-actions">
                    <button className="btn-rechazar-inline" onClick={() => verificarLotePendiente(grupo.loteId, 'RECHAZAR')}>Rechazar todo</button>
                    <button className="btn btn-primary btn-sm" onClick={() => verificarLotePendiente(grupo.loteId, 'APROBAR')}>Aprobar todo</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Mi cuenta — el directivo como residente ── */}
      {tab === 'cuenta' && (
        <div className="drp-tab-content drp-mi-cuenta">
          <ResidentePagos user={user} />
        </div>
      )}

      {/* ── Configuración ── */}
      {tab === 'configuracion' && (
        <div className="drp-tab-content">
          <div className="drp-config-header">
            <p className="drp-sub-lbl">{configs.length} mes{configs.length !== 1 ? 'es' : ''} configurado{configs.length !== 1 ? 's' : ''}</p>
            <button className="us-btn-nuevo" onClick={() => { setCrearConfigOpen(!crearConfigOpen); setEditConfigId(null) }}>
              {crearConfigOpen ? <IcoX /> : <IcoPlus />}
              {crearConfigOpen ? 'Cancelar' : 'Configurar nuevo mes'}
            </button>
          </div>

          {crearConfigOpen && (
            <PanelConfigurarMes
              onExito={(m) => { setCrearConfigOpen(false); setMsg(m); cargarDatos(); setTimeout(() => setMsg(''), 4000) }}
              onCancelar={() => setCrearConfigOpen(false)}
            />
          )}

          {loading && <div className="drp-skeleton">{[...Array(3)].map((_, i) => <div key={i} className="drp-skeleton-row" />)}</div>}
          {!loading && configs.length === 0 && !crearConfigOpen && (
            <div className="empty-state">No hay configuraciones registradas todavía.</div>
          )}

          <div className="configs-lista">
            {configs.map(c => (
              <div key={c.id} className="drp-config-card-wrap">
                <div className="config-card">
                  <div>
                    <p className="config-periodo">{MESES[c.mes - 1]} {c.anio}</p>
                    <p className="config-costo">
                      {c.tipoCalculo === 'PORCENTAJE'
                        ? `Por alícuota · S/ ${Number(c.totalMensual || 0).toFixed(2)} total`
                        : c.tipoCalculo === 'MONTO_FIJO'
                        ? `Cuota fija · S/ ${Number(c.montoFijo || 0).toFixed(2)} por departamento`
                        : `S/ ${c.costoPorM2} por m²`}
                    </p>
                    {c.observaciones && <p className="config-obs">{c.observaciones}</p>}
                  </div>
                  <div className="config-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditConfigId(editConfigId === c.id ? null : c.id); setCrearConfigOpen(false) }}>
                      <IcoEdit /> Editar
                    </button>
                  </div>
                </div>

                {editConfigId === c.id && (
                  <PanelEditarConfig
                    config={c}
                    onExito={() => { setEditConfigId(null); setMsg('Configuración actualizada.'); cargarDatos(); setTimeout(() => setMsg(''), 4000) }}
                    onCancelar={() => setEditConfigId(null)}
                  />
                )}
              </div>
            ))}
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
