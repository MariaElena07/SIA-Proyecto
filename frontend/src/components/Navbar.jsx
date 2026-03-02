import { useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <span className="navbar-brand fw-bold">SIA</span>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/empleados">Empleados</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/horarios">Horarios</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/asistencias">Asistencias</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/reportes">Reportes</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/reconocimiento">Reconocimiento</NavLink>
            </li>
          </ul>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  )
}