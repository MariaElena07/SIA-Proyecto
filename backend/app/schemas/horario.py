from pydantic import BaseModel
from typing import Optional
from datetime import date

class HorarioCreate(BaseModel):
    nombre_horario: str
    hora_entrada: str
    hora_salida: str
    tolerancia_minutos: Optional[int] = 0

class AsignarHorario(BaseModel):
    id_empleado: int
    id_horario: int
    fecha_inicio: date
    fecha_fin: Optional[date] = None