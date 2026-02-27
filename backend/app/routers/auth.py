from fastapi import APIRouter, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends
from app.database import get_connection
from app.services.auth import verificar_password, crear_token, hashear_password
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Autenticación"])

class CrearUsuario(BaseModel):
    usuario: str
    password: str

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM usuarios WHERE usuario = %s AND estado = 'activo'",
            (form_data.username,)
        )
        user = cursor.fetchone()
        if not user or not verificar_password(form_data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

        token = crear_token({"sub": user["usuario"]})
        return {"access_token": token, "token_type": "bearer"}
    finally:
        conn.close()

@router.post("/crear-admin")
def crear_admin(datos: CrearUsuario):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_usuario FROM usuarios WHERE usuario = %s", (datos.usuario,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="El usuario ya existe")

        password_hash = hashear_password(datos.password)
        cursor2 = conn.cursor()
        cursor2.execute(
            "INSERT INTO usuarios (usuario, password_hash, rol) VALUES (%s, %s, 'admin')",
            (datos.usuario, password_hash)
        )
        conn.commit()
        return {"mensaje": "Admin creado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()