import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import TelefonoInput from '../components/TelefonoInput'
import './Usuarios.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE', 'SECRETARIO', 'TESORERO']
const CARGOS_DIRECTIVOS = ['PRESIDENTE', 'SECRETARIO', 'TESORERO']

const CARGO_COLOR = {
  PRESIDENTE: 'rol-presidente', SECRETARIO: 'rol-secretario', TESORERO: 'rol-tesorero',
}
const CARGO_LABEL = {
  PRESIDENTE: 'Presidente', SECRETARIO: 'Secretario', TESORERO: 'Tesorero',
}
const AVATAR_COLOR = {
  PRESIDENTE: '#0F172A', SECRETARIO: '#2563EB', TESORERO: '#059669', default: '#64748B',
}

const IcoSearch = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IcoEdit  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcoCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoX     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoPlus  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoEye   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const IcoEyeOff= () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
const IcoAlert = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>

// Solo letras y tildes
const soloLetras = v => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '')

const iniciales = u => ((u?.nombre?.[0] || '') + (u?.apellido?.[0] || '')).toUpperCase()
const cargoDirectivo = u => u.roles?.find(r => CARGOS_DIRECTIVOS.includes(r.nombre))
const tipoResidencia = u => u.departamentos?.[0]?.tipo || null
const avatarColor    = u => {
  const cargo = cargoDirectivo(u)
  return cargo ? (AVATAR_COLOR[cargo.nombre] || '#64748B') : '#64748B'
}

const FORM_NUEVO_VACIO = {
  nombre: '', apellido: '', email: '', dni: '', telefono: '',
  password: '', departamentoId: '', tipoResidencia: 'PROPIETARIO', cargoDirectivoId: '',
}

// Ordena: 1º directivos, 2º propietarios/inquilinos vinculados a algún depto,
// 3º usuarios sin ningún depto vinculado — cada grupo en orden alfabético
const collatorEs = new Intl.Collator('es', { sensitivity: 'base' })
const ordenarUsuarios = (lista) => {
  const grupo = (u) => {
    if (cargoDirectivo(u)) return 0
    if ((u.departamentos?.length || 0) > 0) return 1
    return 2
  }
  return [...lista].sort((a, b) => {
    const ga = grupo(a), gb = grupo(b)
    if (ga !== gb) return ga - gb
    return collatorEs.compare(`${a.nombre} ${a.apellido}`, `${b.nombre} ${b.apellido}`)
  })
}

// ═════════════════════════════════════════════════════════════════════
export default function Usuarios() {
  const { user, logout } = useAuth()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)

  const [usuarios,   setUsuarios]   = useState([])
  const [roles,      setRoles]      = useState([])
  const [deptos,     setDeptos]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [busqueda,   setBusqueda]   = useState('')
  const [filtroEst,  setFiltroEst]  = useState('')
  const [editId,     setEditId]     = useState(null)
  const [crearOpen,  setCrearOpen]  = useState(false)
  const [formEdit,   setFormEdit]   = useState({})
  const [formNuevo,  setFormNuevo]  = useState(FORM_NUEVO_VACIO)
  const [msg,        setMsg]        = useState({})
  const [msgNuevo,   setMsgNuevo]   = useState('')
  const [errNuevo,   setErrNuevo]   = useState('')
  const [error,      setError]      = useState('')
  const [verPass,    setVerPass]    = useState(false)
  const [confirmDesactivar, setConfirmDesactivar] = useState(null) // id del usuario a confirmar
  const [confirmAutoQuitar, setConfirmAutoQuitar] = useState(false) // te estás quitando tu propio cargo

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const promesas = [api.get('/api/usuarios')]
      if (esDirectivo) {
        promesas.push(
          api.get('/api/usuarios/catalogos/roles'),
          api.get('/api/departamentos')
        )
      }
      const [u, r, d] = await Promise.all(promesas)
      setUsuarios(u.data)
      if (esDirectivo) {
        // Solo mostrar cargos directivos en el selector
        const soloDirectivos = (r?.data || []).filter(rol => CARGOS_DIRECTIVOS.includes(rol.nombre))
        setRoles(soloDirectivos)
        setDeptos(d?.data || [])
      }
    } catch { setError('Error al cargar datos') }
    finally { setLoading(false) }
  }

  const filtrados = ordenarUsuarios(usuarios.filter(u => {
    const texto = `${u.nombre} ${u.apellido} ${u.email || ''} ${u.dni || ''}`.toLowerCase()
    if (busqueda && !texto.includes(busqueda.toLowerCase())) return false
    if (filtroEst && u.estado !== filtroEst) return false
    return true
  }))

  const abrirEditar = (u) => {
    if (editId === u.id) { setEditId(null); return }
    setEditId(u.id)
    setConfirmAutoQuitar(false)
    const cargo = cargoDirectivo(u)
    // Normaliza teléfonos guardados antes de tener código de país (ej. "987654321"
    // sin +51) para que la validación no falle aunque el usuario no toque ese campo
    let tel = u.telefono || ''
    if (tel && !tel.startsWith('+')) tel = '+51 ' + tel
    setFormEdit({
      nombre:         u.nombre,
      apellido:       u.apellido,
      email:          u.email || '',
      telefono:       tel,
      dni:            u.dni || '',
      cargoDirectivoId: cargo?.rolId || '',
      cargoOriginalId:  cargo?.rolId || null, // para detectar si se quiere quitar
    })
    setMsg(prev => ({ ...prev, [u.id]: '' }))
  }

  const guardarEditar = async (u) => {
    if (!formEdit.nombre?.trim())   { setMsg(prev => ({ ...prev, [u.id]: 'El nombre no puede quedar vacío' })); return }
    if (!formEdit.apellido?.trim()) { setMsg(prev => ({ ...prev, [u.id]: 'El apellido no puede quedar vacío' })); return }

    const esMiPropiaFila = u.id === user.id
    const teniaCargo = !!formEdit.cargoOriginalId
    const quiereQuitarCargo = teniaCargo && !formEdit.cargoDirectivoId

    if (quiereQuitarCargo) {
      // Primero valida si esto es viable: ¿hay alguien más con ese mismo cargo?
      // Si es el único, ni siquiera tiene sentido mostrar el aviso de "vas a
      // perder tu propio acceso" — la acción de por sí no se puede hacer.
      const cargoActual = cargoDirectivo(u)
      const hayOtroConEseCargo = usuarios.some(x => x.id !== u.id && cargoDirectivo(x)?.rolId === cargoActual?.rolId)
      if (!hayOtroConEseCargo) {
        setMsg(prev => ({ ...prev, [u.id]: `No puedes quitar el cargo de ${CARGO_LABEL[cargoActual?.nombre] || cargoActual?.nombre} porque es el único activo en ese puesto. Primero asigna ese cargo a otra persona.` }))
        return
      }
    }

    // Recién aquí, si es viable Y es tu propia fila, se pide la confirmación
    // fuerte de que vas a perder tu propio acceso
    if (esMiPropiaFila && quiereQuitarCargo && !confirmAutoQuitar) {
      setConfirmAutoQuitar(true)
      return
    }

    await ejecutarGuardado(u, esMiPropiaFila && quiereQuitarCargo)
  }

  const ejecutarGuardado = async (u, cerrarSesionAlTerminar) => {
    try {
      const payload = { ...formEdit }
      const teniaCargo = !!payload.cargoOriginalId
      const quiereQuitar = teniaCargo && !payload.cargoDirectivoId
      delete payload.cargoOriginalId

      if (quiereQuitar) {
        // Envía 0 como señal explícita de "quitar cargo actual"
        payload.cargoDirectivoId = 0
      } else if (!payload.cargoDirectivoId) {
        delete payload.cargoDirectivoId
      }

      await api.put(`/api/usuarios/${u.id}`, payload)

      if (cerrarSesionAlTerminar) {
        // Te quitaste tu propio cargo: tu sesión actual ya no debe tener
        // acceso a los módulos de directivo — se cierra para que el próximo
        // inicio de sesión refleje los permisos correctos
        logout()
        return
      }

      setMsg(prev => ({ ...prev, [u.id]: 'ok' }))
      cargarDatos()
      setTimeout(() => { setEditId(null); setMsg({}); setConfirmAutoQuitar(false) }, 1200)
    } catch (e) { setMsg(prev => ({ ...prev, [u.id]: e.response?.data || 'Error al guardar' })) }
  }

  const toggleEstado = async (u) => {
    const cargo = cargoDirectivo(u)
    if (cargo && u.estado === 'ACTIVO') return // no se puede desactivar a un directivo activo (primero hay que quitarle el cargo)

    // Reactivar no tiene implicancias que confirmar — se hace directo
    if (u.estado !== 'ACTIVO') {
      try { await api.patch(`/api/usuarios/${u.id}/reactivar`); cargarDatos() }
      catch (e) { alert(e.response?.data || 'Error') }
      return
    }

    // Desactivar sí tiene implicancias (desvincula departamentos) — pide confirmación inline
    setConfirmDesactivar(confirmDesactivar === u.id ? null : u.id)
  }

  const confirmarDesactivar = async (u) => {
    try {
      await api.patch(`/api/usuarios/${u.id}/desactivar`)
      setConfirmDesactivar(null)
      cargarDatos()
    } catch (e) { alert(e.response?.data || 'Error') }
  }

  const validarNuevo = () => {
    if (!formNuevo.nombre.trim())    return 'El nombre es obligatorio'
    if (!formNuevo.apellido.trim())  return 'El apellido es obligatorio'
    if (!formNuevo.password.trim())  return 'La contraseña es obligatoria'
    if (!formNuevo.email.trim() && !formNuevo.dni.trim())
      return 'Debe ingresar al menos un correo o DNI'
    if (!formNuevo.departamentoId)   return 'El departamento es obligatorio'
    if (!formNuevo.tipoResidencia)   return 'El tipo de residencia es obligatorio'
    return null
  }

  const crearUsuario = async () => {
    setErrNuevo('')
    const err = validarNuevo()
    if (err) { setErrNuevo(err); return }
    try {
      await api.post('/api/usuarios', {
        nombre:           formNuevo.nombre,
        apellido:         formNuevo.apellido,
        dni:              formNuevo.dni || null,
        email:            formNuevo.email || null,
        telefono:         formNuevo.telefono || null,
        password:         formNuevo.password,
        departamentoId:   Number(formNuevo.departamentoId),
        tipoResidencia:   formNuevo.tipoResidencia,
        cargoDirectivoId: formNuevo.cargoDirectivoId ? Number(formNuevo.cargoDirectivoId) : null,
      })
      setMsgNuevo('Usuario creado correctamente')
      setFormNuevo(FORM_NUEVO_VACIO)
      cargarDatos()
      setTimeout(() => { setCrearOpen(false); setMsgNuevo('') }, 1400)
    } catch (e) { setErrNuevo(e.response?.data || 'Error al crear') }
  }

  const sortedDeptos = [...deptos].sort((a, b) =>
    a.numero.localeCompare(b.numero, undefined, { numeric: true }))

  if (loading) return (
    <div className="us-page">
      <div className="us-skeleton">
        {[...Array(5)].map((_, i) => <div key={i} className="us-skeleton-row" />)}
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
          <button className="us-btn-nuevo" onClick={() => {
            setCrearOpen(!crearOpen)
            setFormNuevo(FORM_NUEVO_VACIO)
            setErrNuevo(''); setMsgNuevo('')
          }}>
            {crearOpen ? <IcoX /> : <IcoPlus />}
            {crearOpen ? 'Cancelar' : 'Nuevo usuario'}
          </button>
        )}
      </div>

      {error && <div className="us-alert-err">{error}</div>}

      {/* Panel crear nuevo */}
      {crearOpen && esDirectivo && (
        <div className="us-crear-panel">
          <h3 className="us-crear-titulo">Nuevo usuario</h3>

          <p className="us-crear-sec">Datos personales</p>
          <div className="us-crear-grid">
            <div className="us-field">
              <label className="us-label">Nombre <span className="us-req">*</span></label>
              <input className="us-input" value={formNuevo.nombre}
                onChange={e => setFormNuevo({ ...formNuevo, nombre: soloLetras(e.target.value) })} />
            </div>
            <div className="us-field">
              <label className="us-label">Apellido <span className="us-req">*</span></label>
              <input className="us-input" value={formNuevo.apellido}
                onChange={e => setFormNuevo({ ...formNuevo, apellido: soloLetras(e.target.value) })} />
            </div>
            <div className="us-field">
              <label className="us-label">Correo <span className="us-label-hint">(o DNI)</span></label>
              <input className="us-input" type="email" placeholder="correo@ejemplo.com" value={formNuevo.email} onChange={e => setFormNuevo({ ...formNuevo, email: e.target.value })} />
            </div>
            <div className="us-field">
              <label className="us-label">DNI <span className="us-label-hint">(o Correo)</span></label>
              <input className="us-input" maxLength={8} placeholder="8 dígitos" value={formNuevo.dni} onChange={e => setFormNuevo({ ...formNuevo, dni: e.target.value.replace(/\D/g, '') })} />
            </div>
            <div className="us-field">
              <label className="us-label">Teléfono</label>
              <TelefonoInput value={formNuevo.telefono} onChange={v => setFormNuevo({ ...formNuevo, telefono: v })} />
            </div>
            <div className="us-field">
              <label className="us-label">Contraseña <span className="us-req">*</span></label>
              <div className="us-pass-wrap">
                <input className="us-input us-pass-input" type={verPass ? 'text' : 'password'}
                  value={formNuevo.password}
                  onChange={e => setFormNuevo({ ...formNuevo, password: e.target.value })} />
                <button type="button" className="us-pass-toggle" onClick={() => setVerPass(v => !v)}>
                  {verPass ? <IcoEyeOff /> : <IcoEye />}
                </button>
              </div>
            </div>
          </div>

          <p className="us-crear-sec us-crear-sec-top">Asignación al edificio <span className="us-req">*</span></p>
          <div className="us-crear-grid">
            <div className="us-field">
              <label className="us-label">Departamento <span className="us-req">*</span></label>
              <select className="us-input" value={formNuevo.departamentoId} onChange={e => setFormNuevo({ ...formNuevo, departamentoId: e.target.value })}>
                <option value="">Seleccionar...</option>
                {sortedDeptos.map(d => (
                  <option key={d.id} value={d.id}>Depto {d.numero} · Piso {d.piso}</option>
                ))}
              </select>
            </div>
            <div className="us-field">
              <label className="us-label">Tipo de residencia <span className="us-req">*</span></label>
              <select className="us-input" value={formNuevo.tipoResidencia} onChange={e => setFormNuevo({ ...formNuevo, tipoResidencia: e.target.value })}>
                <option value="PROPIETARIO">Propietario</option>
                <option value="INQUILINO">Inquilino</option>
              </select>
            </div>
            <div className="us-field">
              <label className="us-label">
                Cargo directivo
                <span className="us-label-hint"> (opcional)</span>
              </label>
              <select className="us-input" value={formNuevo.cargoDirectivoId} onChange={e => setFormNuevo({ ...formNuevo, cargoDirectivoId: e.target.value })}>
                <option value="">Sin cargo directivo</option>
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
        <select className="us-filtro-sel" value={filtroEst} onChange={e => setFiltroEst(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activos</option>
          <option value="INACTIVO">Inactivos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="us-tabla-wrap">
        <div className="us-tabla-head">
          <span>Usuario</span>
          <span>DNI</span>
          <span>Departamento</span>
          <span>Tipo</span>
          <span>Cargo directivo</span>
          <span>Estado</span>
          <span></span>
        </div>

        {filtrados.length === 0 && (
          <div className="us-empty">No hay usuarios que coincidan.</div>
        )}

        {filtrados.map(u => {
          const cargo   = cargoDirectivo(u)
          const tipo    = tipoResidencia(u)
          const deptosDelUsuario = u.departamentos || []
          const esDir   = !!cargo
          const abierto = editId === u.id
          const confirmando = confirmDesactivar === u.id
          const activo  = u.estado === 'ACTIVO'
          const deptosPropietario = deptosDelUsuario.filter(d => d.tipo === 'PROPIETARIO')
          const deptosInquilino   = deptosDelUsuario.filter(d => d.tipo === 'INQUILINO')

          return (
            <div key={u.id} className={`us-fila-wrap ${abierto ? 'us-fila-wrap-open' : ''}`}>
              <div className={`us-fila ${abierto ? 'us-fila-active' : ''}`}>

                {/* Avatar + nombre */}
                <div className="us-col-usuario">
                  <div className="us-avatar" style={{ background: avatarColor(u) }}>
                    {iniciales(u)}
                  </div>
                  <div className="us-usuario-info">
                    <p className="us-nombre">{u.nombre} {u.apellido}</p>
                    <p className="us-email">{u.email || <span className="us-vacio">Sin correo</span>}</p>
                  </div>
                </div>

                {/* DNI */}
                <span className="us-col-dni us-mono">{u.dni || <span className="us-vacio">—</span>}</span>

                {/* Departamento */}
                <span className="us-col-depto-num">
                  {deptosDelUsuario.length === 0 && <span className="us-vacio">—</span>}
                  {deptosDelUsuario.length === 1 && `Depto ${deptosDelUsuario[0].numero} · P${deptosDelUsuario[0].piso}`}
                  {deptosDelUsuario.length > 1 && (
                    <>
                      Depto {deptosDelUsuario[0].numero} <span className="us-depto-mas">+{deptosDelUsuario.length - 1} más</span>
                    </>
                  )}
                </span>

                {/* Tipo de residencia */}
                <span className={`us-tipo-badge ${tipo === 'PROPIETARIO' ? 'us-tipo-prop' : tipo === 'INQUILINO' ? 'us-tipo-inq' : ''}`}>
                  {tipo === 'PROPIETARIO' ? 'Propietario' : tipo === 'INQUILINO' ? 'Inquilino' : <span className="us-vacio">—</span>}
                </span>

                {/* Cargo directivo */}
                <span>
                  {cargo
                    ? <span className={`us-rol-badge ${CARGO_COLOR[cargo.nombre] || 'rol-residente'}`}>{CARGO_LABEL[cargo.nombre] || cargo.nombre}</span>
                    : <span className="us-vacio">—</span>}
                </span>

                {/* Estado */}
                <div className="us-col-estado">
                  <span className={`us-estado-dot ${activo ? 'us-dot-ok' : 'us-dot-off'}`} />
                  <span className={`us-estado-txt ${activo ? 'us-est-ok' : 'us-est-off'}`}>
                    {activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Acciones */}
                <div className="us-col-acc">
                  {esDirectivo && (
                    <>
                      <button className={`us-btn-edit ${abierto ? 'us-btn-edit-on' : ''}`} onClick={() => abrirEditar(u)}>
                        {abierto ? <IcoX /> : <IcoEdit />}
                      </button>
                      {(!esDir || !activo) && (
                        <button className={`us-btn-toggle ${activo ? 'us-btn-desact' : 'us-btn-react'}`} onClick={() => toggleEstado(u)}>
                          {activo ? 'Desactivar' : 'Reactivar'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Panel edición inline */}
              <div className={`us-edit-panel ${abierto ? 'us-edit-panel-open' : ''}`}>
                {abierto && (
                  <div className="us-edit-body">
                    <p className="us-edit-sec">Información personal</p>
                    <div className="us-edit-grid">
                      <div className="us-field">
                        <label className="us-label">Nombre</label>
                        <input className="us-input" value={formEdit.nombre || ''} onChange={e => setFormEdit({ ...formEdit, nombre: soloLetras(e.target.value) })} />
                      </div>
                      <div className="us-field">
                        <label className="us-label">Apellido</label>
                        <input className="us-input" value={formEdit.apellido || ''} onChange={e => setFormEdit({ ...formEdit, apellido: soloLetras(e.target.value) })} />
                      </div>
                      <div className="us-field">
                        <label className="us-label">Correo</label>
                        <input className="us-input" type="email" value={formEdit.email || ''} onChange={e => setFormEdit({ ...formEdit, email: e.target.value })} />
                      </div>
                      <div className="us-field">
                        <label className="us-label">Teléfono</label>
                        <TelefonoInput value={formEdit.telefono} onChange={v => setFormEdit({ ...formEdit, telefono: v })} />
                      </div>
                      {esDirectivo && (
                        <div className="us-field">
                          <label className="us-label">DNI <span className="us-label-badge">Solo directivo</span></label>
                          <input className="us-input" maxLength={8} value={formEdit.dni || ''} onChange={e => setFormEdit({ ...formEdit, dni: e.target.value.replace(/\D/g, '') })} />
                        </div>
                      )}
                    </div>

                    {esDirectivo && (
                      <>
                        <p className="us-edit-sec us-edit-sec-top">Cargo directivo <span className="us-label-hint">(opcional)</span></p>
                        <div className="us-edit-grid">
                          <div className="us-field">
                            <label className="us-label">Cargo</label>
                            <select className="us-input" value={formEdit.cargoDirectivoId || ''} disabled={!activo}
                              onChange={e => setFormEdit({ ...formEdit, cargoDirectivoId: e.target.value })}>
                              <option value="">Sin cargo directivo</option>
                              {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                            </select>
                          </div>
                        </div>
                        {!activo
                          ? <p className="us-edit-nota us-edit-nota-warn">Este usuario está inactivo — reactívalo primero para poder asignarle un cargo directivo.</p>
                          : <p className="us-edit-nota">El tipo de residencia (propietario/inquilino) se gestiona desde el módulo de Departamentos.</p>
                        }
                      </>
                    )}

                    {msg[u.id] && msg[u.id] !== 'ok' && <p className="us-err">{msg[u.id]}</p>}
                    {msg[u.id] === 'ok' && <p className="us-ok">Guardado correctamente</p>}

                    {confirmAutoQuitar && u.id === user.id && (
                      <div className="us-confirm-self">
                        <div className="us-confirm-titulo">
                          <IcoAlert />
                          ¿Quitarte tu propio cargo directivo?
                        </div>
                        <ul className="us-confirm-lista">
                          <li>Perderás acceso inmediato a Usuarios, Departamentos, Gastos, Reportes y Fondo de Contingencia</li>
                          <li>Tu sesión se cerrará automáticamente para aplicar el cambio</li>
                          <li>Tendrás que pedirle a otro directivo que te vuelva a asignar un cargo si lo necesitas de nuevo</li>
                        </ul>
                      </div>
                    )}

                    <div className="us-edit-footer">
                      {confirmAutoQuitar && u.id === user.id ? (
                        <>
                          <button className="us-btn-cancelar" onClick={() => {
                            setConfirmAutoQuitar(false)
                            setFormEdit({ ...formEdit, cargoDirectivoId: formEdit.cargoOriginalId || '' })
                          }}>Cancelar</button>
                          <button className="us-btn-confirmar-desact" onClick={() => ejecutarGuardado(u, true)}>
                            Sí, quitar mi cargo y cerrar sesión
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="us-btn-cancelar" onClick={() => setEditId(null)}>Cancelar</button>
                          <button className="us-btn-guardar" onClick={() => guardarEditar(u)}>
                            <IcoCheck /> Guardar cambios
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Panel de confirmación al desactivar — muestra las implicancias antes de aplicar */}
              <div className={`us-confirm-panel ${confirmando ? 'us-confirm-panel-open' : ''}`}>
                {confirmando && (
                  <div className="us-confirm-body">
                    <div className="us-confirm-titulo">
                      <IcoAlert />
                      ¿Desactivar a {u.nombre} {u.apellido}?
                    </div>
                    <ul className="us-confirm-lista">
                      <li>Ya no podrá iniciar sesión en el sistema</li>
                      {deptosPropietario.length > 0 && (
                        <li>
                          Se desvinculará como <strong>propietario</strong> de: {deptosPropietario.map(d => `Depto ${d.numero}`).join(', ')}
                        </li>
                      )}
                      {deptosInquilino.length > 0 && (
                        <li>
                          Se desvinculará como <strong>inquilino</strong> de: {deptosInquilino.map(d => `Depto ${d.numero}`).join(', ')}
                        </li>
                      )}
                      <li>Sus recibos, pagos e historial se mantienen intactos en Reportes</li>
                      <li>Esta acción queda registrada en Auditoría con tu nombre y la fecha/hora exacta</li>
                    </ul>
                    <div className="us-confirm-footer">
                      <button className="us-btn-cancelar" onClick={() => setConfirmDesactivar(null)}>Cancelar</button>
                      <button className="us-btn-confirmar-desact" onClick={() => confirmarDesactivar(u)}>Sí, desactivar</button>
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
