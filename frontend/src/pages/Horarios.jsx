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

export default function Horarios() {
  const [horarios, setHorarios] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [tab, setTab] = useState('lista')
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('success')
  const [modalCrear, setModalCrear] = useState(false)
  const [modalAsignar, setModalAsignar] = useState(false)
  const [horarioEmpleado, setHorarioEmpleado] = useState(null)
  const [idBuscar, setIdBuscar] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [formHorario, setFormHorario] = useState({
    nombre_horario: '', hora_entrada: '', hora_salida: '', tolerancia_minutos: 0
  })
  const [formAsignar, setFormAsignar] = useState({
    id_empleado: '', id_horario: '', fecha_inicio: ''
  })

  useEffect(() => {
    cargarHorarios()
    cargarEmpleados()
  }, [])

  const cargarHorarios = async () => {
    try {
      const r = await api.get('/horarios/')
      setHorarios(r.data)
    } catch (err) { console.error(err) }
  }

  const cargarEmpleados = async () => {
    try {
      const r = await api.get('/empleados/')
      setEmpleados(r.data)
    } catch (err) { console.error(err) }
  }

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje(texto)
    setTipoMensaje(tipo)
    setTimeout(() => setMensaje(''), 3000)
  }

  const formatearHora = (hora) => {
    if (hora === null || hora === undefined) return '—'
    if (typeof hora === 'number') {
      const h = Math.floor(hora / 3600)
      const m = Math.floor((hora % 3600) / 60)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
    return String(hora).slice(0, 5)
  }

  const handleCrearHorario = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.post('/horarios/', formHorario)
      mostrarMensaje('Horario creado exitosamente')
      setFormHorario({ nombre_horario: '', hora_entrada: '', hora_salida: '', tolerancia_minutos: 0 })
      setModalCrear(false)
      cargarHorarios()
    } catch (err) {
      mostrarMensaje('Error al crear horario', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const handleAsignar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.post('/horarios/asignar', formAsignar)
      mostrarMensaje('Horario asignado exitosamente')
      setFormAsignar({ id_empleado: '', id_horario: '', fecha_inicio: '' })
      setModalAsignar(false)
    } catch (err) {
      mostrarMensaje('Error al asignar horario', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const handleBuscarHorario = async (e) => {
    e.preventDefault()
    try {
      const r = await api.get(`/horarios/empleado/${idBuscar}`)
      setHorarioEmpleado(r.data)
    } catch (err) {
      mostrarMensaje('No se encontró horario para ese empleado', 'error')
      setHorarioEmpleado(null)
    }
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"

  const tabs = [
    { id: 'lista', label: 'Lista de Horarios' },
    { id: 'ver', label: 'Ver por Empleado' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Horarios</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{horarios.length} horarios configurados</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setModalAsignar(true)}
            className="px-4 py-2 border border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 rounded-xl text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            Asignar Horario
          </button>
          <button
            onClick={() => setModalCrear(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            + Nuevo Horario
          </button>
        </div>
      </div>

      {/* Alerta */}
      {mensaje && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
          tipoMensaje === 'success'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {mensaje}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista de horarios */}
      {tab === 'lista' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-4 font-medium">Nombre</th>
                  <th className="px-6 py-4 font-medium">Hora Entrada</th>
                  <th className="px-6 py-4 font-medium">Hora Salida</th>
                  <th className="px-6 py-4 font-medium">Tolerancia</th>
                </tr>
              </thead>
              <tbody>
                {horarios.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">No hay horarios registrados</td></tr>
                ) : (
                  horarios.map((h) => (
                    <tr key={h.id_horario} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{h.nombre_horario}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatearHora(h.hora_entrada)}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatearHora(h.hora_salida)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {h.tolerancia_minutos} min
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ver por empleado */}
      {tab === 'ver' && (
        <div>
          <form onSubmit={handleBuscarHorario} className="flex gap-3 mb-6">
            <select
              className={inputClass + ' max-w-xs'}
              value={idBuscar}
              onChange={(e) => setIdBuscar(e.target.value)}
              required
            >
              <option value="">Seleccionar empleado</option>
              {empleados.map((emp) => (
                <option key={emp.id_empleado} value={emp.id_empleado}>
                  {emp.nombres} {emp.apellidos}
                </option>
              ))}
            </select>
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
              Buscar
            </button>
          </form>

          {horarioEmpleado && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-2xl">
              {[
                { label: 'Horario', valor: horarioEmpleado.nombre_horario },
                { label: 'Entrada', valor: formatearHora(horarioEmpleado.hora_entrada) },
                { label: 'Salida', valor: formatearHora(horarioEmpleado.hora_salida) },
                { label: 'Tolerancia', valor: `${horarioEmpleado.tolerancia_minutos} min` },
              ].map((item) => (
                <div key={item.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{item.valor}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Crear Horario */}
      {modalCrear && (
        <Modal title="Nuevo Horario" onClose={() => setModalCrear(false)}>
          <form onSubmit={handleCrearHorario} className="space-y-4">
            <div>
              <label className={labelClass}>Nombre del horario</label>
              <input type="text" className={inputClass} placeholder="Ej: Turno mañana"
                value={formHorario.nombre_horario}
                onChange={(e) => setFormHorario({ ...formHorario, nombre_horario: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Hora entrada</label>
                <input type="time" className={inputClass}
                  value={formHorario.hora_entrada}
                  onChange={(e) => setFormHorario({ ...formHorario, hora_entrada: e.target.value })} required />
              </div>
              <div>
                <label className={labelClass}>Hora salida</label>
                <input type="time" className={inputClass}
                  value={formHorario.hora_salida}
                  onChange={(e) => setFormHorario({ ...formHorario, hora_salida: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className={labelClass}>Tolerancia (minutos)</label>
              <input type="number" className={inputClass} min="0"
                value={formHorario.tolerancia_minutos}
                onChange={(e) => setFormHorario({ ...formHorario, tolerancia_minutos: parseInt(e.target.value) })} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalCrear(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={guardando}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                {guardando ? 'Guardando...' : 'Crear Horario'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Asignar Horario */}
      {modalAsignar && (
        <Modal title="Asignar Horario a Empleado" onClose={() => setModalAsignar(false)}>
          <form onSubmit={handleAsignar} className="space-y-4">
            <div>
              <label className={labelClass}>Empleado</label>
              <select className={inputClass} value={formAsignar.id_empleado}
                onChange={(e) => setFormAsignar({ ...formAsignar, id_empleado: e.target.value })} required>
                <option value="">Seleccionar empleado</option>
                {empleados.map((emp) => (
                  <option key={emp.id_empleado} value={emp.id_empleado}>
                    {emp.nombres} {emp.apellidos}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Horario</label>
              <select className={inputClass} value={formAsignar.id_horario}
                onChange={(e) => setFormAsignar({ ...formAsignar, id_horario: e.target.value })} required>
                <option value="">Seleccionar horario</option>
                {horarios.map((h) => (
                  <option key={h.id_horario} value={h.id_horario}>{h.nombre_horario}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Fecha de inicio</label>
              <input type="date" className={inputClass} value={formAsignar.fecha_inicio}
                onChange={(e) => setFormAsignar({ ...formAsignar, fecha_inicio: e.target.value })} required />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalAsignar(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={guardando}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                {guardando ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}