# SIA - Sistema Inteligente de Asistencia

Sistema de control de asistencia mediante reconocimiento facial en tiempo real, desarrollado con Python, FastAPI, TensorFlow/Keras y React.

---

## Tecnologías

### Backend
- Python 3.10
- FastAPI + Uvicorn
- TensorFlow / Keras (Red Neuronal Convolucional)
- OpenCV (detección de rostros)
- MySQL (XAMPP / MariaDB)
- JWT (autenticación)

### Frontend
- React + Vite
- Tailwind CSS
- React Router DOM
- Axios
- XLSX (exportación a Excel)

---

## Inteligencia Artificial — Red Neuronal Convolucional (CNN)

El sistema utiliza una **Red Neuronal Convolucional (CNN)** para el reconocimiento facial. Este tipo de red neuronal es especialmente efectiva para el procesamiento de imágenes, ya que aprende a detectar automáticamente patrones visuales como bordes, texturas y rasgos faciales.

### Arquitectura del modelo

```
Imagen de entrada (100x100 píxeles RGB)
        ↓
Conv2D (32 filtros, 3x3) + ReLU     → Detecta bordes y formas básicas
        ↓
MaxPooling2D (2x2)                   → Reduce dimensiones
        ↓
Conv2D (64 filtros, 3x3) + ReLU     → Detecta características más complejas
        ↓
MaxPooling2D (2x2)                   → Reduce dimensiones
        ↓
Conv2D (128 filtros, 3x3) + ReLU    → Detecta rasgos faciales específicos
        ↓
MaxPooling2D (2x2)                   → Reduce dimensiones
        ↓
Flatten                              → Convierte a vector 1D
        ↓
Dense (256 neuronas) + ReLU         → Aprende combinaciones de rasgos
        ↓
Dropout (50%)                        → Evita sobreajuste
        ↓
Dense (N clases) + Softmax          → Identifica al empleado
```

### Proceso de entrenamiento

1. Se capturan mínimo 10 fotos del rostro del empleado (recomendado 30)
2. OpenCV detecta el rostro y lo recorta a 100x100 píxeles
3. Los píxeles se normalizan (divididos entre 255)
4. El modelo CNN aprende a distinguir entre los rostros registrados
5. Se guarda el modelo `.keras` y las etiquetas `.pkl`

### Proceso de reconocimiento

1. La cámara captura un frame
2. OpenCV detecta si hay un rostro en la imagen
3. El rostro se pasa al modelo CNN
4. El modelo devuelve la predicción con un porcentaje de confianza
5. Si la confianza es ≥ 97%, se registra la asistencia automáticamente
6. Si la confianza es menor, se rechaza como "desconocido"

---

## Estructura del proyecto

```
Proyecto-sia/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py              # Autenticación JWT
│   │   │   ├── empleados.py         # CRUD empleados
│   │   │   ├── horarios.py          # Gestión de horarios
│   │   │   ├── asistencias.py       # Registro de asistencia
│   │   │   ├── reportes.py          # Reportes e incidencias
│   │   │   ├── reconocimiento.py    # API de reconocimiento facial
│   │   │   └── captura.py           # Captura de rostros y entrenamiento
│   │   ├── services/
│   │   │   ├── auth.py              # Lógica JWT y hashing
│   │   │   ├── utils.py             # Utilidades
│   │   │   ├── captura_rostro.py    # Captura de imágenes faciales
│   │   │   ├── entrenar_modelo.py   # Entrenamiento CNN
│   │   │   └── reconocimiento.py    # Reconocimiento en tiempo real
│   │   ├── database.py              # Conexión MySQL
│   │   └── main.py                  # App principal FastAPI
│   ├── rostros_dataset/             # Imágenes de entrenamiento por empleado
│   ├── modelo_entrenado/            # Modelo .keras y etiquetas .pkl
│   └── venv/                        # Entorno virtual Python
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx           # Sidebar de navegación
    │   │   └── Layout.jsx           # Layout general
    │   ├── context/
    │   │   ├── AuthContext.jsx      # Manejo de autenticación
    │   │   └── ThemeContext.jsx     # Dark/Light mode
    │   ├── pages/
    │   │   ├── Login.jsx            # Página de login
    │   │   ├── Dashboard.jsx        # Dashboard con estadísticas
    │   │   ├── Empleados.jsx        # Gestión de empleados + captura rostro
    │   │   ├── Horarios.jsx         # Gestión de horarios
    │   │   ├── Asistencias.jsx      # Control de asistencias
    │   │   ├── Reportes.jsx         # Reportes e incidencias
    │   │   └── Quiosco.jsx          # Quiosco de reconocimiento facial
    │   └── services/
    │       └── api.js               # Configuración Axios
    └── index.html
```

---

## Instalación

### Requisitos previos
- Python 3.10
- XAMPP con MySQL/MariaDB
- Node.js 18+

### Backend

1. Entra a la carpeta backend:
```bash
cd Proyecto-sia/backend
```

2. Crea y activa el entorno virtual:
```bash
python -m venv venv
venv\Scripts\activate
```

3. Instala las dependencias:
```bash
pip install opencv-python fastapi uvicorn mysql-connector-python python-jose passlib bcrypt tensorflow keras scikit-learn pillow python-multipart bcrypt==4.0.1
```

4. Inicia XAMPP y asegúrate de que MySQL esté corriendo.

5. Importa la base de datos:
   - Abre `localhost/phpmyadmin`
   - Crea una base de datos llamada `sia_asistencia`
   - Importa el archivo `sia_asistencia.sql`

6. Inicia el servidor:
```bash
uvicorn app.main:app --reload
```

7. Accede a la documentación interactiva en:
```
http://127.0.0.1:8000/docs
```

### Frontend

1. Entra a la carpeta frontend:
```bash
cd Proyecto-sia/frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

4. Accede en el navegador en:
```
http://localhost:5173
```

---

## Uso del sistema

### 1. Crear usuario administrador
```
POST /auth/crear-admin
{
  "usuario": "admin",
  "password": "tu_password"
}
```

### 2. Registrar empleado y capturar rostro
- Ve a la página **Empleados**
- Crea un nuevo empleado
- Haz clic en **📷 Capturar rostro**
- Toma mínimo 10 fotos con la cámara o súbelas desde tu PC
- Presiona **🧠 Entrenar modelo**
- Reinicia uvicorn para cargar el nuevo modelo

### 3. Registrar asistencia
- Usa el **Quiosco** (`/quiosco`) para reconocimiento facial automático
- O registra manualmente desde **Asistencias**

---

## Endpoints principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /auth/login | Iniciar sesión |
| POST | /auth/crear-admin | Crear usuario admin |
| GET | /empleados/ | Listar empleados |
| POST | /empleados/ | Crear empleado |
| POST | /horarios/ | Crear horario |
| POST | /horarios/asignar | Asignar horario a empleado |
| GET | /horarios/empleado/{id} | Ver horario de empleado |
| POST | /asistencias/registrar/{id} | Registrar asistencia |
| GET | /asistencias/hoy | Ver asistencias del día |
| GET | /reportes/asistencias | Reporte por rango de fechas |
| GET | /reportes/incidencias | Reporte de incidencias |
| GET | /reportes/resumen/{id} | Resumen de empleado |
| PUT | /reportes/incidencias/{id} | Editar incidencia |
| POST | /reconocimiento/identificar | Identificar rostro desde imagen |
| POST | /captura/foto/{id} | Guardar foto de empleado |
| POST | /captura/entrenar | Entrenar modelo CNN |

---

## Lógica de registro de asistencia

El sistema detecta automáticamente el tipo de registro según el estado del empleado en el día:

| Llamada | Registro |
|--------|----------|
| 1ra vez del día | Entrada |
| 2da vez | Salida a almuerzo |
| 3ra vez | Regreso de almuerzo |
| 4ta vez | Salida final |

---

## Incidencias automáticas

| Incidencia | Condición |
|-----------|-----------|
| Retardo | Llegada después de hora de entrada + tolerancia |
| Exceso de almuerzo | Almuerzo mayor a 60 minutos |
| Salida anticipada | Salida antes de la hora establecida |
| Jornada incompleta | Sin registro de salida (editable por admin) |

---

## Funcionalidades del frontend

- 🔐 Login con JWT y protección de rutas
- 🌙 Dark mode / Light mode
- 🏠 Dashboard con estadísticas en tiempo real
- 👥 Gestión de empleados con captura de rostro integrada
- 🕐 Gestión de horarios y asignación a empleados
- ✅ Control de asistencias del día
- 📊 Reportes con exportación a Excel
- 🎥 Quiosco de reconocimiento facial a pantalla completa

---

## Proponente
**Elena Perez** — Carrera de Informática, 2026
