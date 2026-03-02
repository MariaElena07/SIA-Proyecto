import { useState, useEffect } from 'react'
import api from '../services/api'

function Modal({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Asistencias() {
  const [empleados, setEmpleados] = useState([])
  const [asistenciasHoy, setAsistenciasHoy] = useState([])
  const [idSeleccionado, setIdSeleccionado] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('success')
  const [cargando, setCargando] = useState(false)
  const [modalRegistrar, setModalRegistrar] = useState(false)

  useEffect(() => {
    cargarEmpleados()
    cargarAsistenciasHoy()
  }, [])

  const cargarEmpleados = async () => {
    try {
      const r = await api.get('/empleados/')
      setEmpleados(r.data)
    } catch (err) { console.error(err) }
  }

  const cargarAsistenciasHoy = async () => {
    try {
      const r = await api.get('/asistencias/hoy')
      setAsistenciasHoy(r.data)
    } catch (err) { console.error(err) }
  }

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje(texto)
    setTipoMensaje(tipo)
    setTimeout(() => setMensaje(''), 4000)
  }

  const handleRegistrar = async (e) => {
    e.preventDefault()
    setCargando(true)
    try {
      const r = await api.post(`/asistencias/registrar/${idSeleccionado}`)
      mostrarMensaje(r.data.mensaje || 'Registro exitoso')
      setIdSeleccionado('')
      setModalRegistrar(false)
      cargarAsistenciasHoy()
    } catch (err) {
      mostrarMensaje('Error al registrar asistencia', 'error')
    } finally {
      setCargando(false)
    }
  }

  const formatearHora = (hora) => {
    if (!hora) return '—'
    return String(hora).slice(0, 5)
  }

  const completos = asistenciasHoy.filter(a => a.estado === 'completo').length
  const incompletos = asistenciasHoy.length - completos

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Asistencias</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => setModalRegistrar(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          + Registrar Asistencia
        </button>
      </div>

      {/* Alerta */}
      {mensaje && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
          tipoMensaje === 'success'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {mensaje}
        </div>
      )}

      {/* Cards resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total hoy</p>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{asistenciasHoy.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Completos</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{completos}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Incompletos</p>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{incompletos}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Registros de hoy</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 font-medium">Empleado</th>
                <th className="px-6 py-4 font-medium">Entrada</th>
                <th className="px-6 py-4 font-medium">S. Almuerzo</th>
                <th className="px-6 py-4 font-medium">R. Almuerzo</th>
                <th className="px-6 py-4 font-medium">Salida</th>
                <th className="px-6 py-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {asistenciasHoy.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No hay registros hoy</td></tr>
              ) : (
                asistenciasHoy.map((a) => (
                  <tr key={a.id_asistencia} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{a.nombres} {a.apellidos}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatearHora(a.hora_entrada)}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatearHora(a.hora_salida_almuerzo)}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatearHora(a.hora_regreso_almuerzo)}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatearHora(a.hora_salida)}</td>
                    <td className="px-6 py-4">
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

      {/* Modal Registrar */}
      {modalRegistrar && (
        <Modal title="Registrar Asistencia" onClose={() => setModalRegistrar(false)}>
          <form onSubmit={handleRegistrar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empleado</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={idSeleccionado}
                onChange={(e) => setIdSeleccionado(e.target.value)}
                required
              >
                <option value="">Seleccionar empleado</option>
                {empleados.map((emp) => (
                  <option key={emp.id_empleado} value={emp.id_empleado}>
                    {emp.nombres} {emp.apellidos}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              El sistema detectará automáticamente el tipo de registro (entrada, almuerzo o salida).
            </p>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalRegistrar(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={cargando}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                {cargando ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}