import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function StatCard({ titulo, valor, subtitulo, icono, color }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{titulo}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{valor}</p>
          {subtitulo && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitulo}</p>}
        </div>
        <div className={`text-3xl`}>{icono}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ empleados: 0, asistenciasHoy: 0, incidenciasHoy: 0, completos: 0 })
  const [asistenciasRecientes, setAsistenciasRecientes] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    cargarStats()
  }, [])

  const cargarStats = async () => {
    try {
      const [empResp, asistResp] = await Promise.all([
        api.get('/empleados/'),
        api.get('/asistencias/hoy')
      ])
      const empleados = empResp.data
      const asistencias = asistResp.data
      const completos = asistencias.filter(a => a.estado === 'completo').length

      setStats({
        empleados: empleados.length,
        asistenciasHoy: asistencias.length,
        completos,
        incompletos: asistencias.length - completos
      })
      setAsistenciasRecientes(asistencias.slice(0, 5))
    } catch (err) {
      console.error(err)
    }
  }

  const formatearHora = (hora) => {
    if (!hora) return '—'
    return String(hora).slice(0, 5)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          titulo="Total Empleados"
          valor={stats.empleados}
          subtitulo="Activos en el sistema"
          icono="👥"
          color="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          titulo="Asistencias Hoy"
          valor={stats.asistenciasHoy}
          subtitulo="Registros del día"
          icono="📋"
          color="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          titulo="Jornadas Completas"
          valor={stats.completos}
          subtitulo="Con salida registrada"
          icono="✅"
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          titulo="Jornadas Incompletas"
          valor={stats.incompletos}
          subtitulo="Sin salida aún"
          icono="⚠️"
          color="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Tabla de asistencias recientes */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Asistencias de hoy</h2>
          <button
            onClick={() => navigate('/asistencias')}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Ver todas →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-3 font-medium">Empleado</th>
                <th className="px-6 py-3 font-medium">Entrada</th>
                <th className="px-6 py-3 font-medium">Salida</th>
                <th className="px-6 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {asistenciasRecientes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">
                    No hay registros hoy
                  </td>
                </tr>
              ) : (
                asistenciasRecientes.map((a) => (
                  <tr key={a.id_asistencia} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                      {a.nombres} {a.apellidos}
                    </td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{formatearHora(a.hora_entrada)}</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{formatearHora(a.hora_salida)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        a.estado === 'completo'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {a.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}