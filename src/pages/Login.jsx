import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Login.css'

export default function Login() {
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPass,     setShowPass]     = useState(false)
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [modalOlvide,  setModalOlvide]  = useState(false)
  const [emailReset,   setEmailReset]   = useState('')
  const [msgReset,     setMsgReset]     = useState('')
  const [loadingReset, setLoadingReset] = useState(false)
  const { login, sesionExpirada } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await api.post('/api/auth/login', { email, password })
      login(res.data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data || 'Correo o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  // Por ahora solo muestra confirmación visual — el envío real de email
  // se conectará cuando integremos el backend de recuperación de contraseña
  const handleRecuperar = async (e) => {
    e.preventDefault()
    if (!emailReset) { setMsgReset('Ingresa tu correo electrónico.'); return }
    setLoadingReset(true); setMsgReset('')
    try {
      await api.post('/api/auth/recuperar-password', { email: emailReset })
      setMsgReset('Si ese correo está registrado, recibirás un código en breve.')
    } catch {
      // Siempre mostramos el mismo mensaje por seguridad (no revelamos si el email existe)
      setMsgReset('Si ese correo está registrado, recibirás un código en breve.')
    } finally {
      setLoadingReset(false)
    }
  }

  return (
    <div className="login-root">
      {/* Panel izquierdo — imagen */}
      <div className="login-image-panel">
        <img src="/torre-blanca.jpg" alt="Residencial Torre Blanca" className="login-img" />
        <div className="login-img-overlay">
          <div className="login-img-content">
            <div className="login-img-badge">Administración Residencial</div>
            <h2 className="login-img-title">Torre Blanca</h2>
            <p className="login-img-sub">Chiclayo, Perú</p>
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="login-form-panel">
        <div className="login-form-inner">

          {/* Marca */}
          <div className="login-brand">
            <div className="login-brand-icon">TB</div>
            <h1 className="login-title">Bienvenido</h1>
            <p className="login-subtitle">Ingresa a tu cuenta para continuar</p>
          </div>

          {/* Aviso sesión cerrada por otro dispositivo */}
          {sesionExpirada && (
            <div className="login-alert login-alert-warning">
              🔒 Tu sesión fue cerrada porque iniciaste sesión desde otro dispositivo.
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="login-form" noValidate>

            <div className="field-group">
              <label htmlFor="email" className="field-label">Correo electrónico</label>
              <input
                id="email"
                type="email"
                className="field-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="field-group">
              <div className="field-label-row">
                <label htmlFor="password" className="field-label">Contraseña</label>
                <button
                  type="button"
                  className="link-olvide"
                  onClick={() => { setModalOlvide(true); setMsgReset(''); setEmailReset('') }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="field-password-wrap">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="field-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-pass"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <div className="login-alert login-alert-error">{error}</div>}

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <span className="btn-login-loading">
                  <span className="spinner" /> Ingresando...
                </span>
              ) : 'Ingresar al sistema'}
            </button>
          </form>

          <p className="login-footer">Residencial Torre Blanca · Chiclayo, Perú</p>
        </div>
      </div>

      {/* Modal — Olvidé mi contraseña */}
      {modalOlvide && (
        <div className="modal-overlay" onClick={() => setModalOlvide(false)}>
          <div className="modal-recuperar" onClick={e => e.stopPropagation()}>
            <div className="modal-recuperar-header">
              <h3 className="modal-recuperar-title">Recuperar contraseña</h3>
              <button className="modal-recuperar-close" onClick={() => setModalOlvide(false)}>✕</button>
            </div>
            <p className="modal-recuperar-desc">
              Ingresa tu correo y te enviaremos un código único para restablecer tu contraseña.
            </p>
            <form onSubmit={handleRecuperar}>
              <div className="field-group">
                <label className="field-label">Correo electrónico</label>
                <input
                  type="email"
                  className="field-input"
                  value={emailReset}
                  onChange={e => setEmailReset(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
              {msgReset && (
                <div className="login-alert login-alert-success">{msgReset}</div>
              )}
              <div className="modal-recuperar-actions">
                <button type="button" className="btn-ghost" onClick={() => setModalOlvide(false)}>Cancelar</button>
                <button type="submit" className="btn-login" disabled={loadingReset}>
                  {loadingReset ? 'Enviando...' : 'Enviar código'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
