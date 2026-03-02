import { useState, useEffect, useRef } from 'react'
import api from '../services/api'

function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-lg mx-4 p-6">
        {children}
      </div>
    </div>
  )
}

export default function Empleados() {
  const [empleados, setEmpleados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState('success')
  const [form, setForm] = useState({ cedula: '', nombres: '', apellidos: '', cargo: '' })
  const [guardando, setGuardando] = useState(false)

  // Captura
  const [modalCaptura, setModalCaptura] = useState(false)
  const [empleadoCaptura, setEmpleadoCaptura] = useState(null)
  const [totalFotos, setTotalFotos] = useState(0)
  const [capturando, setCapturando] = useState(false)
  const [entrenando, setEntrenando] = useState(false)
  const [mensajeCaptura, setMensajeCaptura] = useState('')
  const [tipoMensajeCaptura, setTipoMensajeCaptura] = useState('success')
  const videoCapRef = useRef(null)
  const canvasCapRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => { cargarEmpleados() }, [])

  const cargarEmpleados = async () => {
    try {
      const r = await api.get('/empleados/')
      setEmpleados(r.data)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  const handleCrear = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.post('/empleados/', form)
      setMensaje('Empleado creado exitosamente')
      setTipoMensaje('success')
      setForm({ cedula: '', nombres: '', apellidos: '', cargo: '' })
      setMostrarModal(false)
      cargarEmpleados()
    } catch (err) {
      setMensaje('Error al crear empleado')
      setTipoMensaje('error')
    } finally {
      setGuardando(false)
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const abrirCaptura = async (emp) => {
    setEmpleadoCaptura(emp)
    setMensajeCaptura('')
    setModalCaptura(true)
    try {
      const r = await api.get(`/captura/fotos/${emp.id_empleado}`)
      setTotalFotos(r.data.total_fotos)
    } catch (err) { setTotalFotos(0) }
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        videoCapRef.current.srcObject = stream
        videoCapRef.current.play()
        streamRef.current = stream
      } catch (err) {
        setMensajeCaptura('No se pudo acceder a la cámara')
        setTipoMensajeCaptura('error')
      }
    }, 300)
  }

  const cerrarCaptura = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setModalCaptura(false)
    setEmpleadoCaptura(null)
    setTotalFotos(0)
    setMensajeCaptura('')
  }

  const tomarFoto = async () => {
    if (!videoCapRef.current || capturando) return
    setCapturando(true)
    const canvas = canvasCapRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = videoCapRef.current.videoWidth
    canvas.height = videoCapRef.current.videoHeight
    ctx.drawImage(videoCapRef.current, 0, 0)
    const imagen = canvas.toDataURL('image/jpeg', 0.9)
    try {
      const r = await api.post(`/captura/foto/${empleadoCaptura.id_empleado}`, { imagen })
      setTotalFotos(r.data.total_fotos)
      setMensajeCaptura(`✓ Foto ${r.data.total_fotos} guardada`)
      setTipoMensajeCaptura('success')
    } catch (err) {
      setMensajeCaptura(err.response?.data?.detail || 'No se detectó rostro, intenta de nuevo')
      setTipoMensajeCaptura('error')
    } finally {
      setCapturando(false)
    }
  }

  const subirFotos = async (e) => {
    const archivos = Array.from(e.target.files)
    let guardadas = 0
    for (const archivo of archivos) {
      const reader = new FileReader()
      await new Promise((resolve) => {
        reader.onload = async (ev) => {
          try {
            const r = await api.post(`/captura/foto/${empleadoCaptura.id_empleado}`, { imagen: ev.target.result })
            setTotalFotos(r.data.total_fotos)
            guardadas++
          } catch (err) { console.error(err) }
          resolve()
        }
        reader.readAsDataURL(archivo)
      })
    }
    setMensajeCaptura(`✓ ${guardadas} fotos subidas`)
    setTipoMensajeCaptura('success')
  }

  const handleEntrenar = async () => {
    if (totalFotos < 10) {
      setMensajeCaptura('Necesitas al menos 10 fotos para entrenar')
      setTipoMensajeCaptura('error')
      return
    }
    setEntrenando(true)
    try {
      await api.post('/captura/entrenar')
      setMensajeCaptura('✓ Entrenamiento iniciado, puede tomar varios minutos')
      setTipoMensajeCaptura('success')
    } catch (err) {
      setMensajeCaptura('Error al iniciar entrenamiento')
      setTipoMensajeCaptura('error')
    } finally {
      setEntrenando(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Empleados</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{empleados.length} empleados registrados</p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          + Nuevo Empleado
        </button>
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

      {/* Modal Nuevo Empleado */}
      {mostrarModal && (
        <Modal onClose={() => setMostrarModal(false)}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo Empleado</h2>
            <button
              onClick={() => setMostrarModal(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleCrear} className="space-y-4">
            {[
              { name: 'cedula', placeholder: 'Cédula', label: 'Cédula' },
              { name: 'nombres', placeholder: 'Nombres', label: 'Nombres' },
              { name: 'apellidos', placeholder: 'Apellidos', label: 'Apellidos' },
              { name: 'cargo', placeholder: 'Cargo (opcional)', label: 'Cargo' },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {field.label}
                </label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  name={field.name}
                  value={form[field.name]}
                  onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
                  required={field.name !== 'cargo'}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {guardando ? 'Guardando...' : 'Guardar Empleado'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 font-medium">Cédula</th>
                <th className="px-6 py-4 font-medium">Nombres</th>
                <th className="px-6 py-4 font-medium">Apellidos</th>
                <th className="px-6 py-4 font-medium">Cargo</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">Cargando...</td></tr>
              ) : empleados.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No hay empleados registrados</td></tr>
              ) : (
                empleados.map((emp) => (
                  <tr key={emp.id_empleado} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{emp.cedula}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{emp.nombres}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{emp.apellidos}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{emp.cargo || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        emp.estado === 'activo'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {emp.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => abrirCaptura(emp)}
                        className="px-3 py-1.5 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                      >
                        📷 Capturar rostro
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Captura */}
      {modalCaptura && empleadoCaptura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={cerrarCaptura} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Capturar rostro</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {empleadoCaptura.nombres} {empleadoCaptura.apellidos}
                </p>
              </div>
              <button onClick={cerrarCaptura} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
            </div>

            {mensajeCaptura && (
              <div className={`mb-4 px-4 py-2 rounded-xl text-sm font-medium ${
                tipoMensajeCaptura === 'success'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {mensajeCaptura}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Cámara */}
              <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video">
                <video ref={videoCapRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />
                <canvas ref={canvasCapRef} className="hidden" />
              </div>

              {/* Controles */}
              <div className="flex flex-col justify-between">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-center mb-4">
                  <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{totalFotos}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">fotos capturadas</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((totalFotos / 30) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Mínimo 10, recomendado 30</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={tomarFoto}
                    disabled={capturando}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    {capturando ? 'Guardando...' : '📸 Tomar foto'}
                  </button>

                  <label className="w-full py-2.5 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer flex items-center justify-center gap-2">
                    📁 Subir fotos
                    <input type="file" accept="image/*" multiple className="hidden" onChange={subirFotos} />
                  </label>

                  <button
                    onClick={handleEntrenar}
                    disabled={entrenando || totalFotos < 10}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    {entrenando ? 'Entrenando...' : '🧠 Entrenar modelo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}