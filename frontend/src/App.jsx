import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Empleados from './pages/Empleados'
import Horarios from './pages/Horarios'
import Asistencias from './pages/Asistencias'
import Reportes from './pages/Reportes'
import Reconocimiento from './pages/Reconocimiento'
import Dashboard from './pages/Dashboard'
import Quiosco from './pages/Quiosco'

function RutaProtegida({ children }) {
  const { token } = useAuth()
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/empleados" element={<RutaProtegida><Empleados /></RutaProtegida>} />
          <Route path="/horarios" element={<RutaProtegida><Horarios /></RutaProtegida>} />
          <Route path="/asistencias" element={<RutaProtegida><Asistencias /></RutaProtegida>} />
          <Route path="/reportes" element={<RutaProtegida><Reportes /></RutaProtegida>} />
          <Route path="/reconocimiento" element={<RutaProtegida><Reconocimiento /></RutaProtegida>} />
          <Route path="*" element={<Navigate to="/login" />} />
          <Route path="/dashboard" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
          <Route path="/quiosco" element={<Quiosco />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App