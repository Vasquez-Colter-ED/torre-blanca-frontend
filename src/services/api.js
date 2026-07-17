import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://torre-blanca-backend.onrender.com'

const api = axios.create({ baseURL: API_URL })

// Adjunta el token JWT a cada request automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tb_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el backend responde 401 (token inválido o sesión invalidada por
// otro login), dispara un evento global que AuthContext escucha para
// mostrar el aviso y redirigir al login.
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const mensaje = typeof err.response?.data === 'string' ? err.response.data : ''
      localStorage.removeItem('tb_token')
      localStorage.removeItem('tb_user')
      window.dispatchEvent(new CustomEvent('tb:sesion-invalida', { detail: { mensaje } }))
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
