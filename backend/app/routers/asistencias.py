from fastapi import APIRouter, HTTPException
from app.database import get_connection
from app.services.utils import timedelta_to_str
from datetime import datetime, date

router = APIRouter(prefix="/asistencias", tags=["Asistencias"])

@router.post("/registrar/{id_empleado}")
def registrar_asistencia(id_empleado: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Verificar que el empleado existe
        cursor.execute("SELECT * FROM empleados WHERE id_empleado = %s AND estado = 'activo'", (id_empleado,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Empleado no encontrado o inactivo")

        hoy = date.today()
        ahora = datetime.now().time()
        segundos_ahora = ahora.hour * 3600 + ahora.minute * 60 + ahora.second

        # Obtener horario del empleado
        cursor.execute("""
            SELECT h.hora_entrada, h.hora_salida, h.tolerancia_minutos 
            FROM empleado_horario eh
            JOIN horarios h ON eh.id_horario = h.id_horario
            WHERE eh.id_empleado = %s
            ORDER BY eh.fecha_inicio DESC LIMIT 1
        """, (id_empleado,))
        horario = cursor.fetchone()

        # Buscar registro de hoy
        cursor.execute(
            "SELECT * FROM asistencias WHERE id_empleado = %s AND fecha = %s",
            (id_empleado, hoy)
        )
        registro = cursor.fetchone()
        cursor2 = conn.cursor()

        # --- CASO 1: Sin registro hoy → ENTRADA ---
        if not registro:
            cursor2.execute(
                """INSERT INTO asistencias (id_empleado, fecha, hora_entrada, estado) 
                   VALUES (%s, %s, %s, 'incompleto')""",
                (id_empleado, hoy, ahora)
            )
            conn.commit()

            # Verificar retardo
            if horario:
                segundos_esperados = int(horario["hora_entrada"].total_seconds()) + (horario["tolerancia_minutos"] * 60)
                if segundos_ahora > segundos_esperados:
                    minutos_tarde = (segundos_ahora - int(horario["hora_entrada"].total_seconds())) // 60
                    cursor2.execute(
                        "INSERT INTO incidencias (id_asistencia, tipo, minutos, observacion) VALUES (%s, 'retardo', %s, %s)",
                        (cursor2.lastrowid, minutos_tarde, f"Llegó {minutos_tarde} minutos tarde")
                    )
                    conn.commit()
                    return {"mensaje": f"Entrada registrada con retardo de {minutos_tarde} minutos", "hora": str(ahora)}

            return {"mensaje": "Entrada registrada exitosamente", "hora": str(ahora)}

        # --- CASO 2: Tiene entrada, sin salida almuerzo → SALIDA ALMUERZO ---
        elif registro["hora_entrada"] and not registro["hora_salida_almuerzo"]:
            cursor2.execute(
                "UPDATE asistencias SET hora_salida_almuerzo = %s WHERE id_empleado = %s AND fecha = %s",
                (ahora, id_empleado, hoy)
            )
            conn.commit()
            return {"mensaje": "Salida a almuerzo registrada", "hora": str(ahora)}

        # --- CASO 3: Tiene salida almuerzo, sin regreso → REGRESO ALMUERZO ---
        elif registro["hora_salida_almuerzo"] and not registro["hora_regreso_almuerzo"]:
            cursor2.execute(
                "UPDATE asistencias SET hora_regreso_almuerzo = %s WHERE id_empleado = %s AND fecha = %s",
                (ahora, id_empleado, hoy)
            )
            conn.commit()

            # Verificar exceso de almuerzo (más de 60 minutos)
            segundos_salida_almuerzo = int(registro["hora_salida_almuerzo"].total_seconds())
            minutos_almuerzo = (segundos_ahora - segundos_salida_almuerzo) // 60
            if minutos_almuerzo > 60:
                exceso = minutos_almuerzo - 60
                cursor.execute("SELECT id_asistencia FROM asistencias WHERE id_empleado = %s AND fecha = %s", (id_empleado, hoy))
                asistencia = cursor.fetchone()
                cursor2.execute(
                    "INSERT INTO incidencias (id_asistencia, tipo, minutos, observacion) VALUES (%s, 'exceso_almuerzo', %s, %s)",
                    (asistencia["id_asistencia"], exceso, f"Se excedió {exceso} minutos en el almuerzo")
                )
                conn.commit()
                return {"mensaje": f"Regreso registrado con {exceso} minutos de exceso en almuerzo", "hora": str(ahora)}

            return {"mensaje": "Regreso de almuerzo registrado", "hora": str(ahora)}

        # --- CASO 4: Tiene regreso almuerzo, sin salida final → SALIDA FINAL ---
        elif registro["hora_regreso_almuerzo"] and not registro["hora_salida"]:
            # Calcular horas trabajadas descontando almuerzo
            segundos_entrada = int(registro["hora_entrada"].total_seconds())
            segundos_salida_alm = int(registro["hora_salida_almuerzo"].total_seconds())
            segundos_regreso_alm = int(registro["hora_regreso_almuerzo"].total_seconds())
            horas_trabajadas = round(
                ((segundos_salida_alm - segundos_entrada) + (segundos_ahora - segundos_regreso_alm)) / 3600, 2
            )

            cursor2.execute(
                """UPDATE asistencias SET hora_salida = %s, horas_trabajadas = %s, estado = 'completo' 
                   WHERE id_empleado = %s AND fecha = %s""",
                (ahora, horas_trabajadas, id_empleado, hoy)
            )
            conn.commit()

            # Verificar salida anticipada
            if horario:
                segundos_salida_esperada = int(horario["hora_salida"].total_seconds())
                if segundos_ahora < segundos_salida_esperada:
                    minutos_antes = (segundos_salida_esperada - segundos_ahora) // 60
                    cursor.execute("SELECT id_asistencia FROM asistencias WHERE id_empleado = %s AND fecha = %s", (id_empleado, hoy))
                    asistencia = cursor.fetchone()
                    cursor2.execute(
                        "INSERT INTO incidencias (id_asistencia, tipo, minutos, observacion) VALUES (%s, 'salida_anticipada', %s, %s)",
                        (asistencia["id_asistencia"], minutos_antes, f"Salió {minutos_antes} minutos antes")
                    )
                    conn.commit()
                    return {"mensaje": f"Salida registrada con {minutos_antes} minutos anticipados", "horas_trabajadas": horas_trabajadas}

            return {"mensaje": "Salida final registrada exitosamente", "horas_trabajadas": horas_trabajadas}

        else:
            return {"mensaje": "El empleado ya completó su jornada hoy"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@router.get("/hoy")
def asistencias_hoy():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    hoy = date.today()
    cursor.execute("""
        SELECT e.nombres, e.apellidos, a.fecha, a.hora_entrada, a.hora_salida_almuerzo,
               a.hora_regreso_almuerzo, a.hora_salida, a.horas_trabajadas, a.estado
        FROM asistencias a
        JOIN empleados e ON a.id_empleado = e.id_empleado
        WHERE a.fecha = %s
    """, (hoy,))
    registros = cursor.fetchall()
    conn.close()
    campos_time = ["hora_entrada", "hora_salida_almuerzo", "hora_regreso_almuerzo", "hora_salida"]
    for r in registros:
        for campo in campos_time:
            r[campo] = timedelta_to_str(r[campo])
    return registros