import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { textoLibreEstricto, sinNegativos } from '../utils/validaciones'
import './Gastos.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE', 'SECRETARIO', 'TESORERO']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ── Iconos ──────────────────────────────────────────────────────
const IcoPlus    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoCheck   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoChev    = ({ open }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}><polyline points="6 9 12 15 18 9"/></svg>
const IcoEdit    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
const IcoTrash   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
const IcoDoc     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
const IcoWallet  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>
const IcoBolt    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
const IcoDroplet = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69s-5.5 6.16-5.5 10.6a5.5 5.5 0 0 0 11 0c0-4.44-5.5-10.6-5.5-10.6z"/></svg>
const IcoSpark   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.1-2.8-2.8L7 14"/></svg>
const IcoShield  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IcoTool    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L2 19l3 3 7.3-7.3a4 4 0 0 0 5.4-5.4l-3.1 3.1-2-2z"/></svg>
const IcoCamera  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
const IcoBox     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
const IcoAlert   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IcoDots    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
const IcoSearch  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>

// Categoría → { icono, color }
const CAT_META = {
  'Luz':                     { Icon: IcoBolt,    color: '#D97706', bg: '#FFFBEB' },
  'Agua':                    { Icon: IcoDroplet, color: '#2563EB', bg: '#EFF6FF' },
  'Limpieza':                { Icon: IcoSpark,   color: '#059669', bg: '#F0FDF4' },
  'Seguridad':               { Icon: IcoShield,  color: '#4F46E5', bg: '#EEF2FF' },
  'Mantenimiento Ascensor':  { Icon: IcoTool,    color: '#7C3AED', bg: '#F5F3FF' },
  'Cámaras de Seguridad':    { Icon: IcoCamera,  color: '#DB2777', bg: '#FDF2F8' },
  'Materiales':              { Icon: IcoBox,     color: '#EA580C', bg: '#FFF7ED' },
  'Contingencia':            { Icon: IcoAlert,   color: '#DC2626', bg: '#FEF2F2' },
  'Otros':                   { Icon: IcoDots,    color: '#475569', bg: '#F1F5F9' },
}
const catMeta = (nombre) => CAT_META[nombre] || CAT_META['Otros']

const FORM_VACIO = { categoriaId: '', descripcion: '', monto: '', fechaGasto: '', comprobanteUrl: '' }

export default function Gastos() {
  const { user } = useAuth()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)
  const ahora = new Date()

  const [gastos,     setGastos]     = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filtroMes,  setFiltroMes]  = useState('')
  const [filtroAnio, setFiltroAnio] = useState('')
  const [busqueda,   setBusqueda]   = useState('')
  const [error,      setError]      = useState('')

  // Panel "registrar nuevo" (inline, no modal)
  const [creando,    setCreando]    = useState(false)
  const [formNuevo,  setFormNuevo]  = useState(FORM_VACIO)
  const [msgNuevo,   setMsgNuevo]   = useState(null)

  // Edición inline por tarjeta
  const [expandId,   setExpandId]   = useState(null)
  const [formEdit,   setFormEdit]   = useState(FORM_VACIO)
  const [msgEdit,    setMsgEdit]    = useState(null)

  // Confirmación inline de borrado
  const [confirmId,  setConfirmId]  = useState(null)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [g, c] = await Promise.all([api.get('/api/gastos'), api.get('/api/gastos/categorias')])
      setGastos(g.data); setCategorias(c.data)
    } catch { setError('Error al cargar datos') }
    finally { setLoading(false) }
  }

  // ── Crear ──────────────────────────────────────────────────────
  const abrirCrear = () => {
    setCreando(true); setExpandId(null); setConfirmId(null)
    setFormNuevo({ ...FORM_VACIO, fechaGasto: ahora.toISOString().split('T')[0] })
    setMsgNuevo(null)
  }

  const cancelarCrear = () => { setCreando(false); setMsgNuevo(null) }

  const guardarNuevo = async () => {
    if (!formNuevo.categoriaId)               { setMsgNuevo({ err: 'Selecciona una categoría' }); return }
    if (!formNuevo.descripcion)                { setMsgNuevo({ err: 'Ingresa una descripción' }); return }
    if (!formNuevo.monto || Number(formNuevo.monto) <= 0) { setMsgNuevo({ err: 'El monto debe ser mayor a cero' }); return }
    if (!formNuevo.fechaGasto)                 { setMsgNuevo({ err: 'Selecciona la fecha del gasto' }); return }
    try {
      await api.post('/api/gastos', formNuevo)
      setMsgNuevo({ ok: 'Gasto registrado correctamente' })
      cargarDatos()
      setTimeout(() => { setCreando(false); setMsgNuevo(null) }, 1100)
    } catch (e) { setMsgNuevo({ err: e.response?.data || 'Error al guardar' }) }
  }

  // ── Editar ─────────────────────────────────────────────────────
  const toggleExpand = (g) => {
    if (expandId === g.id) { setExpandId(null); return }
    setExpandId(g.id); setCreando(false); setConfirmId(null)
    setFormEdit({
      categoriaId: categorias.find(c => c.nombre === g.categoria)?.id || '',
      descripcion: g.descripcion,
      monto: g.monto,
      fechaGasto: g.fechaGasto,
      comprobanteUrl: g.comprobanteUrl || '',
    })
    setMsgEdit(null)
  }

  const guardarEdicion = async (id) => {
    if (!formEdit.monto || Number(formEdit.monto) <= 0) { setMsgEdit({ err: 'El monto debe ser mayor a cero' }); return }
    try {
      await api.put('/api/gastos/' + id, formEdit)
      setMsgEdit({ ok: 'Gasto actualizado' })
      cargarDatos()
      setTimeout(() => { setExpandId(null); setMsgEdit(null) }, 1100)
    } catch (e) { setMsgEdit({ err: e.response?.data || 'Error al guardar' }) }
  }

  // ── Eliminar ───────────────────────────────────────────────────
  const eliminar = async (id) => {
    try {
      await api.delete('/api/gastos/' + id)
      setConfirmId(null); setExpandId(null)
      cargarDatos()
    } catch (e) { setMsgEdit({ err: e.response?.data || 'No se pudo eliminar' }) }
  }

  // ── Filtrado ───────────────────────────────────────────────────
  const filtrados = gastos.filter(g => {
    if (filtroMes  && g.mes  !== Number(filtroMes))  return false
    if (filtroAnio && g.anio !== Number(filtroAnio)) return false
    if (busqueda && !`${g.descripcion} ${g.categoria} ${g.registradoPorNombre || ''}`.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  }).sort((a, b) => new Date(b.fechaGasto) - new Date(a.fechaGasto))

  const totalFiltrado = filtrados.reduce((s, g) => s + Number(g.monto), 0)

  // Resumen por categoría (sobre lo filtrado)
  const resumenCategorias = categorias
    .map(c => ({ ...c, total: filtrados.filter(g => g.categoria === c.nombre).reduce((s, g) => s + Number(g.monto), 0) }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total)

  if (loading) return (
    <div className="gst-page">
      <div className="gst-skeleton">{[...Array(4)].map((_, i) => <div key={i} className="gst-skeleton-item" />)}</div>
    </div>
  )

  return (
    <div className="gst-page">

      {/* Header */}
      <div className="gst-header">
        <div>
          <h1 className="gst-titulo">Gastos</h1>
          <p className="gst-sub">Registro de gastos del edificio Torre Blanca</p>
        </div>
        {esDirectivo && (
          <button className="gst-btn-nuevo" onClick={creando ? cancelarCrear : abrirCrear}>
            <IcoPlus /> {creando ? 'Cancelar' : 'Registrar gasto'}
          </button>
        )}
      </div>

      {error && <div className="gst-alert-err">{error}</div>}

      {/* Panel inline: registrar gasto */}
      {creando && (
        <div className="gst-panel-nuevo">
          <p className="gst-panel-titulo">Nuevo gasto</p>
          <div className="gst-form-grid">
            <div className="gst-campo">
              <label>Categoría</label>
              <select value={formNuevo.categoriaId} onChange={e => setFormNuevo({ ...formNuevo, categoriaId: e.target.value })}>
                <option value="">Seleccionar...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="gst-campo">
              <label>Fecha del gasto</label>
              <input type="date" value={formNuevo.fechaGasto} onChange={e => setFormNuevo({ ...formNuevo, fechaGasto: e.target.value })} />
            </div>
            <div className="gst-campo gst-campo-full">
              <label>Descripción</label>
              <input value={formNuevo.descripcion} placeholder="Ej: Pago de luz de mayo"
                onChange={e => setFormNuevo({ ...formNuevo, descripcion: textoLibreEstricto(e.target.value) })} />
            </div>
            <div className="gst-campo">
              <label>Monto (S/)</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={formNuevo.monto}
                onChange={e => setFormNuevo({ ...formNuevo, monto: sinNegativos(e.target.value) })} />
            </div>
            <div className="gst-campo">
              <label>URL del comprobante <span className="gst-hint-opt">(opcional)</span></label>
              <input value={formNuevo.comprobanteUrl} placeholder="https://..."
                onChange={e => setFormNuevo({ ...formNuevo, comprobanteUrl: e.target.value })} />
            </div>
          </div>
          {msgNuevo?.err && <p className="gst-msg-err">{msgNuevo.err}</p>}
          {msgNuevo?.ok  && <p className="gst-msg-ok">{msgNuevo.ok}</p>}
          <div className="gst-panel-btns">
            <button className="gst-btn-cancelar" onClick={cancelarCrear}>Cancelar</button>
            <button className="gst-btn-confirmar" onClick={guardarNuevo}><IcoCheck /> Registrar</button>
          </div>
        </div>
      )}

      {/* Resumen por categoría */}
      {resumenCategorias.length > 0 && (
        <div className="gst-resumen-cats">
          {resumenCategorias.map(c => {
            const { Icon, color, bg } = catMeta(c.nombre)
            return (
              <div className="gst-resumen-chip" key={c.id}>
                <span className="gst-resumen-icon" style={{ background: bg, color }}><Icon /></span>
                <div>
                  <p className="gst-resumen-val">S/ {c.total.toFixed(2)}</p>
                  <p className="gst-resumen-lbl">{c.nombre}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Toolbar: filtros + búsqueda */}
      <div className="gst-toolbar">
        <div className="gst-search-wrap">
          <IcoSearch />
          <input className="gst-search" placeholder="Buscar por descripción, categoría o responsable..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <select className="gst-select-filtro" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
          <option value="">Todos los meses</option>
          {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="gst-select-filtro" value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}>
          <option value="">Todos los años</option>
          {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Total filtrado */}
      <div className="gst-total-bar">
        <span className="gst-total-icon"><IcoWallet /></span>
        <div>
          <p className="gst-total-lbl">
            Total {filtroMes && filtroAnio ? `· ${MESES[Number(filtroMes) - 1]} ${filtroAnio}` : filtroMes ? `· ${MESES[Number(filtroMes) - 1]}` : filtroAnio ? `· ${filtroAnio}` : '(todos los gastos)'}
          </p>
          <p className="gst-total-val">S/ {totalFiltrado.toFixed(2)}</p>
        </div>
        <span className="gst-total-cnt">{filtrados.length} gasto{filtrados.length !== 1 ? 's' : ''}</span>
      </div>

      {filtrados.length === 0 && (
        <div className="gst-empty">
          <IcoWallet />
          <p>No hay gastos para el período seleccionado.</p>
        </div>
      )}

      {/* Lista de gastos */}
      <div className="gst-lista">
        {filtrados.map(g => {
          const { Icon, color, bg } = catMeta(g.categoria)
          const abierto = expandId === g.id
          const fecha = new Date(g.fechaGasto + 'T00:00:00')
          const fechaStr = fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })

          return (
            <div key={g.id} className={`gst-card ${abierto ? 'gst-card-open' : ''}`}>
              <button className="gst-card-head" onClick={() => toggleExpand(g)}>
                <span className="gst-card-icon" style={{ background: bg, color }}><Icon /></span>
                <div className="gst-card-mid">
                  <p className="gst-card-desc">{g.descripcion}</p>
                  <p className="gst-card-meta">
                    <span className="gst-card-cat" style={{ color }}>{g.categoria}</span>
                    <span className="gst-dot-sep" />
                    <span>{fechaStr}</span>
                    {g.registradoPorNombre && <><span className="gst-dot-sep" />Por {g.registradoPorNombre}</>}
                  </p>
                </div>
                <div className="gst-card-right">
                  <span className="gst-card-monto">S/ {Number(g.monto).toFixed(2)}</span>
                  {esDirectivo && <IcoChev open={abierto} />}
                </div>
              </button>

              {esDirectivo && (
                <div className={`gst-panel ${abierto ? 'gst-panel-open' : ''}`}>
                  {abierto && (
                    <div className="gst-panel-body">
                      {g.comprobanteUrl && (
                        <a href={g.comprobanteUrl} target="_blank" rel="noreferrer" className="gst-voucher-link">
                          <IcoDoc /> Ver comprobante
                        </a>
                      )}

                      {confirmId === g.id ? (
                        <div className="gst-confirm">
                          <p className="gst-confirm-txt">¿Eliminar este gasto de <strong>S/ {Number(g.monto).toFixed(2)}</strong>? Esta acción no se puede deshacer.</p>
                          <div className="gst-confirm-btns">
                            <button className="gst-btn-cancelar" onClick={() => setConfirmId(null)}>Cancelar</button>
                            <button className="gst-btn-eliminar-confirm" onClick={() => eliminar(g.id)}><IcoTrash /> Sí, eliminar</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="gst-form-grid">
                            <div className="gst-campo">
                              <label>Categoría</label>
                              <select value={formEdit.categoriaId} onChange={e => setFormEdit({ ...formEdit, categoriaId: e.target.value })}>
                                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                              </select>
                            </div>
                            <div className="gst-campo">
                              <label>Fecha del gasto</label>
                              <input type="date" value={formEdit.fechaGasto} onChange={e => setFormEdit({ ...formEdit, fechaGasto: e.target.value })} />
                            </div>
                            <div className="gst-campo gst-campo-full">
                              <label>Descripción</label>
                              <input value={formEdit.descripcion} onChange={e => setFormEdit({ ...formEdit, descripcion: textoLibreEstricto(e.target.value) })} />
                            </div>
                            <div className="gst-campo">
                              <label>Monto (S/)</label>
                              <input type="number" min="0" step="0.01" value={formEdit.monto} onChange={e => setFormEdit({ ...formEdit, monto: sinNegativos(e.target.value) })} />
                            </div>
                            <div className="gst-campo">
                              <label>URL del comprobante <span className="gst-hint-opt">(opcional)</span></label>
                              <input value={formEdit.comprobanteUrl} placeholder="https://..." onChange={e => setFormEdit({ ...formEdit, comprobanteUrl: e.target.value })} />
                            </div>
                          </div>
                          {msgEdit?.err && <p className="gst-msg-err">{msgEdit.err}</p>}
                          {msgEdit?.ok  && <p className="gst-msg-ok">{msgEdit.ok}</p>}
                          <div className="gst-panel-btns gst-panel-btns-edit">
                            <button className="gst-btn-eliminar" onClick={() => setConfirmId(g.id)}><IcoTrash /> Eliminar</button>
                            <div className="gst-panel-btns-der">
                              <button className="gst-btn-cancelar" onClick={() => setExpandId(null)}>Cancelar</button>
                              <button className="gst-btn-confirmar" onClick={() => guardarEdicion(g.id)}><IcoEdit /> Guardar cambios</button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
