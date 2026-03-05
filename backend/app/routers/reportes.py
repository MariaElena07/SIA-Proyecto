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
        # Asistencias del período
        cursor.execute("""
            SELECT a.fecha, a.hora_entrada, a.hora_salida, a.estado, a.horas_trabajadas
            FROM asistencias a
            WHERE a.id_empleado = %s AND a.fecha BETWEEN %s AND %s
            ORDER BY a.fecha
        """, (id_empleado, fecha_inicio, fecha_fin))
        asistencias = cursor.fetchall()

        # Incidencias del período
        cursor.execute("""
            SELECT i.tipo, i.minutos, i.observacion, a.fecha
            FROM incidencias i
            JOIN asistencias a ON i.id_asistencia = a.id_asistencia
            WHERE a.id_empleado = %s AND a.fecha BETWEEN %s AND %s
            ORDER BY a.fecha
        """, (id_empleado, fecha_inicio, fecha_fin))
        incidencias = cursor.fetchall()

        # Días libres del período
        cursor.execute("""
            SELECT fecha, motivo FROM dias_libres
            WHERE id_empleado = %s AND fecha BETWEEN %s AND %s
            ORDER BY fecha
        """, (id_empleado, fecha_inicio, fecha_fin))
        dias_libres = cursor.fetchall()
        dias_libres_set = {str(d['fecha']) for d in dias_libres}

        # Agrupar incidencias por fecha
        inc_por_fecha = {}
        for inc in incidencias:
            f = str(inc['fecha'])
            if f not in inc_por_fecha:
                inc_por_fecha[f] = []
            inc_por_fecha[f].append(inc)

        # Construir detalle por día
        asistencias_map = {str(a['fecha']): a for a in asistencias}
        detalle = []
        for a in asistencias:
            fecha_str = str(a['fecha'])
            detalle.append({
                "fecha": fecha_str,
                "estado": a['estado'],
                "hora_entrada": str(a['hora_entrada']) if a['hora_entrada'] else None,
                "hora_salida": str(a['hora_salida']) if a['hora_salida'] else None,
                "horas_trabajadas": float(a['horas_trabajadas']) if a['horas_trabajadas'] else 0,
                "incidencias": inc_por_fecha.get(fecha_str, [])
            })

        # Totales
        dias_asistidos = sum(1 for a in asistencias if a['estado'] != 'ausente')
        dias_ausentes = sum(1 for a in asistencias if a['estado'] == 'ausente')
        dias_incompletos = sum(1 for a in asistencias if a['estado'] == 'incompleto')
        total_horas = sum(float(a['horas_trabajadas'] or 0) for a in asistencias)

        tardanzas = sum(1 for i in incidencias if i['tipo'] == 'retardo')
        almuerzos_ext = sum(1 for i in incidencias if i['tipo'] == 'exceso_almuerzo')
        salidas_anticipadas = sum(1 for i in incidencias if i['tipo'] == 'salida_anticipada')

        return {
            "resumen": {
                "dias_asistidos": dias_asistidos,
                "dias_ausentes": dias_ausentes,
                "dias_libres": len(dias_libres),
                "dias_incompletos": dias_incompletos,
                "total_horas": round(total_horas, 2),
                "tardanzas": tardanzas,
                "almuerzos_extendidos": almuerzos_ext,
                "salidas_anticipadas": salidas_anticipadas,
            },
            "detalle": detalle,
            "dias_libres": [{"fecha": str(d['fecha']), "motivo": d['motivo']} for d in dias_libres]
        }
    finally:
        conn.close()

@router.post("/ausencias/registrar")
def registrar_ausencias(fecha_str: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        fecha = date.fromisoformat(fecha_str) if fecha_str else date.today()

        # Obtener empleados activos con horario asignado
        cursor.execute("""
            SELECT DISTINCT e.id_empleado, e.nombres, e.apellidos
            FROM empleados e
            JOIN empleado_horario eh ON e.id_empleado = eh.id_empleado
            WHERE e.estado = 'activo'
            AND eh.fecha_inicio <= %s
        """, (fecha,))
        empleados_con_horario = cursor.fetchall()

        # Obtener empleados que sí asistieron ese día
        cursor.execute("SELECT id_empleado FROM asistencias WHERE fecha = %s", (fecha,))
        asistieron = {r['id_empleado'] for r in cursor.fetchall()}

        # Obtener empleados con día libre ese día
        cursor.execute("SELECT id_empleado FROM dias_libres WHERE fecha = %s", (fecha,))
        dia_libre = {r['id_empleado'] for r in cursor.fetchall()}

        ausentes = []
        cursor2 = conn.cursor()

        for emp in empleados_con_horario:
            id_emp = emp['id_empleado']

            # Saltar si asistió o tiene día libre
            if id_emp in asistieron or id_emp in dia_libre:
                continue

            # Verificar si ya tiene incidencia de ausencia ese día
            cursor.execute("""
                SELECT i.id_incidencia FROM incidencias i
                JOIN asistencias a ON i.id_asistencia = a.id_asistencia
                WHERE a.id_empleado = %s AND a.fecha = %s AND i.tipo = 'ausencia'
            """, (id_emp, fecha))

            if not cursor.fetchone():
                cursor2.execute("""
                    INSERT INTO asistencias (id_empleado, fecha, estado)
                    VALUES (%s, %s, 'ausente')
                """, (id_emp, fecha))
                id_asistencia = cursor2.lastrowid

                cursor2.execute("""
                    INSERT INTO incidencias (id_asistencia, tipo, minutos, observacion)
                    VALUES (%s, 'ausencia', 0, 'No se presentó a trabajar')
                """, (id_asistencia,))
                conn.commit()
                ausentes.append(f"{emp['nombres']} {emp['apellidos']}")

        return {
            "fecha": str(fecha),
            "ausentes_registrados": len(ausentes),
            "empleados": ausentes
        }
    finally:
        conn.close()

@router.get("/ausencias")
def reporte_ausencias(
    fecha_inicio: date,
    fecha_fin: date,
    id_empleado: Optional[int] = None
):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if id_empleado:
            cursor.execute("""
                SELECT e.nombres, e.apellidos, a.fecha, i.observacion
                FROM incidencias i
                JOIN asistencias a ON i.id_asistencia = a.id_asistencia
                JOIN empleados e ON a.id_empleado = e.id_empleado
                WHERE i.tipo = 'ausencia'
                AND a.fecha BETWEEN %s AND %s
                AND a.id_empleado = %s
                ORDER BY a.fecha DESC
            """, (fecha_inicio, fecha_fin, id_empleado))
        else:
            cursor.execute("""
                SELECT e.nombres, e.apellidos, a.fecha, i.observacion
                FROM incidencias i
                JOIN asistencias a ON i.id_asistencia = a.id_asistencia
                JOIN empleados e ON a.id_empleado = e.id_empleado
                WHERE i.tipo = 'ausencia'
                AND a.fecha BETWEEN %s AND %s
                ORDER BY a.fecha DESC, e.apellidos ASC
            """, (fecha_inicio, fecha_fin))

        return cursor.fetchall()
    finally:
        conn.close()