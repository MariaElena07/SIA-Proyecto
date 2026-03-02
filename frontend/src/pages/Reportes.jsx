import { useState, useEffect } from 'react'
import api from '../services/api'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export default function Reportes() {
  const [empleados, setEmpleados] = useState([])
  const [tab, setTab] = useState('asistencias')
  const [mensaje, setMensaje] = useState('')
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
      setMensaje('Error al cargar reporte')
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
      setMensaje('Error al cargar incidencias')
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
      setMensaje('Error al cargar resumen')
    } finally {
      setCargando(false)
    }
  }

  const handleEditar = async (id) => {
    try {
      await api.put(`/reportes/incidencias/${id}`, { observacion: nuevaObservacion })
      setMensaje('Incidencia actualizada')
      setEditando(null)
      buscarIncidencias({ preventDefault: () => {} })
    } catch (err) {
      setMensaje('Error al actualizar incidencia')
    }
  }

  const filtroForm = (onSubmit) => (
    <form onSubmit={onSubmit} className="row g-2 mb-4 align-items-end">
      <div className="col-md-3">
        <label className="form-label">Fecha inicio</label>
        <input type="date" className="form-control" value={filtros.fecha_inicio}
          onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })} required />
      </div>
      <div className="col-md-3">
        <label className="form-label">Fecha fin</label>
        <input type="date" className="form-control" value={filtros.fecha_fin}
          onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })} required />
      </div>
      <div className="col-md-4">
        <label className="form-label">Empleado (opcional)</label>
        <select className="form-select" value={filtros.id_empleado}
          onChange={(e) => setFiltros({ ...filtros, id_empleado: e.target.value })}>
          <option value="">Todos</option>
          {empleados.map((emp) => (
            <option key={emp.id_empleado} value={emp.id_empleado}>
              {emp.nombres} {emp.apellidos}
            </option>
          ))}
        </select>
      </div>
      <div className="col-md-2">
        <button type="submit" className="btn btn-primary w-100" disabled={cargando}>
          {cargando ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
    </form>
  )

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
  const buffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([buffer]), 'reporte_asistencias.xlsx')
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
    const buffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buffer]), 'reporte_incidencias.xlsx')
  }

  return (
    <div>
      <h4 className="mb-3">Reportes</h4>
      {mensaje && <div className="alert alert-info py-2">{mensaje}</div>}

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'asistencias' ? 'active' : ''}`} onClick={() => setTab('asistencias')}>Asistencias</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'incidencias' ? 'active' : ''}`} onClick={() => setTab('incidencias')}>Incidencias</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'resumen' ? 'active' : ''}`} onClick={() => setTab('resumen')}>Resumen por Empleado</button>
        </li>
      </ul>

      {/* ASISTENCIAS */}
      {tab === 'asistencias' && (
        <div>
          {filtroForm(buscarAsistencias)}
          {asistencias.length > 0 && (
            <button className="btn btn-success btn-sm mb-3" onClick={exportarAsistencias}>
              ⬇ Exportar a Excel
            </button>
          )}
          <table className="table table-bordered table-hover">
            <thead className="table-primary">
              <tr>
                <th>Empleado</th>
                <th>Fecha</th>
                <th>Entrada</th>
                <th>S. Almuerzo</th>
                <th>R. Almuerzo</th>
                <th>Salida</th>
                <th>Horas</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.length === 0 ? (
                <tr><td colSpan="8" className="text-center">Sin resultados</td></tr>
              ) : (
                asistencias.map((a, i) => (
                  <tr key={i}>
                    <td>{a.nombres} {a.apellidos}</td>
                    <td>{a.fecha}</td>
                    <td>{formatearHora(a.hora_entrada)}</td>
                    <td>{formatearHora(a.hora_salida_almuerzo)}</td>
                    <td>{formatearHora(a.hora_regreso_almuerzo)}</td>
                    <td>{formatearHora(a.hora_salida)}</td>
                    <td>{a.horas_trabajadas ?? '—'}</td>
                    <td>
                      <span className={`badge ${a.estado === 'completo' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {a.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* INCIDENCIAS */}
      {tab === 'incidencias' && (
        <div>
          {filtroForm(buscarIncidencias)}
          {incidencias.length > 0 && (
            <button className="btn btn-success btn-sm mb-3" onClick={exportarIncidencias}>
              ⬇ Exportar a Excel
            </button>
          )}
          <table className="table table-bordered table-hover">
            <thead className="table-primary">
              <tr>
                <th>Empleado</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Duración</th>
                <th>Observación</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {incidencias.length === 0 ? (
                <tr><td colSpan="6" className="text-center">Sin resultados</td></tr>
              ) : (
                incidencias.map((inc) => (
                  <tr key={inc.id_incidencia}>
                    <td>{inc.nombres} {inc.apellidos}</td>
                    <td>{inc.fecha}</td>
                    <td><span className="badge bg-danger">{inc.tipo}</span></td>
                    <td>{minutosAHHMM(inc.minutos)}</td>
                    <td>
                      {editando === inc.id_incidencia ? (
                        <input type="text" className="form-control form-control-sm"
                          value={nuevaObservacion}
                          onChange={(e) => setNuevaObservacion(e.target.value)} />
                      ) : inc.observacion}
                    </td>
                    <td>
                      {editando === inc.id_incidencia ? (
                        <div className="d-flex gap-1">
                          <button className="btn btn-success btn-sm" onClick={() => handleEditar(inc.id_incidencia)}>Guardar</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditando(null)}>Cancelar</button>
                        </div>
                      ) : (
                        <button className="btn btn-outline-primary btn-sm"
                          onClick={() => { setEditando(inc.id_incidencia); setNuevaObservacion(inc.observacion) }}>
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
      )}

      {/* RESUMEN */}
      {tab === 'resumen' && (
        <div>
          <form onSubmit={buscarResumen} className="row g-2 mb-4 align-items-end">
            <div className="col-md-4">
              <label className="form-label">Empleado</label>
              <select className="form-select" value={filtrosResumen.id_empleado}
                onChange={(e) => setFiltrosResumen({ ...filtrosResumen, id_empleado: e.target.value })} required>
                <option value="">Seleccionar empleado</option>
                {empleados.map((emp) => (
                  <option key={emp.id_empleado} value={emp.id_empleado}>
                    {emp.nombres} {emp.apellidos}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha inicio</label>
              <input type="date" className="form-control" value={filtrosResumen.fecha_inicio}
                onChange={(e) => setFiltrosResumen({ ...filtrosResumen, fecha_inicio: e.target.value })} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha fin</label>
              <input type="date" className="form-control" value={filtrosResumen.fecha_fin}
                onChange={(e) => setFiltrosResumen({ ...filtrosResumen, fecha_fin: e.target.value })} required />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100" disabled={cargando}>Buscar</button>
            </div>
          </form>

          {resumen && (
            <div className="row g-3">
              <div className="col-md-4">
                <div className="card p-3 text-center">
                  <h6>Días asistidos</h6>
                  <h2 className="text-primary">{resumen.resumen_asistencia.dias_asistidos}</h2>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card p-3 text-center">
                  <h6>Total horas trabajadas</h6>
                  <h2 className="text-success">{resumen.resumen_asistencia.total_horas ?? 0}</h2>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card p-3 text-center">
                  <h6>Días incompletos</h6>
                  <h2 className="text-warning">{resumen.resumen_asistencia.dias_incompletos}</h2>
                </div>
              </div>

              {resumen.incidencias_por_tipo.length > 0 && (
                <div className="col-12">
                  <h6 className="mt-2">Incidencias por tipo</h6>
                  <table className="table table-bordered">
                    <thead className="table-secondary">
                      <tr>
                        <th>Tipo</th>
                        <th>Cantidad</th>
                        <th>Total tiempo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumen.incidencias_por_tipo.map((inc, i) => (
                        <tr key={i}>
                          <td><span className="badge bg-danger">{inc.tipo}</span></td>
                          <td>{inc.cantidad}</td>
                          <td>{minutosAHHMM(inc.total_minutos)}</td>
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