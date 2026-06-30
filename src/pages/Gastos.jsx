import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import SubirFoto from '../components/SubirFoto'
import { soloMonto } from '../utils/validaciones'
import './Gastos.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE', 'SECRETARIO', 'TESORERO']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ── Iconos ──────────────────────────────────────────────────────
const IcoPlus    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoCheck   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoTrash   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
const IcoDoc     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
const IcoWallet  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>
const IcoBolt    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
const IcoDroplet = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69s-5.5 6.16-5.5 10.6a5.5 5.5 0 0 0 11 0c0-4.44-5.5-10.6-5.5-10.6z"/></svg>
const IcoSpark   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.1-2.8-2.8L7 14"/></svg>
const IcoShield  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IcoTool    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L2 19l3 3 7.3-7.3a4 4 0 0 0 5.4-5.4l-3.1 3.1-2-2z"/></svg>
const IcoCamera  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
const IcoBox     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
const IcoAlert   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IcoDots    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
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

export default function Gastos() {
  const { user } = useAuth()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)
  const ahora = new Date()

  const [gastos,     setGastos]     = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filtroMes,  setFiltroMes]  = useState(ahora.getMonth() + 1)   // mes actual por defecto
  const [filtroAnio, setFiltroAnio] = useState(ahora.getFullYear())    // año actual por defecto
  const [busqueda,   setBusqueda]   = useState('')
  const [error,      setError]      = useState('')

  // Panel "registrar nuevo" (inline, no modal)
  const [creando,     setCreando]     = useState(false)
  const [catNueva,    setCatNueva]    = useState('')
  const [montoNuevo,  setMontoNuevo]  = useState('')
  const [fechaNueva,  setFechaNueva]  = useState('')
  const [fotoNueva,   setFotoNueva]   = useState('')
  const [msgNuevo,    setMsgNuevo]    = useState(null)
  const [guardando,   setGuardando]   = useState(false)

  // Confirmación inline de borrado (por fila de la tabla)
  const [confirmId,  setConfirmId]  = useState(null)
  const [msgFila,    setMsgFila]    = useState(null)

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
    setCreando(true); setConfirmId(null)
    setCatNueva(''); setMontoNuevo(''); setFotoNueva('')
    setFechaNueva(ahora.toISOString().split('T')[0])
    setMsgNuevo(null)
  }

  const cancelarCrear = () => { setCreando(false); setMsgNuevo(null) }

  const guardarNuevo = async () => {
    if (!catNueva)                              { setMsgNuevo({ err: 'Selecciona una categoría' }); return }
    if (!montoNuevo || Number(montoNuevo) <= 0) { setMsgNuevo({ err: 'El monto debe ser mayor a cero' }); return }
    if (!fechaNueva)                            { setMsgNuevo({ err: 'Selecciona la fecha del gasto' }); return }

    const nombreCategoria = categorias.find(c => c.id === Number(catNueva))?.nombre || ''

    setGuardando(true); setMsgNuevo(null)
    try {
      await api.post('/api/gastos', {
        categoriaId:    catNueva,
        descripcion:    nombreCategoria,
        monto:          montoNuevo,
        fechaGasto:     fechaNueva,
        comprobanteUrl: fotoNueva || null,
      })
      setMsgNuevo({ ok: 'Gasto registrado correctamente' })
      cargarDatos()
      setTimeout(() => { setCreando(false); setMsgNuevo(null) }, 1100)
    } catch (e) { setMsgNuevo({ err: e.response?.data || 'Error al guardar' }) }
    finally { setGuardando(false) }
  }

  // ── Eliminar ───────────────────────────────────────────────────
  const eliminar = async (id) => {
    try {
      await api.delete('/api/gastos/' + id)
      setConfirmId(null); setMsgFila(null)
      cargarDatos()
    } catch (e) { setMsgFila({ id, err: e.response?.data || 'No se pudo eliminar' }) }
  }

  // ── Filtrado ───────────────────────────────────────────────────
  const filtrados = gastos.filter(g => {
    if (filtroMes  !== '' && g.mes  !== Number(filtroMes))  return false
    if (filtroAnio !== '' && g.anio !== Number(filtroAnio)) return false
    if (busqueda && !`${g.descripcion} ${g.categoria} ${g.registradoPorNombre || ''}`.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  }).sort((a, b) => new Date(b.fechaGasto) - new Date(a.fechaGasto))

  const totalFiltrado = filtrados.reduce((s, g) => s + Number(g.monto), 0)

  // Resumen por categoría (sobre lo filtrado → respeta mes/año actuales por defecto)
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
              <select value={catNueva} onChange={e => setCatNueva(e.target.value)}>
                <option value="">Seleccionar...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="gst-campo">
              <label>Fecha del gasto</label>
              <input type="date" value={fechaNueva} onChange={e => setFechaNueva(e.target.value)} />
            </div>
            <div className="gst-campo">
              <label>Monto (S/)</label>
              <input type="text" inputMode="decimal" placeholder="0.00" value={montoNuevo}
                onChange={e => setMontoNuevo(soloMonto(e.target.value))} />
            </div>
          </div>

          <div className="gst-foto-wrap">
            <SubirFoto
              onSubida={url => setFotoNueva(url)}
              obligatorio={false}
              label="Foto del voucher (opcional)"
            />
          </div>

          {msgNuevo?.err && <p className="gst-msg-err">{msgNuevo.err}</p>}
          {msgNuevo?.ok  && <p className="gst-msg-ok">{msgNuevo.ok}</p>}
          <div className="gst-panel-btns">
            <button className="gst-btn-cancelar" onClick={cancelarCrear}>Cancelar</button>
            <button className="gst-btn-confirmar" onClick={guardarNuevo} disabled={guardando}>
              <IcoCheck /> {guardando ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </div>
      )}

      {/* Resumen por categoría — respeta el filtro de mes/año actual */}
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
          <input className="gst-search" placeholder="Buscar por categoría o responsable..."
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

      {/* Tabla de gastos */}
      {filtrados.length > 0 && (
        <div className="gst-tabla-wrap">
          <table className="gst-tabla">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Fecha</th>
                <th>Registrado por</th>
                <th>Voucher</th>
                <th className="gst-th-monto">Monto</th>
                {esDirectivo && <th className="gst-th-accion">Acción</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(g => {
                const { Icon, color, bg } = catMeta(g.categoria)
                const fecha = new Date(g.fechaGasto + 'T00:00:00')
                const fechaStr = fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })

                return (
                  <tr key={g.id}>
                    <td>
                      <span className="gst-cat-cell">
                        <span className="gst-cat-icon" style={{ background: bg, color }}><Icon /></span>
                        <span style={{ color }}>{g.categoria}</span>
                      </span>
                    </td>
                    <td className="gst-td-muted">{fechaStr}</td>
                    <td className="gst-td-muted">{g.registradoPorNombre || '—'}</td>
                    <td>
                      {g.comprobanteUrl ? (
                        <a href={g.comprobanteUrl} target="_blank" rel="noreferrer" className="gst-voucher-link">
                          <IcoDoc /> Ver
                        </a>
                      ) : <span className="gst-td-muted">—</span>}
                    </td>
                    <td className="gst-td-monto">S/ {Number(g.monto).toFixed(2)}</td>
                    {esDirectivo && (
                      <td className="gst-td-accion">
                        {confirmId === g.id ? (
                          <div className="gst-confirm-inline">
                            <span>¿Eliminar?</span>
                            <button className="gst-btn-mini-cancelar" onClick={() => setConfirmId(null)}>No</button>
                            <button className="gst-btn-mini-eliminar" onClick={() => eliminar(g.id)}>Sí</button>
                          </div>
                        ) : (
                          <button className="gst-btn-eliminar-fila" onClick={() => { setConfirmId(g.id); setMsgFila(null) }}>
                            <IcoTrash /> Eliminar
                          </button>
                        )}
                        {msgFila?.id === g.id && <p className="gst-fila-err">{msgFila.err}</p>}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
