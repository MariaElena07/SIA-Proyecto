import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Asistencias() {
  const [empleados, setEmpleados] = useState([])
  const [asistenciasHoy, setAsistenciasHoy] = useState([])
  const [idSeleccionado, setIdSeleccionado] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('info')
  const [cargando, setCargando] = useState(false)
  const [tab, setTab] = useState('registrar')

  useEffect(() => {
    cargarEmpleados()
    cargarAsistenciasHoy()
  }, [])

  const cargarEmpleados = async () => {
    try {
      const response = await api.get('/empleados/')
      setEmpleados(response.data)
    } catch (err) {
      console.error(err)
    }
  }

  const cargarAsistenciasHoy = async () => {
    try {
      const response = await api.get('/asistencias/hoy')
      setAsistenciasHoy(response.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRegistrar = async (e) => {
    e.preventDefault()
    setCargando(true)
    setMensaje('')
    try {
      const response = await api.post(`/asistencias/registrar/${idSeleccionado}`)
      setMensaje(response.data.mensaje || 'Registro exitoso')
      setTipoMensaje('success')
      cargarAsistenciasHoy()
    } catch (err) {
      setMensaje('Error al registrar asistencia')
      setTipoMensaje('danger')
    } finally {
      setCargando(false)
    }
  }

  const formatearHora = (hora) => {
    if (hora === null || hora === undefined) return '—'
    if (typeof hora === 'number') {
      const horas = Math.floor(hora / 3600)
      const minutos = Math.floor((hora % 3600) / 60)
      return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
    }
    return String(hora).slice(0, 5)
  }

  return (
    <div>
      <h4 className="mb-3">Asistencias</h4>

      {mensaje && <div className={`alert alert-${tipoMensaje} py-2`}>{mensaje}</div>}

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'registrar' ? 'active' : ''}`} onClick={() => setTab('registrar')}>
            Registrar
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'hoy' ? 'active' : ''}`} onClick={() => { setTab('hoy'); cargarAsistenciasHoy() }}>
            Asistencias de Hoy
          </button>
        </li>
      </ul>

      {tab === 'registrar' && (
        <div className="card p-3" style={{ maxWidth: '400px' }}>
          <h6 className="mb-3">Registrar Asistencia</h6>
          <form onSubmit={handleRegistrar}>
            <div className="mb-3">
              <label className="form-label">Empleado</label>
              <select
                className="form-select"
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
            <button type="submit" className="btn btn-primary w-100" disabled={cargando}>
              {cargando ? 'Registrando...' : 'Registrar'}
            </button>
          </form>
        </div>
      )}

      {tab === 'hoy' && (
        <table className="table table-bordered table-hover">
          <thead className="table-primary">
            <tr>
              <th>Empleado</th>
              <th>Entrada</th>
              <th>Salida Almuerzo</th>
              <th>Regreso Almuerzo</th>
              <th>Salida Final</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {asistenciasHoy.length === 0 ? (
              <tr><td colSpan="6" className="text-center">No hay registros hoy</td></tr>
            ) : (
              asistenciasHoy.map((a) => (
                <tr key={a.id_asistencia}>
                  <td>{a.nombres} {a.apellidos}</td>
                  <td>{formatearHora(a.hora_entrada)}</td>
                  <td>{formatearHora(a.hora_salida_almuerzo)}</td>
                  <td>{formatearHora(a.hora_regreso_almuerzo)}</td>
                  <td>{formatearHora(a.hora_salida)}</td>
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
      )}
    </div>
  )
}