import { useState, useEffect } from 'react'
import api from '../services/api'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export default function Reportes() {
  const [empleados, setEmpleados] = useState([])
  const [tab, setTab] = useState('asistencias')
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('success')
  const [cargando, setCargando] = useState(false)

  const hoy = new Date().toISOString().split('T')[0]
  const [filtros, setFiltros] = useState({ fecha_inicio: hoy, fecha_fin: hoy, id_empleado: '' })
  const [filtrosResumen, setFiltrosResumen] = useState({ id_empleado: '', fecha_inicio: hoy, fecha_fin: hoy })

  const [asistencias, setAsistencias] = useState([])
  const [incidencias, setIncidencias] = useState([])
  const [resumen, setResumen] = useState(null)
  const [editando, setEditando] = useState(null)
  const [nuevaObservacion, setNuevaObservacion] = useState('')

  useEffect(() => { cargarEmpleados() }, [])

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
    if (!hora) return '—'
    return String(hora).slice(0, 5)
  }

  const minutosAHHMM = (minutos) => {
    if (!minutos) return '0min'
    const h = Math.floor(minutos / 60)
    const m = minutos % 60
    return h > 0 ? `${h}h ${String(m).padStart(2, '0')}min` : `${m}min`
  }

  const buscarAsistencias = async (e) => {
    e.preventDefault()
    setCargando(true)
    try {
      const params = { fecha_inicio: filtros.fecha_inicio, fecha_fin: filtros.fecha_fin }
      if (filtros.id_empleado) params.id_empleado = filtros.id_empleado
      const r = await api.get('/reportes/asistencias', { params })
      setAsistencias(r.data)
    } catch (err) {
      mostrarMensaje('Error al cargar reporte', 'error')
    } finally {
      setCargando(false)
    }
  }

  const buscarIncidencias = async (e) => {
    e.preventDefault()
    setCargando(true)
    try {
      const params = { fecha_inicio: filtros.fecha_inicio, fecha_fin: filtros.fecha_fin }
      if (filtros.id_empleado) params.id_empleado = filtros.id_empleado
      const r = await api.get('/reportes/incidencias', { params })
      setIncidencias(r.data)
    } catch (err) {
      mostrarMensaje('Error al cargar incidencias', 'error')
    } finally {
      setCargando(false)
    }
  }

  const buscarResumen = async (e) => {
    e.preventDefault()
    setCargando(true)
    try {
      const r = await api.get(`/reportes/resumen/${filtrosResumen.id_empleado}`, {
        params: { fecha_inicio: filtrosResumen.fecha_inicio, fecha_fin: filtrosResumen.fecha_fin }
      })
      setResumen(r.data)
    } catch (err) {
      mostrarMensaje('Error al cargar resumen', 'error')
    } finally {
      setCargando(false)
    }
  }

  const handleEditar = async (id) => {
    try {
      await api.put(`/reportes/incidencias/${id}`, { observacion: nuevaObservacion })
      mostrarMensaje('Incidencia actualizada')
      setEditando(null)
      buscarIncidencias({ preventDefault: () => {} })
    } catch (err) {
      mostrarMensaje('Error al actualizar', 'error')
    }
  }

  const exportarAsistencias = () => {
    const datos = asistencias.map((a) => ({
      Empleado: `${a.nombres} ${a.apellidos}`,
      Fecha: a.fecha,
      Entrada: formatearHora(a.hora_entrada),
      'Salida Almuerzo': formatearHora(a.hora_salida_almuerzo),
      'Regreso Almuerzo': formatearHora(a.hora_regreso_almuerzo),
      'Salida Final': formatearHora(a.hora_salida),
      'Horas Trabajadas': a.horas_trabajadas ?? 0,
      Estado: a.estado
    }))
    const hoja = XLSX.utils.json_to_sheet(datos)
    const libro = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(libro, hoja, 'Asistencias')
    saveAs(new Blob([XLSX.write(libro, { bookType: 'xlsx', type: 'array' })]), 'reporte_asistencias.xlsx')
  }

  const exportarIncidencias = () => {
    const datos = incidencias.map((inc) => ({
      Empleado: `${inc.nombres} ${inc.apellidos}`,
      Fecha: inc.fecha,
      Tipo: inc.tipo,
      Duración: minutosAHHMM(inc.minutos),
      Observación: inc.observacion
    }))
    const hoja = XLSX.utils.json_to_sheet(datos)
    const libro = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(libro, hoja, 'Incidencias')
    saveAs(new Blob([XLSX.write(libro, { bookType: 'xlsx', type: 'array' })]), 'reporte_incidencias.xlsx')
  }

  const inputClass = "px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
  const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"

  const tabs = [
    { id: 'asistencias', label: 'Asistencias' },
    { id: 'incidencias', label: 'Incidencias' },
    { id: 'resumen', label: 'Resumen' },
  ]

  const FiltroBar = ({ onSubmit, mostrarExportar, onExportar }) => (
    <form onSubmit={onSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className={labelClass}>Fecha inicio</label>
          <input type="date" className={inputClass} value={filtros.fecha_inicio}
            onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })} required />
        </div>
        <div>
          <label className={labelClass}>Fecha fin</label>
          <input type="date" className={inputClass} value={filtros.fecha_fin}
            onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })} required />
        </div>
        <div>
          <label className={labelClass}>Empleado</label>
          <select className={inputClass} value={filtros.id_empleado}
            onChange={(e) => setFiltros({ ...filtros, id_empleado: e.target.value })}>
            <option value="">Todos</option>
            {empleados.map((emp) => (
              <option key={emp.id_empleado} value={emp.id_empleado}>
                {emp.nombres} {emp.apellidos}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={cargando}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
          {cargando ? 'Buscando...' : 'Buscar'}
        </button>
        {mostrarExportar && (
          <button type="button" onClick={onExportar}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors">
            ⬇ Excel
          </button>
        )}
      </div>
    </form>
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Consulta y exporta información del sistema</p>
      </div>

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

      {/* ASISTENCIAS */}
      {tab === 'asistencias' && (
        <div>
          <FiltroBar onSubmit={buscarAsistencias} mostrarExportar={asistencias.length > 0} onExportar={exportarAsistencias} />
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  {['Empleado', 'Fecha', 'Entrada', 'S. Almuerzo', 'R. Almuerzo', 'Salida', 'Horas', 'Estado'].map(h => (
                    <th key={h} className="px-6 py-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {asistencias.length === 0 ? (
                  <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-400">Selecciona un rango de fechas y presiona Buscar</td></tr>
                ) : (
                  asistencias.map((a, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{a.nombres} {a.apellidos}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{a.fecha}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatearHora(a.hora_entrada)}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatearHora(a.hora_salida_almuerzo)}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatearHora(a.hora_regreso_almuerzo)}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatearHora(a.hora_salida)}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{a.horas_trabajadas ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          a.estado === 'completo'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>{a.estado}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INCIDENCIAS */}
      {tab === 'incidencias' && (
        <div>
          <FiltroBar onSubmit={buscarIncidencias} mostrarExportar={incidencias.length > 0} onExportar={exportarIncidencias} />
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  {['Empleado', 'Fecha', 'Tipo', 'Duración', 'Observación', 'Acción'].map(h => (
                    <th key={h} className="px-6 py-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incidencias.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">Selecciona un rango de fechas y presiona Buscar</td></tr>
                ) : (
                  incidencias.map((inc) => (
                    <tr key={inc.id_incidencia} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{inc.nombres} {inc.apellidos}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{inc.fecha}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          {inc.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{minutosAHHMM(inc.minutos)}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {editando === inc.id_incidencia ? (
                          <input type="text" value={nuevaObservacion}
                            onChange={(e) => setNuevaObservacion(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        ) : inc.observacion}
                      </td>
                      <td className="px-6 py-4">
                        {editando === inc.id_incidencia ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleEditar(inc.id_incidencia)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors">
                              Guardar
                            </button>
                            <button onClick={() => setEditando(null)}
                              className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditando(inc.id_incidencia); setNuevaObservacion(inc.observacion) }}
                            className="px-3 py-1.5 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESUMEN */}
      {tab === 'resumen' && (
        <div>
          <form onSubmit={buscarResumen} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className={labelClass}>Empleado</label>
                <select className={inputClass} value={filtrosResumen.id_empleado}
                  onChange={(e) => setFiltrosResumen({ ...filtrosResumen, id_empleado: e.target.value })} required>
                  <option value="">Seleccionar empleado</option>
                  {empleados.map((emp) => (
                    <option key={emp.id_empleado} value={emp.id_empleado}>
                      {emp.nombres} {emp.apellidos}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Fecha inicio</label>
                <input type="date" className={inputClass} value={filtrosResumen.fecha_inicio}
                  onChange={(e) => setFiltrosResumen({ ...filtrosResumen, fecha_inicio: e.target.value })} required />
              </div>
              <div>
                <label className={labelClass}>Fecha fin</label>
                <input type="date" className={inputClass} value={filtrosResumen.fecha_fin}
                  onChange={(e) => setFiltrosResumen({ ...filtrosResumen, fecha_fin: e.target.value })} required />
              </div>
              <button type="submit" disabled={cargando}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                {cargando ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </form>

          {resumen && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Días asistidos', valor: resumen.resumen_asistencia.dias_asistidos, color: 'text-indigo-600 dark:text-indigo-400' },
                  { label: 'Total horas trabajadas', valor: resumen.resumen_asistencia.total_horas ?? 0, color: 'text-green-600 dark:text-green-400' },
                  { label: 'Días incompletos', valor: resumen.resumen_asistencia.dias_incompletos, color: 'text-amber-600 dark:text-amber-400' },
                ].map((item) => (
                  <div key={item.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${item.color}`}>{item.valor}</p>
                  </div>
                ))}
              </div>

              {resumen.incidencias_por_tipo.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Incidencias por tipo</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                        <th className="px-6 py-4 font-medium">Tipo</th>
                        <th className="px-6 py-4 font-medium">Cantidad</th>
                        <th className="px-6 py-4 font-medium">Total tiempo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumen.incidencias_por_tipo.map((inc, i) => (
                        <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              {inc.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{inc.cantidad}</td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{minutosAHHMM(inc.total_minutos)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}