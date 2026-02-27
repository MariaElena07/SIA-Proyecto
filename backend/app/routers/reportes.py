from fastapi import APIRouter, HTTPException
from app.database import get_connection
from app.services.utils import timedelta_to_str
from datetime import date
from typing import Optional
from pydantic import BaseModel

router = APIRouter(prefix="/reportes", tags=["Reportes"])

class EditarIncidencia(BaseModel):
    observacion: str

@router.get("/asistencias")
def reporte_asistencias(
    fecha_inicio: date,
    fecha_fin: date,
    id_empleado: Optional[int] = None
):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if id_empleado:
            cursor.execute("""
                SELECT e.nombres, e.apellidos, a.fecha, a.hora_entrada, 
                       a.hora_salida_almuerzo, a.hora_regreso_almuerzo,
                       a.hora_salida, a.horas_trabajadas, a.estado
                FROM asistencias a
                JOIN empleados e ON a.id_empleado = e.id_empleado
                WHERE a.fecha BETWEEN %s AND %s AND a.id_empleado = %s
                ORDER BY a.fecha DESC
            """, (fecha_inicio, fecha_fin, id_empleado))
        else:
            cursor.execute("""
                SELECT e.nombres, e.apellidos, a.fecha, a.hora_entrada,
                       a.hora_salida_almuerzo, a.hora_regreso_almuerzo,
                       a.hora_salida, a.horas_trabajadas, a.estado
                FROM asistencias a
                JOIN empleados e ON a.id_empleado = e.id_empleado
                WHERE a.fecha BETWEEN %s AND %s
                ORDER BY a.fecha DESC, e.apellidos ASC
            """, (fecha_inicio, fecha_fin))

        registros = cursor.fetchall()
        campos_time = ["hora_entrada", "hora_salida_almuerzo", "hora_regreso_almuerzo", "hora_salida"]
        for r in registros:
            for campo in campos_time:
                r[campo] = timedelta_to_str(r[campo])
        return registros
    finally:
        conn.close()

@router.get("/incidencias")
def reporte_incidencias(
    fecha_inicio: date,
    fecha_fin: date,
    id_empleado: Optional[int] = None
):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if id_empleado:
            cursor.execute("""
                SELECT e.nombres, e.apellidos, a.fecha, i.tipo, i.minutos, i.observacion, i.id_incidencia
                FROM incidencias i
                JOIN asistencias a ON i.id_asistencia = a.id_asistencia
                JOIN empleados e ON a.id_empleado = e.id_empleado
                WHERE a.fecha BETWEEN %s AND %s AND a.id_empleado = %s
                ORDER BY a.fecha DESC
            """, (fecha_inicio, fecha_fin, id_empleado))
        else:
            cursor.execute("""
                SELECT e.nombres, e.apellidos, a.fecha, i.tipo, i.minutos, i.observacion, i.id_incidencia
                FROM incidencias i
                JOIN asistencias a ON i.id_asistencia = a.id_asistencia
                JOIN empleados e ON a.id_empleado = e.id_empleado
                WHERE a.fecha BETWEEN %s AND %s
                ORDER BY a.fecha DESC, e.apellidos ASC
            """, (fecha_inicio, fecha_fin))

        return cursor.fetchall()
    finally:
        conn.close()

@router.put("/incidencias/{id_incidencia}")
def editar_incidencia(id_incidencia: int, datos: EditarIncidencia):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id_incidencia FROM incidencias WHERE id_incidencia = %s", (id_incidencia,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Incidencia no encontrada")

        cursor.execute(
            "UPDATE incidencias SET observacion = %s WHERE id_incidencia = %s",
            (datos.observacion, id_incidencia)
        )
        conn.commit()
        return {"mensaje": "Incidencia actualizada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@router.get("/resumen/{id_empleado}")
def resumen_empleado(id_empleado: int, fecha_inicio: date, fecha_fin: date):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT 
                COUNT(*) as dias_asistidos,
                SUM(horas_trabajadas) as total_horas,
                SUM(CASE WHEN estado = 'incompleto' THEN 1 ELSE 0 END) as dias_incompletos
            FROM asistencias
            WHERE id_empleado = %s AND fecha BETWEEN %s AND %s
        """, (id_empleado, fecha_inicio, fecha_fin))
        resumen = cursor.fetchone()

        cursor.execute("""
            SELECT tipo, COUNT(*) as cantidad, SUM(minutos) as total_minutos
            FROM incidencias i
            JOIN asistencias a ON i.id_asistencia = a.id_asistencia
            WHERE a.id_empleado = %s AND a.fecha BETWEEN %s AND %s
            GROUP BY tipo
        """, (id_empleado, fecha_inicio, fecha_fin))
        incidencias = cursor.fetchall()

        return {
            "resumen_asistencia": resumen,
            "incidencias_por_tipo": incidencias
        }
    finally:
        conn.close()