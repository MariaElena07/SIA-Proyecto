from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routers import empleados, horarios, asistencias, reportes, auth
from app.services.auth import verificar_token
from app.routers import reconocimiento
from app.routers import captura
from app.routers import dias_libres

app = FastAPI(title="SIA - Sistema de Asistencia", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

# Endpoints protegidos con token
app.include_router(empleados.router, dependencies=[Depends(verificar_token)])
app.include_router(horarios.router, dependencies=[Depends(verificar_token)])
app.include_router(reportes.router, dependencies=[Depends(verificar_token)])
app.include_router(reconocimiento.router, dependencies=[Depends(verificar_token)])
app.include_router(captura.router, dependencies=[Depends(verificar_token)])
app.include_router(dias_libres.router, dependencies=[Depends(verificar_token)])

app.include_router(asistencias.router)

@app.get("/")
def root():
    return {"mensaje": "SIA API funcionando correctamente"}