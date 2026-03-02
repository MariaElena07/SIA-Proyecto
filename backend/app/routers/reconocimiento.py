from fastapi import APIRouter
from app.services import reconocimiento

router = APIRouter(prefix="/reconocimiento", tags=["Reconocimiento"])

@router.post("/iniciar")
def iniciar():
    resultado = reconocimiento.iniciar()
    if resultado:
        return {"mensaje": "Reconocimiento facial iniciado"}
    return {"mensaje": "El reconocimiento ya está activo"}

@router.post("/detener")
def detener():
    reconocimiento.detener()
    return {"mensaje": "Reconocimiento facial detenido"}

@router.get("/estado")
def estado():
    activo = reconocimiento.estado()
    return {"activo": activo}