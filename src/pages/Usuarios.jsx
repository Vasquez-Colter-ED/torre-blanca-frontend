import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Usuarios.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE', 'SECRETARIO', 'TESORERO']

const ROL_COLOR = {
  PRESIDENTE: 'rol-presidente', SECRETARIO: 'rol-secretario',
  TESORERO:   'rol-tesorero',   RESIDENTE:  'rol-residente',
}
const ROL_LABEL = {
  PRESIDENTE: 'Presidente', SECRETARIO: 'Secretario',
  TESORERO:   'Tesorero',   RESIDENTE:  'Residente',
}

const AVATAR_COLOR = {
  PRESIDENTE: '#0F172A', SECRETARIO: '#2563EB',
  TESORERO:   '#059669', RESIDENTE:  '#64748B',
}

// ── Íconos ──────────────────────────────────────────────────────
const IcoSearch = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IcoEdit   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcoCheck  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoX      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoPlus   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoChev   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>

// Iniciales para avatar
const iniciales = u => u ? (u.nombre?.[0] || '') + (u.apellido?.[0] || '') : 'U'

// Rol principal del usuario
const rolPrincipal = u => u.roles?.[0]?.nombre || 'RESIDENTE'

export default function Usuarios() {
  const { user }       = useAuth()
  const esDirectivo    = ROLES_DIRECTIVOS.includes(user?.rol)

  const [usuarios,   setUsuarios]   = useState([])
  const [roles,      setRoles]      = useState([])
  const [deptos,     setDeptos]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [busqueda,   setBusqueda]   = useState('')
  const [filtroRol,  setFiltroRol]  = useState('')
  const [filtroEst,  setFiltroEst]  = useState('')
  const [editId,     setEditId]     = useState(null)   // fila expandida para editar
  const [crearOpen,  setCrearOpen]  = useState(false)  // panel crear nuevo
  const [formEdit,   setFormEdit]   = useState({})
  const [formNuevo,  setFormNuevo]  = useState({})
  const [msg,        setMsg]        = useState({})     // { [id]: 'ok'|'error' }
  const [msgNuevo,   setMsgNuevo]   = useState('')
  const [errNuevo,   setErrNuevo]   = useState('')
  const [error,      setError]      = useState('')

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const promesas = [api.get('/api/usuarios')]
      if (esDirectivo) {
        promesas.push(api.get('/api/usuarios/catalogos/roles'), api.get('/api/departamentos'))
      }
      const [u, r, d] = await Promise.all(promesas)
      setUsuarios(u.data)
      if (esDirectivo) { setRoles(r?.data || []); setDeptos(d?.data || []) }
    } catch { setError('Error al cargar datos') }
    finally { setLoading(false) }
  }

  // Filtrado
  const filtrados = usuarios.filter(u => {
    const texto = `${u.nombre} ${u.apellido} ${u.email} ${u.dni || ''}`.toLowerCase()
    const rol   = rolPrincipal(u)
    if (busqueda && !texto.includes(busqueda.toLowerCase())) return false
    if (filtroRol && rol !== filtroRol) return false
    if (filtroEst && u.estado !== filtroEst) return false
    return true
  })

  const abrirEditar = (u) => {
    if (editId === u.id) { setEditId(null); return }
    setEditId(u.id)
    setFormEdit({
      nombre:       u.nombre,
      apellido:     u.apellido,
      email:        u.email,
      telefono:     u.telefono || '',
      dni:          u.dni || '',
      rolId:        u.roles?.[0]?.id || '',
      departamentoId: u.departamentos?.[0]?.departamentoId || '',
      tipoResidencia: u.departamentos?.[0]?.tipo || 'PROPIETARIO',
    })
    setMsg(prev => ({ ...prev, [u.id]: '' }))
  }

  const guardarEditar = async (u) => {
    try {
      const payload = { ...formEdit }
      if (!payload.rolId)          delete payload.rolId
      if (!payload.departamentoId) delete payload.departamentoId
      await api.put(`/api/usuarios/${u.id}`, payload)
      setMsg(prev => ({ ...prev, [u.id]: 'ok' }))
      cargarDatos()
      setTimeout(() => { setEditId(null); setMsg({}) }, 1200)
    } catch (e) { setMsg(prev => ({ ...prev, [u.id]: e.response?.data || 'Error al guardar' })) }
  }

  const toggleEstado = async (u) => {
    const esDir = ROLES_DIRECTIVOS.includes(rolPrincipal(u))
    if (esDir) return
    try {
      await api[u.estado === 'ACTIVO' ? 'patch' : 'patch'](`/api/usuarios/${u.id}/${u.estado === 'ACTIVO' ? 'desactivar' : 'reactivar'}`)
      cargarDatos()
    } catch (e) { alert(e.response?.data || 'Error') }
  }

  const crearUsuario = async () => {
    setErrNuevo('')
    try {
      await api.post('/api/usuarios', {
        nombre:    formNuevo.nombre,
        apellido:  formNuevo.apellido,
        dni:       formNuevo.dni || null,
        email:     formNuevo.email,
        telefono:  formNuevo.telefono || null,
        password:  formNuevo.password,
        rolId:     formNuevo.rolId || null,
      })
      setMsgNuevo('Usuario creado correctamente')
      setFormNuevo({})
      cargarDatos()
      setTimeout(() => { setCrearOpen(false); setMsgNuevo('') }, 1400)
    } catch (e) { setErrNuevo(e.response?.data || 'Error al crear') }
  }

  if (loading) return (
    <div className="us-page">
      <div className="us-skeleton">
        {[...Array(5)].map((_,i) => <div key={i} className="us-skeleton-row" />)}
      </div>
    </div>
  )

  return (
    <div className="us-page">

      {/* Header */}
      <div className="us-header">
        <div>
          <h1 className="us-titulo">Usuarios</h1>
          <p className="us-sub">{filtrados.length} de {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}</p>
        </div>
        {esDirectivo && (
          <button className="us-btn-nuevo" onClick={() => { setCrearOpen(!crearOpen); setFormNuevo({}); setErrNuevo(''); setMsgNuevo('') }}>
            {crearOpen ? <IcoX /> : <IcoPlus />}
            {crearOpen ? 'Cancelar' : 'Nuevo usuario'}
          </button>
        )}
      </div>

      {error && <div className="us-alert-err">{error}</div>}

      {/* Panel crear nuevo — sin modal, se despliega aquí */}
      {crearOpen && esDirectivo && (
        <div className="us-crear-panel">
          <h3 className="us-crear-titulo">Nuevo usuario</h3>
          <div className="us-crear-grid">
            <div className="us-field">
              <label className="us-label">Nombre</label>
              <input className="us-input" value={formNuevo.nombre||''} onChange={e => setFormNuevo({...formNuevo,nombre:e.target.value})} />
            </div>
            <div className="us-field">
              <label className="us-label">Apellido</label>
              <input className="us-input" value={formNuevo.apellido||''} onChange={e => setFormNuevo({...formNuevo,apellido:e.target.value})} />
            </div>
            <div className="us-field">
              <label className="us-label">Email</label>
              <input className="us-input" type="email" value={formNuevo.email||''} onChange={e => setFormNuevo({...formNuevo,email:e.target.value})} />
            </div>
            <div className="us-field">
              <label className="us-label">DNI</label>
              <input className="us-input" value={formNuevo.dni||''} maxLength={8} onChange={e => setFormNuevo({...formNuevo,dni:e.target.value.replace(/\D/g,'')})} />
            </div>
            <div className="us-field">
              <label className="us-label">Teléfono</label>
              <input className="us-input" value={formNuevo.telefono||''} onChange={e => setFormNuevo({...formNuevo,telefono:e.target.value.replace(/\D/g,'')})} />
            </div>
            <div className="us-field">
              <label className="us-label">Contraseña</label>
              <input className="us-input" type="password" value={formNuevo.password||''} onChange={e => setFormNuevo({...formNuevo,password:e.target.value})} />
            </div>
            <div className="us-field">
              <label className="us-label">Rol</label>
              <select className="us-input" value={formNuevo.rolId||''} onChange={e => setFormNuevo({...formNuevo,rolId:e.target.value})}>
                <option value="">Sin rol (residente)</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
          </div>
          {errNuevo && <p className="us-err">{errNuevo}</p>}
          {msgNuevo && <p className="us-ok">{msgNuevo}</p>}
          <div className="us-crear-footer">
            <button className="us-btn-cancelar" onClick={() => setCrearOpen(false)}>Cancelar</button>
            <button className="us-btn-guardar" onClick={crearUsuario}>Crear usuario</button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="us-filtros">
        <div className="us-search-wrap">
          <IcoSearch />
          <input className="us-search" placeholder="Buscar por nombre, email o DNI..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <select className="us-filtro-sel" value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
          <option value="">Todos los roles</option>
          <option value="PRESIDENTE">Presidente</option>
          <option value="SECRETARIO">Secretario</option>
          <option value="TESORERO">Tesorero</option>
          <option value="RESIDENTE">Residente</option>
        </select>
        <select className="us-filtro-sel" value={filtroEst} onChange={e => setFiltroEst(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activos</option>
          <option value="INACTIVO">Inactivos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="us-tabla-wrap">
        {/* Encabezado */}
        <div className="us-tabla-head">
          <span>Usuario</span>
          <span>DNI</span>
          <span>Departamento</span>
          <span>Rol</span>
          <span>Estado</span>
          <span></span>
        </div>

        {filtrados.length === 0 && (
          <div className="us-empty">No hay usuarios que coincidan con los filtros.</div>
        )}

        {/* Filas */}
        {filtrados.map(u => {
          const rol      = rolPrincipal(u)
          const esDir    = ROLES_DIRECTIVOS.includes(rol)
          const depto    = u.departamentos?.[0]
          const abierto  = editId === u.id
          const estadoOk = u.estado === 'ACTIVO'

          return (
            <div key={u.id} className={`us-fila-wrap ${abierto ? 'us-fila-wrap-open' : ''}`}>

              {/* Fila principal */}
              <div className={`us-fila ${abierto ? 'us-fila-active' : ''}`}>

                {/* Avatar + nombre */}
                <div className="us-col-usuario">
                  <div className="us-avatar" style={{ background: AVATAR_COLOR[rol] || '#64748B' }}>
                    {iniciales(u).toUpperCase()}
                  </div>
                  <div className="us-usuario-info">
                    <p className="us-nombre">{u.nombre} {u.apellido}</p>
                    <p className="us-email">{u.email}</p>
                  </div>
                </div>

                {/* DNI */}
                <span className="us-col-dni us-mono">{u.dni || <span className="us-vacio">—</span>}</span>

                {/* Departamento */}
                <div className="us-col-depto">
                  {depto ? (
                    <>
                      <span className="us-depto-num">Depto {depto.numero}</span>
                      <span className={`us-tipo-badge ${depto.tipo === 'PROPIETARIO' ? 'us-tipo-prop' : 'us-tipo-inq'}`}>
                        {depto.tipo === 'PROPIETARIO' ? 'Propietario' : 'Inquilino'}
                      </span>
                    </>
                  ) : <span className="us-vacio">Sin asignar</span>}
                </div>

                {/* Rol */}
                <span className={`us-rol-badge ${ROL_COLOR[rol] || 'rol-residente'}`}>
                  {ROL_LABEL[rol] || rol}
                </span>

                {/* Estado */}
                <div className="us-col-estado">
                  <span className={`us-estado-dot ${estadoOk ? 'us-dot-ok' : 'us-dot-off'}`} />
                  <span className={`us-estado-txt ${estadoOk ? 'us-est-ok' : 'us-est-off'}`}>
                    {estadoOk ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Acciones */}
                <div className="us-col-acc">
                  {esDirectivo && (
                    <>
                      <button className={`us-btn-edit ${abierto ? 'us-btn-edit-on' : ''}`} onClick={() => abrirEditar(u)} title="Editar">
                        {abierto ? <IcoX /> : <IcoEdit />}
                      </button>
                      {!esDir && (
                        <button
                          className={`us-btn-toggle ${estadoOk ? 'us-btn-desact' : 'us-btn-react'}`}
                          onClick={() => toggleEstado(u)}
                          title={estadoOk ? 'Desactivar' : 'Reactivar'}
                        >
                          {estadoOk ? 'Desactivar' : 'Reactivar'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Panel edición inline — acordeón */}
              <div className={`us-edit-panel ${abierto ? 'us-edit-panel-open' : ''}`}>
                {abierto && (
                  <div className="us-edit-body">
                    <p className="us-edit-sec">Información personal</p>
                    <div className="us-edit-grid">
                      <div className="us-field">
                        <label className="us-label">Nombre</label>
                        <input className="us-input" value={formEdit.nombre||''} onChange={e => setFormEdit({...formEdit,nombre:e.target.value})} />
                      </div>
                      <div className="us-field">
                        <label className="us-label">Apellido</label>
                        <input className="us-input" value={formEdit.apellido||''} onChange={e => setFormEdit({...formEdit,apellido:e.target.value})} />
                      </div>
                      <div className="us-field">
                        <label className="us-label">Email</label>
                        <input className="us-input" type="email" value={formEdit.email||''} onChange={e => setFormEdit({...formEdit,email:e.target.value})} />
                      </div>
                      <div className="us-field">
                        <label className="us-label">Teléfono</label>
                        <input className="us-input" value={formEdit.telefono||''} onChange={e => setFormEdit({...formEdit,telefono:e.target.value.replace(/\D/g,'')})} />
                      </div>

                      {/* Solo directivos pueden editar DNI */}
                      {esDirectivo && (
                        <div className="us-field">
                          <label className="us-label">
                            DNI
                            <span className="us-label-badge">Solo directivo</span>
                          </label>
                          <input className="us-input" value={formEdit.dni||''} maxLength={8}
                            onChange={e => setFormEdit({...formEdit,dni:e.target.value.replace(/\D/g,'')})} />
                        </div>
                      )}
                    </div>

                    {/* Solo directivos pueden cambiar rol y departamento */}
                    {esDirectivo && (
                      <>
                        <p className="us-edit-sec us-edit-sec-top">Administración</p>
                        <div className="us-edit-grid">
                          <div className="us-field">
                            <label className="us-label">Rol</label>
                            <select className="us-input" value={formEdit.rolId||''} onChange={e => setFormEdit({...formEdit,rolId:e.target.value})}>
                              <option value="">Sin rol (residente)</option>
                              {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                            </select>
                          </div>
                          <div className="us-field">
                            <label className="us-label">Departamento</label>
                            <select className="us-input" value={formEdit.departamentoId||''} onChange={e => setFormEdit({...formEdit,departamentoId:e.target.value})}>
                              <option value="">Sin departamento</option>
                              {deptos.sort((a,b) => a.numero.localeCompare(b.numero,undefined,{numeric:true})).map(d => (
                                <option key={d.id} value={d.id}>Depto {d.numero} · Piso {d.piso}</option>
                              ))}
                            </select>
                          </div>
                          {formEdit.departamentoId && (
                            <div className="us-field">
                              <label className="us-label">Tipo de residencia</label>
                              <select className="us-input" value={formEdit.tipoResidencia||'PROPIETARIO'} onChange={e => setFormEdit({...formEdit,tipoResidencia:e.target.value})}>
                                <option value="PROPIETARIO">Propietario</option>
                                <option value="INQUILINO">Inquilino</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {msg[u.id] && msg[u.id] !== 'ok' && <p className="us-err">{msg[u.id]}</p>}
                    {msg[u.id] === 'ok' && <p className="us-ok">Guardado correctamente</p>}

                    <div className="us-edit-footer">
                      <button className="us-btn-cancelar" onClick={() => setEditId(null)}>Cancelar</button>
                      <button className="us-btn-guardar" onClick={() => guardarEditar(u)}>
                        <IcoCheck /> Guardar cambios
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}
