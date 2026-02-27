# SIA - Sistema Inteligente de Asistencia

Sistema de control de asistencia mediante reconocimiento facial en tiempo real, desarrollado con Python, FastAPI, TensorFlow y MySQL.

## Tecnologías

- Python 3.10
- FastAPI + Uvicorn
- TensorFlow / Keras
- OpenCV
- MySQL (XAMPP / MariaDB)
- React (Frontend - en desarrollo)

## Estructura del proyecto

```
Proyecto-sia/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py           # Autenticación JWT
│   │   │   ├── empleados.py      # CRUD empleados
│   │   │   ├── horarios.py       # Gestión de horarios
│   │   │   ├── asistencias.py    # Registro de asistencia
│   │   │   └── reportes.py       # Reportes e incidencias
│   │   ├── schemas/
│   │   │   ├── empleado.py
│   │   │   └── horario.py
│   │   ├── services/
│   │   │   ├── auth.py           # Lógica JWT y hashing
│   │   │   ├── utils.py          # Utilidades (timedelta, etc.)
│   │   │   ├── captura_rostro.py # Captura de imágenes faciales
│   │   │   ├── entrenar_modelo.py# Entrenamiento CNN
│   │   │   └── reconocimiento.py # Reconocimiento en tiempo real
│   │   ├── database.py           # Conexión MySQL
│   │   └── main.py               # App principal FastAPI
│   ├── rostros_dataset/          # Imágenes de entrenamiento por empleado
│   ├── modelo_entrenado/         # Modelo .keras y etiquetas .pkl
│   ├── venv/                     # Entorno virtual Python
│   └── test_camara.py            # Script de prueba de cámara
└── frontend/                     # React (en desarrollo)
```

## Instalación

### Requisitos previos
- Python 3.10
- XAMPP con MySQL/MariaDB
- Node.js (para el frontend)

### Backend

1. Clona el repositorio y entra a la carpeta backend:
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
pip install opencv-python fastapi uvicorn mysql-connector-python python-jose passlib bcrypt tensorflow keras scikit-learn pillow mtcnn python-multipart bcrypt==4.0.1
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

## Uso

### Crear usuario admin
```
POST /auth/crear-admin
{
  "usuario": "admin",
  "password": "tu_password"
}
```

### Registrar empleado y capturar rostro
```bash
python app/services/captura_rostro.py
```

### Entrenar modelo
```bash
python app/services/entrenar_modelo.py
```

### Iniciar reconocimiento facial
```bash
python app/services/reconocimiento.py
```

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

## Lógica de registro de asistencia

El sistema detecta automáticamente el tipo de registro según el estado del empleado:

1. Sin registro hoy → **Entrada**
2. Con entrada, sin salida almuerzo → **Salida almuerzo**
3. Con salida almuerzo, sin regreso → **Regreso almuerzo**
4. Con regreso almuerzo, sin salida final → **Salida final**

## Incidencias automáticas

- **Retardo:** llegada después de la hora de entrada + tolerancia
- **Exceso de almuerzo:** almuerzo mayor a 60 minutos
- **Salida anticipada:** salida antes de la hora establecida
- **Jornada incompleta:** sin registro de salida (editable por admin)

## Proponente
Elena Perez — Carrera de Informática, 2026
