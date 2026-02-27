import cv2
import numpy as np
import pickle
import requests
from keras import models
from PIL import Image

# Cargar modelo y etiquetas
def cargar_modelo():
    modelo = models.load_model("modelo_entrenado/modelo_sia.keras")
    with open("modelo_entrenado/etiquetas.pkl", "rb") as f:
        etiquetas = pickle.load(f)
    return modelo, etiquetas

def reconocer_en_tiempo_real():
    modelo, le = cargar_modelo()
    detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    camara = cv2.VideoCapture(0)

    print("Sistema de reconocimiento activo. Presiona Q para salir.")
    ultimo_registro = {}  # Para evitar registros duplicados seguidos

    while True:
        ret, frame = camara.read()
        if not ret:
            break

        gris = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        rostros = detector.detectMultiScale(gris, scaleFactor=1.3, minNeighbors=5)

        for (x, y, w, h) in rostros:
            rostro = frame[y:y+h, x:x+w]
            rostro_redim = cv2.resize(rostro, (100, 100))
            rostro_norm = np.array(rostro_redim) / 255.0
            rostro_input = np.expand_dims(rostro_norm, axis=0)

            prediccion = modelo.predict(rostro_input, verbose=0)
            confianza = np.max(prediccion)
            clase = np.argmax(prediccion)
            id_empleado = le.inverse_transform([clase])[0]

            if confianza >= 0.85:
                color = (0, 255, 0)
                texto = f"ID: {id_empleado} ({confianza*100:.1f}%)"

                # Registrar asistencia si no se registró en los últimos 5 segundos
                import time
                ahora = time.time()
                if id_empleado not in ultimo_registro or (ahora - ultimo_registro[id_empleado]) > 5:
                    try:
                        resp = requests.post(f"http://127.0.0.1:8000/asistencias/registrar/{id_empleado}")
                        mensaje = resp.json().get("mensaje", "")
                        print(f"✅ {texto} - {mensaje}")
                        ultimo_registro[id_empleado] = ahora
                    except Exception as e:
                        print(f"Error al registrar: {e}")
            else:
                color = (0, 0, 255)
                texto = f"Desconocido ({confianza*100:.1f}%)"

            cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
            cv2.putText(frame, texto, (x, y-10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        cv2.imshow("SIA - Reconocimiento Facial (Q para salir)", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    camara.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    reconocer_en_tiempo_real()