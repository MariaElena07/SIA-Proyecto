from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from app.database import get_connection
from app.services import reconocimiento
import base64
import numpy as np
import cv2
from keras import models
import pickle
from datetime import date
import time

router = APIRouter(prefix="/reconocimiento", tags=["Reconocimiento"])

# Cargar modelo una sola vez
_modelo = None
_le = None

def get_modelo():
    global _modelo, _le
    if _modelo is None:
        _modelo = models.load_model("modelo_entrenado/modelo_sia.keras")
        with open("modelo_entrenado/etiquetas.pkl", "rb") as f:
            _le = pickle.load(f)
    return _modelo, _le

@router.post("/identificar")
async def identificar(payload: dict):
    try:
        # Decodificar imagen base64
        img_data = payload["imagen"].split(",")[1]
        img_bytes = base64.b64decode(img_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return {"identificado": False}

        modelo, le = get_modelo()
        detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gris = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        rostros = detector.detectMultiScale(gris, scaleFactor=1.3, minNeighbors=5)

        for (x, y, w, h) in rostros:
            rostro = frame[y:y+h, x:x+w]
            rostro_redim = cv2.resize(rostro, (100, 100))
            rostro_norm = np.array(rostro_redim) / 255.0
            rostro_input = np.expand_dims(rostro_norm, axis=0)

            prediccion = modelo.predict(rostro_input, verbose=0)
            confianza = float(np.max(prediccion))
            clase = np.argmax(prediccion)
            id_empleado = int(le.inverse_transform([clase])[0])

            if confianza >= 0.85:
                # Obtener nombre del empleado
                conn = get_connection()
                cursor = conn.cursor(dictionary=True)
                cursor.execute("SELECT nombres, apellidos FROM empleados WHERE id_empleado = %s", (id_empleado,))
                empleado = cursor.fetchone()
                conn.close()

                if empleado:
                    return {
                        "identificado": True,
                        "id_empleado": id_empleado,
                        "nombre": f"{empleado['nombres']} {empleado['apellidos']}",
                        "confianza": round(confianza * 100, 1)
                    }

        return {"identificado": False}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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