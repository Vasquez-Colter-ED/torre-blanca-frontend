import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { soloLetras, soloNumeros, esEmailValido } from '../utils/validaciones'
import './Perfil.css'

export default function Perfil() {
  const { user } = useAuth()
  const [datos,        setDatos]        = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [editando,     setEditando]     = useState(false)
  const [cambioPass,   setCambioPass]   = useState(false)
  const [form,         setForm]         = useState({})
  const [passForm,     setPassForm]     = useState({ actual: '', nueva: '', confirma: '' })
  const [showActual,   setShowActual]   = useState(false)
  const [showNueva,    setShowNueva]    = useState(false)
  const [showConfirma, setShowConfirma] = useState(false)
  const [msg,          setMsg]          = useState('')
  const [error,        setError]        = useState('')
  const [saving,       setSaving]       = useState(false)

  useEffect(() => { cargarPerfil() }, [])

  const cargarPerfil = async () => {
    setLoading(true)
    try {
      const r = await api.get('/api/usuarios/' + user.id)
      setDatos(r.data)
      setForm({
        nombre:   r.data.nombre,
        apellido: r.data.apellido,
        telefono: r.data.telefono || '',
        email:    r.data.email,
      })
    } catch { setError('No se pudo cargar el perfil') }
    finally { setLoading(false) }
  }

  const iniciales = datos
    ? datos.nombre[0].toUpperCase() + datos.apellido[0].toUpperCase()
    : '?'

  const guardarDatos = async () => {
    if (!esEmailValido(form.email)) { setError('El formato del email no es válido'); return }
    setSaving(true); setError(''); setMsg('')
    try {
      await api.put('/api/usuarios/' + user.id, form)
      setMsg('Datos actualizados correctamente')
      setEditando(false)
      cargarPerfil()
    } catch (e) { setError(e.response?.data || 'Error al guardar') }
    finally { setSaving(false) }
  }

  const guardarPassword = async () => {
    if (!passForm.actual) { setError('Ingresa tu contraseña actual'); return }
    if (passForm.nueva.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres'); return }
    if (passForm.nueva !== passForm.confirma) { setError('Las contraseñas no coinciden'); return }
    setSaving(true); setError(''); setMsg('')
    try {
      await api.put('/api/usuarios/' + user.id, {
        passwordActual: passForm.actual,
        nuevaPassword:  passForm.nueva,
      })
      setMsg('Contraseña actualizada correctamente')
      setCambioPass(false)
      setPassForm({ actual: '', nueva: '', confirma: '' })
    } catch (e) { setError(e.response?.data || 'Contraseña actual incorrecta') }
    finally { setSaving(false) }
  }

  const cancelarEdicion = () => {
    setEditando(false); setError(''); setMsg('')
    setForm({ nombre: datos.nombre, apellido: datos.apellido, telefono: datos.telefono || '', email: datos.email })
  }

  const cancelarPassword = () => {
    setCambioPass(false); setError(''); setMsg('')
    setPassForm({ actual: '', nueva: '', confirma: '' })
  }

  if (loading) return <div className="perfil-loading">Cargando perfil...</div>

  return (
    <div className="perfil-page">
      <div className="perfil-header">
        <h1 className="perfil-titulo">Mi perfil</h1>
        <p className="perfil-subtitulo">Gestiona tu información personal y seguridad</p>
      </div>

      <div className="perfil-grid">
        {/* Columna izquierda */}
        <div className="perfil-card perfil-identidad">
          <div className="perfil-avatar">{iniciales}</div>
          <h2 className="perfil-nombre">{datos?.nombre} {datos?.apellido}</h2>
          <p className="perfil-email-display">{datos?.email}</p>
          {datos?.departamentos?.length > 0 && (
            <div className="perfil-deptos">
              {datos.departamentos.map((d, i) => (
                <div key={i} className="perfil-depto-badge">
                  <span className="depto-icono">🏠</span>
                  <div>
                    <p className="depto-numero">Depto {d.numero}</p>
                    <p className="depto-tipo">{d.tipo === 'PROPIETARIO' ? 'Propietario' : 'Inquilino'} · Piso {d.piso}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {datos?.roles?.length > 0 && (
            <div className="perfil-roles">
              {datos.roles.map((r, i) => (
                <span key={i} className="perfil-rol-badge">{r.nombre}</span>
              ))}
            </div>
          )}
          <div className="perfil-estado-badge">● Cuenta activa</div>
        </div>

        {/* Columna derecha */}
        <div className="perfil-derecha">
          {msg   && <div className="perfil-alert perfil-alert-success">{msg}</div>}
          {error && <div className="perfil-alert perfil-alert-error">{error}</div>}

          {/* Datos personales */}
          <div className="perfil-card">
            <div className="perfil-seccion-header">
              <div>
                <h3 className="perfil-seccion-titulo">Datos personales</h3>
                <p className="perfil-seccion-sub">Actualiza tu información de contacto</p>
              </div>
              {!editando && (
                <button className="btn-perfil-editar" onClick={() => { setEditando(true); setMsg(''); setError('') }}>
                  Editar
                </button>
              )}
            </div>
            <div className="perfil-campos">
              <div className="perfil-campo">
                <label className="perfil-campo-label">Nombre</label>
                {editando
                  ? <input className="perfil-input" value={form.nombre} onChange={e => setForm({...form, nombre: soloLetras(e.target.value)})} />
                  : <p className="perfil-campo-valor">{datos?.nombre}</p>}
              </div>
              <div className="perfil-campo">
                <label className="perfil-campo-label">Apellido</label>
                {editando
                  ? <input className="perfil-input" value={form.apellido} onChange={e => setForm({...form, apellido: soloLetras(e.target.value)})} />
                  : <p className="perfil-campo-valor">{datos?.apellido}</p>}
              </div>
              <div className="perfil-campo">
                <label className="perfil-campo-label">DNI <span className="perfil-readonly-badge">Solo lectura</span></label>
                <p className="perfil-campo-valor perfil-campo-readonly">{datos?.dni || '—'}</p>
              </div>
              <div className="perfil-campo">
                <label className="perfil-campo-label">Teléfono</label>
                {editando
                  ? <input className="perfil-input" value={form.telefono} inputMode="numeric" onChange={e => setForm({...form, telefono: soloNumeros(e.target.value).slice(0,9)})} placeholder="987654321" />
                  : <p className="perfil-campo-valor">{datos?.telefono || '—'}</p>}
              </div>
              <div className="perfil-campo perfil-campo-full">
                <label className="perfil-campo-label">Correo electrónico</label>
                {editando
                  ? <input className="perfil-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  : <p className="perfil-campo-valor">{datos?.email}</p>}
              </div>
            </div>
            {editando && (
              <div className="perfil-acciones">
                <button className="btn-perfil-cancelar" onClick={cancelarEdicion}>Cancelar</button>
                <button className="btn-perfil-guardar" onClick={guardarDatos} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            )}
          </div>

          {/* Seguridad */}
          <div className="perfil-card">
            <div className="perfil-seccion-header">
              <div>
                <h3 className="perfil-seccion-titulo">Seguridad</h3>
                <p className="perfil-seccion-sub">Administra tu contraseña de acceso</p>
              </div>
              {!cambioPass && (
                <button className="btn-perfil-editar" onClick={() => { setCambioPass(true); setMsg(''); setError('') }}>
                  Cambiar contraseña
                </button>
              )}
            </div>
            {!cambioPass
              ? <p className="perfil-pass-hint">••••••••••••  <span className="perfil-pass-sub">Protege tu cuenta con una contraseña segura</span></p>
              : (
                <div className="perfil-campos">
                  {[
                    { key: 'actual',   label: 'Contraseña actual',   show: showActual,   setShow: setShowActual },
                    { key: 'nueva',    label: 'Nueva contraseña',     show: showNueva,    setShow: setShowNueva },
                    { key: 'confirma', label: 'Confirmar contraseña', show: showConfirma, setShow: setShowConfirma },
                  ].map(({ key, label, show, setShow }) => (
                    <div className="perfil-campo perfil-campo-full" key={key}>
                      <label className="perfil-campo-label">{label}</label>
                      <div className="perfil-pass-wrap">
                        <input className="perfil-input" type={show ? 'text' : 'password'}
                          value={passForm[key]} onChange={e => setPassForm({...passForm, [key]: e.target.value})} />
                        <button type="button" className="perfil-pass-toggle" onClick={() => setShow(!show)}>
                          {show ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="perfil-acciones perfil-campo-full">
                    <button className="btn-perfil-cancelar" onClick={cancelarPassword}>Cancelar</button>
                    <button className="btn-perfil-guardar" onClick={guardarPassword} disabled={saving}>
                      {saving ? 'Guardando...' : 'Actualizar contraseña'}
                    </button>
                  </div>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  )
}
