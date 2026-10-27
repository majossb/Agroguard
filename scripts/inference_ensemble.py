#!/usr/bin/env python3
"""
AgroGuard - Motor de Inferencia en Ensamble de Modelos Deep Learning (Proceso Persistente)
Carga una sola vez en memoria los 4 modelos reales en formato .keras:
  1. CNN_Base (normalización simple img / 255.0)
  2. MobileNetV2 (tf.keras.applications.mobilenet_v2.preprocess_input)
  3. ResNet50 (tf.keras.applications.resnet50.preprocess_input)
  4. EfficientNetB0 (tf.keras.applications.efficientnet.preprocess_input)

Además carga el filtro CLIP (openai/clip-vit-base-patch32) para validar
que la imagen corresponde a una hoja de planta antes de pasar al ensemble.

Opera como Daemon en bucle continuo a través de sys.stdin / sys.stdout mediante
protocolo JSON Lines para garantizar tiempos de inferencia en milisegundos.
"""

import os
import sys
import json
import time
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


# ── Configuración del filtro CLIP ─────────────────────────────────────────────
# Variables de entorno heredadas de Node.js (PythonEnsembleInferenceEngine las establece).
# Los umbrales se aplican sobre la MASA de probabilidad de cada grupo, no sobre
# una única etiqueta: con 15+ etiquetas zero-shot es normal que ninguna etiqueta
# aislada supere 0.60 aunque la imagen sea claramente una hoja.
CLIP_ENABLED = os.environ.get("AGROGUARD_CLIP_ENABLED", "true").lower() == "true"
CLIP_THRESHOLD_PLANT = float(os.environ.get("AGROGUARD_CLIP_THRESHOLD_PLANT", "0.30"))
CLIP_THRESHOLD_REJECT = float(os.environ.get("AGROGUARD_CLIP_THRESHOLD_REJECT", "0.70"))
CLIP_THRESHOLD_UNSUPPORTED_CROP = float(
    os.environ.get("AGROGUARD_CLIP_THRESHOLD_UNSUPPORTED_CROP", "0.60")
)

# ── Etiquetas zero-shot ───────────────────────────────────────────────────────
# Prompts cortos y discriminativos: CLIP zero-shot rinde mejor con descripciones
# directas que con frases largas. El conjunto se calibró con imágenes reales del
# proyecto: hojas -> masa de planta 0.69-1.00; capturas/dibujos -> 0.00.
ETIQUETAS_PLANTA = [
    "a close-up photograph of a plant leaf",
    "a photograph of a diseased plant leaf",
    "a photograph of a healthy plant leaf",
    "a photograph of a leaf on the ground",
    "a photograph of a leaf held in hand",
    "a smartphone photo of a plant leaf",
    "a photograph of a plant in a field",
]
ETIQUETAS_NO_VALIDAS = [
    "a screenshot of a computer screen",
    "a cartoon drawing",
    "an anime character illustration",
    "a photograph of a person",
    "a photograph of an animal",
    "a photograph of a piece of furniture",
    "a photograph of an outdoor landscape",
    "a medical or scientific diagram",
]
ETIQUETAS_CULTIVO_NO_SOPORTADO = [
    "a photograph of a mango leaf",
    "a photograph of an avocado leaf",
    "a photograph of a banana leaf",
    "a photograph of a coffee leaf",
    "a photograph of a cocoa leaf",
    "a photograph of a citrus leaf",
]
ETIQUETAS_CLIP = ETIQUETAS_PLANTA + ETIQUETAS_NO_VALIDAS + ETIQUETAS_CULTIVO_NO_SOPORTADO


# ── Rutas y archivos de modelos ───────────────────────────────────────────────
DEFAULT_MODEL_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "agroguard_modelos_completos")
)

MODEL_FILES = {
    "EfficientNetB0": "efficientnetb0_phase2_best.keras",
    "ResNet50": "resnet50_phase2_best.keras",
    "MobileNetV2": "mobilenetv2_best_model.keras",
    "CNN_Base": "cnn_base_best_model.keras",
}


# ── CLIP ──────────────────────────────────────────────────────────────────────

def load_clip_pipeline():
    """Carga el pipeline de CLIP una sola vez al arrancar el daemon."""
    if not CLIP_ENABLED:
        sys.stderr.write("[INFO] Filtro CLIP desactivado (AGROGUARD_CLIP_ENABLED=false).\n")
        sys.stderr.flush()
        return None

    try:
        from transformers import pipeline as hf_pipeline

        sys.stderr.write("[INFO] Cargando pipeline CLIP (openai/clip-vit-base-patch32)...\n")
        sys.stderr.flush()
        clip_pipe = hf_pipeline(
            "zero-shot-image-classification",
            model="openai/clip-vit-base-patch32",
            device=-1,  # CPU; cambiar a 0 si hay GPU CUDA disponible
        )
        sys.stderr.write("[INFO] Pipeline CLIP cargado correctamente.\n")
        sys.stderr.flush()
        return clip_pipe
    except ImportError:
        sys.stderr.write(
            "[WARN] 'transformers' no instalado. El filtro CLIP esta desactivado. "
            "Instala con: pip install transformers torch\n"
        )
        sys.stderr.flush()
        return None
    except Exception as e:
        sys.stderr.write(f"[WARN] No se pudo cargar CLIP: {e}. Filtro desactivado.\n")
        sys.stderr.flush()
        return None


def validar_imagen_planta(pil_rgb, clip_pipe):
    """
    Clasifica la imagen con CLIP para determinar si es una hoja de planta.

    Política (alta sensibilidad para no bloquear hojas reales):
      1. RECHAZAR solo si el grupo "no válido" domina con claridad.
      2. REVISAR solo si parece una hoja de un cultivo fuera de catálogo.
      3. ACEPTAR si hay masa suficiente de planta/hoja, o si la mejor etiqueta
         pertenece a una hoja. Cualquier imagen dudosa pasa al ensemble, que es
         quien decide con su umbral de confianza.

    Returns:
        dict con keys 'estado' ('ACEPTAR' | 'RECHAZAR' | 'REVISAR') y 'motivo'.
    """
    if not CLIP_ENABLED:
        return {
            "estado": "ACEPTAR",
            "motivo": "Filtro CLIP desactivado explícitamente.",
            "topLabels": [],
            "grupos": {},
        }

    if clip_pipe is None:
        raise RuntimeError(
            "Filtro CLIP habilitado pero modelo no disponible. "
            "Falla segura activa: no se permite inferencia sin validación CLIP."
        )

    try:
        resultados = clip_pipe(pil_rgb, candidate_labels=ETIQUETAS_CLIP)
        # El pipeline ya devuelve ordenado, pero lo garantizamos explícitamente.
        resultados = sorted(resultados, key=lambda r: float(r["score"]), reverse=True)

        mejor = resultados[0]
        etiqueta = mejor["label"]
        score = float(mejor["score"])
        top_labels = [
            {"label": r["label"], "score": round(float(r["score"]), 4)}
            for r in resultados[:3]
        ]

        score_planta = sum(r["score"] for r in resultados if r["label"] in ETIQUETAS_PLANTA)
        score_no_valida = sum(r["score"] for r in resultados if r["label"] in ETIQUETAS_NO_VALIDAS)
        score_no_soportado = sum(
            r["score"] for r in resultados if r["label"] in ETIQUETAS_CULTIVO_NO_SOPORTADO
        )
        score_hoja = score_planta + score_no_soportado

        grupos = {
            "planta": round(score_planta, 4),
            "noValida": round(score_no_valida, 4),
            "cultivoNoSoportado": round(score_no_soportado, 4),
        }

        def _respuesta(estado, motivo):
            return {
                "estado": estado,
                "motivo": motivo,
                "topLabels": top_labels,
                "grupos": grupos,
            }

        # 1. Rechazo: contenido claramente ajeno a una hoja/planta.
        #    Exigimos que la masa no válida sea alta y supere a la masa foliar,
        #    para no rechazar hojas reales con fondos complicados.
        if score_no_valida >= CLIP_THRESHOLD_REJECT and score_no_valida > score_hoja:
            return _respuesta(
                "RECHAZAR",
                (
                    f"Contenido ajeno a una hoja/planta "
                    f"(etiqueta principal: '{etiqueta}', confianza: {score:.2f}; "
                    f"masa no válida: {score_no_valida:.2f})."
                ),
            )

        # 2. Revisión por cultivo fuera de catálogo: solo si domina de forma
        #    contundente sobre las etiquetas genéricas de hoja.
        if (
            score_no_soportado >= CLIP_THRESHOLD_UNSUPPORTED_CROP
            and score_no_soportado > score_planta * 2
            and score_planta < CLIP_THRESHOLD_PLANT
        ):
            return _respuesta(
                "REVISAR",
                (
                    f"La imagen parece ser una hoja real, pero no corresponde a ninguno "
                    f"de los cultivos soportados (etiqueta principal: '{etiqueta}', "
                    f"confianza: {score:.2f}). Por favor, verifica el cultivo."
                ),
            )

        # 3. Aceptación: alta sensibilidad. Cualquier evidencia razonable de hoja
        #    permite que el ensemble real emita su predicción.
        if (
            etiqueta in ETIQUETAS_PLANTA
            or etiqueta in ETIQUETAS_CULTIVO_NO_SOPORTADO
            or score_planta >= CLIP_THRESHOLD_PLANT
            or score_hoja >= max(0.45, CLIP_THRESHOLD_PLANT)
            or score_planta > score_no_valida
        ):
            return _respuesta(
                "ACEPTAR",
                (
                    f"Fotografía de planta/hoja detectada "
                    f"(etiqueta principal: '{etiqueta}', confianza: {score:.2f}; "
                    f"masa de planta: {score_planta:.2f})."
                ),
            )

        # 4. Ambiguo: no hay evidencia suficiente ni en contra.
        return _respuesta(
            "REVISAR",
            (
                f"Resultado ambiguo "
                f"(mejor etiqueta: '{etiqueta}', confianza: {score:.2f}). "
                "Intenta con una foto más clara."
            ),
        )

    except Exception as e:
        sys.stderr.write(f"[ERROR] Error en validacion CLIP: {e}\n")
        sys.stderr.flush()
        raise RuntimeError(f"Falla segura: error en validación CLIP ({e}).")




# ── Carga de diccionario y modelos Keras ─────────────────────────────────────

def load_class_dictionary(model_dir):
    """Carga el diccionario oficial de 38 clases fitopatologicas."""
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
    Aplica el preprocesamiento matematico exacto para cada arquitectura:
      - CNN_Base: normalizacion simple dividiendo entre 255.0
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

    # 4. EfficientNetB0: escalado especifico de EfficientNet
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
        outputs[key] = [float(p) for p in raw_pred]
    return outputs


# ── Daemon loop ───────────────────────────────────────────────────────────────

def run_daemon(model_dir):
    """Bucle continuo (Daemon) a traves de sys.stdin / sys.stdout."""
    class_names = load_class_dictionary(model_dir)
    models = load_models(model_dir)
    clip_pipe = load_clip_pipeline()

    # Notificar a Node.js que el daemon esta listo
    ready_msg = {
        "status": "ready",
        "models": list(models.keys()),
        "classCount": len(class_names),
        "classNames": class_names,
        "clipEnabled": clip_pipe is not None,
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
            res = {"status": "error", "message": f"JSON invalido: {e}"}
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

                # ── 1. Filtro CLIP ────────────────────────────────────────────
                clip_result = validar_imagen_planta(pil_rgb, clip_pipe)

                if clip_result["estado"] == "RECHAZAR":
                    res = {
                        "status": "rejected",
                        "estado": "RECHAZAR",
                        "motivo": clip_result["motivo"],
                        "clipTopLabels": clip_result.get("topLabels", []),
                    }
                    sys.stdout.write(json.dumps(res) + "\n")
                    sys.stdout.flush()
                    continue

                if clip_result["estado"] == "REVISAR":
                    res = {
                        "status": "review",
                        "estado": "REVISAR",
                        "motivo": clip_result["motivo"],
                        "clipTopLabels": clip_result.get("topLabels", []),
                    }
                    sys.stdout.write(json.dumps(res) + "\n")
                    sys.stdout.flush()
                    continue

                # ── 2. Ensemble inference (solo si CLIP acepto) ───────────────
                inputs = preprocess_image_per_model(pil_rgb)

            model_outputs = predict_ensemble(models, inputs)
            duration_ms = round((time.time() - start_time) * 1000, 2)

            res = {
                "status": "success",
                "inferenceTimeMs": duration_ms,
                "models": model_outputs,
                "clipMotivo": clip_result["motivo"],
                "clipTopLabels": clip_result.get("topLabels", []),
            }
            sys.stdout.write(json.dumps(res) + "\n")

            sys.stdout.flush()

        except Exception as e:
            res = {"status": "error", "message": f"Fallo en inferencia: {str(e)}"}
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()


def main():
    model_dir = os.environ.get("AGROGUARD_MODEL_ROOT", DEFAULT_MODEL_DIR)

    # Si se pasa --image por CLI, ejecutar una sola vez (modo diagnostico de prueba)
    if len(sys.argv) > 1 and sys.argv[1] == "--image" and len(sys.argv) > 2:
        img_path = sys.argv[2]
        class_names = load_class_dictionary(model_dir)
        models = load_models(model_dir)
        clip_pipe = load_clip_pipeline()
        with Image.open(img_path) as img:
            pil_rgb = img.convert("RGB")
            clip_result = validar_imagen_planta(pil_rgb, clip_pipe)
            if clip_result["estado"] != "ACEPTAR":
                print(json.dumps({"status": clip_result["estado"].lower(), **clip_result}))
                return
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
                    "clipMotivo": clip_result["motivo"],
                }
            )
        )
        return

    # Modo Daemon persistente por defecto
    run_daemon(model_dir)


if __name__ == "__main__":
    main()
