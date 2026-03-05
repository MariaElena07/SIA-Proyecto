import os
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras import layers, models, Model
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pickle

def cargar_imagenes(dataset_path="rostros_dataset"):
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
                etiquetas.append(carpeta)

    return np.array(imagenes), np.array(etiquetas)

def entrenar():
    print("Cargando imágenes...")
    X, y = cargar_imagenes()

    if len(X) == 0:
        print("No hay imágenes para entrenar.")
        return

    X = X / 255.0

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    y_categorical = tf.keras.utils.to_categorical(y_encoded)

    num_clases = len(le.classes_)
    print(f"Empleados encontrados: {num_clases}")
    print(f"Total imágenes: {len(X)}")

    X_train, X_val, y_train, y_val = train_test_split(
        X, y_categorical, test_size=0.2, random_state=42
    )

    # Construir modelo CNN con API funcional para extraer embeddings
    entrada = layers.Input(shape=(100, 100, 3))
    x = layers.Conv2D(32, (3, 3), activation='relu')(entrada)
    x = layers.MaxPooling2D(2, 2)(x)
    x = layers.Conv2D(64, (3, 3), activation='relu')(x)
    x = layers.MaxPooling2D(2, 2)(x)
    x = layers.Conv2D(128, (3, 3), activation='relu')(x)
    x = layers.MaxPooling2D(2, 2)(x)
    x = layers.Flatten()(x)
    x = layers.Dense(256, activation='relu')(x)
    embedding = layers.Dropout(0.5)(x)
    salida = layers.Dense(num_clases, activation='softmax')(embedding)

    modelo = Model(inputs=entrada, outputs=salida)
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

    os.makedirs("modelo_entrenado", exist_ok=True)
    modelo.save("modelo_entrenado/modelo_sia.keras")
    with open("modelo_entrenado/etiquetas.pkl", "wb") as f:
        pickle.dump(le, f)

    # Generar embeddings promedio por empleado
    modelo_embedding = Model(inputs=entrada, outputs=embedding)

    print("\nCalculando embeddings promedio por empleado...")
    embeddings_por_clase = {}
    for clase_idx, clase_nombre in enumerate(le.classes_):
        mascaras = y_encoded == clase_idx
        imgs_clase = X[mascaras]
        embs = modelo_embedding.predict(imgs_clase, verbose=0)
        embeddings_por_clase[clase_nombre] = np.mean(embs, axis=0)

    with open("modelo_entrenado/embeddings.pkl", "wb") as f:
        pickle.dump(embeddings_por_clase, f)

    print("✅ Modelo y embeddings guardados en modelo_entrenado/")

if __name__ == "__main__":
    entrenar()