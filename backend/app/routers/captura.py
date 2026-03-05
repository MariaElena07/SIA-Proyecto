from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.database import get_connection
import base64
import numpy as np
import cv2
import os
import subprocess
import sys

router = APIRouter(prefix="/captura", tags=["Captura"])

@router.post("/foto/{id_empleado}")
async def guardar_foto(id_empleado: int, payload: dict):
    try:
        # Verificar que el empleado existe
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT nombres, apellidos FROM empleados WHERE id_empleado = %s", (id_empleado,))
        empleado = cursor.fetchone()
        conn.close()

        if not empleado:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")

        # Decodificar imagen base64
        img_data = payload["imagen"].split(",")[1]
        img_bytes = base64.b64decode(img_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(status_code=400, detail="Imagen inválida")

        # Detectar rostro
        detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gris = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        rostros = detector.detectMultiScale(gris, scaleFactor=1.3, minNeighbors=5)

        if len(rostros) == 0:
            raise HTTPException(status_code=400, detail="No se detectó ningún rostro en la imagen")

        # Guardar solo el primer rostro detectado
        carpeta = f"rostros_dataset/{id_empleado}"
        os.makedirs(carpeta, exist_ok=True)

        # Contar fotos existentes
        fotos_existentes = len([f for f in os.listdir(carpeta) if f.endswith('.jpg')])

        (x, y, w, h) = rostros[0]
        rostro = frame[y:y+h, x:x+w]
        rostro = cv2.resize(rostro, (100, 100))
        ruta = f"{carpeta}/{fotos_existentes + 1}.jpg"
        cv2.imwrite(ruta, rostro)

        return {
            "mensaje": "Foto guardada exitosamente",
            "total_fotos": fotos_existentes + 1
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/fotos/{id_empleado}")
def contar_fotos(id_empleado: int):
    carpeta = f"rostros_dataset/{id_empleado}"
    if not os.path.exists(carpeta):
        return {"total_fotos": 0}
    total = len([f for f in os.listdir(carpeta) if f.endswith('.jpg')])
    return {"total_fotos": total}

@router.post("/entrenar")
async def entrenar(background_tasks: BackgroundTasks):
    background_tasks.add_task(correr_entrenamiento)
    return {"mensaje": "Entrenamiento iniciado, esto puede tomar varios minutos"}

def correr_entrenamiento():
    try:
        subprocess.run([sys.executable, "app/services/entrenar_modelo.py"], check=True)
    except Exception as e:
        print(f"Error en entrenamiento: {e}")

@router.delete("/fotos/{id_empleado}")
def eliminar_fotos(id_empleado: int):
    carpeta = f"rostros_dataset/{id_empleado}"
    if not os.path.exists(carpeta):
        return {"mensaje": "No hay fotos para eliminar", "total_eliminadas": 0}
    
    fotos = [f for f in os.listdir(carpeta) if f.endswith('.jpg')]
    for foto in fotos:
        os.remove(os.path.join(carpeta, foto))
    
    return {
        "mensaje": f"Se eliminaron {len(fotos)} fotos exitosamente",
        "total_eliminadas": len(fotos)
    }