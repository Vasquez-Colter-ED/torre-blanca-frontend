import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Departamentos.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE', 'SECRETARIO', 'TESORERO']
const MAX_INQUILINOS   = 5

// ── Íconos ────────────────────────────────────────────────────────
const IcoSearch  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IcoChev    = ({ open }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}><polyline points="6 9 12 15 18 9"/></svg>
const IcoCheck   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoX       = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoPlus    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoUser    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcoTrash   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
const IcoHome    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>

// Nombre completo del usuario para el dropdown
const nombreUsuario = u => `${u.nombre} ${u.apellido}${u.dni ? ` · DNI ${u.dni}` : ''}${u.email ? ` · ${u.email}` : ''}`

export default function Departamentos() {
  const { user }    = useAuth()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)

  const [deptos,    setDeptos]    = useState([])
  const [usuarios,  setUsuarios]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [busqueda,  setBusqueda]  = useState('')
  const [expandId,  setExpandId]  = useState(null)   // depto expandido
  const [error,     setError]     = useState('')

  // Formulario asignar propietario
  const [formPropDeptoId, setFormPropDeptoId] = useState(null)
  const [selPropUsuario,  setSelPropUsuario]  = useState('')
  const [msgProp,         setMsgProp]         = useState({})

  // Formulario agregar inquilino
  const [formInqDeptoId,  setFormInqDeptoId]  = useState(null)
  const [selInqUsuario,   setSelInqUsuario]   = useState('')
  const [msgInq,          setMsgInq]          = useState({})

  // Confirmación quitar
  const [confirmacion, setConfirmacion] = useState(null)
  // { tipo: 'propietario'|'inquilino', asignacionId, nombre, deptoId }

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const promesas = [api.get('/api/departamentos')]
      if (esDirectivo) promesas.push(api.get('/api/usuarios'))
      const [d, u] = await Promise.all(promesas)
      setDeptos(d.data)
      if (esDirectivo) setUsuarios((u?.data || []).filter(u => u.estado === 'ACTIVO'))
    } catch { setError('Error al cargar departamentos') }
    finally { setLoading(false) }
  }

  const toggleExpand = (id) => {
    setExpandId(expandId === id ? null : id)
    setFormPropDeptoId(null)
    setFormInqDeptoId(null)
    setConfirmacion(null)
    setMsgProp({})
    setMsgInq({})
  }

  // ── Asignar propietario ───────────────────────────────────────────
  const abrirFormProp = (deptoId) => {
    setFormPropDeptoId(formPropDeptoId === deptoId ? null : deptoId)
    setSelPropUsuario('')
    setFormInqDeptoId(null)
    setConfirmacion(null)
  }

  const guardarPropietario = async (deptoId) => {
    if (!selPropUsuario) { setMsgProp({ [deptoId]: { err: 'Selecciona un usuario' } }); return }
    try {
      await api.post('/api/departamentos/asignar-propietario', {
        usuarioId: Number(selPropUsuario), departamentoId: deptoId
      })
      setMsgProp({ [deptoId]: { ok: 'Propietario asignado correctamente' } })
      cargarDatos()
      setTimeout(() => { setFormPropDeptoId(null); setMsgProp({}) }, 1200)
    } catch (e) { setMsgProp({ [deptoId]: { err: e.response?.data || 'Error al asignar' } }) }
  }

  // ── Quitar propietario ────────────────────────────────────────────
  const confirmarQuitarPropietario = (depto) => {
    setConfirmacion({
      tipo: 'propietario',
      asignacionId: depto.propietarioAsignacionId,
      nombre: depto.propietarioNombre,
      deptoId: depto.id,
    })
    setFormPropDeptoId(null)
    setFormInqDeptoId(null)
  }

  // ── Agregar inquilino ─────────────────────────────────────────────
  const abrirFormInq = (deptoId) => {
    setFormInqDeptoId(formInqDeptoId === deptoId ? null : deptoId)
    setSelInqUsuario('')
    setFormPropDeptoId(null)
    setConfirmacion(null)
  }

  const guardarInquilino = async (deptoId) => {
    if (!selInqUsuario) { setMsgInq({ [deptoId]: { err: 'Selecciona un usuario' } }); return }
    try {
      await api.post('/api/departamentos/asignar-inquilino', {
        usuarioId: Number(selInqUsuario), departamentoId: deptoId
      })
      setMsgInq({ [deptoId]: { ok: 'Inquilino agregado correctamente' } })
      cargarDatos()
      setTimeout(() => { setFormInqDeptoId(null); setMsgInq({}) }, 1200)
    } catch (e) { setMsgInq({ [deptoId]: { err: e.response?.data || 'Error al asignar' } }) }
  }

  // ── Quitar inquilino ──────────────────────────────────────────────
  const confirmarQuitarInquilino = (inq, deptoId) => {
    setConfirmacion({
      tipo: 'inquilino',
      asignacionId: inq.asignacionId,
      nombre: inq.nombre,
      deptoId,
    })
    setFormPropDeptoId(null)
    setFormInqDeptoId(null)
  }

  // ── Ejecutar quitar (propietario o inquilino) ─────────────────────
  const ejecutarQuitar = async () => {
    if (!confirmacion) return
    try {
      const endpoint = confirmacion.tipo === 'propietario'
        ? `/api/departamentos/propietario/${confirmacion.asignacionId}`
        : `/api/departamentos/inquilino/${confirmacion.asignacionId}`
      await api.delete(endpoint)
      setConfirmacion(null)
      cargarDatos()
    } catch (e) { alert(e.response?.data || 'Error al quitar') }
  }

  // ── Filtrado y agrupado por piso ──────────────────────────────────
  const filtrados = deptos.filter(d => {
    const texto = `${d.numero} ${d.propietarioNombre || ''} ${(d.inquilinos || []).map(i => i.nombre).join(' ')}`.toLowerCase()
    return busqueda === '' || texto.includes(busqueda.toLowerCase())
  })

  const pisos = [...new Set(filtrados.map(d => d.piso))].sort((a, b) => a - b)

  // Estado visual del departamento
  const estadoDepto = (d) => {
    if (!d.propietarioNombre && (!d.inquilinos || d.inquilinos.length === 0)) return 'vacio'
    if (!d.propietarioNombre) return 'parcial'
    return 'ocupado'
  }

  if (loading) return (
    <div className="dpt-page">
      <div className="dpt-skeleton">
        {[...Array(6)].map((_, i) => <div key={i} className="dpt-skeleton-item" />)}
      </div>
    </div>
  )

  return (
    <div className="dpt-page">

      {/* Header */}
      <div className="dpt-header">
        <div>
          <h1 className="dpt-titulo">Departamentos</h1>
          <p className="dpt-sub">{deptos.length} departamentos · Torre Blanca</p>
        </div>
        {/* Leyenda */}
        <div className="dpt-leyenda">
          <span className="dpt-ley-item"><span className="dpt-dot dpt-dot-ocupado" />Ocupado</span>
          <span className="dpt-ley-item"><span className="dpt-dot dpt-dot-parcial" />Sin propietario</span>
          <span className="dpt-ley-item"><span className="dpt-dot dpt-dot-vacio" />Vacío</span>
        </div>
      </div>

      {error && <div className="dpt-alert-err">{error}</div>}

      {/* Barra búsqueda */}
      <div className="dpt-search-wrap">
        <IcoSearch />
        <input className="dpt-search" placeholder="Buscar por número, propietario o inquilino..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      {/* Lista por piso */}
      {pisos.map(piso => (
        <div key={piso} className="dpt-piso-section">
          <div className="dpt-piso-header">
            <span className="dpt-piso-label">Piso {piso}</span>
            <span className="dpt-piso-cnt">{filtrados.filter(d => d.piso === piso).length} deptos</span>
          </div>

          {filtrados.filter(d => d.piso === piso)
            .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }))
            .map(depto => {
              const abierto    = expandId === depto.id
              const est        = estadoDepto(depto)
              const numInq     = (depto.inquilinos || []).length
              const puedeInq   = numInq < MAX_INQUILINOS
              const tieneProp  = !!depto.propietarioNombre
              const confirm    = confirmacion?.deptoId === depto.id ? confirmacion : null

              return (
                <div key={depto.id} className={`dpt-card ${abierto ? 'dpt-card-open' : ''}`}>

                  {/* Cabecera clickeable */}
                  <button className="dpt-card-head" onClick={() => toggleExpand(depto.id)}>
                    <div className="dpt-card-left">
                      <span className={`dpt-dot dpt-dot-${est}`} />
                      <span className="dpt-num">Depto {depto.numero}</span>
                      {depto.metrosCuadrados && <span className="dpt-m2">{depto.metrosCuadrados}m²</span>}
                    </div>
                    <div className="dpt-card-mid">
                      {tieneProp
                        ? <span className="dpt-resumen-prop"><IcoHome /> {depto.propietarioNombre}</span>
                        : <span className="dpt-resumen-vacio">Sin propietario</span>
                      }
                      {numInq > 0 && (
                        <span className="dpt-resumen-inq"><IcoUser /> {numInq} inquilino{numInq > 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <div className="dpt-card-right">
                      <span className="dpt-badge-inq">{numInq}/{MAX_INQUILINOS} inq.</span>
                      <IcoChev open={abierto} />
                    </div>
                  </button>

                  {/* Panel expandible */}
                  <div className={`dpt-panel ${abierto ? 'dpt-panel-open' : ''}`}>
                    {abierto && (
                      <div className="dpt-panel-body">

                        {/* Confirmación inline — aparece sobre todo */}
                        {confirm && (
                          <div className="dpt-confirm">
                            <p className="dpt-confirm-txt">
                              ¿{confirm.tipo === 'propietario' ? 'Desvincular al propietario' : 'Quitar al inquilino'}{' '}
                              <strong>{confirm.nombre}</strong> del Depto {depto.numero}?
                            </p>
                            <div className="dpt-confirm-btns">
                              <button className="dpt-btn-cancelar" onClick={() => setConfirmacion(null)}>Cancelar</button>
                              <button className="dpt-btn-quitar-confirm" onClick={ejecutarQuitar}>
                                <IcoTrash /> Sí, desvincular
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ── Sección propietario ── */}
                        <div className="dpt-seccion">
                          <div className="dpt-sec-header">
                            <p className="dpt-sec-titulo">Propietario</p>
                            <span className={`dpt-sec-badge ${tieneProp ? 'dpt-sec-badge-ok' : 'dpt-sec-badge-empty'}`}>
                              {tieneProp ? '1/1' : '0/1'}
                            </span>
                          </div>

                          {tieneProp ? (
                            <div className="dpt-residente-item">
                              <div className="dpt-res-avatar dpt-av-prop">{depto.propietarioNombre?.[0]}</div>
                              <div className="dpt-res-info">
                                <p className="dpt-res-nombre">{depto.propietarioNombre}</p>
                                <p className="dpt-res-email">{depto.propietarioEmail || '—'}</p>
                              </div>
                              {esDirectivo && (
                                <button className="dpt-btn-quitar" onClick={() => confirmarQuitarPropietario(depto)}>
                                  <IcoTrash /> Desvincular
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="dpt-vacio-hint">
                              <p>Sin propietario asignado.</p>
                              {esDirectivo && (
                                <button className="dpt-btn-agregar" onClick={() => abrirFormProp(depto.id)}>
                                  <IcoPlus /> Asignar propietario
                                </button>
                              )}
                            </div>
                          )}

                          {/* Formulario asignar propietario */}
                          {formPropDeptoId === depto.id && esDirectivo && (
                            <div className="dpt-form-inline">
                              <select className="dpt-select"
                                value={selPropUsuario}
                                onChange={e => setSelPropUsuario(e.target.value)}
                              >
                                <option value="">Seleccionar usuario...</option>
                                {usuarios
                                  .filter(u => u.id !== depto.propietarioId &&
                                    !(depto.inquilinos || []).some(i => i.usuarioId === u.id))
                                  .map(u => (
                                    <option key={u.id} value={u.id}>{nombreUsuario(u)}</option>
                                  ))}
                              </select>
                              <div className="dpt-form-btns">
                                <button className="dpt-btn-cancelar" onClick={() => setFormPropDeptoId(null)}>Cancelar</button>
                                <button className="dpt-btn-confirmar" onClick={() => guardarPropietario(depto.id)}>
                                  <IcoCheck /> Asignar
                                </button>
                              </div>
                              {msgProp[depto.id]?.err && <p className="dpt-msg-err">{msgProp[depto.id].err}</p>}
                              {msgProp[depto.id]?.ok  && <p className="dpt-msg-ok">{msgProp[depto.id].ok}</p>}
                            </div>
                          )}
                        </div>

                        {/* ── Sección inquilinos ── */}
                        <div className="dpt-seccion">
                          <div className="dpt-sec-header">
                            <p className="dpt-sec-titulo">Inquilinos</p>
                            <span className={`dpt-sec-badge ${numInq >= MAX_INQUILINOS ? 'dpt-sec-badge-full' : 'dpt-sec-badge-ok'}`}>
                              {numInq}/{MAX_INQUILINOS}
                            </span>
                          </div>

                          {numInq === 0 && (
                            <div className="dpt-vacio-hint"><p>Sin inquilinos.</p></div>
                          )}

                          {(depto.inquilinos || []).map(inq => (
                            <div key={inq.asignacionId} className="dpt-residente-item">
                              <div className="dpt-res-avatar dpt-av-inq">{inq.nombre?.[0]}</div>
                              <div className="dpt-res-info">
                                <p className="dpt-res-nombre">{inq.nombre}</p>
                                <p className="dpt-res-email">{inq.email || '—'}</p>
                              </div>
                              {esDirectivo && (
                                <button className="dpt-btn-quitar" onClick={() => confirmarQuitarInquilino(inq, depto.id)}>
                                  <IcoTrash /> Quitar
                                </button>
                              )}
                            </div>
                          ))}

                          {esDirectivo && (
                            puedeInq ? (
                              <button className="dpt-btn-agregar" onClick={() => abrirFormInq(depto.id)}>
                                <IcoPlus /> Agregar inquilino
                              </button>
                            ) : (
                              <p className="dpt-limite-msg">Límite de {MAX_INQUILINOS} inquilinos alcanzado</p>
                            )
                          )}

                          {/* Formulario agregar inquilino */}
                          {formInqDeptoId === depto.id && esDirectivo && (
                            <div className="dpt-form-inline">
                              <select className="dpt-select"
                                value={selInqUsuario}
                                onChange={e => setSelInqUsuario(e.target.value)}
                              >
                                <option value="">Seleccionar usuario...</option>
                                {usuarios
                                  .filter(u => u.id !== depto.propietarioId &&
                                    !(depto.inquilinos || []).some(i => i.usuarioId === u.id))
                                  .map(u => (
                                    <option key={u.id} value={u.id}>{nombreUsuario(u)}</option>
                                  ))}
                              </select>
                              <div className="dpt-form-btns">
                                <button className="dpt-btn-cancelar" onClick={() => setFormInqDeptoId(null)}>Cancelar</button>
                                <button className="dpt-btn-confirmar" onClick={() => guardarInquilino(depto.id)}>
                                  <IcoCheck /> Agregar
                                </button>
                              </div>
                              {msgInq[depto.id]?.err && <p className="dpt-msg-err">{msgInq[depto.id].err}</p>}
                              {msgInq[depto.id]?.ok  && <p className="dpt-msg-ok">{msgInq[depto.id].ok}</p>}
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      ))}
    </div>
  )
}
