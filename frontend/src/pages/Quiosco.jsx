import { useState, useEffect, useRef } from 'react'
import api from '../services/api'

export default function Quiosco() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [hora, setHora] = useState('')
  const [fecha, setFecha] = useState('')
  const [estado, setEstado] = useState('esperando') // esperando, procesando, reconocido, error
  const [empleado, setEmpleado] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [camaraLista, setCamaraLista] = useState(false)

  // Reloj
  useEffect(() => {
    const actualizarReloj = () => {
      const ahora = new Date()
      setHora(ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
      setFecha(ahora.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
    }
    actualizarReloj()
    const timer = setInterval(actualizarReloj, 1000)
    return () => clearInterval(timer)
  }, [])

  // Iniciar cámara
  useEffect(() => {
    iniciarCamara()
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  const iniciarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      videoRef.current.srcObject = stream
      videoRef.current.play()
      setCamaraLista(true)
    } catch (err) {
      setEstado('error')
      setMensaje('No se pudo acceder a la cámara')
    }
  }

  const handleRegistrar = async () => {
    if (!camaraLista || estado === 'procesando') return
    setEstado('procesando')
    setEmpleado(null)
    setMensaje('')

    // Capturar foto
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    ctx.drawImage(videoRef.current, 0, 0)
    const imagen = canvas.toDataURL('image/jpeg', 0.9)

    try {
      // Identificar rostro
      const r = await api.post('/reconocimiento/identificar', { imagen })

      if (r.data.identificado) {
        setEmpleado(r.data)

        // Registrar asistencia
        const resp = await api.post(`/asistencias/registrar/${r.data.id_empleado}`)
        setMensaje(resp.data.mensaje || 'Asistencia registrada')
        setEstado('reconocido')

        // Volver a esperar después de 5 segundos
        setTimeout(() => {
          setEstado('esperando')
          setEmpleado(null)
          setMensaje('')
        }, 5000)
      } else {
        setEstado('error')
        setMensaje('Rostro no reconocido. Intenta de nuevo.')
        setTimeout(() => {
          setEstado('esperando')
          setMensaje('')
        }, 3000)
      }
    } catch (err) {
      setEstado('error')
      setMensaje('Error al procesar. Intenta de nuevo.')
      setTimeout(() => {
        setEstado('esperando')
        setMensaje('')
      }, 3000)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-950 flex overflow-hidden">

      {/* Cámara - lado izquierdo */}
      <div className="w-1/2 flex items-center justify-center p-8">
        <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl">
          <video
            ref={videoRef}
            className="w-full h-full object-cover scale-x-[-1]"
            muted
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Overlay de estado */}
          <div className={`absolute inset-0 border-4 rounded-3xl transition-colors duration-500 ${
            estado === 'reconocido' ? 'border-green-400' :
            estado === 'procesando' ? 'border-indigo-400' :
            estado === 'error' ? 'border-red-400' :
            'border-white/20'
          }`} />

          {/* Overlay procesando */}
          {estado === 'procesando' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-3xl">
              <div className="text-center text-white">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium">Procesando...</p>
              </div>
            </div>
          )}

          {/* Barra inferior */}
          <div className={`absolute bottom-0 left-0 right-0 py-4 text-center transition-colors duration-300 ${
            estado === 'reconocido' ? 'bg-green-500' :
            estado === 'error' ? 'bg-red-500' :
            estado === 'procesando' ? 'bg-indigo-600' :
            'bg-indigo-600'
          }`}>
            {estado === 'esperando' && (
              <button
                onClick={handleRegistrar}
                className="text-white font-semibold text-sm w-full"
              >
                📸 Registrar asistencia
              </button>
            )}
            {estado === 'procesando' && (
              <p className="text-white font-semibold text-sm">Analizando rostro...</p>
            )}
            {estado === 'reconocido' && (
              <p className="text-white font-semibold text-sm">✓ Asistencia registrada</p>
            )}
            {estado === 'error' && (
              <p className="text-white font-semibold text-sm">✗ {mensaje}</p>
            )}
          </div>
        </div>
      </div>

      {/* Info - lado derecho */}
      <div className="w-1/2 flex flex-col items-center justify-center p-8 text-white relative">

        {/* Icono de estado */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
          estado === 'reconocido' ? 'bg-green-500' :
          estado === 'error' ? 'bg-red-500' :
          estado === 'procesando' ? 'bg-indigo-600' :
          'bg-white/10'
        }`}>
          <span className="text-3xl">
            {estado === 'reconocido' ? '✓' :
             estado === 'error' ? '✗' :
             estado === 'procesando' ? '⏳' : '🎥'}
          </span>
        </div>

        {/* Hora */}
        <p className="text-7xl font-bold tracking-tight mb-2">{hora}</p>
        <p className="text-gray-400 text-lg mb-8 capitalize">{fecha}</p>

        {/* Nombre del empleado o instrucción */}
        {empleado ? (
          <div className="text-center">
            <div className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur border border-white/20 mb-3">
              <p className="text-xl font-semibold">{empleado.nombre}</p>
              <p className="text-sm text-gray-400 mt-1">Confianza: {empleado.confianza}%</p>
            </div>
            {mensaje && (
              <p className="text-green-400 text-sm font-medium">{mensaje}</p>
            )}
          </div>
        ) : (
          <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-gray-400 text-sm">
              {estado === 'error' ? mensaje : 'Presiona el botón para registrar tu asistencia'}
            </p>
          </div>
        )}

        {/* Botón volver */}
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
        >
          ← Volver
        </button>
      </div>
    </div>
  )
}