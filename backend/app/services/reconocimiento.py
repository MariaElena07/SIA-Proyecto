import cv2
import numpy as np
import pickle
import requests
import time
import threading
from keras import models, Model
from PIL import Image

_hilo = None
_corriendo = False

UMBRAL_CONFIANZA = 0.99
UMBRAL_DISTANCIA = 10.0

def cargar_modelo():
    modelo = models.load_model("modelo_entrenado/modelo_sia.keras")
    with open("modelo_entrenado/etiquetas.pkl", "rb") as f:
        etiquetas = pickle.load(f)
    with open("modelo_entrenado/embeddings.pkl", "rb") as f:
        embeddings = pickle.load(f)
    modelo_embedding = Model(inputs=modelo.input, outputs=modelo.layers[-2].output)
    return modelo, modelo_embedding, etiquetas, embeddings

def verificar_distancia(modelo_embedding, rostro_input, id_empleado, embeddings):
    emb = modelo_embedding.predict(rostro_input, verbose=0)[0]
    centroide = embeddings.get(str(id_empleado))
    if centroide is None:
        return False, 999
    distancia = np.linalg.norm(emb - centroide)
    return distancia <= UMBRAL_DISTANCIA, distancia

def _ejecutar():
    global _corriendo
    modelo, modelo_embedding, le, embeddings = cargar_modelo()
    detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    camara = cv2.VideoCapture(0)
    ultimo_registro = {}

    while _corriendo:
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

            if confianza >= UMBRAL_CONFIANZA:
                valido, distancia = verificar_distancia(modelo_embedding, rostro_input, id_empleado, embeddings)
                if valido:
                    color = (0, 255, 0)
                    texto = f"ID: {id_empleado} ({confianza*100:.1f}%)"
                    ahora = time.time()
                    if id_empleado not in ultimo_registro or (ahora - ultimo_registro[id_empleado]) > 5:
                        try:
                            resp = requests.post(f"http://127.0.0.1:8000/asistencias/registrar/{id_empleado}")
                            mensaje = resp.json().get("mensaje", "")
                            print(f"✅ {texto} - dist:{distancia:.1f} - {mensaje}")
                            ultimo_registro[id_empleado] = ahora
                        except Exception as e:
                            print(f"Error al registrar: {e}")
                else:
                    color = (0, 165, 255)
                    texto = f"Sospechoso ({confianza*100:.1f}% dist:{distancia:.1f})"
            else:
                color = (0, 0, 255)
                texto = f"Desconocido ({confianza*100:.1f}%)"

            cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
            cv2.putText(frame, texto, (x, y-10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        cv2.imshow("SIA - Reconocimiento Facial", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    _corriendo = False
    camara.release()
    cv2.destroyAllWindows()

def iniciar():
    global _hilo, _corriendo
    if _corriendo:
        return False
    _corriendo = True
    _hilo = threading.Thread(target=_ejecutar, daemon=True)
    _hilo.start()
    return True

def detener():
    global _corriendo
    _corriendo = False
    return True

def estado():
    return _corriendo