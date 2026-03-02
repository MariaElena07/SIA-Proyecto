import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Horarios() {
  const [horarios, setHorarios] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [tab, setTab] = useState('lista')
  const [mensaje, setMensaje] = useState('')

  const [formHorario, setFormHorario] = useState({
    nombre_horario: '',
    hora_entrada: '',
    hora_salida: '',
    tolerancia_minutos: 0
  })

  const [formAsignar, setFormAsignar] = useState({
    id_empleado: '',
    id_horario: '',
    fecha_inicio: ''
  })

  const [horarioEmpleado, setHorarioEmpleado] = useState(null)
  const [idBuscar, setIdBuscar] = useState('')

  useEffect(() => {
    cargarHorarios()
    cargarEmpleados()
  }, [])

  const cargarHorarios = async () => {
    try {
      const response = await api.get('/horarios/')
      setHorarios(response.data)
    } catch (err) {
      console.error(err)
    }
  }

  const cargarEmpleados = async () => {
    try {
      const response = await api.get('/empleados/')
      setEmpleados(response.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCrearHorario = async (e) => {
    e.preventDefault()
    try {
      await api.post('/horarios/', formHorario)
      setMensaje('Horario creado exitosamente')
      setFormHorario({ nombre_horario: '', hora_entrada: '', hora_salida: '', tolerancia_minutos: 0 })
      cargarHorarios()
    } catch (err) {
      setMensaje('Error al crear horario')
    }
  }

  const handleAsignar = async (e) => {
    e.preventDefault()
    try {
      await api.post('/horarios/asignar', formAsignar)
      setMensaje('Horario asignado exitosamente')
      setFormAsignar({ id_empleado: '', id_horario: '', fecha_inicio: '' })
    } catch (err) {
      setMensaje('Error al asignar horario')
    }
  }

  const handleBuscarHorario = async (e) => {
    e.preventDefault()
    try {
      const response = await api.get(`/horarios/empleado/${idBuscar}`)
      setHorarioEmpleado(response.data)
      setMensaje('')
    } catch (err) {
      setMensaje('No se encontró horario para ese empleado')
      setHorarioEmpleado(null)
    }
  }

  const formatearHora = (hora) => {
    if (hora === null || hora === undefined) return ''
    if (typeof hora === 'number') {
      const horas = Math.floor(hora / 3600)
      const minutos = Math.floor((hora % 3600) / 60)
      return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
    }
    return String(hora).slice(0, 5)
  }

  return (
    <div>
      <h4 className="mb-3">Horarios</h4>

      {mensaje && <div className="alert alert-info py-2">{mensaje}</div>}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'lista' ? 'active' : ''}`} onClick={() => setTab('lista')}>
            Lista de Horarios
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'crear' ? 'active' : ''}`} onClick={() => setTab('crear')}>
            Crear Horario
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'asignar' ? 'active' : ''}`} onClick={() => setTab('asignar')}>
            Asignar Horario
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'ver' ? 'active' : ''}`} onClick={() => setTab('ver')}>
            Ver por Empleado
          </button>
        </li>
      </ul>

      {/* Lista de horarios */}
      {tab === 'lista' && (
        <table className="table table-bordered table-hover">
          <thead className="table-primary">
            <tr>
              <th>Nombre</th>
              <th>Hora Entrada</th>
              <th>Hora Salida</th>
              <th>Tolerancia (min)</th>
            </tr>
          </thead>
          <tbody>
            {horarios.length === 0 ? (
              <tr><td colSpan="4" className="text-center">No hay horarios registrados</td></tr>
            ) : (
              horarios.map((h) => (
                <tr key={h.id_horario}>
                  <td>{h.nombre_horario}</td>
                  <td>{formatearHora(h.hora_entrada)}</td>
                  <td>{formatearHora(h.hora_salida)}</td>
                  <td>{h.tolerancia_minutos}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Crear horario */}
      {tab === 'crear' && (
        <div className="card p-3" style={{ maxWidth: '500px' }}>
          <h6 className="mb-3">Nuevo Horario</h6>
          <form onSubmit={handleCrearHorario}>
            <div className="mb-2">
              <label className="form-label">Nombre del horario</label>
              <input
                type="text"
                className="form-control"
                value={formHorario.nombre_horario}
                onChange={(e) => setFormHorario({ ...formHorario, nombre_horario: e.target.value })}
                required
              />
            </div>
            <div className="mb-2">
              <label className="form-label">Hora de entrada</label>
              <input
                type="time"
                className="form-control"
                value={formHorario.hora_entrada}
                onChange={(e) => setFormHorario({ ...formHorario, hora_entrada: e.target.value })}
                required
              />
            </div>
            <div className="mb-2">
              <label className="form-label">Hora de salida</label>
              <input
                type="time"
                className="form-control"
                value={formHorario.hora_salida}
                onChange={(e) => setFormHorario({ ...formHorario, hora_salida: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Tolerancia (minutos)</label>
              <input
                type="number"
                className="form-control"
                value={formHorario.tolerancia_minutos}
                onChange={(e) => setFormHorario({ ...formHorario, tolerancia_minutos: parseInt(e.target.value) })}
              />
            </div>
            <button type="submit" className="btn btn-success btn-sm">Crear Horario</button>
          </form>
        </div>
      )}

      {/* Asignar horario */}
      {tab === 'asignar' && (
        <div className="card p-3" style={{ maxWidth: '500px' }}>
          <h6 className="mb-3">Asignar Horario a Empleado</h6>
          <form onSubmit={handleAsignar}>
            <div className="mb-2">
              <label className="form-label">Empleado</label>
              <select
                className="form-select"
                value={formAsignar.id_empleado}
                onChange={(e) => setFormAsignar({ ...formAsignar, id_empleado: e.target.value })}
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
            <div className="mb-2">
              <label className="form-label">Horario</label>
              <select
                className="form-select"
                value={formAsignar.id_horario}
                onChange={(e) => setFormAsignar({ ...formAsignar, id_horario: e.target.value })}
                required
              >
                <option value="">Seleccionar horario</option>
                {horarios.map((h) => (
                  <option key={h.id_horario} value={h.id_horario}>
                    {h.nombre_horario}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Fecha de inicio</label>
              <input
                type="date"
                className="form-control"
                value={formAsignar.fecha_inicio}
                onChange={(e) => setFormAsignar({ ...formAsignar, fecha_inicio: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-success btn-sm">Asignar</button>
          </form>
        </div>
      )}

      {/* Ver horario por empleado */}
      {tab === 'ver' && (
        <div>
          <form onSubmit={handleBuscarHorario} className="d-flex gap-2 mb-3">
            <select
              className="form-select"
              value={idBuscar}
              onChange={(e) => setIdBuscar(e.target.value)}
              style={{ maxWidth: '300px' }}
              required
            >
              <option value="">Seleccionar empleado</option>
              {empleados.map((emp) => (
                <option key={emp.id_empleado} value={emp.id_empleado}>
                  {emp.nombres} {emp.apellidos}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary btn-sm">Buscar</button>
          </form>
          {horarioEmpleado && (
            <div className="card p-3" style={{ maxWidth: '400px' }}>
              <p><strong>Horario:</strong> {horarioEmpleado.nombre_horario}</p>
              <p><strong>Entrada:</strong> {formatearHora(horarioEmpleado.hora_entrada)}</p>
              <p><strong>Salida:</strong> {formatearHora(horarioEmpleado.hora_salida)}</p>
              <p><strong>Tolerancia:</strong> {horarioEmpleado.tolerancia_minutos} min</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}