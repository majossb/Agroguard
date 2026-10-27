#!/usr/bin/env python3
"""
AgroGuard — Microservicio de Inferencia Ensemble
FastAPI · POST /predict · GET /health

Carga los 4 modelos Keras (.keras) una sola vez al arrancar y ejecuta
inferencia con Soft Voting Ponderado.
"""

import base64
import io
import json
import logging
import os
import sys
import time
from contextlib import asynccontextmanager
from typing import Any

import numpy as np
from fastapi import FastAPI, HTTPException
from PIL import Image
from pydantic import BaseModel

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger("ensemble-inference")

# Suprimir logs de TF
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import warnings
warnings.filterwarnings("ignore")

import tensorflow as tf
import keras

# Deshabilitar GPU si no hay CUDA
try:
    tf.config.set_visible_devices([], "GPU")
except Exception:
    pass

# ── Configuración de modelos ────────────────────────────────────────────────
MODEL_ROOT = os.getenv("MODEL_ROOT", os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "agroguard_modelos_completos")
))

MODEL_FILES = {
    "EfficientNetB0": "efficientnetb0_phase2_best.keras",
    "ResNet50": "resnet50_phase2_best.keras",
    "MobileNetV2": "mobilenetv2_best_model.keras",
    "CNN_Base": "cnn_base_best_model.keras",
}

WEIGHTS = {
    "EfficientNetB0": 0.35,
    "ResNet50": 0.30,
    "MobileNetV2": 0.20,
    "CNN_Base": 0.15,
}

# ── Estado global ───────────────────────────────────────────────────────────
models: dict[str, Any] = {}
class_names: list[str] = []
models_loaded = False


def _load_class_dictionary(model_dir: str) -> list[str]:
    """Carga el diccionario oficial de 38 clases fitopatológicas."""
    dict_path = os.path.join(model_dir, "class_dictionary.json")
    if not os.path.exists(dict_path):
        raise FileNotFoundError(f"Diccionario de clases no encontrado en {dict_path}")

    with open(dict_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Soportar ambos formatos:
    # {"0": "Apple___Apple_scab", ...} o {"Apple___Apple_scab": 0, ...}
    first_key = next(iter(data))
    try:
        int(first_key)
        # Formato {idx_str: class_name}
        names = [data[str(i)] for i in range(len(data))]
    except ValueError:
        # Formato {class_name: idx}
        sorted_items = sorted(data.items(), key=lambda x: x[1])
        names = [item[0] for item in sorted_items]

    if len(names) != 38:
        raise ValueError(
            f"El diccionario debe tener exactamente 38 clases, tiene {len(names)}"
        )

    return names


def _load_models(model_dir: str) -> dict[str, Any]:
    """Carga los 4 modelos Keras en memoria."""
    loaded = {}
    for key, filename in MODEL_FILES.items():
        model_path = os.path.join(model_dir, filename)
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Modelo no encontrado: {model_path}")
        log.info("Cargando modelo %s desde %s...", key, filename)
        loaded[key] = keras.models.load_model(model_path, compile=False)
        log.info("Modelo %s cargado.", key)
    return loaded


def _preprocess(pil_rgb: Image.Image) -> dict[str, np.ndarray]:
    """Preprocesamiento específico por arquitectura."""
    resized = pil_rgb.resize((224, 224), Image.Resampling.BILINEAR)
    arr = np.array(resized, dtype=np.float32)

    return {
        "CNN_Base": np.expand_dims(arr / 255.0, 0),
        "MobileNetV2": np.expand_dims(
            tf.keras.applications.mobilenet_v2.preprocess_input(arr.copy()), 0
        ),
        "ResNet50": np.expand_dims(
            tf.keras.applications.resnet50.preprocess_input(arr.copy()), 0
        ),
        "EfficientNetB0": np.expand_dims(
            tf.keras.applications.efficientnet.preprocess_input(arr.copy()), 0
        ),
    }


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global models, class_names, models_loaded
    try:
        log.info("MODEL_ROOT = %s", MODEL_ROOT)
        class_names = _load_class_dictionary(MODEL_ROOT)
        log.info("Diccionario cargado: %d clases", len(class_names))
        models = _load_models(MODEL_ROOT)
        models_loaded = True
        log.info("Todos los modelos cargados. Servicio listo.")
    except Exception as exc:
        log.error("Error al cargar modelos: %s", exc)
        models_loaded = False
    yield


# ── FastAPI app ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="AgroGuard Ensemble Inference",
    version="1.0.0",
    lifespan=lifespan,
)


# ── Schemas ─────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    image_base64: str


class TopEnsembleEntry(BaseModel):
    classKey: str
    score: float


class TopModelEntry(BaseModel):
    classKey: str
    score: float


class PredictResponse(BaseModel):
    predictedClass: str
    ensembleScore: float
    topEnsemble: list[TopEnsembleEntry]
    topPerModel: dict[str, TopModelEntry]
    inferenceTimeMs: float
    modelOutputs: dict[str, list[float]]


class ModelStatus(BaseModel):
    name: str
    loaded: bool
    weight: float


class HealthResponse(BaseModel):
    status: str
    models_loaded: bool
    class_count: int
    models: list[ModelStatus]


# ── Endpoints ───────────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse)
async def health():
    model_statuses = [
        ModelStatus(name=k, loaded=k in models, weight=WEIGHTS[k])
        for k in MODEL_FILES
    ]
    return HealthResponse(
        status="ok" if models_loaded else "degraded",
        models_loaded=models_loaded,
        class_count=len(class_names),
        models=model_statuses,
    )


@app.post("/predict", response_model=PredictResponse)
async def predict(body: PredictRequest):
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Los modelos no están cargados.")

    # Decodificar imagen
    try:
        img_bytes = base64.b64decode(body.image_base64)
        pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"No se pudo decodificar la imagen: {exc}"
        )

    start = time.time()

    # Preprocesar
    preprocessed = _preprocess(pil_img)

    # Inferencia por modelo
    raw_outputs: dict[str, list[float]] = {}
    for key, model in models.items():
        inp = preprocessed[key]
        pred = model(inp, training=False).numpy()[0]

        # Validaciones
        if len(pred) != 38:
            raise HTTPException(
                status_code=500,
                detail=f"Modelo {key} produjo {len(pred)} valores, esperados 38.",
            )
        if not np.all(np.isfinite(pred)):
            raise HTTPException(
                status_code=500,
                detail=f"Modelo {key} produjo valores no finitos.",
            )

        raw_outputs[key] = [float(p) for p in pred]

    # Soft Voting Ponderado
    ensemble = np.zeros(38, dtype=np.float64)
    for key, probs in raw_outputs.items():
        ensemble += WEIGHTS[key] * np.array(probs, dtype=np.float64)

    # Top-3 ensemble
    top3_idx = np.argsort(ensemble)[::-1][:3]
    top_ensemble = [
        TopEnsembleEntry(classKey=class_names[i], score=round(float(ensemble[i]), 6))
        for i in top3_idx
    ]

    # Top-1 por modelo
    top_per_model = {}
    for key, probs in raw_outputs.items():
        best_idx = int(np.argmax(probs))
        top_per_model[key] = TopModelEntry(
            classKey=class_names[best_idx],
            score=round(float(probs[best_idx]), 6),
        )

    predicted_class = class_names[top3_idx[0]]
    ensemble_score = round(float(ensemble[top3_idx[0]]), 6)
    elapsed_ms = round((time.time() - start) * 1000, 2)

    log.info(
        "Inferencia completada en %.2f ms — clase: %s (%.4f)",
        elapsed_ms,
        predicted_class,
        ensemble_score,
    )

    return PredictResponse(
        predictedClass=predicted_class,
        ensembleScore=ensemble_score,
        topEnsemble=top_ensemble,
        topPerModel=top_per_model,
        inferenceTimeMs=elapsed_ms,
        modelOutputs=raw_outputs,
    )
