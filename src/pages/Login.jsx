import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Login.css'

// Elige el logo según el mes actual. Si el logo festivo de ese mes
// todavía no se diseñó (o el archivo no existe en /public), el <img>
// cae automáticamente a logo-base.png mediante el onError del tag.
const getLogoFestivo = () => {
  const mes = new Date().getMonth() + 1
  if (mes === 1)  return '/logo-añonuevo.png'
  if (mes === 7)  return '/logo-fiestas-patrias.png'
  if (mes === 10) return '/logo-halloween.png'
  if (mes === 12) return '/logo-navidad.png'
  return '/logo-base.png'
}

// Clave de localStorage para "Recuérdame". La contraseña se guarda
// ofuscada con base64 (no es cifrado real, solo evita que quede
// legible a simple vista en las devtools).
const RECORDAR_KEY = 'tb_recordar'

export default function Login() {
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPass,     setShowPass]     = useState(false)
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [recordar,     setRecordar]     = useState(false)
  const [logoSrc,      setLogoSrc]      = useState(getLogoFestivo())

  // Flujo de recuperación
  const [paso,         setPaso]         = useState(0) // 0=login, 1=email, 2=código, 3=nueva pass
  const [emailReset,   setEmailReset]   = useState('')
  const [digitos,      setDigitos]      = useState(['','','','','',''])
  const [nuevaPass,    setNuevaPass]    = useState('')
  const [confirmaPass, setConfirmaPass] = useState('')
  const [showNueva,    setShowNueva]    = useState(false)
  const [showConfirma, setShowConfirma] = useState(false)
  const [msgExito,     setMsgExito]     = useState('')
  const digitRefs     = useRef([])
  const { login, sesionExpirada, sesionExpiradaMsg } = useAuth()
  const navigate = useNavigate()

  // Al montar: si había credenciales guardadas por "Recuérdame", las precarga
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(RECORDAR_KEY)
      if (guardado) {
        const { email: e, password: p } = JSON.parse(guardado)
        setEmail(e || '')
        setPassword(p ? atob(p) : '')
        setRecordar(true)
      }
    } catch { /* si el JSON guardado es inválido, se ignora */ }
  }, [])

  const resetRecuperacion = () => {
    setPaso(0); setEmailReset(''); setDigitos(['','','','','',''])
    setNuevaPass(''); setConfirmaPass(''); setError(''); setMsgExito('')
  }

  // ── Login ─────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await api.post('/api/auth/login', { email, password })
      login(res.data)

      // Guarda o borra las credenciales según el checkbox "Recuérdame"
      if (recordar) {
        localStorage.setItem(RECORDAR_KEY, JSON.stringify({ email, password: btoa(password) }))
      } else {
        localStorage.removeItem(RECORDAR_KEY)
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data || 'Correo o contraseña incorrectos.')
    } finally { setLoading(false) }
  }

  // ── Paso 1: enviar código ─────────────────────────────────────────
  const handleEnviarCodigo = async (e) => {
    e.preventDefault()
    if (!emailReset.trim()) { setError('Ingresa tu correo electrónico'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/api/auth/recuperar-password', { email: emailReset })
      if (res.data?.exito === false) {
        setError('No encontramos una cuenta con ese correo. Verifica que sea el correo con el que te registraste.')
      } else {
        setPaso(2)
      }
    } catch (err) {
      setError('No encontramos una cuenta con ese correo. Verifica que sea el correo con el que te registraste.')
    } finally { setLoading(false) }
  }

  // ── Paso 2: manejo de cajitas de dígitos ─────────────────────────
  const handleDigito = (index, valor) => {
    const solo = valor.replace(/\D/g, '').slice(-1)
    const nuevos = [...digitos]
    nuevos[index] = solo
    setDigitos(nuevos)
    // Auto-avanza al siguiente campo
    if (solo && index < 5) digitRefs.current[index + 1]?.focus()
  }

  const handleDigitoKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digitos[index] && index > 0) {
      digitRefs.current[index - 1]?.focus()
    }
  }

  const handlePegar = (e) => {
    e.preventDefault()
    const pegado = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const nuevos = ['','','','','','']
    for (let i = 0; i < pegado.length; i++) nuevos[i] = pegado[i]
    setDigitos(nuevos)
    digitRefs.current[Math.min(pegado.length, 5)]?.focus()
  }

  const handleVerificarCodigo = async (e) => {
    e.preventDefault()
    const codigo = digitos.join('')
    if (codigo.length < 6) { setError('Ingresa los 6 dígitos del código.'); return }
    setLoading(true); setError('')
    try {
      await api.post('/api/auth/verificar-codigo', { email: emailReset, codigo })
      setPaso(3)
    } catch (err) {
      setError(err.response?.data || 'Código incorrecto.')
    } finally { setLoading(false) }
  }

  // ── Paso 3: nueva contraseña ──────────────────────────────────────
  const handleNuevaPassword = async (e) => {
    e.preventDefault()
    if (nuevaPass !== confirmaPass) { setError('Las contraseñas no coinciden.'); return }
    if (nuevaPass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true); setError('')
    try {
      await api.post('/api/auth/nueva-password', { email: emailReset, nuevaPassword: nuevaPass })
      setMsgExito('¡Contraseña restablecida! Ya puedes iniciar sesión.')
      setTimeout(resetRecuperacion, 2500)
    } catch (err) {
      setError(err.response?.data || 'No se pudo restablecer la contraseña.')
    } finally { setLoading(false) }
  }

  // ── Renderizado ───────────────────────────────────────────────────
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
            <img
              src={logoSrc}
              alt="Torre Blanca"
              className="login-brand-logo"
              onError={() => setLogoSrc('/logo-base.png')}
            />
            <h1 className="login-title">
              {paso === 0 && 'Bienvenido'}
              {paso === 1 && 'Recuperar contraseña'}
              {paso === 2 && 'Ingresa el código'}
              {paso === 3 && 'Nueva contraseña'}
            </h1>
            <p className="login-subtitle">
              {paso === 0 && 'Ingresa a tu cuenta para continuar'}
              {paso === 1 && 'Te enviaremos un código a tu correo'}
              {paso === 2 && `Enviamos un código de 6 dígitos a ${emailReset}`}
              {paso === 3 && 'Crea una contraseña segura para tu cuenta'}
            </p>
          </div>

          {/* Barra de progreso — pasos 1, 2, 3 */}
          {paso > 0 && (
            <div className="recovery-progress">
              {[1,2,3].map(n => (
                <div key={n} className={`progress-step ${paso >= n ? 'progress-step-active' : ''} ${paso > n ? 'progress-step-done' : ''}`}>
                  <div className="progress-dot">
                    {paso > n ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : n}
                  </div>
                  {n < 3 && <div className={`progress-line ${paso > n ? 'progress-line-done' : ''}`} />}
                </div>
              ))}
            </div>
          )}

          {sesionExpirada && paso === 0 && (
            <div className="login-alert login-alert-warning">
              {sesionExpiradaMsg || 'Tu sesión fue cerrada porque iniciaste sesión desde otro dispositivo.'}
            </div>
          )}

          {/* ── PASO 0: Login ── */}
          {paso === 0 && (
            <form onSubmit={handleLogin} className="login-form" noValidate>
              <div className="field-group">
                <label htmlFor="email" className="field-label">Correo electrónico o DNI</label>
                <input id="email" type="text" className="field-input"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com o 12345678" autoComplete="username" required />
              </div>

              <div className="field-group">
                <label htmlFor="password" className="field-label">Contraseña</label>
                <div className="field-password-wrap">
                  <input id="password" type={showPass ? 'text' : 'password'} className="field-input"
                    value={password} onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password" required />
                  <button type="button" className="btn-toggle-pass"
                    onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                    {showPass ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="login-remember-row">
                <label className="login-remember-check">
                  <input type="checkbox" checked={recordar} onChange={e => setRecordar(e.target.checked)} />
                  <span>Recuérdame</span>
                </label>
                <button type="button" className="link-olvide"
                  onClick={() => { setPaso(1); setError('') }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {error && <div className="login-alert login-alert-error">{error}</div>}

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? <LoadingBtn texto="Ingresando..." /> : 'Ingresar al sistema'}
              </button>
            </form>
          )}

          {/* ── PASO 1: Ingresar email ── */}
          {paso === 1 && (
            <form onSubmit={handleEnviarCodigo} className="login-form" noValidate>
              <div className="field-group">
                <label className="field-label">Correo electrónico</label>
                <input type="email" className="field-input"
                  value={emailReset} onChange={e => setEmailReset(e.target.value)}
                  placeholder="correo@ejemplo.com" autoComplete="email" required />
              </div>

              {error && <div className="login-alert login-alert-error">{error}</div>}

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? <LoadingBtn texto="Enviando..." /> : 'Enviar código'}
              </button>
              <button type="button" className="btn-back" onClick={resetRecuperacion}>
                ← Volver al inicio de sesión
              </button>
            </form>
          )}

          {/* ── PASO 2: Cajitas de código ── */}
          {paso === 2 && (
            <form onSubmit={handleVerificarCodigo} className="login-form" noValidate>
              <div className="digit-boxes">
                {digitos.map((d, i) => (
                  <input
                    key={i}
                    ref={el => digitRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`digit-box ${d ? 'digit-box-filled' : ''}`}
                    value={d}
                    onChange={e => handleDigito(i, e.target.value)}
                    onKeyDown={e => handleDigitoKeyDown(i, e)}
                    onPaste={i === 0 ? handlePegar : undefined}
                  />
                ))}
              </div>
              <p className="digit-hint">
                Revisa la bandeja de <strong>{emailReset}</strong>.<br />
                Asegúrate que ese correo esté registrado en el sistema.{' '}
                <button type="button" className="link-olvide" onClick={() => { setPaso(1); setDigitos(['','','','','','']); setError('') }}>
                  Cambiar correo
                </button>
              </p>

              {error && <div className="login-alert login-alert-error">{error}</div>}

              <button type="submit" className="btn-login" disabled={loading || digitos.join('').length < 6}>
                {loading ? <LoadingBtn texto="Verificando..." /> : 'Verificar código'}
              </button>
              <button type="button" className="btn-back" onClick={resetRecuperacion}>
                ← Volver al inicio de sesión
              </button>
            </form>
          )}

          {/* ── PASO 3: Nueva contraseña ── */}
          {paso === 3 && (
            <form onSubmit={handleNuevaPassword} className="login-form" noValidate>
              {msgExito ? (
                <div className="login-alert login-alert-success login-success-final">
                  <div className="login-success-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  {msgExito}
                </div>
              ) : (
                <>
                  <div className="field-group">
                    <label className="field-label">Nueva contraseña</label>
                    <div className="field-password-wrap">
                      <input type={showNueva ? 'text' : 'password'} className="field-input"
                        value={nuevaPass} onChange={e => setNuevaPass(e.target.value)} required />
                      <button type="button" className="btn-toggle-pass"
                        onClick={() => setShowNueva(!showNueva)} tabIndex={-1}>
                        {showNueva ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Repite la contraseña</label>
                    <div className="field-password-wrap">
                      <input type={showConfirma ? 'text' : 'password'} className="field-input"
                        value={confirmaPass} onChange={e => setConfirmaPass(e.target.value)} required />
                      <button type="button" className="btn-toggle-pass"
                        onClick={() => setShowConfirma(!showConfirma)} tabIndex={-1}>
                        {showConfirma ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {error && <div className="login-alert login-alert-error">{error}</div>}

                  <button type="submit" className="btn-login" disabled={loading}>
                    {loading ? <LoadingBtn texto="Restableciendo..." /> : 'Restablecer contraseña'}
                  </button>
                  <button type="button" className="btn-back" onClick={resetRecuperacion}>
                    ← Volver al inicio de sesión
                  </button>
                </>
              )}
            </form>
          )}

          <p className="login-footer">Residencial Torre Blanca · Chiclayo, Perú</p>
        </div>
      </div>
    </div>
  )
}

// ── Componentes auxiliares ────────────────────────────────────────
function LoadingBtn({ texto }) {
  return <span className="btn-login-loading"><span className="spinner" />{texto}</span>
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}
