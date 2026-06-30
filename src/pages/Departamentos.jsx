import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Departamentos.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE', 'SECRETARIO', 'TESORERO']
const MAX_INQUILINOS   = 5

const IcoSearch  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IcoChev    = ({ open }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}><polyline points="6 9 12 15 18 9"/></svg>
const IcoCheck   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoX       = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoPlus    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoUser    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcoTrash   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
const IcoHome    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const IcoCar     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M14 7h5a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-5"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 11h14"/></svg>

const nombreUsuario = u => `${u.nombre} ${u.apellido}${u.dni ? ` · DNI ${u.dni}` : ''}${u.email ? ` · ${u.email}` : ''}`

// ── Tarjeta expandible (compartida por deptos y estacionamientos) ──
function DeptoCard({
  depto, abierto, esDirectivo, usuarios,
  onToggle, formPropDeptoId, selPropUsuario, setSelPropUsuario,
  abrirFormProp, guardarPropietario, msgProp, setFormPropDeptoId,
  formInqDeptoId, selInqUsuario, setSelInqUsuario,
  abrirFormInq, guardarInquilino, msgInq, setFormInqDeptoId,
  confirmacion, confirmarQuitarPropietario, confirmarQuitarInquilino,
  ejecutarQuitar, setConfirmacion
}) {
  const numInq    = (depto.inquilinos || []).length
  const puedeInq  = numInq < MAX_INQUILINOS
  const tieneProp = !!depto.propietarioNombre
  const confirm   = confirmacion?.deptoId === depto.id ? confirmacion : null
  const esEstac   = depto.tipo === 'ESTACIONAMIENTO'

  const dotClass = () => {
    if (!tieneProp && numInq === 0) return 'dpt-dot-vacio'
    if (!tieneProp) return 'dpt-dot-parcial'
    return 'dpt-dot-ocupado'
  }

  return (
    <div className={`dpt-card ${abierto ? 'dpt-card-open' : ''}`}>
      <button className="dpt-card-head" onClick={onToggle}>
        <div className="dpt-card-left">
          <span className={`dpt-dot ${dotClass()}`} />
          <span className="dpt-num">{esEstac ? 'Estac.' : 'Depto'} {depto.numero}</span>
          {depto.descripcion && depto.descripcion.includes('Azotea') && (
            <span className="dpt-badge-azotea">+ Azotea</span>
          )}
        </div>
        <div className="dpt-card-mid">
          <span className="dpt-datos-tecnicos">
            {depto.metrosCuadrados && <span>{Number(depto.metrosCuadrados).toFixed(2)} m²</span>}
            {depto.porcentaje && <span className="dpt-porcentaje">{Number(depto.porcentaje).toFixed(2)}%</span>}
          </span>
          <span className="dpt-card-mid-sep" />
          {tieneProp
            ? <span className="dpt-resumen-prop"><IcoHome /> {depto.propietarioNombre}</span>
            : <span className="dpt-resumen-vacio">Sin propietario</span>
          }
          {numInq > 0 && (
            <span className="dpt-resumen-inq"><IcoUser /> {numInq} inq.</span>
          )}
        </div>
        <div className="dpt-card-right">
          {!esEstac && <span className="dpt-badge-inq">{numInq}/{MAX_INQUILINOS} inq.</span>}
          <IcoChev open={abierto} />
        </div>
      </button>

      <div className={`dpt-panel ${abierto ? 'dpt-panel-open' : ''}`}>
        {abierto && (
          <div className="dpt-panel-body">

            {/* Info técnica */}
            <div className="dpt-info-tecnica">
              {depto.descripcion && <span>{depto.descripcion}</span>}
              {depto.metrosCuadrados && <span><strong>{Number(depto.metrosCuadrados).toFixed(2)}</strong> m²</span>}
              {depto.porcentaje && <span>Participación: <strong>{Number(depto.porcentaje).toFixed(2)}%</strong></span>}
            </div>

            {/* Confirmación inline */}
            {confirm && (
              <div className="dpt-confirm">
                <p className="dpt-confirm-txt">
                  ¿{confirm.tipo === 'propietario' ? 'Desvincular al propietario' : 'Quitar al inquilino'}{' '}
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

            {/* Propietario */}
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
              {formPropDeptoId === depto.id && esDirectivo && (
                <div className="dpt-form-inline">
                  <select className="dpt-select" value={selPropUsuario} onChange={e => setSelPropUsuario(e.target.value)}>
                    <option value="">Seleccionar usuario...</option>
                    {usuarios.filter(u => u.id !== depto.propietarioId && !(depto.inquilinos || []).some(i => i.usuarioId === u.id))
                      .map(u => <option key={u.id} value={u.id}>{nombreUsuario(u)}</option>)}
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

            {/* Inquilinos — solo para departamentos */}
            {!esEstac && (
              <div className="dpt-seccion">
                <div className="dpt-sec-header">
                  <p className="dpt-sec-titulo">Inquilinos</p>
                  <span className={`dpt-sec-badge ${numInq >= MAX_INQUILINOS ? 'dpt-sec-badge-full' : 'dpt-sec-badge-ok'}`}>
                    {numInq}/{MAX_INQUILINOS}
                  </span>
                </div>
                {numInq === 0 && <div className="dpt-vacio-hint"><p>Sin inquilinos.</p></div>}
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
                {esDirectivo && (puedeInq
                  ? <button className="dpt-btn-agregar" onClick={() => abrirFormInq(depto.id)}><IcoPlus /> Agregar inquilino</button>
                  : <p className="dpt-limite-msg">Límite de {MAX_INQUILINOS} inquilinos alcanzado</p>
                )}
                {formInqDeptoId === depto.id && esDirectivo && (
                  <div className="dpt-form-inline">
                    <select className="dpt-select" value={selInqUsuario} onChange={e => setSelInqUsuario(e.target.value)}>
                      <option value="">Seleccionar usuario...</option>
                      {usuarios.filter(u => u.id !== depto.propietarioId && !(depto.inquilinos || []).some(i => i.usuarioId === u.id))
                        .map(u => <option key={u.id} value={u.id}>{nombreUsuario(u)}</option>)}
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
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────
export default function Departamentos() {
  const { user }    = useAuth()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)

  const [deptos,    setDeptos]    = useState([])
  const [usuarios,  setUsuarios]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [busqueda,  setBusqueda]  = useState('')
  const [expandId,  setExpandId]  = useState(null)
  const [error,     setError]     = useState('')

  const [formPropDeptoId, setFormPropDeptoId] = useState(null)
  const [selPropUsuario,  setSelPropUsuario]  = useState('')
  const [msgProp,         setMsgProp]         = useState({})
  const [formInqDeptoId,  setFormInqDeptoId]  = useState(null)
  const [selInqUsuario,   setSelInqUsuario]   = useState('')
  const [msgInq,          setMsgInq]          = useState({})
  const [confirmacion,    setConfirmacion]    = useState(null)

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
    setFormPropDeptoId(null); setFormInqDeptoId(null)
    setConfirmacion(null); setMsgProp({}); setMsgInq({})
  }

  const abrirFormProp = (id) => { setFormPropDeptoId(formPropDeptoId === id ? null : id); setSelPropUsuario(''); setFormInqDeptoId(null); setConfirmacion(null) }
  const abrirFormInq  = (id) => { setFormInqDeptoId(formInqDeptoId === id ? null : id); setSelInqUsuario(''); setFormPropDeptoId(null); setConfirmacion(null) }

  const guardarPropietario = async (deptoId) => {
    if (!selPropUsuario) { setMsgProp({ [deptoId]: { err: 'Selecciona un usuario' } }); return }
    try {
      await api.post('/api/departamentos/asignar-propietario', { usuarioId: Number(selPropUsuario), departamentoId: deptoId })
      setMsgProp({ [deptoId]: { ok: 'Propietario asignado' } })
      cargarDatos(); setTimeout(() => { setFormPropDeptoId(null); setMsgProp({}) }, 1200)
    } catch (e) { setMsgProp({ [deptoId]: { err: e.response?.data || 'Error' } }) }
  }

  const guardarInquilino = async (deptoId) => {
    if (!selInqUsuario) { setMsgInq({ [deptoId]: { err: 'Selecciona un usuario' } }); return }
    try {
      await api.post('/api/departamentos/asignar-inquilino', { usuarioId: Number(selInqUsuario), departamentoId: deptoId })
      setMsgInq({ [deptoId]: { ok: 'Inquilino agregado' } })
      cargarDatos(); setTimeout(() => { setFormInqDeptoId(null); setMsgInq({}) }, 1200)
    } catch (e) { setMsgInq({ [deptoId]: { err: e.response?.data || 'Error' } }) }
  }

  const confirmarQuitarPropietario = (d) => { setConfirmacion({ tipo: 'propietario', asignacionId: d.propietarioAsignacionId, nombre: d.propietarioNombre, deptoId: d.id }); setFormPropDeptoId(null); setFormInqDeptoId(null) }
  const confirmarQuitarInquilino   = (inq, deptoId) => { setConfirmacion({ tipo: 'inquilino', asignacionId: inq.asignacionId, nombre: inq.nombre, deptoId }); setFormPropDeptoId(null); setFormInqDeptoId(null) }

  const ejecutarQuitar = async () => {
    if (!confirmacion) return
    try {
      await api.delete(confirmacion.tipo === 'propietario'
        ? `/api/departamentos/propietario/${confirmacion.asignacionId}`
        : `/api/departamentos/inquilino/${confirmacion.asignacionId}`)
      setConfirmacion(null); cargarDatos()
    } catch (e) { alert(e.response?.data || 'Error') }
  }

  const texto = d => `${d.numero} ${d.descripcion || ''} ${d.propietarioNombre || ''} ${(d.inquilinos || []).map(i => i.nombre).join(' ')}`.toLowerCase()
  const filtrados     = deptos.filter(d => busqueda === '' || texto(d).includes(busqueda.toLowerCase()))
  const departamentos = filtrados.filter(d => d.tipo !== 'ESTACIONAMIENTO').sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }))
  const estacionamientos = filtrados.filter(d => d.tipo === 'ESTACIONAMIENTO').sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }))
  const pisos = [...new Set(departamentos.map(d => d.piso))].sort((a, b) => a - b)

  const cardProps = (depto) => ({
    depto, abierto: expandId === depto.id, esDirectivo, usuarios,
    onToggle: () => toggleExpand(depto.id),
    formPropDeptoId, selPropUsuario, setSelPropUsuario,
    abrirFormProp, guardarPropietario, msgProp, setFormPropDeptoId,
    formInqDeptoId, selInqUsuario, setSelInqUsuario,
    abrirFormInq, guardarInquilino, msgInq, setFormInqDeptoId,
    confirmacion, confirmarQuitarPropietario, confirmarQuitarInquilino,
    ejecutarQuitar, setConfirmacion,
  })

  if (loading) return (
    <div className="dpt-page">
      <div className="dpt-skeleton">{[...Array(6)].map((_, i) => <div key={i} className="dpt-skeleton-item" />)}</div>
    </div>
  )

  return (
    <div className="dpt-page">

      <div className="dpt-header">
        <div>
          <h1 className="dpt-titulo">Departamentos</h1>
          <p className="dpt-sub">{departamentos.length} departamentos · {estacionamientos.length} estacionamientos</p>
        </div>
        <div className="dpt-leyenda">
          <span className="dpt-ley-item"><span className="dpt-dot dpt-dot-ocupado" />Con propietario</span>
          <span className="dpt-ley-item"><span className="dpt-dot dpt-dot-parcial" />Sin propietario</span>
          <span className="dpt-ley-item"><span className="dpt-dot dpt-dot-vacio" />Vacío</span>
        </div>
      </div>

      {error && <div className="dpt-alert-err">{error}</div>}

      <div className="dpt-search-wrap">
        <IcoSearch />
        <input className="dpt-search" placeholder="Buscar por número, propietario o inquilino..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      {/* ── Departamentos por piso ── */}
      {pisos.map(piso => (
        <div key={piso} className="dpt-piso-section">
          <div className="dpt-piso-header">
            <span className="dpt-piso-label">Piso {piso}</span>
            <span className="dpt-piso-cnt">{departamentos.filter(d => d.piso === piso).length} departamentos</span>
          </div>
          {departamentos.filter(d => d.piso === piso).map(d => (
            <DeptoCard key={d.id} {...cardProps(d)} />
          ))}
        </div>
      ))}

      {/* ── Estacionamientos ── */}
      {estacionamientos.length > 0 && (
        <div className="dpt-piso-section">
          <div className="dpt-piso-header dpt-piso-header-estac">
            <span className="dpt-piso-label"><IcoCar /> Estacionamientos</span>
            <span className="dpt-piso-cnt">{estacionamientos.length} plazas · {estacionamientos.reduce((s, d) => s + Number(d.porcentaje || 0), 0).toFixed(2)}% participación total</span>
          </div>
          <div className="dpt-estac-grid">
            {estacionamientos.map(d => (
              <DeptoCard key={d.id} {...cardProps(d)} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
