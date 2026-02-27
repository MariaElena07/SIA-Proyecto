from fastapi import APIRouter, HTTPException
from app.database import get_connection
from app.schemas.empleado import EmpleadoCreate

router = APIRouter(prefix="/empleados", tags=["Empleados"])

@router.get("/")
def listar_empleados():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM empleados WHERE estado = 'activo'")
    empleados = cursor.fetchall()
    conn.close()
    return empleados

@router.post("/")
def crear_empleado(empleado: EmpleadoCreate):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO empleados (cedula, nombres, apellidos, cargo) VALUES (%s, %s, %s, %s)",
            (empleado.cedula, empleado.nombres, empleado.apellidos, empleado.cargo)
        )
        conn.commit()
        return {"mensaje": "Empleado creado exitosamente", "id": cursor.lastrowid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()