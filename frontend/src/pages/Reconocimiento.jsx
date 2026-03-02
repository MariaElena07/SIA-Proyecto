import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Reconocimiento() {
  const [activo, setActivo] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('success')
  const [cargando, setCargando] = useState(false)

  useEffect(() => { verificarEstado() }, [])

  const verificarEstado = async () => {
    try {
      const r = await api.get('/reconocimiento/estado')
      setActivo(r.data.activo)
    } catch (err) { console.error(err) }
  }

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje(texto)
    setTipoMensaje(tipo)
    setTimeout(() => setMensaje(''), 4000)
  }

  const handleIniciar = async () => {
    setCargando(true)
    try {
      const r = await api.post('/reconocimiento/iniciar')
      mostrarMensaje(r.data.mensaje)
      setActivo(true)
    } catch (err) {
      mostrarMensaje('Error al iniciar reconocimiento', 'error')
    } finally {
      setCargando(false)
    }
  }

  const handleDetener = async () => {
    setCargando(true)
    try {
      const r = await api.post('/reconocimiento/detener')
      mostrarMensaje(r.data.mensaje)
      setActivo(false)
    } catch (err) {
      mostrarMensaje('Error al detener reconocimiento', 'error')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reconocimiento Facial</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Control del sistema de reconocimiento facial en tiempo real
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card de control */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8">
          <div className="flex flex-col items-center text-center">
            {/* Indicador visual */}
            <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${
              activo
                ? 'bg-green-100 dark:bg-green-900/30 ring-4 ring-green-400 ring-offset-4 dark:ring-offset-gray-900'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <span className="text-5xl">{activo ? '🎥' : '📷'}</span>
            </div>

            {/* Estado */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${activo ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="font-semibold text-gray-900 dark:text-white">
                {activo ? 'Sistema activo' : 'Sistema inactivo'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              {activo
                ? 'La cámara está encendida y registrando asistencia automáticamente'
                : 'Presiona el botón para activar la cámara y el reconocimiento facial'}
            </p>

            {/* Botón */}
            {!activo ? (
              <button
                onClick={handleIniciar}
                disabled={cargando}
                className="w-full max-w-xs px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {cargando ? 'Iniciando...' : '▶ Iniciar Reconocimiento'}
              </button>
            ) : (
              <button
                onClick={handleDetener}
                disabled={cargando}
                className="w-full max-w-xs px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {cargando ? 'Deteniendo...' : '⏹ Detener Reconocimiento'}
              </button>
            )}
          </div>
        </div>

        {/* Card informativa */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">¿Cómo funciona?</h3>
          <div className="space-y-4">
            {[
              { icono: '1️⃣', titulo: 'Activa la cámara', desc: 'El sistema abre la cámara del PC y comienza a detectar rostros en tiempo real.' },
              { icono: '2️⃣', titulo: 'Reconoce al empleado', desc: 'El modelo identifica al empleado con un nivel de confianza mínimo del 85%.' },
              { icono: '3️⃣', titulo: 'Registro automático', desc: 'Se registra entrada, salida de almuerzo, regreso o salida final según corresponda.' },
              { icono: '4️⃣', titulo: 'Detecta incidencias', desc: 'El sistema registra retardos, exceso de almuerzo y salidas anticipadas automáticamente.' },
            ].map((item) => (
              <div key={item.titulo} className="flex gap-3">
                <span className="text-xl flex-shrink-0">{item.icono}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.titulo}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}