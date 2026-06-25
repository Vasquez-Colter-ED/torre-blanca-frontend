import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { soloLetras, soloNumeros, esEmailValido } from '../utils/validaciones'
import './Perfil.css'

function IconBuilding() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18"/><path d="M9 3v18"/>
    </svg>
  )
}

function IconEye({ off }) {
  if (off) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function IconLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

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
      setForm({ nombre: r.data.nombre, apellido: r.data.apellido, telefono: r.data.telefono || '', email: r.data.email })
    } catch { setError('No se pudo cargar el perfil') }
    finally { setLoading(false) }
  }

  const iniciales = datos ? datos.nombre[0].toUpperCase() + datos.apellido[0].toUpperCase() : '?'

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
    if (passForm.nueva.length < 6) { setError('Mínimo 6 caracteres'); return }
    if (passForm.nueva !== passForm.confirma) { setError('Las contraseñas no coinciden'); return }
    setSaving(true); setError(''); setMsg('')
    try {
      await api.put('/api/usuarios/' + user.id, { passwordActual: passForm.actual, nuevaPassword: passForm.nueva })
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

  if (loading) return (
    <div className="perfil-skeleton">
      <div className="skeleton-left" />
      <div className="skeleton-right"><div className="skeleton-card" /><div className="skeleton-card" /></div>
    </div>
  )

  return (
    <div className="perfil-page">
      <div className="perfil-breadcrumb">Mi perfil</div>
      <div className="perfil-hero">
        <div className="perfil-hero-left">
          <div className="perfil-avatar-wrap">
            <div className="perfil-avatar">{iniciales}</div>
            <span className="perfil-status-dot" />
          </div>
          <div>
            <h1 className="perfil-nombre-hero">{datos?.nombre} {datos?.apellido}</h1>
            <p className="perfil-email-hero">{datos?.email}</p>
            {datos?.roles?.length > 0 && (
              <div className="perfil-roles-hero">
                {datos.roles.map((r, i) => <span key={i} className="perfil-rol-chip">{r.nombre}</span>)}
              </div>
            )}
          </div>
        </div>
        {datos?.departamentos?.length > 0 && (
          <div className="perfil-deptos-hero">
            {datos.departamentos.map((d, i) => (
              <div key={i} className="perfil-depto-chip">
                <span className="depto-chip-icon"><IconBuilding /></span>
                <div>
                  <span className="depto-chip-num">Depto {d.numero}</span>
                  <span className="depto-chip-tipo">{d.tipo === 'PROPIETARIO' ? 'Propietario' : 'Inquilino'} · Piso {d.piso}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {msg   && <div className="perfil-alert perfil-alert-success"><IconCheck /> {msg}</div>}
      {error && <div className="perfil-alert perfil-alert-error">{error}</div>}

      <div className="perfil-grid">

        {/* Datos personales */}
        <div className="perfil-card">
          <div className="perfil-card-header">
            <div>
              <h2 className="perfil-card-titulo">Información personal</h2>
              <p className="perfil-card-sub">Nombre, contacto y documento de identidad</p>
            </div>
            {!editando && (
              <button className="btn-editar" onClick={() => { setEditando(true); setMsg(''); setError('') }}>
                Editar
              </button>
            )}
          </div>

          <div className="perfil-campos">
            {[
              { key: 'nombre',   label: 'Nombre',    editable: true,  tipo: 'text',  change: v => soloLetras(v) },
              { key: 'apellido', label: 'Apellido',  editable: true,  tipo: 'text',  change: v => soloLetras(v) },
              { key: 'telefono', label: 'Teléfono',  editable: true,  tipo: 'text',  change: v => soloNumeros(v).slice(0,9), placeholder: '987654321' },
              { key: 'email',    label: 'Correo electrónico', editable: true, tipo: 'email', change: v => v },
            ].map(({ key, label, editable, tipo, change, placeholder }) => (
              <div className="perfil-campo" key={key}>
                <label className="perfil-campo-label">{label}</label>
                {editando && editable
                  ? <input className="perfil-input" type={tipo} value={form[key]} onChange={e => setForm({...form, [key]: change(e.target.value)})} placeholder={placeholder || ''} />
                  : <p className="perfil-campo-valor">{datos?.[key] || '—'}</p>
                }
              </div>
            ))}

            <div className="perfil-campo">
              <label className="perfil-campo-label">
                DNI
                <span className="perfil-lock-badge"><IconLock /> Solo lectura</span>
              </label>
              <p className="perfil-campo-valor perfil-valor-muted">{datos?.dni || '—'}</p>
            </div>
          </div>

          {editando && (
            <div className="perfil-acciones">
              <button className="btn-cancelar" onClick={cancelarEdicion}>Cancelar</button>
              <button className="btn-guardar" onClick={guardarDatos} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          )}
        </div>

        {/* Seguridad */}
        <div className="perfil-card">
          <div className="perfil-card-header">
            <div>
              <h2 className="perfil-card-titulo">Seguridad</h2>
              <p className="perfil-card-sub">Contraseña de acceso a tu cuenta</p>
            </div>
            {!cambioPass && (
              <button className="btn-editar" onClick={() => { setCambioPass(true); setMsg(''); setError('') }}>
                Cambiar contraseña
              </button>
            )}
          </div>

          {!cambioPass ? (
            <div className="perfil-pass-display">
              <div className="perfil-pass-dots">
                {[...Array(10)].map((_, i) => <span key={i} className="pass-dot" />)}
              </div>
              <p className="perfil-pass-hint-txt">Tu contraseña está protegida</p>
            </div>
          ) : (
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
                    <button type="button" className="btn-toggle-pass" onClick={() => setShow(!show)}>
                      <IconEye off={show} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="perfil-acciones perfil-campo-full">
                <button className="btn-cancelar" onClick={cancelarPassword}>Cancelar</button>
                <button className="btn-guardar" onClick={guardarPassword} disabled={saving}>
                  {saving ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
