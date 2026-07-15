import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import BuscadorUsuario from '../components/BuscadorUsuario'
import './Departamentos.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE', 'SECRETARIO', 'TESORERO']
const MAX_INQUILINOS   = 5

const IcoSearch = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IcoChev   = ({ open }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}><polyline points="6 9 12 15 18 9"/></svg>
const IcoCheck  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoX      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoPlus   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoUser   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcoTrash  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
const IcoHome   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const IcoCar    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M14 7h5a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-5"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 11h14"/></svg>

export default function Departamentos() {
  const { user }    = useAuth()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)

  const [deptos,    setDeptos]    = useState([])
  const [usuarios,  setUsuarios]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [busqueda,  setBusqueda]  = useState('')
  const [expandId,  setExpandId]  = useState(null)
  const [error,     setError]     = useState('')

  // Propietario
  const [formPropDeptoId, setFormPropDeptoId] = useState(null)
  const [selPropUsuario,  setSelPropUsuario]  = useState('')
  const [msgProp,         setMsgProp]         = useState({})

  // Inquilino
  const [formInqDeptoId, setFormInqDeptoId] = useState(null)
  const [selInqUsuario,  setSelInqUsuario]  = useState('')
  const [msgInq,         setMsgInq]         = useState({})

  // Cochera
  const [formCocheraDeptoId, setFormCocheraDeptoId] = useState(null)
  const [selCochera,         setSelCochera]          = useState('')
  const [msgCochera,         setMsgCochera]          = useState({})

  // Confirmación
  const [confirmacion, setConfirmacion] = useState(null)

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
    setFormPropDeptoId(null); setFormInqDeptoId(null); setFormCocheraDeptoId(null)
    setConfirmacion(null); setMsgProp({}); setMsgInq({}); setMsgCochera({})
  }

  // ── Propietario ────────────────────────────────────────────────────
  const guardarPropietario = async (deptoId) => {
    if (!selPropUsuario) { setMsgProp({ [deptoId]: { err: 'Selecciona un usuario' } }); return }
    try {
      await api.post('/api/departamentos/asignar-propietario', { usuarioId: Number(selPropUsuario), departamentoId: deptoId })
      setMsgProp({ [deptoId]: { ok: 'Propietario asignado' } })
      cargarDatos(); setTimeout(() => { setFormPropDeptoId(null); setMsgProp({}) }, 1200)
    } catch (e) { setMsgProp({ [deptoId]: { err: e.response?.data || 'Error' } }) }
  }

  // ── Inquilino ──────────────────────────────────────────────────────
  const guardarInquilino = async (deptoId) => {
    if (!selInqUsuario) { setMsgInq({ [deptoId]: { err: 'Selecciona un usuario' } }); return }
    try {
      await api.post('/api/departamentos/asignar-inquilino', { usuarioId: Number(selInqUsuario), departamentoId: deptoId })
      setMsgInq({ [deptoId]: { ok: 'Inquilino agregado' } })
      cargarDatos(); setTimeout(() => { setFormInqDeptoId(null); setMsgInq({}) }, 1200)
    } catch (e) { setMsgInq({ [deptoId]: { err: e.response?.data || 'Error' } }) }
  }

  // ── Cochera ────────────────────────────────────────────────────────
  const asignarCochera = async (deptoId) => {
    if (!selCochera) { setMsgCochera({ [deptoId]: { err: 'Selecciona un estacionamiento' } }); return }
    try {
      await api.post(`/api/departamentos/asignar-cochera?cocheraId=${selCochera}&departamentoId=${deptoId}`)
      setMsgCochera({ [deptoId]: { ok: 'Cochera asignada correctamente' } })
      cargarDatos(); setTimeout(() => { setFormCocheraDeptoId(null); setMsgCochera({}) }, 1200)
    } catch (e) { setMsgCochera({ [deptoId]: { err: e.response?.data || 'Error' } }) }
  }

  // ── Quitar (propietario / inquilino / cochera) ─────────────────────
  const ejecutarQuitar = async () => {
    if (!confirmacion) return
    try {
      const endpoints = {
        propietario: `/api/departamentos/propietario/${confirmacion.asignacionId}`,
        inquilino:   `/api/departamentos/inquilino/${confirmacion.asignacionId}`,
        cochera:     `/api/departamentos/cochera-asignacion/${confirmacion.asignacionId}`,
      }
      await api.delete(endpoints[confirmacion.tipo])
      setConfirmacion(null); cargarDatos()
    } catch (e) { alert(e.response?.data || 'Error') }
  }

  const confirmar = (tipo, asignacionId, nombre, deptoId) => {
    setConfirmacion({ tipo, asignacionId, nombre, deptoId })
    setFormPropDeptoId(null); setFormInqDeptoId(null); setFormCocheraDeptoId(null)
  }

  // ── Filtrado ───────────────────────────────────────────────────────
  const texto = d => `${d.numero} ${d.descripcion || ''} ${d.propietarioNombre || ''} ${(d.inquilinos || []).map(i => i.nombre).join(' ')}`.toLowerCase()
  const filtrados      = deptos.filter(d => busqueda === '' || texto(d).includes(busqueda.toLowerCase()))
  const departamentos  = filtrados.filter(d => d.tipo !== 'ESTACIONAMIENTO').sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }))
  const estacionamientos = filtrados.filter(d => d.tipo === 'ESTACIONAMIENTO').sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }))
  const pisos          = [...new Set(departamentos.map(d => d.piso))].sort((a, b) => a - b)

  // Cocheras libres (sin asignación activa) para el dropdown
  const cocherasLibres = estacionamientos.filter(e =>
    !deptos.some(d => (d.cocheras || []).some(c => c.cocheraId === e.id))
  )

  // Para estacionamientos: qué depto tiene asignada esa cochera
  const deptoDeEstac = (estacId) =>
    deptos.find(d => (d.cocheras || []).some(c => c.cocheraId === estacId))

  if (loading) return (
    <div className="dpt-page">
      <div className="dpt-skeleton">{[...Array(6)].map((_, i) => <div key={i} className="dpt-skeleton-item" />)}</div>
    </div>
  )

  // ── Render de una card ─────────────────────────────────────────────
  const renderCard = (depto) => {
    const abierto   = expandId === depto.id
    const esEstac   = depto.tipo === 'ESTACIONAMIENTO'
    const tieneProp = !!depto.propietarioNombre
    const numInq    = (depto.inquilinos || []).length
    const puedeInq  = numInq < MAX_INQUILINOS
    const cocheras  = depto.cocheras || []
    const confirm   = confirmacion?.deptoId === depto.id ? confirmacion : null

    const dotClass = esEstac
      ? (deptoDeEstac(depto.id) ? 'dpt-dot-ocupado' : 'dpt-dot-vacio')
      : (!tieneProp && numInq === 0 ? 'dpt-dot-vacio'
         : !tieneProp               ? 'dpt-dot-parcial'
         : 'dpt-dot-ocupado')

    // Porcentaje total = depto + cocheras
    const pctTotal = (Number(depto.porcentaje || 0) + cocheras.reduce((s, c) => s + Number(c.porcentaje || 0), 0)).toFixed(2)

    return (
      <div key={depto.id} className={`dpt-card ${abierto ? 'dpt-card-open' : ''}`}>

        {/* Cabecera */}
        <button className="dpt-card-head" onClick={() => toggleExpand(depto.id)}>
          <div className="dpt-card-left">
            <span className={`dpt-dot ${dotClass}`} />
            <span className="dpt-num">{esEstac ? 'Estac.' : 'Depto'} {depto.numero}</span>
            {depto.descripcion?.includes('Azotea') && <span className="dpt-badge-azotea">+ Azotea</span>}
          </div>
          <div className="dpt-card-mid">
            <span className="dpt-datos-tecnicos">
              {depto.metrosCuadrados && <span>{Number(depto.metrosCuadrados).toFixed(2)} m²</span>}
              <span className="dpt-porcentaje">{pctTotal}%</span>
              {cocheras.length > 0 && <span className="dpt-badge-cochera"><IcoCar /> {cocheras.length} cochera{cocheras.length > 1 ? 's' : ''}</span>}
            </span>
            <span className="dpt-card-mid-sep" />
            {esEstac ? (
              deptoDeEstac(depto.id)
                ? <span className="dpt-resumen-prop"><IcoHome /> Depto {deptoDeEstac(depto.id).numero}</span>
                : <span className="dpt-resumen-vacio">Sin departamento</span>
            ) : (
              tieneProp
                ? <span className="dpt-resumen-prop"><IcoHome /> {depto.propietarioNombre}</span>
                : <span className="dpt-resumen-vacio">Sin propietario</span>
            )}
            {!esEstac && numInq > 0 && <span className="dpt-resumen-inq"><IcoUser /> {numInq} inq.</span>}
          </div>
          <div className="dpt-card-right">
            {!esEstac && <span className="dpt-badge-inq">{numInq}/{MAX_INQUILINOS} inq.</span>}
            <IcoChev open={abierto} />
          </div>
        </button>

        {/* Panel expandible */}
        <div className={`dpt-panel ${abierto ? 'dpt-panel-open' : ''}`}>
          {abierto && (
            <div className="dpt-panel-body">

              {/* Info técnica */}
              <div className="dpt-info-tecnica">
                {depto.descripcion && <span>{depto.descripcion}</span>}
                {depto.metrosCuadrados && <span><strong>{Number(depto.metrosCuadrados).toFixed(2)}</strong> m²</span>}
                {depto.porcentaje && <span>% propio: <strong>{Number(depto.porcentaje).toFixed(2)}%</strong></span>}
                {cocheras.length > 0 && <span>% cocheras: <strong>+{cocheras.reduce((s, c) => s + Number(c.porcentaje || 0), 0).toFixed(2)}%</strong></span>}
                <span className="dpt-pct-total-badge">Total: <strong>{pctTotal}%</strong></span>
              </div>

              {/* Confirmación */}
              {confirm && (
                <div className="dpt-confirm">
                  <p className="dpt-confirm-txt">
                    ¿{confirm.tipo === 'propietario' ? 'Desvincular al propietario' : confirm.tipo === 'cochera' ? 'Desasignar la' : 'Quitar al inquilino'}{' '}
                    <strong>{confirm.nombre}</strong>?
                  </p>
                  <div className="dpt-confirm-btns">
                    <button className="dpt-btn-cancelar" onClick={() => setConfirmacion(null)}>Cancelar</button>
                    <button className="dpt-btn-quitar-confirm" onClick={ejecutarQuitar}>
                      <IcoTrash /> Sí, desvincular
                    </button>
                  </div>
                </div>
              )}

              {/* ── Propietario (deptos) o Depto asignado (estacionamientos) ── */}
              {esEstac ? (
                <div className="dpt-seccion">
                  <div className="dpt-sec-header">
                    <p className="dpt-sec-titulo">Asignado al departamento</p>
                    <span className={`dpt-sec-badge ${deptoDeEstac(depto.id) ? 'dpt-sec-badge-ok' : 'dpt-sec-badge-empty'}`}>
                      {deptoDeEstac(depto.id) ? '1' : '0'}
                    </span>
                  </div>
                  {deptoDeEstac(depto.id) ? (
                    <div className="dpt-residente-item">
                      <div className="dpt-res-avatar" style={{ background: '#0F172A', fontSize: '0.7rem' }}>
                        {deptoDeEstac(depto.id).numero}
                      </div>
                      <div className="dpt-res-info">
                        <p className="dpt-res-nombre">Departamento {deptoDeEstac(depto.id).numero}</p>
                        <p className="dpt-res-email">
                          Piso {deptoDeEstac(depto.id).piso}
                          {deptoDeEstac(depto.id).propietarioNombre && ` · ${deptoDeEstac(depto.id).propietarioNombre}`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="dpt-vacio-hint"><p>Sin departamento asignado.</p></div>
                  )}
                </div>
              ) : (
              /* ── Propietario (deptos) ── */
              <div className="dpt-seccion">
                <div className="dpt-sec-header">
                  <p className="dpt-sec-titulo">Propietario</p>
                  <span className={`dpt-sec-badge ${tieneProp ? 'dpt-sec-badge-ok' : 'dpt-sec-badge-empty'}`}>{tieneProp ? '1/1' : '0/1'}</span>
                </div>
                {tieneProp ? (
                  <div className="dpt-residente-item">
                    <div className="dpt-res-avatar dpt-av-prop">{depto.propietarioNombre?.[0]}</div>
                    <div className="dpt-res-info">
                      <p className="dpt-res-nombre">{depto.propietarioNombre}</p>
                      <p className="dpt-res-email">{depto.propietarioEmail || '—'}</p>
                    </div>
                    {esDirectivo && <button className="dpt-btn-quitar" onClick={() => confirmar('propietario', depto.propietarioAsignacionId, depto.propietarioNombre, depto.id)}><IcoTrash /> Desvincular</button>}
                  </div>
                ) : (
                  <div className="dpt-vacio-hint">
                    <p>Sin propietario asignado.</p>
                    {esDirectivo && <button className="dpt-btn-agregar" onClick={() => { setFormPropDeptoId(formPropDeptoId === depto.id ? null : depto.id); setSelPropUsuario('') }}><IcoPlus /> Asignar propietario</button>}
                  </div>
                )}
                {formPropDeptoId === depto.id && esDirectivo && (
                  <div className="dpt-form-inline">
                    <BuscadorUsuario
                      usuarios={usuarios.filter(u => u.id !== depto.propietarioId && !(depto.inquilinos || []).some(i => i.usuarioId === u.id))}
                      value={selPropUsuario}
                      onChange={setSelPropUsuario}
                      placeholder="Buscar propietario por nombre, DNI o correo..."
                    />
                    <div className="dpt-form-btns">
                      <button className="dpt-btn-cancelar" onClick={() => setFormPropDeptoId(null)}>Cancelar</button>
                      <button className="dpt-btn-confirmar" onClick={() => guardarPropietario(depto.id)}><IcoCheck /> Asignar</button>
                    </div>
                    {msgProp[depto.id]?.err && <p className="dpt-msg-err">{msgProp[depto.id].err}</p>}
                    {msgProp[depto.id]?.ok  && <p className="dpt-msg-ok">{msgProp[depto.id].ok}</p>}
                  </div>
                )}
              </div>
              )}

              {/* ── Cocheras (solo deptos) ── */}
              {!esEstac && (
                <div className="dpt-seccion">
                  <div className="dpt-sec-header">
                    <p className="dpt-sec-titulo">Cocheras asignadas</p>
                    <span className={`dpt-sec-badge ${cocheras.length > 0 ? 'dpt-sec-badge-ok' : 'dpt-sec-badge-empty'}`}>{cocheras.length}</span>
                  </div>
                  {cocheras.length === 0 && <div className="dpt-vacio-hint"><p>Sin cochera asignada.</p></div>}
                  {cocheras.map(c => (
                    <div key={c.asignacionId} className="dpt-residente-item">
                      <div className="dpt-res-avatar dpt-av-cochera">{c.numero}</div>
                      <div className="dpt-res-info">
                        <p className="dpt-res-nombre">Estacionamiento {c.numero}</p>
                        <p className="dpt-res-email">{c.metros} m² · {c.porcentaje}% participación</p>
                      </div>
                      {esDirectivo && <button className="dpt-btn-quitar" onClick={() => confirmar('cochera', c.asignacionId, `Estacionamiento ${c.numero}`, depto.id)}><IcoTrash /> Desasignar</button>}
                    </div>
                  ))}
                  {esDirectivo && cocherasLibres.length > 0 && (
                    <button className="dpt-btn-agregar" onClick={() => { setFormCocheraDeptoId(formCocheraDeptoId === depto.id ? null : depto.id); setSelCochera('') }}>
                      <IcoPlus /> {cocheras.length > 0 ? 'Asignar otra cochera' : 'Asignar cochera'}
                    </button>
                  )}
                  {esDirectivo && cocherasLibres.length === 0 && cocheras.length === 0 && (
                    <p className="dpt-limite-msg">No hay estacionamientos libres disponibles</p>
                  )}
                  {formCocheraDeptoId === depto.id && esDirectivo && (
                    <div className="dpt-form-inline">
                      <select className="dpt-select" value={selCochera} onChange={e => setSelCochera(e.target.value)}>
                        <option value="">Seleccionar estacionamiento libre...</option>
                        {cocherasLibres.map(c => <option key={c.id} value={c.id}>{c.numero} · {c.metrosCuadrados}m² · {c.porcentaje}%</option>)}
                      </select>
                      <div className="dpt-form-btns">
                        <button className="dpt-btn-cancelar" onClick={() => setFormCocheraDeptoId(null)}>Cancelar</button>
                        <button className="dpt-btn-confirmar" onClick={() => asignarCochera(depto.id)}><IcoCheck /> Asignar</button>
                      </div>
                      {msgCochera[depto.id]?.err && <p className="dpt-msg-err">{msgCochera[depto.id].err}</p>}
                      {msgCochera[depto.id]?.ok  && <p className="dpt-msg-ok">{msgCochera[depto.id].ok}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* ── Inquilinos (solo deptos) ── */}
              {!esEstac && (
                <div className="dpt-seccion">
                  <div className="dpt-sec-header">
                    <p className="dpt-sec-titulo">Inquilinos</p>
                    <span className={`dpt-sec-badge ${numInq >= MAX_INQUILINOS ? 'dpt-sec-badge-full' : 'dpt-sec-badge-ok'}`}>{numInq}/{MAX_INQUILINOS}</span>
                  </div>
                  {numInq === 0 && <div className="dpt-vacio-hint"><p>Sin inquilinos.</p></div>}
                  {(depto.inquilinos || []).map(inq => (
                    <div key={inq.asignacionId} className="dpt-residente-item">
                      <div className="dpt-res-avatar dpt-av-inq">{inq.nombre?.[0]}</div>
                      <div className="dpt-res-info">
                        <p className="dpt-res-nombre">{inq.nombre}</p>
                        <p className="dpt-res-email">{inq.email || '—'}</p>
                      </div>
                      {esDirectivo && <button className="dpt-btn-quitar" onClick={() => confirmar('inquilino', inq.asignacionId, inq.nombre, depto.id)}><IcoTrash /> Quitar</button>}
                    </div>
                  ))}
                  {esDirectivo && (puedeInq
                    ? <button className="dpt-btn-agregar" onClick={() => { setFormInqDeptoId(formInqDeptoId === depto.id ? null : depto.id); setSelInqUsuario('') }}><IcoPlus /> Agregar inquilino</button>
                    : <p className="dpt-limite-msg">Límite de {MAX_INQUILINOS} inquilinos alcanzado</p>
                  )}
                  {formInqDeptoId === depto.id && esDirectivo && (
                    <div className="dpt-form-inline">
                      <BuscadorUsuario
                        usuarios={usuarios.filter(u => u.id !== depto.propietarioId && !(depto.inquilinos || []).some(i => i.usuarioId === u.id))}
                        value={selInqUsuario}
                        onChange={setSelInqUsuario}
                        placeholder="Buscar inquilino por nombre, DNI o correo..."
                      />
                      <div className="dpt-form-btns">
                        <button className="dpt-btn-cancelar" onClick={() => setFormInqDeptoId(null)}>Cancelar</button>
                        <button className="dpt-btn-confirmar" onClick={() => guardarInquilino(depto.id)}><IcoCheck /> Agregar</button>
                      </div>
                      {msgInq[depto.id]?.err && <p className="dpt-msg-err">{msgInq[depto.id].err}</p>}
                      {msgInq[depto.id]?.ok  && <p className="dpt-msg-ok">{msgInq[depto.id].ok}</p>}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="dpt-page">
      <div className="dpt-header">
        <div>
          <h1 className="dpt-titulo">Departamentos</h1>
          <p className="dpt-sub">{departamentos.length} departamentos · {estacionamientos.length} estacionamientos</p>
        </div>
        <div className="dpt-leyenda">
          <span className="dpt-ley-item"><span className="dpt-dot dpt-dot-ocupado" />Con propietario</span>
          <span className="dpt-ley-item"><span className="dpt-dot dpt-dot-parcial" />Con inquilino, sin propietario</span>
          <span className="dpt-ley-item"><span className="dpt-dot dpt-dot-vacio" />Sin nadie asignado</span>
        </div>
      </div>

      {error && <div className="dpt-alert-err">{error}</div>}

      <div className="dpt-search-wrap">
        <IcoSearch />
        <input className="dpt-search" placeholder="Buscar por número, propietario o inquilino..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      {/* Departamentos por piso */}
      {pisos.map(piso => (
        <div key={piso} className="dpt-piso-section">
          <div className="dpt-piso-header">
            <span className="dpt-piso-label">Piso {piso}</span>
            <span className="dpt-piso-cnt">{departamentos.filter(d => d.piso === piso).length} departamentos</span>
          </div>
          {departamentos.filter(d => d.piso === piso).map(d => renderCard(d))}
        </div>
      ))}

      {/* Estacionamientos */}
      {estacionamientos.length > 0 && (
        <div className="dpt-piso-section">
          <div className="dpt-piso-header dpt-piso-header-estac">
            <span className="dpt-piso-label"><IcoCar /> Estacionamientos</span>
            <span className="dpt-piso-cnt">
              {estacionamientos.length} plazas ·{' '}
              {estacionamientos.reduce((s, d) => s + Number(d.porcentaje || 0), 0).toFixed(2)}% participación total
            </span>
          </div>
          <div className="dpt-estac-grid">
            {estacionamientos.map(d => renderCard(d))}
          </div>
        </div>
      )}
    </div>
  )
}
