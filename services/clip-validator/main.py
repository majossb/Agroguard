#!/usr/bin/env python3
"""
AgroGuard — Microservicio de Validación CLIP
FastAPI · POST /validate · GET /health

Carga el modelo CLIP (openai/clip-vit-base-patch32) una sola vez al arrancar
y clasifica imágenes como ACEPTAR / RECHAZAR / REVISAR según etiquetas zero-shot.
"""

import base64
import io
import logging
import os
import sys
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger("clip-validator")

# ── Etiquetas zero-shot ──────────────────────────────────────────────────────
# Prompts cortos y discriminativos. CLIP zero-shot rinde mejor con descripciones
# directas que con frases largas. Calibradas con imágenes reales del proyecto:
# hojas -> masa de planta 0.69-1.00; capturas/dibujos -> 0.00.
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

# ── Umbrales (env vars) ─────────────────────────────────────────────────────
# Se aplican sobre la MASA de probabilidad de cada grupo, no sobre una etiqueta
# aislada. Con 21 etiquetas es normal que la mejor etiqueta no supere 0.60.
CLIP_THRESHOLD_PLANT = float(os.getenv("CLIP_THRESHOLD_PLANT", "0.30"))
CLIP_THRESHOLD_NO_PLANT = float(os.getenv("CLIP_THRESHOLD_NO_PLANT", "0.70"))
CLIP_THRESHOLD_UNSUPPORTED_CROP = float(os.getenv("CLIP_THRESHOLD_UNSUPPORTED_CROP", "0.60"))

# ── Estado global del modelo ────────────────────────────────────────────────
clip_pipe = None
model_loaded = False


def _load_clip():
    """Carga el pipeline CLIP una sola vez."""
    global clip_pipe, model_loaded
    try:
        from transformers import pipeline as hf_pipeline

        log.info("Cargando pipeline CLIP (openai/clip-vit-base-patch32)...")
        clip_pipe = hf_pipeline(
            "zero-shot-image-classification",
            model="openai/clip-vit-base-patch32",
            device=-1,
        )
        model_loaded = True
        log.info("Pipeline CLIP cargado correctamente.")
    except Exception as exc:
        log.error("No se pudo cargar CLIP: %s", exc)
        clip_pipe = None
        model_loaded = False


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _load_clip()
    yield


# ── FastAPI app ─────────────────────────────────────────────────────────────
app = FastAPI(title="AgroGuard CLIP Validator", version="1.0.0", lifespan=lifespan)


# ── Schemas ─────────────────────────────────────────────────────────────────
class ValidateRequest(BaseModel):
    image_base64: str


class TopLabel(BaseModel):
    label: str
    score: float


class ValidateResponse(BaseModel):
    state: str
    reason: str
    topLabels: list[TopLabel]
    groups: dict[str, float] = {}


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    thresholds: dict[str, float]


# ── Endpoints ───────────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok" if model_loaded else "degraded",
        model_loaded=model_loaded,
        thresholds={
            "plant": CLIP_THRESHOLD_PLANT,
            "no_plant": CLIP_THRESHOLD_NO_PLANT,
            "unsupported_crop": CLIP_THRESHOLD_UNSUPPORTED_CROP,
        },
    )


@app.post("/validate", response_model=ValidateResponse)
async def validate(body: ValidateRequest):
    if not model_loaded or clip_pipe is None:
        raise HTTPException(status_code=503, detail="Modelo CLIP no disponible.")

    # Decode base64 → PIL Image
    try:
        img_bytes = base64.b64decode(body.image_base64)
        pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"No se pudo decodificar la imagen: {exc}")

    # Clasificación CLIP
    start = time.time()
    try:
        results = clip_pipe(pil_img, candidate_labels=ETIQUETAS_CLIP)
    except Exception as exc:
        log.error("Error en inferencia CLIP: %s", exc)
        raise HTTPException(status_code=500, detail=f"Error en inferencia CLIP: {exc}")

    elapsed_ms = round((time.time() - start) * 1000, 2)
    log.info("Inferencia CLIP completada en %.2f ms", elapsed_ms)

    # Orden garantizado (el pipeline ya suele devolverlo ordenado)
    results = sorted(results, key=lambda r: float(r["score"]), reverse=True)

    # Top 3 para respuesta
    top3 = [TopLabel(label=r["label"], score=round(float(r["score"]), 4)) for r in results[:3]]

    best = results[0]
    label = best["label"]
    score = float(best["score"])

    # ── Lógica de decisión sobre MASAS de grupo ──────────────────────────
    score_planta = sum(r["score"] for r in results if r["label"] in ETIQUETAS_PLANTA)
    score_no_valida = sum(r["score"] for r in results if r["label"] in ETIQUETAS_NO_VALIDAS)
    score_no_soportado = sum(r["score"] for r in results if r["label"] in ETIQUETAS_CULTIVO_NO_SOPORTADO)
    score_hoja = score_planta + score_no_soportado

    groups = {
        "planta": round(score_planta, 4),
        "noValida": round(score_no_valida, 4),
        "cultivoNoSoportado": round(score_no_soportado, 4),
    }

    # 1. Rechazo: contenido claramente ajeno a una hoja/planta.
    #    Se exige masa no válida alta Y superior a la masa foliar.
    if score_no_valida >= CLIP_THRESHOLD_NO_PLANT and score_no_valida > score_hoja:
        return ValidateResponse(
            state="RECHAZAR",
            reason=(
                f"Contenido ajeno a una hoja/planta (etiqueta principal: '{label}', "
                f"confianza: {score:.2f}; masa no válida: {score_no_valida:.2f})."
            ),
            topLabels=top3,
            groups=groups,
        )

    # 2. Revisión: hoja real de un cultivo fuera de catálogo, solo si domina
    #    de forma contundente sobre las etiquetas genéricas de hoja.
    if (
        score_no_soportado >= CLIP_THRESHOLD_UNSUPPORTED_CROP
        and score_no_soportado > score_planta * 2
        and score_planta < CLIP_THRESHOLD_PLANT
    ):
        return ValidateResponse(
            state="REVISAR",
            reason=(
                f"La imagen parece ser una hoja real, pero no corresponde a ninguno "
                f"de los cultivos soportados (etiqueta principal: '{label}', "
                f"confianza: {score:.2f}). Por favor, verifica el cultivo."
            ),
            topLabels=top3,
            groups=groups,
        )

    # 3. Aceptación: alta sensibilidad. Cualquier evidencia razonable de hoja
    #    permite que el ensemble real emita su predicción.
    if (
        label in ETIQUETAS_PLANTA
        or label in ETIQUETAS_CULTIVO_NO_SOPORTADO
        or score_planta >= CLIP_THRESHOLD_PLANT
        or score_hoja >= max(0.45, CLIP_THRESHOLD_PLANT)
        or score_planta > score_no_valida
    ):
        return ValidateResponse(
            state="ACEPTAR",
            reason=(
                f"Fotografía de planta/hoja detectada (etiqueta principal: '{label}', "
                f"confianza: {score:.2f}; masa de planta: {score_planta:.2f})."
            ),
            topLabels=top3,
            groups=groups,
        )

    # 4. Fallback: ambiguo
    return ValidateResponse(
        state="REVISAR",
        reason=(
            f"Resultado ambiguo (mejor etiqueta: '{label}', confianza: {score:.2f}). "
            "Intenta con una foto más clara."
        ),
        topLabels=top3,
        groups=groups,
    )

