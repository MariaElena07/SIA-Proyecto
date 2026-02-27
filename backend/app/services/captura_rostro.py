import cv2
import os
import time

def capturar_rostro(id_empleado: int, nombre_empleado: str, cantidad_fotos: int = 30):
    """
    Abre la cámara y captura fotos del rostro del empleado.
    Guarda las imágenes en rostros_dataset/{id_empleado}/
    """
    # Crear carpeta del empleado
    carpeta = f"rostros_dataset/{id_empleado}"
    os.makedirs(carpeta, exist_ok=True)

    # Cargar detector de rostros de OpenCV
    detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    camara = cv2.VideoCapture(0)
    contador = 0

    print(f"Capturando rostro de {nombre_empleado}. Mire a la cámara...")

    while contador < cantidad_fotos:
        ret, frame = camara.read()
        if not ret:
            break

        gris = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        rostros = detector.detectMultiScale(gris, scaleFactor=1.3, minNeighbors=5)

        for (x, y, w, h) in rostros:
            contador += 1
            rostro = frame[y:y+h, x:x+w]
            rostro = cv2.resize(rostro, (100, 100))
            ruta = f"{carpeta}/{contador}.jpg"
            cv2.imwrite(ruta, rostro)

            # Dibujar rectángulo en pantalla
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, f"{contador}/{cantidad_fotos}", (x, y-10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        cv2.imshow(f"Capturando rostro - {nombre_empleado} (Q para cancelar)", frame)

        if cv2.waitKey(100) & 0xFF == ord('q'):
            break

        time.sleep(0.1)

    camara.release()
    cv2.destroyAllWindows()

    print(f"Captura completada: {contador} fotos guardadas en {carpeta}")
    return contador, carpeta


if __name__ == "__main__":
    # Prueba rápida
    capturar_rostro(1, "Empleado Prueba")
