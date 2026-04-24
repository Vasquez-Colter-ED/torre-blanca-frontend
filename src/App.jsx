import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout      from './components/Layout/Layout'
import Login       from './pages/Login'
import Dashboard   from './pages/Dashboard'
import Usuarios    from './pages/Usuarios'
import Departamentos from './pages/Departamentos'
import Pagos       from './pages/Pagos'
import Gastos      from './pages/Gastos'
import Boletas     from './pages/Boletas'
import Reportes    from './pages/Reportes'
import Fondo       from './pages/Fondo'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index         element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"    element={<Dashboard />} />
            <Route path="usuarios"     element={<Usuarios />} />
            <Route path="departamentos"element={<Departamentos />} />
            <Route path="pagos"        element={<Pagos />} />
            <Route path="gastos"       element={<Gastos />} />
            <Route path="boletas"      element={<Boletas />} />
            <Route path="reportes"     element={<Reportes />} />
            <Route path="fondo"        element={<Fondo />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
