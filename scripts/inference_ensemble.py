#!/usr/bin/env python3
"""
AgroGuard - Motor de Inferencia en Ensamble de Modelos Deep Learning (Proceso Persistente)
Carga una sola vez en memoria los 4 modelos reales en formato .keras:
  1. CNN_Base (normalización simple img / 255.0)
  2. MobileNetV2 (tf.keras.applications.mobilenet_v2.preprocess_input)
  3. ResNet50 (tf.keras.applications.resnet50.preprocess_input)
  4. EfficientNetB0 (tf.keras.applications.efficientnet.preprocess_input)

Opera como Daemon en bucle continuo a través de sys.stdin / sys.stdout mediante
protocolo JSON Lines para garantizar tiempos de inferencia en milisegundos.
"""

import os
import sys
import json
import time
import signal
import warnings

# Suprimir logs ruidosos de TensorFlow / OneDNN en stdout
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
warnings.filterwarnings("ignore")

import numpy as np
from PIL import Image

try:
    import tensorflow as tf
    import keras
except ImportError as e:
    sys.stderr.write(f"[ERROR] Dependencias de Deep Learning no encontradas: {e}\n")
    sys.stderr.flush()
    sys.exit(1)

# Deshabilitar GPU si no hay CUDA configurado para evitar mensajes de advertencia lentos
try:
    tf.config.set_visible_devices([], "GPU")
except Exception:
    pass

# Rutas predeterminadas
DEFAULT_MODEL_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "agroguard_modelos_completos")
)

MODEL_FILES = {
    "EfficientNetB0": "efficientnetb0_phase2_best.keras",
    "ResNet50": "resnet50_phase2_best.keras",
    "MobileNetV2": "mobilenetv2_best_model.keras",
    "CNN_Base": "cnn_base_best_model.keras",
}


def load_class_dictionary(model_dir):
    """Carga el diccionario oficial de 38 clases fitopatológicas."""
    dict_path = os.path.join(model_dir, "class_dictionary.json")
    if not os.path.exists(dict_path):
        raise FileNotFoundError(f"Diccionario de clases no encontrado en {dict_path}")
    with open(dict_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    num_classes = len(data)
    class_names = [data[str(i)] for i in range(num_classes)]
    return class_names


def load_models(model_dir):
    """Carga los 4 modelos de Keras en memoria una sola vez al arrancar."""
    models = {}
    for key, filename in MODEL_FILES.items():
        model_path = os.path.join(model_dir, filename)
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Archivo de modelo no encontrado: {model_path}")
        sys.stderr.write(f"[INFO] Cargando modelo {key} desde {filename}...\n")
        sys.stderr.flush()
        models[key] = keras.models.load_model(model_path, compile=False)
    return models


def preprocess_image_per_model(pil_image_rgb):
    """
    Aplica el preprocesamiento matemático exacto para cada arquitectura:
      - CNN_Base: normalización simple dividiendo entre 255.0
      - MobileNetV2: tf.keras.applications.mobilenet_v2.preprocess_input
      - ResNet50: tf.keras.applications.resnet50.preprocess_input
      - EfficientNetB0: tf.keras.applications.efficientnet.preprocess_input
    """
    resized = pil_image_rgb.resize((224, 224), Image.Resampling.BILINEAR)
    base_array = np.array(resized, dtype=np.float32)

    # 1. CNN_Base: img / 255.0 en rango [0, 1]
    cnn_input = np.expand_dims(base_array / 255.0, axis=0)

    # 2. MobileNetV2: escala [0, 255] -> [-1, 1]
    mobilenet_input = np.expand_dims(
        tf.keras.applications.mobilenet_v2.preprocess_input(base_array.copy()),
        axis=0,
    )

    # 3. ResNet50: RGB a BGR y resta de medias ImageNet
    resnet_input = np.expand_dims(
        tf.keras.applications.resnet50.preprocess_input(base_array.copy()),
        axis=0,
    )

    # 4. EfficientNetB0: escalado específico de EfficientNet
    efficientnet_input = np.expand_dims(
        tf.keras.applications.efficientnet.preprocess_input(base_array.copy()),
        axis=0,
    )

    return {
        "CNN_Base": cnn_input,
        "MobileNetV2": mobilenet_input,
        "ResNet50": resnet_input,
        "EfficientNetB0": efficientnet_input,
    }


def predict_ensemble(models, preprocessed_inputs):
    """Ejecuta la inferencia sobre los 4 modelos y retorna vectores de probabilidad."""
    outputs = {}
    for key, model in models.items():
        inp = preprocessed_inputs[key]
        raw_pred = model(inp, training=False).numpy()[0]
        # Asegurar conversión a lista de flotantes de precisión simple
        outputs[key] = [float(p) for p in raw_pred]
    return outputs


def run_daemon(model_dir):
    """Bucle continuo (Daemon) a través de sys.stdin / sys.stdout."""
    class_names = load_class_dictionary(model_dir)
    models = load_models(model_dir)

    # Notificar a Node.js que el daemon está listo con los 4 modelos en RAM
    ready_msg = {
        "status": "ready",
        "models": list(models.keys()),
        "classCount": len(class_names),
        "classNames": class_names,
    }
    sys.stdout.write(json.dumps(ready_msg) + "\n")
    sys.stdout.flush()

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            req = json.loads(line)
        except Exception as e:
            res = {"status": "error", "message": f"JSON inválido: {e}"}
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()
            continue

        command = req.get("command", "predict")

        if command == "ping":
            sys.stdout.write(json.dumps({"status": "pong"}) + "\n")
            sys.stdout.flush()
            continue

        if command == "exit":
            sys.stdout.write(json.dumps({"status": "exiting"}) + "\n")
            sys.stdout.flush()
            break

        image_path = req.get("imagePath")
        if not image_path or not os.path.exists(image_path):
            res = {
                "status": "error",
                "message": f"Archivo de imagen no encontrado: {image_path}",
            }
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()
            continue

        try:
            start_time = time.time()
            with Image.open(image_path) as img:
                pil_rgb = img.convert("RGB")
                inputs = preprocess_image_per_model(pil_rgb)

            model_outputs = predict_ensemble(models, inputs)
            duration_ms = round((time.time() - start_time) * 1000, 2)

            res = {
                "status": "success",
                "inferenceTimeMs": duration_ms,
                "models": model_outputs,
            }
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()
        except Exception as e:
            res = {"status": "error", "message": f"Fallo en inferencia: {str(e)}"}
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()


def main():
    model_dir = os.environ.get("AGROGUARD_MODEL_ROOT", DEFAULT_MODEL_DIR)

    # Si se pasa --image por CLI, ejecutar una sola vez (modo diagnóstico de prueba)
    if len(sys.argv) > 1 and sys.argv[1] == "--image" and len(sys.argv) > 2:
        img_path = sys.argv[2]
        class_names = load_class_dictionary(model_dir)
        models = load_models(model_dir)
        with Image.open(img_path) as img:
            pil_rgb = img.convert("RGB")
            inputs = preprocess_image_per_model(pil_rgb)
        start_time = time.time()
        outputs = predict_ensemble(models, inputs)
        duration_ms = round((time.time() - start_time) * 1000, 2)
        print(
            json.dumps(
                {
                    "status": "success",
                    "inferenceTimeMs": duration_ms,
                    "models": outputs,
                }
            )
        )
        return

    # Modo Daemon persistente por defecto
    run_daemon(model_dir)


if __name__ == "__main__":
    main()
