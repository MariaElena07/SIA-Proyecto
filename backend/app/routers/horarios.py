from fastapi import APIRouter, HTTPException
from app.database import get_connection
from app.schemas.horario import HorarioCreate, AsignarHorario
from app.services.utils import timedelta_to_str

router = APIRouter(prefix="/horarios", tags=["Horarios"])

@router.get("/")
def listar_horarios():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM horarios")
    horarios = cursor.fetchall()
    conn.close()
    return horarios

@router.post("/")
def crear_horario(horario: HorarioCreate):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO horarios (nombre_horario, hora_entrada, hora_salida, tolerancia_minutos) VALUES (%s, %s, %s, %s)",
            (horario.nombre_horario, horario.hora_entrada, horario.hora_salida, horario.tolerancia_minutos)
        )
        conn.commit()
        return {"mensaje": "Horario creado exitosamente", "id": cursor.lastrowid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@router.post("/asignar")
def asignar_horario(datos: AsignarHorario):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Verificar que el empleado existe
        cursor.execute("SELECT id_empleado FROM empleados WHERE id_empleado = %s", (datos.id_empleado,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
        
        # Verificar que el horario existe
        cursor.execute("SELECT id_horario FROM horarios WHERE id_horario = %s", (datos.id_horario,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Horario no encontrado")

        cursor.execute(
            "INSERT INTO empleado_horario (id_empleado, id_horario, fecha_inicio, fecha_fin) VALUES (%s, %s, %s, %s)",
            (datos.id_empleado, datos.id_horario, datos.fecha_inicio, datos.fecha_fin)
        )
        conn.commit()
        return {"mensaje": "Horario asignado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@router.get("/empleado/{id_empleado}")
def horario_de_empleado(id_empleado: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT h.id_horario, h.nombre_horario, h.hora_entrada, h.hora_salida, 
               h.tolerancia_minutos, eh.fecha_inicio, eh.fecha_fin
        FROM empleado_horario eh
        JOIN horarios h ON eh.id_horario = h.id_horario
        WHERE eh.id_empleado = %s
        ORDER BY eh.fecha_inicio DESC
        LIMIT 1
    """, (id_empleado,))
    horario = cursor.fetchone()
    conn.close()
    if not horario:
        raise HTTPException(status_code=404, detail="Este empleado no tiene horario asignado")
    
    # Convertir timedelta a string legible
    horario["hora_entrada"] = timedelta_to_str(horario["hora_entrada"])
    horario["hora_salida"] = timedelta_to_str(horario["hora_salida"])
    return horario