import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL ||
  'https://torre-blanca-backend-production.up.railway.app'

const api = axios.create({ baseURL: API_URL })

// Adjunta el token JWT a cada request automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tb_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Si el token expiró, redirige al login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tb_token')
      localStorage.removeItem('tb_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
