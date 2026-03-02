import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Reconocimiento() {
  const [activo, setActivo] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    verificarEstado()
  }, [])

  const verificarEstado = async () => {
    try {
      const r = await api.get('/reconocimiento/estado')
      setActivo(r.data.activo)
    } catch (err) {
      console.error(err)
    }
  }

  const handleIniciar = async () => {
    setCargando(true)
    try {
      const r = await api.post('/reconocimiento/iniciar')
      setMensaje(r.data.mensaje)
      setActivo(true)
    } catch (err) {
      setMensaje('Error al iniciar')
    } finally {
      setCargando(false)
    }
  }

  const handleDetener = async () => {
    setCargando(true)
    try {
      const r = await api.post('/reconocimiento/detener')
      setMensaje(r.data.mensaje)
      setActivo(false)
    } catch (err) {
      setMensaje('Error al detener')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div>
      <h4 className="mb-3">Reconocimiento Facial</h4>

      {mensaje && <div className="alert alert-info py-2">{mensaje}</div>}

      <div className="card p-4" style={{ maxWidth: '400px' }}>
        <div className="d-flex align-items-center mb-4">
          <span className="me-2">Estado:</span>
          <span className={`badge ${activo ? 'bg-success' : 'bg-secondary'}`}>
            {activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {!activo ? (
          <button className="btn btn-success w-100" onClick={handleIniciar} disabled={cargando}>
            {cargando ? 'Iniciando...' : '▶ Iniciar Reconocimiento'}
          </button>
        ) : (
          <button className="btn btn-danger w-100" onClick={handleDetener} disabled={cargando}>
            {cargando ? 'Deteniendo...' : '⏹ Detener Reconocimiento'}
          </button>
        )}

        <p className="text-muted mt-3 small">
          Al iniciar, se abrirá la cámara del PC y el sistema registrará automáticamente la asistencia al detectar un rostro conocido.
        </p>
      </div>
    </div>
  )
}