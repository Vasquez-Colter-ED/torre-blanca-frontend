import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Usuarios.css'

const ROLES_DIRECTIVOS = ['PRESIDENTE', 'SECRETARIO', 'TESORERO']

export default function Usuarios() {
  const { user } = useAuth()
  const esDirectivo = ROLES_DIRECTIVOS.includes(user?.rol)

  const [usuarios,  setUsuarios]  = useState([])
  const [roles,     setRoles]     = useState([])
  const [modulos,   setModulos]   = useState([])
  const [permisos,  setPermisos]  = useState([])
  const [deptos,    setDeptos]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [busqueda,  setBusqueda]  = useState('')
  const [modal,     setModal]     = useState(null)
  const [selected,  setSelected]  = useState(null)
  const [form,      setForm]      = useState({})
  const [msg,       setMsg]       = useState('')
  const [error,     setError]     = useState('')

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const promesas = [api.get('/api/usuarios')]
      if (esDirectivo) {
        promesas.push(
          api.get('/api/usuarios/catalogos/roles'),
          api.get('/api/usuarios/catalogos/modulos'),
          api.get('/api/usuarios/catalogos/permisos'),
          api.get('/api/departamentos'),
        )
      }
      const [u, r, m, p, d] = await Promise.all(promesas)
      setUsuarios(u.data)
      if (esDirectivo) { setRoles(r.data); setModulos(m.data); setPermisos(p.data); setDeptos(d.data) }
    } catch { setError('Error al cargar datos') }
    finally { setLoading(false) }
  }

  const filtrados = esDirectivo
    ? usuarios.filter(u =>
        `${u.nombre} ${u.apellido} ${u.email} ${u.dni||''}`.toLowerCase().includes(busqueda.toLowerCase()))
    : usuarios.filter(u => u.id === user?.id)

  const cerrar = () => { setModal(null); setSelected(null); setMsg(''); setError('') }

  const abrirEditar = (u) => {
    if (!esDirectivo && u.id !== user?.id) return
    setSelected(u)
    setForm({ nombre: u.nombre, apellido: u.apellido, dni: u.dni||'', telefono: u.telefono||'', email: u.email, nuevaPassword: '' })
    setModal('editar'); setMsg(''); setError('')
  }

  const guardarEdicion = async () => {
    try {
      const payload = { ...form }
      if (!payload.nuevaPassword) delete payload.nuevaPassword
      await api.put(`/api/usuarios/${selected.id}`, payload)
      setMsg('Guardado correctamente')
      cargarDatos()
      setTimeout(cerrar, 1200)
    } catch (e) { setError(e.response?.data || 'Error al guardar') }
  }

  const guardarNuevo = async () => {
    try {
      await api.post('/api/usuarios', { ...form, rolId: form.rolId || null, departamentoId: form.departamentoId || null })
      setMsg('Usuario creado correctamente')
      cargarDatos()
      setTimeout(cerrar, 1200)
    } catch (e) { setError(e.response?.data || 'Error al crear') }
  }

  const desactivar = async (u) => {
    if (!confirm(`¿Desactivar a ${u.nombre} ${u.apellido}?`)) return
    try { await api.patch(`/api/usuarios/${u.id}/desactivar`); cargarDatos() }
    catch (e) { alert(e.response?.data || 'No se puede desactivar') }
  }

  const reactivar = async (u) => {
    try { await api.patch(`/api/usuarios/${u.id}/reactivar`); cargarDatos() }
    catch (e) { alert(e.response?.data || 'Error') }
  }

  const guardarRol = async () => {
    try {
      await api.post(`/api/usuarios/${selected.id}/roles`, { rolId: Number(form.rolId) })
      setMsg('Rol asignado.')
      cargarDatos()
      setTimeout(cerrar, 1500)
    } catch (e) { setError(e.response?.data || 'Error') }
  }

  const revocarRol = async (usuarioId, rolId) => {
    if (!confirm('¿Revocar este rol?')) return
    try { await api.delete(`/api/usuarios/${usuarioId}/roles/${rolId}`); cargarDatos() }
    catch (e) { alert(e.response?.data || 'Error') }
  }

  const guardarPermiso = async () => {
    try {
      await api.post(`/api/usuarios/${selected.id}/permisos`, { moduloId: Number(form.moduloId), permisoId: Number(form.permisoId) })
      setMsg('Permiso asignado correctamente')
      cargarDatos()
      setTimeout(cerrar, 1200)
    } catch (e) { setError(e.response?.data || 'Error') }
  }

  const revocarPermiso = async (asignacionId) => {
    if (!confirm('¿Revocar este permiso?')) return
    try { await api.delete(`/api/usuarios/permisos/${asignacionId}`); cargarDatos() }
    catch (e) { alert(e.response?.data || 'Error') }
  }

  const restablecerPermisos = async (u) => {
    if (!confirm(`¿Restablecer permisos de ${u.nombre}?`)) return
    try { await api.post(`/api/usuarios/${u.id}/permisos/restablecer`); cargarDatos() }
    catch (e) { alert(e.response?.data || 'Error') }
  }

  if (loading) return <div className="loading-msg">Cargando usuarios...</div>

  return (
    <div className="usuarios-page">
      <h1 className="page-title">Usuarios</h1>
      <p className="page-subtitle">{esDirectivo ? 'Gestión de residentes y directiva' : 'Tu perfil'}</p>

      {esDirectivo && (
        <div className="usuarios-toolbar">
          <input className="search-input" placeholder="Buscar por nombre, email o DNI..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <button className="btn btn-primary" onClick={() => {
            setForm({ nombre:'', apellido:'', dni:'', email:'', telefono:'', password:'', rolId:'', departamentoId:'' })
            setModal('crear'); setMsg(''); setError('')
          }}>Nuevo usuario</button>
        </div>
      )}

      {error && <div className="alert-error">{error}</div>}

      <div className="usuarios-list">
        {filtrados.length === 0 && <div className="empty-state glass">No se encontraron usuarios.</div>}
        {filtrados.map(u => (
          <div key={u.id} className={`usuario-card glass ${u.estado === 'INACTIVO' ? 'card-inactive' : ''}`}>
            <div className="user-avatar">{u.nombre[0]}{u.apellido[0]}</div>
            <div className="user-info">
              <p className="user-name">{u.nombre} {u.apellido}</p>
              <p className="user-email">{u.email}</p>
              {u.departamentos?.length > 0 && (
                <div className="user-deptos">
                  {u.departamentos.map((d,i) => (
                    <span key={i} className="badge badge-depto">Depto {d.numero} · {d.tipo}</span>
                  ))}
                </div>
              )}
              <div className="user-tags">
                <span className={`badge ${u.estado === 'ACTIVO' ? 'badge-active' : 'badge-inactive'}`}>{u.estado}</span>
                {u.roles?.map(r => (
                  <span key={r.asignacionId} className="badge badge-role">
                    {r.nombre}
                    {esDirectivo && <button className="tag-remove" onClick={() => revocarRol(u.id, r.rolId)}>×</button>}
                  </span>
                ))}
              </div>
              {esDirectivo && u.permisosExtra?.length > 0 && (
                <div className="permisos-extra">
                  <span className="permisos-label">Permisos extra:</span>
                  {u.permisosExtra.map(p => (
                    <span key={p.asignacionId} className="badge badge-permiso">
                      {p.modulo} — {p.permiso}
                      <button className="tag-remove" onClick={() => revocarPermiso(p.asignacionId)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="user-actions">
              {(esDirectivo || u.id === user?.id) && (
                <button className="btn btn-ghost btn-sm" onClick={() => abrirEditar(u)}>Editar</button>
              )}
              {esDirectivo && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => {
                    setSelected(u); setForm({ rolId: '' }); setModal('rol'); setMsg(''); setError('')
                  }}>Asignar rol</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => {
                    setSelected(u); setForm({ moduloId:'', permisoId:'' }); setModal('permiso'); setMsg(''); setError('')
                  }}>Dar permiso</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => restablecerPermisos(u)}>Restablecer permisos</button>
                  {u.estado === 'ACTIVO'
                    ? <button className="btn btn-danger btn-sm" onClick={() => desactivar(u)}>Desactivar</button>
                    : <button className="btn btn-ghost btn-sm" onClick={() => reactivar(u)}>Reactivar</button>
                  }
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL EDITAR */}
      {modal === 'editar' && (
        <div className="modal-overlay">
          <div className="modal-box glass">
            <h3 className="modal-title">Editar usuario</h3>
            <div className="modal-scroll">
              <div className="modal-form">
                {[['nombre','Nombre'],['apellido','Apellido'],['dni','DNI'],['telefono','Teléfono'],['email','Email']].map(([k,l]) => (
                  <div className="form-group" key={k}>
                    <label>{l}</label>
                    <input value={form[k]||''} onChange={e => setForm({...form,[k]:e.target.value})} />
                  </div>
                ))}
                <div className="form-group">
                  <label>Nueva contraseña <span className="label-hint">(dejar en blanco para no cambiar)</span></label>
                  <input type="password" value={form.nuevaPassword||''} onChange={e => setForm({...form, nuevaPassword: e.target.value})} placeholder="••••••••" />
                </div>
              </div>
            </div>
            {msg   && <p className="modal-success">{msg}</p>}
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarEdicion}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR */}
      {modal === 'crear' && (
        <div className="modal-overlay">
          <div className="modal-box glass">
            <h3 className="modal-title">Nuevo usuario</h3>
            <div className="modal-scroll">
              <div className="modal-form">
                {[['nombre','Nombre'],['apellido','Apellido'],['dni','DNI'],['email','Email'],['telefono','Teléfono']].map(([k,l]) => (
                  <div className="form-group" key={k}>
                    <label>{l}</label>
                    <input value={form[k]||''} onChange={e => setForm({...form,[k]:e.target.value})} />
                  </div>
                ))}
                <div className="form-group">
                  <label>Contraseña</label>
                  <input type="password" value={form.password||''} onChange={e => setForm({...form, password: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Rol inicial</label>
                  <select value={form.rolId||''} onChange={e => setForm({...form, rolId: e.target.value})}>
                    <option value="">Sin rol</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Departamento <span className="label-hint">(opcional)</span></label>
                  <select value={form.departamentoId||''} onChange={e => setForm({...form, departamentoId: e.target.value})}>
                    <option value="">Sin departamento</option>
                    {deptos.sort((a,b) => a.numero.localeCompare(b.numero)).map(d => (
                      <option key={d.id} value={d.id}>
                        {d.numero} — Piso {d.piso} {d.propietarioNombre ? `(${d.propietarioNombre})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {msg   && <p className="modal-success">{msg}</p>}
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarNuevo}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ROL */}
      {modal === 'rol' && (
        <div className="modal-overlay">
          <div className="modal-box glass">
            <h3 className="modal-title">Asignar rol</h3>
            <p className="modal-sub">Usuario: <strong>{selected?.nombre} {selected?.apellido}</strong></p>
            <p className="modal-warning">Al asignar un rol se eliminarán los permisos extra actuales.</p>
            <div className="form-group" style={{marginTop:16}}>
              <label>Rol</label>
              <select value={form.rolId||''} onChange={e => setForm({...form, rolId: e.target.value})}>
                <option value="">Selecciona un rol</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            {msg   && <p className="modal-success">{msg}</p>}
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarRol} disabled={!form.rolId}>Asignar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERMISO */}
      {modal === 'permiso' && (
        <div className="modal-overlay">
          <div className="modal-box glass">
            <h3 className="modal-title">Dar permiso extra</h3>
            <p className="modal-sub">Usuario: <strong>{selected?.nombre} {selected?.apellido}</strong></p>
            <div className="modal-form" style={{marginTop:16}}>
              <div className="form-group">
                <label>Módulo</label>
                <select value={form.moduloId||''} onChange={e => setForm({...form, moduloId: e.target.value})}>
                  <option value="">Selecciona un módulo</option>
                  {modulos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo de permiso</label>
                <select value={form.permisoId||''} onChange={e => setForm({...form, permisoId: e.target.value})}>
                  <option value="">Selecciona un permiso</option>
                  {permisos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            </div>
            {msg   && <p className="modal-success">{msg}</p>}
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarPermiso} disabled={!form.moduloId||!form.permisoId}>Dar permiso</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
