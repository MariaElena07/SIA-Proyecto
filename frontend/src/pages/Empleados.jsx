import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Empleados() {
  const [empleados, setEmpleados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [form, setForm] = useState({
    cedula: '',
    nombres: '',
    apellidos: '',
    cargo: ''
  })
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const cargarEmpleados = async () => {
    try {
      const response = await api.get('/empleados/')
      setEmpleados(response.data)
    } catch (err) {
      setError('Error al cargar empleados')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarEmpleados()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleCrear = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setMensaje('')
    try {
      await api.post('/empleados/', form)
      setMensaje('Empleado creado exitosamente')
      setForm({ cedula: '', nombres: '', apellidos: '', cargo: '' })
      setMostrarFormulario(false)
      cargarEmpleados()
    } catch (err) {
      setMensaje('Error al crear empleado')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Empleados</h4>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nuevo Empleado'}
        </button>
      </div>

      {mensaje && <div className="alert alert-info py-2">{mensaje}</div>}

      {mostrarFormulario && (
        <div className="card p-3 mb-4">
          <h6 className="mb-3">Nuevo Empleado</h6>
          <form onSubmit={handleCrear}>
            <div className="row g-2">
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cédula"
                  name="cedula"
                  value={form.cedula}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombres"
                  name="nombres"
                  value={form.nombres}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Apellidos"
                  name="apellidos"
                  value={form.apellidos}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cargo"
                  name="cargo"
                  value={form.cargo}
                  onChange={handleChange}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-success btn-sm mt-3" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar Empleado'}
            </button>
          </form>
        </div>
      )}

      {cargando ? (
        <p>Cargando...</p>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <table className="table table-bordered table-hover">
          <thead className="table-primary">
            <tr>
              <th>Cédula</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Cargo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {empleados.length === 0 ? (
              <tr><td colSpan="5" className="text-center">No hay empleados registrados</td></tr>
            ) : (
              empleados.map((emp) => (
                <tr key={emp.id_empleado}>
                  <td>{emp.cedula}</td>
                  <td>{emp.nombres}</td>
                  <td>{emp.apellidos}</td>
                  <td>{emp.cargo}</td>
                  <td>
                    <span className={`badge ${emp.estado === 'activo' ? 'bg-success' : 'bg-secondary'}`}>
                      {emp.estado}
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