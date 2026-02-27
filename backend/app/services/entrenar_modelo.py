import os
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras import layers, models
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pickle

def cargar_imagenes(dataset_path="rostros_dataset"):
    """Carga todas las imágenes y sus etiquetas (id_empleado)"""
    imagenes = []
    etiquetas = []

    for carpeta in os.listdir(dataset_path):
        ruta_carpeta = os.path.join(dataset_path, carpeta)
        if not os.path.isdir(ruta_carpeta):
            continue

        for archivo in os.listdir(ruta_carpeta):
            if archivo.endswith(".jpg"):
                ruta_img = os.path.join(ruta_carpeta, archivo)
                img = Image.open(ruta_img).convert("RGB")
                img = img.resize((100, 100))
                imagenes.append(np.array(img))
                etiquetas.append(carpeta)  # El nombre de la carpeta es el id_empleado

    return np.array(imagenes), np.array(etiquetas)

def entrenar():
    print("Cargando imágenes...")
    X, y = cargar_imagenes()

    if len(X) == 0:
        print("No hay imágenes para entrenar.")
        return

    # Normalizar píxeles
    X = X / 255.0

    # Codificar etiquetas
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    y_categorical = tf.keras.utils.to_categorical(y_encoded)

    num_clases = len(le.classes_)
    print(f"Empleados encontrados: {num_clases}")
    print(f"Total imágenes: {len(X)}")

    # Dividir en entrenamiento y validación
    X_train, X_val, y_train, y_val = train_test_split(
        X, y_categorical, test_size=0.2, random_state=42
    )

    # Construir modelo CNN
    modelo = models.Sequential([
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=(100, 100, 3)),
        layers.MaxPooling2D(2, 2),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D(2, 2),
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.MaxPooling2D(2, 2),
        layers.Flatten(),
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(num_clases, activation='softmax')
    ])

    modelo.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    modelo.summary()

    print("\nEntrenando modelo...")
    modelo.fit(
        X_train, y_train,
        epochs=20,
        validation_data=(X_val, y_val),
        batch_size=16
    )

    # Guardar modelo y etiquetas
    os.makedirs("modelo_entrenado", exist_ok=True)
    modelo.save("modelo_entrenado/modelo_sia.keras")
    with open("modelo_entrenado/etiquetas.pkl", "wb") as f:
        pickle.dump(le, f)

    print("\n✅ Modelo guardado en modelo_entrenado/")

if __name__ == "__main__":
    entrenar()
