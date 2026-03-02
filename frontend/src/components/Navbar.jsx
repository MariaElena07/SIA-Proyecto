import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const menuItems = [
  { to: '/dashboard', icon: <i className="fi fi-rs-home"></i>, label: 'Dashboard' },
  { to: '/empleados', icon: <i className="fi fi-rs-users"></i>, label: 'Empleados' },
  { to: '/horarios', icon: <i className="fi fi-rs-clock"></i>, label: 'Horarios' },
  { to: '/asistencias', icon: <i className="fi fi-rs-calendar-check"></i>, label: 'Asistencias' },
  { to: '/reportes', icon: <i className="fi fi-rs-chart-histogram"></i>, label: 'Reportes' },
  { to: '/reconocimiento', icon: <i className="fi fi-rs-camera"></i>, label: 'Reconocimiento' },
  { to: '/quiosco', icon: <i className="fi fi-rs-computer"></i>, label: 'Quiosco' },
]

export default function Sidebar() {
  const { logout } = useAuth()
  const { dark, toggleTema } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">SIA</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Control de Asistencia</p>
          </div>
        </div>
      </div>

      {/* Menú */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <span className="text-base w-5 flex items-center justify-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer del sidebar */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
        {/* Toggle dark mode */}
        <button
          onClick={toggleTema}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-base">{dark ? '☀️' : '🌙'}</span>
          {dark ? 'Modo claro' : 'Modo oscuro'}
        </button>

        {/* Cerrar sesión */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <span className="text-base w-5 flex items-center justify-center">🚪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}