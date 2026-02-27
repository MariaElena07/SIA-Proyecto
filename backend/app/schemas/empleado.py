from pydantic import BaseModel
from typing import Optional

class EmpleadoCreate(BaseModel):
    cedula: str
    nombres: str
    apellidos: str
    cargo: Optional[str] = None
