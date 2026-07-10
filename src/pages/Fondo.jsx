import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import SubirFoto from '../components/SubirFoto'
import { textoLibreEstricto, soloMonto } from '../utils/validaciones'
import './Fondo.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE', 'SECRETARIO', 'TESORERO']

// ── Íconos ──────────────────────────────────────────────────────
const IcoPlus     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoCheck    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoX        = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoChev     = ({ open }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}><polyline points="6 9 12 15 18 9"/></svg>
const IcoTrash    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
const IcoDoc      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
const IcoWallet   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>
const IcoTrendUp  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
const IcoTrendDown= () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
const IcoFolder   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
const IcoFlag     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
const IcoTarget   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>

const ESTADO_META = {
  ACTIVO:    { label: 'Activo',    color: '#2563EB', bg: '#EFF6FF' },
  CERRADO:   { label: 'Completado',color: '#059669', bg: '#F0FDF4' },
  CANCELADO: { label: 'Cancelado', color: '#64748B', bg: '#F1F5F9' },
}

const fechaCorta = (iso) => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

// ══════════════════════════════════════════════════════════════════
//  Formulario inline: registrar ingreso o retiro
// ══════════════════════════════════════════════════════════════════
function FormMovimiento({ proyectoId, tipo, onExito, onCancelar }) {
  const hoy = new Date().toISOString().split('T')[0]
  const [monto, setMonto]     = useState('')
  const [concepto, setConcepto] = useState('')
  const [fecha, setFecha]     = useState(hoy)
  const [comprobante, setComprobante] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError]     = useState('')

  const guardar = async () => {
    if (!monto || Number(monto) <= 0) { setError('Ingresa un monto válido mayor a cero'); return }
    if (!concepto.trim()) { setError('Ingresa un concepto'); return }
    setGuardando(true); setError('')
    try {
      await api.post('/api/fondo/movimientos', {
        proyectoId: proyectoId || null,
        tipo, monto: Number(monto), concepto, fecha,
        comprobanteUrl: comprobante || null,
      })
      onExito()
    } catch (e) { setError(e.response?.data || 'Error al registrar el movimiento') }
    finally { setGuardando(false) }
  }

  return (
    <div className="fc-form">
      <p className="fc-form-titulo">{tipo === 'INGRESO' ? 'Registrar ingreso' : 'Registrar retiro'}</p>
      <div className="fc-form-grid">
        <div className="fc-campo">
          <label>Monto (S/)</label>
          <input type="text" inputMode="decimal" placeholder="0.00" value={monto} onChange={e => setMonto(soloMonto(e.target.value))} />
        </div>
        <div className="fc-campo">
          <label>Fecha</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        </div>
        <div className="fc-campo fc-campo-full">
          <label>Concepto</label>
          <input value={concepto} placeholder={tipo === 'INGRESO' ? 'Ej: Recaudación pollada' : 'Ej: Pago a proveedor de faja'}
            onChange={e => setConcepto(textoLibreEstricto(e.target.value))} />
        </div>
      </div>
      <div className="fc-foto-wrap">
        <SubirFoto onSubida={url => setComprobante(url)} obligatorio={false}
          label={tipo === 'RETIRO' ? 'Foto del comprobante de pago (opcional)' : 'Foto del voucher (opcional)'} />
      </div>
      {tipo === 'RETIRO' && (
        <p className="fc-hint">Este retiro también se registrará automáticamente como Gasto (categoría Contingencia).</p>
      )}
      {error && <p className="fc-msg-err">{error}</p>}
      <div className="fc-form-btns">
        <button className="fc-btn-cancelar" onClick={onCancelar} disabled={guardando}>Cancelar</button>
        <button className={tipo === 'INGRESO' ? 'fc-btn-confirmar-ingreso' : 'fc-btn-confirmar-retiro'} onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : tipo === 'INGRESO' ? 'Registrar ingreso' : 'Registrar retiro'}
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  Tabla de movimientos (reusable: dentro de un proyecto o generales)
// ══════════════════════════════════════════════════════════════════
function TablaMovimientos({ movimientos, onEliminar }) {
  const [confirmId, setConfirmId] = useState(null)

  if (movimientos.length === 0) {
    return <p className="fc-sin-movimientos">Aún no hay movimientos registrados.</p>
  }

  return (
    <div className="fc-mov-tabla-wrap">
      <table className="fc-mov-tabla">
        <thead>
          <tr>
            <th>Fecha</th><th>Tipo</th><th>Concepto</th><th>Registrado por</th>
            <th className="fc-th-monto">Monto</th><th className="fc-th-accion"></th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map(m => (
            <tr key={m.id}>
              <td className="fc-td-muted">{fechaCorta(m.fecha)}</td>
              <td>
                <span className={`fc-tipo-chip ${m.tipo === 'INGRESO' ? 'fc-tipo-ingreso' : 'fc-tipo-retiro'}`}>
                  {m.tipo === 'INGRESO' ? <IcoTrendUp /> : <IcoTrendDown />}
                  {m.tipo === 'INGRESO' ? 'Ingreso' : 'Retiro'}
                </span>
              </td>
              <td className="fc-td-concepto">
                {m.concepto}
                {m.comprobanteUrl && (
                  <a href={m.comprobanteUrl} target="_blank" rel="noreferrer" className="fc-voucher-link"><IcoDoc /> Ver</a>
                )}
              </td>
              <td className="fc-td-muted">{m.registradoPorNombre || '—'}</td>
              <td className={`fc-td-monto ${m.tipo === 'INGRESO' ? 'fc-monto-ingreso' : 'fc-monto-retiro'}`}>
                {m.tipo === 'INGRESO' ? '+' : '−'} S/ {Number(m.monto).toFixed(2)}
              </td>
              <td className="fc-td-accion">
                {confirmId === m.id ? (
                  <div className="fc-confirm-inline">
                    <button className="fc-btn-mini-cancelar" onClick={() => setConfirmId(null)}>No</button>
                    <button className="fc-btn-mini-eliminar" onClick={() => { onEliminar(m.id); setConfirmId(null) }}>Sí</button>
                  </div>
                ) : (
                  <button className="fc-btn-eliminar-fila" onClick={() => setConfirmId(m.id)}><IcoTrash /></button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  Tarjeta de proyecto (expandible, sin modal)
// ══════════════════════════════════════════════════════════════════
function ProyectoCard({ proyecto, abierto, onToggle, movimientos, onCambiarEstado, onExitoMovimiento, onEliminarMovimiento }) {
  const [formTipo, setFormTipo] = useState(null) // 'INGRESO' | 'RETIRO' | null
  const [confirmEstado, setConfirmEstado] = useState(null)

  const meta = ESTADO_META[proyecto.estado] || ESTADO_META.ACTIVO
  const ingresado = Number(proyecto.totalIngresado || 0)
  const saldo = Number(proyecto.saldo || 0)
  const metaMonto = proyecto.metaMonto ? Number(proyecto.metaMonto) : null
  const pct = metaMonto ? Math.min(100, Math.round((ingresado / metaMonto) * 100)) : null

  return (
    <div className={`fc-card ${abierto ? 'fc-card-open' : ''}`}>
      <button className="fc-card-head" onClick={onToggle}>
        <span className="fc-card-icon"><IcoFolder /></span>
        <div className="fc-card-mid">
          <div className="fc-card-titulo-row">
            <p className="fc-card-nombre">{proyecto.nombre}</p>
            <span className="fc-estado-chip" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
          </div>
          {metaMonto ? (
            <div className="fc-progreso-wrap">
              <div className="fc-progreso-bar"><div className="fc-progreso-fill" style={{ width: `${pct}%` }} /></div>
              <span className="fc-progreso-txt">S/ {ingresado.toFixed(0)} de S/ {metaMonto.toFixed(0)} recaudados ({pct}%)</span>
            </div>
          ) : (
            <p className="fc-card-fecha">Iniciado el {fechaCorta(proyecto.fechaInicio)}</p>
          )}
        </div>
        <div className="fc-card-right">
          <span className="fc-card-saldo">S/ {saldo.toFixed(2)}</span>
          <span className="fc-card-saldo-lbl">disponible</span>
          <IcoChev open={abierto} />
        </div>
      </button>

      <div className={`fc-panel ${abierto ? 'fc-panel-open' : ''}`}>
        {abierto && (
          <div className="fc-panel-body">
            {proyecto.descripcion && <p className="fc-descripcion">{proyecto.descripcion}</p>}

            <div className="fc-panel-toolbar">
              <div className="fc-panel-btns-izq">
                <button className="fc-btn-add-ingreso" onClick={() => setFormTipo(formTipo === 'INGRESO' ? null : 'INGRESO')}>
                  <IcoPlus /> Ingreso
                </button>
                <button className="fc-btn-add-retiro" onClick={() => setFormTipo(formTipo === 'RETIRO' ? null : 'RETIRO')}>
                  <IcoPlus /> Retiro
                </button>
              </div>
              {proyecto.estado === 'ACTIVO' && (
                confirmEstado ? (
                  <div className="fc-confirm-inline">
                    <span className="fc-confirm-txt">¿{confirmEstado === 'CERRADO' ? 'Marcar como completado' : 'Cancelar proyecto'}?</span>
                    <button className="fc-btn-mini-cancelar" onClick={() => setConfirmEstado(null)}>No</button>
                    <button className="fc-btn-mini-eliminar" onClick={() => { onCambiarEstado(proyecto.id, confirmEstado); setConfirmEstado(null) }}>Sí</button>
                  </div>
                ) : (
                  <div className="fc-panel-btns-der">
                    <button className="fc-btn-cerrar-proyecto" onClick={() => setConfirmEstado('CERRADO')}><IcoFlag /> Completado</button>
                    <button className="fc-btn-cancelar-proyecto" onClick={() => setConfirmEstado('CANCELADO')}>Cancelar proyecto</button>
                  </div>
                )
              )}
            </div>

            {formTipo && (
              <FormMovimiento proyectoId={proyecto.id} tipo={formTipo}
                onExito={() => { setFormTipo(null); onExitoMovimiento() }}
                onCancelar={() => setFormTipo(null)} />
            )}

            <TablaMovimientos movimientos={movimientos || []} onEliminar={onEliminarMovimiento} />
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  Formulario inline: nuevo proyecto
// ══════════════════════════════════════════════════════════════════
function FormNuevoProyecto({ onExito, onCancelar }) {
  const hoy = new Date().toISOString().split('T')[0]
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [meta, setMeta] = useState('')
  const [fechaInicio, setFechaInicio] = useState(hoy)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const guardar = async () => {
    if (!nombre.trim()) { setError('Ingresa el nombre del proyecto'); return }
    setGuardando(true); setError('')
    try {
      await api.post('/api/fondo/proyectos', {
        nombre, descripcion: descripcion || null,
        metaMonto: meta ? Number(meta) : null,
        fechaInicio,
      })
      onExito()
    } catch (e) { setError(e.response?.data || 'Error al crear el proyecto') }
    finally { setGuardando(false) }
  }

  return (
    <div className="fc-panel-nuevo">
      <p className="fc-form-titulo">Nuevo proyecto</p>
      <div className="fc-form-grid">
        <div className="fc-campo fc-campo-full">
          <label>Nombre del proyecto</label>
          <input value={nombre} placeholder="Ej: Cambio de faja del ascensor"
            onChange={e => setNombre(textoLibreEstricto(e.target.value))} />
        </div>
        <div className="fc-campo fc-campo-full">
          <label>Motivo / descripción <span className="fc-hint-opt">(opcional)</span></label>
          <input value={descripcion} placeholder="Ej: Mantenimiento indicó que la faja dura 3 años más"
            onChange={e => setDescripcion(textoLibreEstricto(e.target.value))} />
        </div>
        <div className="fc-campo">
          <label>Meta de recaudación (S/) <span className="fc-hint-opt">(opcional)</span></label>
          <input type="text" inputMode="decimal" placeholder="Ej: 800.00" value={meta} onChange={e => setMeta(soloMonto(e.target.value))} />
        </div>
        <div className="fc-campo">
          <label>Fecha de inicio</label>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
        </div>
      </div>
      {error && <p className="fc-msg-err">{error}</p>}
      <div className="fc-form-btns">
        <button className="fc-btn-cancelar" onClick={onCancelar} disabled={guardando}>Cancelar</button>
        <button className="fc-btn-confirmar-ingreso" onClick={guardar} disabled={guardando}>
          <IcoCheck /> {guardando ? 'Creando...' : 'Crear proyecto'}
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  Página principal
// ══════════════════════════════════════════════════════════════════
export default function Fondo() {
  const { user } = useAuth()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)

  const [resumen, setResumen] = useState(null)
  const [proyectos, setProyectos] = useState([])
  const [movimientosPorProyecto, setMovimientosPorProyecto] = useState({})
  const [generales, setGenerales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [crearOpen, setCrearOpen] = useState(false)
  const [expandId, setExpandId] = useState(null)
  const [generalesAbierto, setGeneralesAbierto] = useState(false)
  const [formGeneralTipo, setFormGeneralTipo] = useState(null)

  useEffect(() => { cargarTodo() }, [])

  const cargarTodo = async () => {
    setLoading(true); setError('')
    try {
      const [r, p] = await Promise.all([api.get('/api/fondo/resumen'), api.get('/api/fondo/proyectos')])
      setResumen(r.data); setProyectos(p.data)
    } catch { setError('No se pudo cargar el fondo de contingencia') }
    finally { setLoading(false) }
  }

  const cargarMovimientosProyecto = async (proyectoId) => {
    try {
      const r = await api.get('/api/fondo/movimientos', { params: { proyectoId } })
      setMovimientosPorProyecto(prev => ({ ...prev, [proyectoId]: r.data }))
    } catch { /* silencioso */ }
  }

  const cargarGenerales = async () => {
    try { const r = await api.get('/api/fondo/movimientos'); setGenerales(r.data) }
    catch { /* silencioso */ }
  }

  const toggleProyecto = (id) => {
    if (expandId === id) { setExpandId(null); return }
    setExpandId(id)
    if (!movimientosPorProyecto[id]) cargarMovimientosProyecto(id)
  }

  const toggleGenerales = () => {
    const abrir = !generalesAbierto
    setGeneralesAbierto(abrir)
    if (abrir && generales.length === 0) cargarGenerales()
  }

  const handleCambiarEstado = async (id, estado) => {
    try {
      await api.patch(`/api/fondo/proyectos/${id}/estado`, null, { params: { estado } })
      cargarTodo()
    } catch (e) { alert(e.response?.data || 'Error al cambiar el estado') }
  }

  const handleExitoMovimientoProyecto = (proyectoId) => {
    cargarTodo()
    cargarMovimientosProyecto(proyectoId)
  }

  const handleEliminarMovimientoProyecto = async (movId, proyectoId) => {
    try {
      await api.delete(`/api/fondo/movimientos/${movId}`)
      cargarTodo()
      cargarMovimientosProyecto(proyectoId)
    } catch (e) { alert(e.response?.data || 'Error al eliminar') }
  }

  const handleEliminarGeneral = async (movId) => {
    try {
      await api.delete(`/api/fondo/movimientos/${movId}`)
      cargarTodo()
      cargarGenerales()
    } catch (e) { alert(e.response?.data || 'Error al eliminar') }
  }

  if (!esDirectivo) {
    return (
      <div className="fc-page">
        <h1 className="fc-titulo">Fondo de contingencia</h1>
        <p className="fc-sub">Este módulo es visible solo para directivos.</p>
      </div>
    )
  }

  if (loading) return (
    <div className="fc-page">
      <div className="fc-skeleton">{[...Array(3)].map((_, i) => <div key={i} className="fc-skeleton-item" />)}</div>
    </div>
  )

  return (
    <div className="fc-page">
      <div className="fc-header">
        <div>
          <h1 className="fc-titulo">Fondo de contingencia</h1>
          <p className="fc-sub">Proyectos y reservas de la Residencial Torre Blanca</p>
        </div>
        <button className="fc-btn-nuevo" onClick={() => setCrearOpen(!crearOpen)}>
          {crearOpen ? <IcoX /> : <IcoPlus />} {crearOpen ? 'Cancelar' : 'Nuevo proyecto'}
        </button>
      </div>

      {error && <div className="fc-alert-err">{error}</div>}

      {resumen && (
        <div className="fc-resumen-bar">
          <div className="fc-resumen-item">
            <span className="fc-resumen-icon"><IcoWallet /></span>
            <div>
              <p className="fc-resumen-lbl">Saldo total del fondo</p>
              <p className="fc-resumen-val">S/ {Number(resumen.saldoTotal).toFixed(2)}</p>
            </div>
          </div>
          <div className="fc-resumen-sep" />
          <div className="fc-resumen-sub">
            <p className="fc-resumen-sub-lbl">Ingresado</p>
            <p className="fc-resumen-sub-val fc-verde">+ S/ {Number(resumen.totalIngresado).toFixed(2)}</p>
          </div>
          <div className="fc-resumen-sub">
            <p className="fc-resumen-sub-lbl">Retirado</p>
            <p className="fc-resumen-sub-val fc-rojo">− S/ {Number(resumen.totalRetirado).toFixed(2)}</p>
          </div>
          <span className="fc-resumen-badge">{resumen.proyectosActivos} proyecto{resumen.proyectosActivos !== 1 ? 's' : ''} activo{resumen.proyectosActivos !== 1 ? 's' : ''}</span>
        </div>
      )}

      {crearOpen && (
        <FormNuevoProyecto
          onExito={() => { setCrearOpen(false); cargarTodo() }}
          onCancelar={() => setCrearOpen(false)}
        />
      )}

      {proyectos.length === 0 && !crearOpen && (
        <div className="fc-empty">
          <IcoFolder />
          <p className="fc-empty-t">Aún no hay proyectos</p>
          <p className="fc-empty-s">Crea uno para empezar a registrar ingresos y retiros, como una pollada u otra actividad.</p>
        </div>
      )}

      <div className="fc-lista-proyectos">
        {proyectos.map(p => (
          <ProyectoCard
            key={p.id}
            proyecto={p}
            abierto={expandId === p.id}
            onToggle={() => toggleProyecto(p.id)}
            movimientos={movimientosPorProyecto[p.id]}
            onCambiarEstado={handleCambiarEstado}
            onExitoMovimiento={() => handleExitoMovimientoProyecto(p.id)}
            onEliminarMovimiento={(movId) => handleEliminarMovimientoProyecto(movId, p.id)}
          />
        ))}
      </div>

      {/* Movimientos generales — no ligados a ningún proyecto puntual */}
      <div className={`fc-card fc-card-general ${generalesAbierto ? 'fc-card-open' : ''}`}>
        <button className="fc-card-head" onClick={toggleGenerales}>
          <span className="fc-card-icon fc-card-icon-general"><IcoWallet /></span>
          <div className="fc-card-mid">
            <p className="fc-card-nombre">Movimientos generales del fondo</p>
            <p className="fc-card-fecha">Aportes o gastos que no pertenecen a un proyecto específico</p>
          </div>
          <div className="fc-card-right">
            <IcoChev open={generalesAbierto} />
          </div>
        </button>
        <div className={`fc-panel ${generalesAbierto ? 'fc-panel-open' : ''}`}>
          {generalesAbierto && (
            <div className="fc-panel-body">
              <div className="fc-panel-toolbar">
                <div className="fc-panel-btns-izq">
                  <button className="fc-btn-add-ingreso" onClick={() => setFormGeneralTipo(formGeneralTipo === 'INGRESO' ? null : 'INGRESO')}>
                    <IcoPlus /> Ingreso
                  </button>
                  <button className="fc-btn-add-retiro" onClick={() => setFormGeneralTipo(formGeneralTipo === 'RETIRO' ? null : 'RETIRO')}>
                    <IcoPlus /> Retiro
                  </button>
                </div>
              </div>
              {formGeneralTipo && (
                <FormMovimiento proyectoId={null} tipo={formGeneralTipo}
                  onExito={() => { setFormGeneralTipo(null); cargarTodo(); cargarGenerales() }}
                  onCancelar={() => setFormGeneralTipo(null)} />
              )}
              <TablaMovimientos movimientos={generales} onEliminar={handleEliminarGeneral} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
