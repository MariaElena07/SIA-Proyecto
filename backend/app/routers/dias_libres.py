from fastapi import APIRouter, HTTPException
from app.database import get_connection
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

router = APIRouter(prefix="/dias-libres", tags=["Días Libres"])

class DiaLibreCreate(BaseModel):
    id_empleado: int
    fecha: str
    motivo: Optional[str] = "Día libre"

class DiaLibreMultiple(BaseModel):
    id_empleado: int
    fechas: List[str]
    motivo: Optional[str] = "Día libre"

@router.post("/multiple")
def crear_dias_libres_multiple(data: DiaLibreMultiple):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        guardados = 0
        omitidos = 0
        for fecha in data.fechas:
            try:
                cursor.execute("""
                    INSERT INTO dias_libres (id_empleado, fecha, motivo)
                    VALUES (%s, %s, %s)
                """, (data.id_empleado, fecha, data.motivo))
                guardados += 1
            except:
                omitidos += 1
        conn.commit()
        return {
            "mensaje": f"{guardados} días libres registrados",
            "guardados": guardados,
            "omitidos": omitidos
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

# Registrar día libre
@router.post("/")
def crear_dia_libre(data: DiaLibreCreate):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO dias_libres (id_empleado, fecha, motivo)
            VALUES (%s, %s, %s)
        """, (data.id_empleado, data.fecha, data.motivo))
        conn.commit()
        return {"mensaje": "Día libre registrado exitosamente"}
    except Exception as e:
        conn.rollback()
        if "Duplicate" in str(e):
            raise HTTPException(status_code=400, detail="Ya existe un día libre registrado para ese empleado en esa fecha")
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

# Listar días libres de un empleado
@router.get("/empleado/{id_empleado}")
def dias_libres_empleado(id_empleado: int, fecha_inicio: Optional[str] = None, fecha_fin: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if fecha_inicio and fecha_fin:
            cursor.execute("""
                SELECT dl.*, e.nombres, e.apellidos
                FROM dias_libres dl
                JOIN empleados e ON dl.id_empleado = e.id_empleado
                WHERE dl.id_empleado = %s AND dl.fecha BETWEEN %s AND %s
                ORDER BY dl.fecha
            """, (id_empleado, fecha_inicio, fecha_fin))
        else:
            cursor.execute("""
                SELECT dl.*, e.nombres, e.apellidos
                FROM dias_libres dl
                JOIN empleados e ON dl.id_empleado = e.id_empleado
                WHERE dl.id_empleado = %s
                ORDER BY dl.fecha DESC
            """, (id_empleado,))
        return cursor.fetchall()
    finally:
        conn.close()

# Ver días libres de hoy
@router.get("/hoy")
def dias_libres_hoy():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT dl.*, e.nombres, e.apellidos, e.cargo
            FROM dias_libres dl
            JOIN empleados e ON dl.id_empleado = e.id_empleado
            WHERE dl.fecha = CURDATE()
            ORDER BY e.apellidos
        """)
        return cursor.fetchall()
    finally:
        conn.close()

# Ver días libres por rango de fechas (todos los empleados)
@router.get("/")
def listar_dias_libres(fecha_inicio: str, fecha_fin: str, id_empleado: Optional[int] = None):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if id_empleado:
            cursor.execute("""
                SELECT dl.*, e.nombres, e.apellidos
                FROM dias_libres dl
                JOIN empleados e ON dl.id_empleado = e.id_empleado
                WHERE dl.fecha BETWEEN %s AND %s AND dl.id_empleado = %s
                ORDER BY dl.fecha, e.apellidos
            """, (fecha_inicio, fecha_fin, id_empleado))
        else:
            cursor.execute("""
                SELECT dl.*, e.nombres, e.apellidos
                FROM dias_libres dl
                JOIN empleados e ON dl.id_empleado = e.id_empleado
                WHERE dl.fecha BETWEEN %s AND %s
                ORDER BY dl.fecha, e.apellidos
            """, (fecha_inicio, fecha_fin))
        return cursor.fetchall()
    finally:
        conn.close()

# Eliminar día libre
@router.delete("/{id_dia_libre}")
def eliminar_dia_libre(id_dia_libre: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM dias_libres WHERE id_dia_libre = %s", (id_dia_libre,))
        conn.commit()
        return {"mensaje": "Día libre eliminado"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()