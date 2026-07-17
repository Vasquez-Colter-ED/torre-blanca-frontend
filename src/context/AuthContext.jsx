import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [token,         setToken]         = useState(localStorage.getItem('tb_token'))
  const [user,          setUser]          = useState(JSON.parse(localStorage.getItem('tb_user') || 'null'))
  const [permisosExtra, setPermisosExtra] = useState([])
  const [sesionExpirada, setSesionExpirada] = useState(false)
  const [sesionExpiradaMsg, setSesionExpiradaMsg] = useState('')

  useEffect(() => {
    if (token) cargarPerfil()
    else setPermisosExtra([])
  }, [token])

  // Escucha el evento global que dispara api.js cuando recibe un 401.
  // Muestra el aviso de sesión cerrada (con el motivo real que mandó el
  // backend: otro dispositivo, inactividad, etc.) para que el usuario sepa qué pasó.
  useEffect(() => {
    const handleSesionInvalida = (e) => {
      setSesionExpirada(true)
      setSesionExpiradaMsg(e.detail?.mensaje || '')
      cerrarSesion()
    }
    window.addEventListener('tb:sesion-invalida', handleSesionInvalida)
    return () => window.removeEventListener('tb:sesion-invalida', handleSesionInvalida)
  }, [])

  const cargarPerfil = async () => {
    try {
      const res = await api.get('/api/auth/perfil')
      setPermisosExtra(res.data.permisosExtra || [])
    } catch {
      setPermisosExtra([])
    }
  }

  const login = (data) => {
    setSesionExpirada(false)
    setSesionExpiradaMsg('')
    localStorage.setItem('tb_token', data.token)
    localStorage.setItem('tb_user', JSON.stringify(data))
    setToken(data.token)
    setUser(data)
  }

  const cerrarSesion = () => {
    localStorage.removeItem('tb_token')
    localStorage.removeItem('tb_user')
    setToken(null)
    setUser(null)
    setPermisosExtra([])
  }

  const logout = () => {
    setSesionExpirada(false)
    setSesionExpiradaMsg('')
    cerrarSesion()
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, permisosExtra, sesionExpirada, sesionExpiradaMsg }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
