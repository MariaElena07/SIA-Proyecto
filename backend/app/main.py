from fastapi import FastAPI, Depends
from app.routers import empleados, horarios, asistencias, reportes, auth
from app.services.auth import verificar_token

app = FastAPI(title="SIA - Sistema de Asistencia", version="1.0")

app.include_router(auth.router)

# Endpoints protegidos con token
app.include_router(empleados.router, dependencies=[Depends(verificar_token)])
app.include_router(horarios.router, dependencies=[Depends(verificar_token)])
app.include_router(reportes.router, dependencies=[Depends(verificar_token)])

app.include_router(asistencias.router)

@app.get("/")
def root():
    return {"mensaje": "SIA API funcionando correctamente"}