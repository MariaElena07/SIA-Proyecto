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
  const [modalDiaLibre, setModalDiaLibre] = useState(false)
  const [modalHorarioSemanal, setModalHorarioSemanal] = useState(false)
  const [horarioEmpleado, setHorarioEmpleado] = useState(null)
  const [idBuscar, setIdBuscar] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Días libres
  const [diasLibres, setDiasLibres] = useState([])
  const [diasLibresHoy, setDiasLibresHoy] = useState([])
  const [formDiaLibre, setFormDiaLibre] = useState({ id_empleado: '', fecha: '', motivo: 'Día libre' })
  const [fechasSeleccionadas, setFechasSeleccionadas] = useState([])
  const [mesActual, setMesActual] = useState(new Date())
  const hoy = new Date().toISOString().split('T')[0]
  const [filtrosDL, setFiltrosDL] = useState({ fecha_inicio: hoy, fecha_fin: hoy, id_empleado: '' })

  // Horario semanal
  const [semanaDatos, setSemanaDatos] = useState(null)
  const [empleadoSemana, setEmpleadoSemana] = useState('')
  const [semanaInicio, setSemanaInicio] = useState(() => {
    const hoy = new Date()
    const dia = hoy.getDay()
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() - (dia === 0 ? 6 : dia - 1))
    return lunes.toISOString().split('T')[0]
  })

  // Horario por día
  const [empleadoHorarioSemanal, setEmpleadoHorarioSemanal] = useState('')
  const [horarioSemanalActual, setHorarioSemanalActual] = useState({})
  const [diasSemanalForm, setDiasSemanalForm] = useState({
    1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: ''
  })

  const [formHorario, setFormHorario] = useState({
    nombre_horario: '', hora_entrada: '', hora_salida: '', tolerancia_minutos: 0
  })
  const [formAsignar, setFormAsignar] = useState({
    id_empleado: '', id_horario: '', fecha_inicio: ''
  })

  useEffect(() => {
    cargarHorarios()
    cargarEmpleados()
    cargarDiasLibresHoy()
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

  const cargarDiasLibresHoy = async () => {
    try {
      const r = await api.get('/dias-libres/hoy')
      setDiasLibresHoy(r.data)
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

  const handleCrearDiaLibre = async (e) => {
    e.preventDefault()
    if (fechasSeleccionadas.length === 0) {
      mostrarMensaje('Selecciona al menos una fecha', 'error')
      return
    }
    setGuardando(true)
    try {
      const r = await api.post('/dias-libres/multiple', {
        id_empleado: formDiaLibre.id_empleado,
        fechas: fechasSeleccionadas,
        motivo: formDiaLibre.motivo
      })
      mostrarMensaje(r.data.mensaje)
      setFormDiaLibre({ id_empleado: '', fecha: '', motivo: 'Día libre' })
      setFechasSeleccionadas([])
      setModalDiaLibre(false)
      buscarDiasLibres()
      cargarDiasLibresHoy()
    } catch (err) {
      mostrarMensaje(err.response?.data?.detail || 'Error al registrar', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminarDiaLibre = async (id) => {
    try {
      await api.delete(`/dias-libres/${id}`)
      mostrarMensaje('Día libre eliminado')
      buscarDiasLibres()
      cargarDiasLibresHoy()
    } catch (err) {
      mostrarMensaje('Error al eliminar', 'error')
    }
  }

  const buscarDiasLibres = async () => {
    try {
      const params = { fecha_inicio: filtrosDL.fecha_inicio, fecha_fin: filtrosDL.fecha_fin }
      if (filtrosDL.id_empleado) params.id_empleado = filtrosDL.id_empleado
      const r = await api.get('/dias-libres/', { params })
      setDiasLibres(r.data)
    } catch (err) {
      mostrarMensaje('Error al cargar días libres', 'error')
    }
  }

  const cargarSemana = async (empId, inicio) => {
    if (!empId) return
    try {
      const r = await api.get(`/horarios/semana/${empId}`, { params: { fecha_inicio: inicio } })
      setSemanaDatos(r.data)
    } catch (err) {
      mostrarMensaje('Error al cargar semana', 'error')
    }
  }

  const navegarSemana = (direccion) => {
    const fecha = new Date(semanaInicio)
    fecha.setDate(fecha.getDate() + (direccion * 7))
    const nuevaFecha = fecha.toISOString().split('T')[0]
    setSemanaInicio(nuevaFecha)
    cargarSemana(empleadoSemana, nuevaFecha)
  }

  const cargarHorarioSemanal = async (id) => {
    try {
      const r = await api.get(`/horarios/semanal/${id}`)
      const mapa = {}
      r.data.forEach(d => { mapa[d.dia_semana] = d.id_horario })
      setDiasSemanalForm({ 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', ...mapa })
      setHorarioSemanalActual(mapa)
    } catch (err) { console.error(err) }
  }

  const handleGuardarHorarioSemanal = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const dias = Object.entries(diasSemanalForm)
        .filter(([_, id_horario]) => id_horario !== '')
        .map(([dia_semana, id_horario]) => ({
          dia_semana: parseInt(dia_semana),
          id_horario: parseInt(id_horario)
        }))
      await api.post('/horarios/semanal', {
        id_empleado: parseInt(empleadoHorarioSemanal),
        dias
      })
      mostrarMensaje('Horario semanal guardado exitosamente')
      setModalHorarioSemanal(false)
    } catch (err) {
      mostrarMensaje('Error al guardar horario semanal', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const toggleFecha = (fecha) => {
    setFechasSeleccionadas(prev =>
      prev.includes(fecha) ? prev.filter(f => f !== fecha) : [...prev, fecha]
    )
  }

  const getDiasDelMes = (fecha) => {
    const year = fecha.getFullYear()
    const month = fecha.getMonth()
    const primerDia = new Date(year, month, 1).getDay()
    const diasEnMes = new Date(year, month + 1, 0).getDate()
    return { primerDia, diasEnMes, year, month }
  }

  const diasSemanaES = {
    'Monday': 'Lunes', 'Tuesday': 'Martes', 'Wednesday': 'Miércoles',
    'Thursday': 'Jueves', 'Friday': 'Viernes', 'Saturday': 'Sábado', 'Sunday': 'Domingo'
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"

  const tabs = [
    { id: 'lista', label: 'Lista de Horarios' },
    { id: 'ver', label: 'Ver por Empleado' },
    { id: 'semana', label: 'Semana' },
    { id: 'diaslibres', label: 'Días Libres' },
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
          {tab === 'diaslibres' ? (
            <button onClick={() => setModalDiaLibre(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
              + Día Libre
            </button>
          ) : tab === 'ver' ? (
            <>
              <button onClick={() => setModalHorarioSemanal(true)}
                className="px-4 py-2 border border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 rounded-xl text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                📅 Horario por día
              </button>
              <button onClick={() => setModalAsignar(true)}
                className="px-4 py-2 border border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 rounded-xl text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                Asignar Horario
              </button>
              <button onClick={() => setModalCrear(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                + Nuevo Horario
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setModalAsignar(true)}
                className="px-4 py-2 border border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 rounded-xl text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                Asignar Horario
              </button>
              <button onClick={() => setModalCrear(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                + Nuevo Horario
              </button>
            </>
          )}
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
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
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
            <select className={inputClass + ' max-w-xs'} value={idBuscar}
              onChange={(e) => setIdBuscar(e.target.value)} required>
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

      {/* Horario semanal */}
      {tab === 'semana' && (
        <div>
          <div className="flex gap-3 mb-6">
            <select className={inputClass + ' max-w-xs'} value={empleadoSemana}
              onChange={(e) => {
                setEmpleadoSemana(e.target.value)
                cargarSemana(e.target.value, semanaInicio)
              }}>
              <option value="">Seleccionar empleado</option>
              {empleados.map((emp) => (
                <option key={emp.id_empleado} value={emp.id_empleado}>
                  {emp.nombres} {emp.apellidos}
                </option>
              ))}
            </select>
          </div>

          {semanaDatos && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => navegarSemana(-1)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  ← Semana anterior
                </button>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {semanaDatos.semana_inicio} — {semanaDatos.semana_fin}
                </p>
                <button onClick={() => navegarSemana(1)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Semana siguiente →
                </button>
              </div>

              <div className="grid grid-cols-7 gap-3">
                {semanaDatos.dias.map((dia) => (
                  <div key={dia.fecha} className={`rounded-2xl border p-3 text-center transition-colors ${
                    dia.es_libre
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      : dia.asistencia
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                  }`}>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      {diasSemanaES[dia.dia_semana] || dia.dia_semana}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {new Date(dia.fecha + 'T12:00:00').getDate()}
                    </p>
                    {dia.es_libre ? (
                      <div>
                        <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-medium block">
                          🏖️ Libre
                        </span>
                        {dia.motivo_libre && dia.motivo_libre !== 'Día libre' && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{dia.motivo_libre}</p>
                        )}
                      </div>
                    ) : dia.horario ? (
                      <div className="space-y-1">
                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-medium block">
                          {formatearHora(dia.horario.entrada)} - {formatearHora(dia.horario.salida)}
                        </span>
                        {dia.asistencia && (
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium block ${
                            dia.asistencia.estado === 'completo'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {dia.asistencia.estado}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Sin horario</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!semanaDatos && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
              <p className="text-gray-400">Selecciona un empleado para ver su horario semanal</p>
            </div>
          )}
        </div>
      )}

      {/* Días Libres */}
      {tab === 'diaslibres' && (
        <div>
          {diasLibresHoy.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-6">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-2">
                🏖️ Empleados con día libre hoy ({diasLibresHoy.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {diasLibresHoy.map((d) => (
                  <span key={d.id_dia_libre} className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                    {d.nombres} {d.apellidos}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha inicio</label>
                <input type="date" value={filtrosDL.fecha_inicio}
                  onChange={(e) => setFiltrosDL({ ...filtrosDL, fecha_inicio: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha fin</label>
                <input type="date" value={filtrosDL.fecha_fin}
                  onChange={(e) => setFiltrosDL({ ...filtrosDL, fecha_fin: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Empleado</label>
                <select value={filtrosDL.id_empleado}
                  onChange={(e) => setFiltrosDL({ ...filtrosDL, id_empleado: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Todos</option>
                  {empleados.map((emp) => (
                    <option key={emp.id_empleado} value={emp.id_empleado}>
                      {emp.nombres} {emp.apellidos}
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={buscarDiasLibres}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                Buscar
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-4 font-medium">Empleado</th>
                  <th className="px-6 py-4 font-medium">Fecha</th>
                  <th className="px-6 py-4 font-medium">Motivo</th>
                  <th className="px-6 py-4 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {diasLibres.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">
                    Selecciona un rango y presiona Buscar
                  </td></tr>
                ) : (
                  diasLibres.map((d) => (
                    <tr key={d.id_dia_libre} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{d.nombres} {d.apellidos}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{d.fecha}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          {d.motivo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleEliminarDiaLibre(d.id_dia_libre)}
                          className="px-3 py-1.5 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
                <input type="time" className={inputClass} value={formHorario.hora_entrada}
                  onChange={(e) => setFormHorario({ ...formHorario, hora_entrada: e.target.value })} required />
              </div>
              <div>
                <label className={labelClass}>Hora salida</label>
                <input type="time" className={inputClass} value={formHorario.hora_salida}
                  onChange={(e) => setFormHorario({ ...formHorario, hora_salida: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className={labelClass}>Tolerancia (minutos)</label>
              <input type="number" className={inputClass} min="0" value={formHorario.tolerancia_minutos}
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

      {/* Modal Día Libre */}
      {modalDiaLibre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalDiaLibre(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Registrar Días Libres</h2>
              <button onClick={() => { setModalDiaLibre(false); setFechasSeleccionadas([]) }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
            </div>
            <form onSubmit={handleCrearDiaLibre} className="space-y-4">
              <div>
                <label className={labelClass}>Empleado</label>
                <select className={inputClass} value={formDiaLibre.id_empleado}
                  onChange={(e) => setFormDiaLibre({ ...formDiaLibre, id_empleado: e.target.value })} required>
                  <option value="">Seleccionar empleado</option>
                  {empleados.map((emp) => (
                    <option key={emp.id_empleado} value={emp.id_empleado}>
                      {emp.nombres} {emp.apellidos}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Seleccionar fechas</label>
                <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <button type="button"
                      onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1))}
                      className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors">←</button>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                      {mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                    <button type="button"
                      onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1))}
                      className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors">→</button>
                  </div>
                  <div className="grid grid-cols-7 text-center">
                    {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => (
                      <div key={d} className="py-2 text-xs font-medium text-gray-400 dark:text-gray-500">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 text-center p-2 gap-1">
                    {(() => {
                      const { primerDia, diasEnMes, year, month } = getDiasDelMes(mesActual)
                      const celdas = []
                      for (let i = 0; i < primerDia; i++) {
                        celdas.push(<div key={`empty-${i}`} />)
                      }
                      for (let dia = 1; dia <= diasEnMes; dia++) {
                        const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
                        const seleccionado = fechasSeleccionadas.includes(fechaStr)
                        celdas.push(
                          <button key={dia} type="button" onClick={() => toggleFecha(fechaStr)}
                            className={`w-full aspect-square rounded-xl text-xs font-medium transition-colors ${
                              seleccionado
                                ? 'bg-indigo-600 text-white'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}>
                            {dia}
                          </button>
                        )
                      }
                      return celdas
                    })()}
                  </div>
                </div>
                {fechasSeleccionadas.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {fechasSeleccionadas.sort().map(f => (
                      <span key={f} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-medium flex items-center gap-1">
                        {f}
                        <button type="button" onClick={() => toggleFecha(f)} className="hover:text-indigo-900">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Motivo</label>
                <input type="text" className={inputClass} placeholder="Ej: Día libre, Descanso rotativo..."
                  value={formDiaLibre.motivo}
                  onChange={(e) => setFormDiaLibre({ ...formDiaLibre, motivo: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModalDiaLibre(false); setFechasSeleccionadas([]) }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando || fechasSeleccionadas.length === 0}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                  {guardando ? 'Guardando...' : `Registrar ${fechasSeleccionadas.length > 0 ? `(${fechasSeleccionadas.length})` : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Horario Semanal */}
      {modalHorarioSemanal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalHorarioSemanal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Horario por día de semana</h2>
              <button onClick={() => setModalHorarioSemanal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
            </div>
            <form onSubmit={handleGuardarHorarioSemanal} className="space-y-4">
              <div>
                <label className={labelClass}>Empleado</label>
                <select className={inputClass} value={empleadoHorarioSemanal}
                  onChange={(e) => {
                    setEmpleadoHorarioSemanal(e.target.value)
                    if (e.target.value) cargarHorarioSemanal(e.target.value)
                  }} required>
                  <option value="">Seleccionar empleado</option>
                  {empleados.map((emp) => (
                    <option key={emp.id_empleado} value={emp.id_empleado}>
                      {emp.nombres} {emp.apellidos}
                    </option>
                  ))}
                </select>
              </div>

              {empleadoHorarioSemanal && (
                <div className="space-y-3">
                  <label className={labelClass}>Asignar horario por día</label>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Deja en blanco los días que use el horario general</p>
                  {[
                    { num: 1, nombre: 'Lunes' },
                    { num: 2, nombre: 'Martes' },
                    { num: 3, nombre: 'Miércoles' },
                    { num: 4, nombre: 'Jueves' },
                    { num: 5, nombre: 'Viernes' },
                    { num: 6, nombre: 'Sábado' },
                    { num: 7, nombre: 'Domingo' },
                  ].map((dia) => (
                    <div key={dia.num} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">{dia.nombre}</span>
                      <select
                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={diasSemanalForm[dia.num]}
                        onChange={(e) => setDiasSemanalForm({ ...diasSemanalForm, [dia.num]: e.target.value })}>
                        <option value="">— Horario general —</option>
                        {horarios.map((h) => (
                          <option key={h.id_horario} value={h.id_horario}>{h.nombre_horario}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalHorarioSemanal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando || !empleadoHorarioSemanal}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}