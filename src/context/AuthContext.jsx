import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [token,         setToken]         = useState(localStorage.getItem('tb_token'))
  const [user,          setUser]          = useState(JSON.parse(localStorage.getItem('tb_user') || 'null'))
  const [permisosExtra, setPermisosExtra] = useState([])

  // Cada vez que hay token, carga el perfil con los permisos extra
  useEffect(() => {
    if (token) cargarPerfil()
    else setPermisosExtra([])
  }, [token])

  const cargarPerfil = async () => {
    try {
      const res = await api.get('/api/auth/perfil')
      setPermisosExtra(res.data.permisosExtra || [])
    } catch {
      setPermisosExtra([])
    }
  }

  const login = (data) => {
    localStorage.setItem('tb_token', data.token)
    localStorage.setItem('tb_user', JSON.stringify(data))
    setToken(data.token)
    setUser(data)
  }

  const logout = () => {
    localStorage.removeItem('tb_token')
    localStorage.removeItem('tb_user')
    setToken(null)
    setUser(null)
    setPermisosExtra([])
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, permisosExtra }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
