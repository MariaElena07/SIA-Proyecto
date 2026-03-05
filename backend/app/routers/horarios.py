from fastapi import APIRouter, HTTPException
from datetime import date, timedelta
from app.database import get_connection
from app.schemas.horario import HorarioCreate, AsignarHorario
from app.services.utils import timedelta_to_str
from pydantic import BaseModel
from typing import List, Optional

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

@router.get("/semana/{id_empleado}")
def horario_semana(id_empleado: int, fecha_inicio: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Obtener horario semanal personalizado
        cursor.execute("""
            SELECT ehs.dia_semana, h.hora_entrada, h.hora_salida, h.nombre_horario
            FROM empleado_horario_semanal ehs
            JOIN horarios h ON ehs.id_horario = h.id_horario
            WHERE ehs.id_empleado = %s
        """, (id_empleado,))
        horario_semanal = {r['dia_semana']: r for r in cursor.fetchall()}

        # Horario general como fallback
        cursor.execute("""
            SELECT h.hora_entrada, h.hora_salida, h.nombre_horario
            FROM empleado_horario eh
            JOIN horarios h ON eh.id_horario = h.id_horario
            WHERE eh.id_empleado = %s
            ORDER BY eh.fecha_inicio DESC LIMIT 1
        """, (id_empleado,))
        horario_general = cursor.fetchone()

        # Días libres de la semana
        fecha_fin = date.fromisoformat(fecha_inicio) + timedelta(days=6)
        cursor.execute("""
            SELECT fecha, motivo FROM dias_libres
            WHERE id_empleado = %s AND fecha BETWEEN %s AND %s
        """, (id_empleado, fecha_inicio, str(fecha_fin)))
        dias_libres = {str(r['fecha']): r['motivo'] for r in cursor.fetchall()}

        # Asistencias de la semana
        cursor.execute("""
            SELECT fecha, hora_entrada, hora_salida, estado
            FROM asistencias
            WHERE id_empleado = %s AND fecha BETWEEN %s AND %s
        """, (id_empleado, fecha_inicio, str(fecha_fin)))
        asistencias = {str(r['fecha']): r for r in cursor.fetchall()}

        # Construir los 7 días
        # dia_semana: 1=Lunes ... 7=Domingo (igual que isoweekday)
        dias = []
        for i in range(7):
            fecha = date.fromisoformat(fecha_inicio) + timedelta(days=i)
            fecha_str = str(fecha)
            num_dia = fecha.isoweekday()  # 1=Lunes, 7=Domingo

            dia = {
                "fecha": fecha_str,
                "dia_semana": fecha.strftime("%A"),
                "es_libre": fecha_str in dias_libres,
                "motivo_libre": dias_libres.get(fecha_str, ''),
                "horario": None,
                "asistencia": asistencias.get(fecha_str)
            }

            if not dia['es_libre']:
                h = horario_semanal.get(num_dia) or horario_general
                if h:
                    dia['horario'] = {
                        "nombre": h['nombre_horario'],
                        "entrada": str(h['hora_entrada']),
                        "salida": str(h['hora_salida'])
                    }
            dias.append(dia)

        return {
            "empleado": id_empleado,
            "semana_inicio": fecha_inicio,
            "semana_fin": str(fecha_fin),
            "dias": dias
        }
    finally:
        conn.close()

class HorarioSemanalItem(BaseModel):
    dia_semana: int
    id_horario: int

class HorarioSemanalCreate(BaseModel):
    id_empleado: int
    dias: List[HorarioSemanalItem]

@router.post("/semanal")
def asignar_horario_semanal(data: HorarioSemanalCreate):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        for dia in data.dias:
            cursor.execute("""
                INSERT INTO empleado_horario_semanal (id_empleado, dia_semana, id_horario)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE id_horario = %s
            """, (data.id_empleado, dia.dia_semana, dia.id_horario, dia.id_horario))
        conn.commit()
        return {"mensaje": "Horario semanal asignado exitosamente"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@router.get("/semanal/{id_empleado}")
def obtener_horario_semanal(id_empleado: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT ehs.dia_semana, h.id_horario, h.nombre_horario,
                   h.hora_entrada, h.hora_salida, h.tolerancia_minutos
            FROM empleado_horario_semanal ehs
            JOIN horarios h ON ehs.id_horario = h.id_horario
            WHERE ehs.id_empleado = %s
            ORDER BY ehs.dia_semana
        """, (id_empleado,))
        return cursor.fetchall()
    finally:
        conn.close()