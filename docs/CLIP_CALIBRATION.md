# Calibración y Funcionamiento del Filtro Visual CLIP en AgroGuard

## 1. Propósito y Arquitectura

En los sistemas de diagnóstico fitopatológico basados exclusivamente en redes convolucionales (CNNs) o ensambles cerrados (e.g. 38 clases PlantVillage), cualquier imagen que entre al pipeline —incluso un dibujo, una persona o una hoja de mango no soportada— será clasificada de manera forzada en una de las 38 clases con alta confianza espuria (falsos positivos fuera de dominio o *Out of Distribution - OOD*).

Para resolver esta vulnerabilidad crítica, AgroGuard implementa un **filtro visual previo** utilizando **CLIP** (`openai/clip-vit-base-patch32`) como clasificador *zero-shot*, operando como microservicio desacoplado (`services/clip-validator/`) o integrado en el daemon de inferencia (`scripts/inference_ensemble.py`):

```
[Cliente HTTP / Frontend]
         │
         ▼
[SharpImageProcessor (Normalización JPEG ≤1600 px)]
         │
         ▼
[ImageValidator (CLIP Zero-Shot Gate)]
  ├── RECHAZAR (masa no válida >= 0.70 y domina) ──► HTTP 422 IMAGE_REJECTED (Detener inferencia)
  ├── REVISAR (cultivo no soportado / ambiguo) ─────► HTTP 200 REVISAR (Sin predicción, detener ensemble)
  └── ACEPTAR (masa de hoja suficiente) ────────────► Continuar a [Ensemble de 4 Modelos Keras]
```

> **Importante:** los umbrales se evalúan sobre la **masa de probabilidad de cada grupo**, no sobre una única etiqueta. Con 21 etiquetas candidatas es normal que la etiqueta ganadora ronde 0.30–0.60 aunque la imagen sea claramente una hoja; exigir 0.70 a una sola etiqueta producía falsos rechazos.

## 2. Conjuntos de Etiquetas Zero-Shot

Los prompts son cortos y discriminativos: CLIP zero-shot rinde mejor con descripciones directas que con frases largas.

### A. Fotografías de Plantas Soportadas (`ETIQUETAS_PLANTA`)
- `'a close-up photograph of a plant leaf'`
- `'a photograph of a diseased plant leaf'`
- `'a photograph of a healthy plant leaf'`
- `'a photograph of a leaf on the ground'`
- `'a photograph of a leaf held in hand'`
- `'a smartphone photo of a plant leaf'`
- `'a photograph of a plant in a field'`

### B. Elementos Fuera de Dominio (`ETIQUETAS_NO_VALIDAS`)
- `'a screenshot of a computer screen'`
- `'a cartoon drawing'`
- `'an anime character illustration'`
- `'a photograph of a person'`
- `'a photograph of an animal'`
- `'a photograph of a piece of furniture'`
- `'a photograph of an outdoor landscape'`
- `'a medical or scientific diagram'`

### C. Cultivos Fuera de Catálogo (`ETIQUETAS_CULTIVO_NO_SOPORTADO`)
- `'a photograph of a mango leaf'`
- `'a photograph of an avocado leaf'`
- `'a photograph of a banana leaf'`
- `'a photograph of a coffee leaf'`
- `'a photograph of a cocoa leaf'`
- `'a photograph of a citrus leaf'`

## 3. Umbrales Calibrados Empíricamente

| Variable de Entorno | Valor Calibrado | Propósito |
|---------------------|-----------------|-----------|
| `CLIP_THRESHOLD_PLANT` | `0.30` | Masa mínima del grupo de hoja/planta para permitir la inferencia. |
| `CLIP_THRESHOLD_NO_PLANT` | `0.70` | Masa mínima del grupo no válido para rechazar de inmediato la imagen (HTTP 422). |
| `CLIP_THRESHOLD_UNSUPPORTED_CROP` | `0.60` | Masa mínima para derivar a `REVISAR` por cultivo no soportado (solo si domina claramente). |

### Calibración observada con imágenes del proyecto

| Tipo de imagen | Masa planta | Masa no válida | Decisión |
|----------------|-------------|----------------|----------|
| Hoja real (256×256, 300×400, 1600×900) | 0.69 – 0.95 | 0.00 | ACEPTAR |
| Captura de pantalla | 0.00 | 1.00 | RECHAZAR |
| Ilustración anime | 0.00 | 1.00 | RECHAZAR |
| Imagen de color plano | 0.66 | 0.05 | ACEPTAR (el ensemble decide con su confianza) |

## 4. Política de Falla Segura (Fail-Safe)

1. **Inferencia bloqueada**: Ningún modelo del ensemble puede invocarse sin que la imagen haya superado con éxito (`ACEPTAR`) la validación CLIP.
2. **Sin aceptación por defecto**: Si el microservicio CLIP no está disponible o falla, el sistema **no asume aceptación**; lanza `InferenceUnavailableError` (HTTP 503), protegiendo la integridad del catálogo agronómico.
3. **Persistencia protegida**: Los resultados en estado `REVISAR` o `RECHAZAR` no se persisten como enfermedades foliares confirmadas en el historial del agricultor.
4. **Alta sensibilidad**: ante duda razonable (masa de hoja > masa no válida) se prefiere dejar pasar la imagen al ensemble antes que bloquear una hoja real. El umbral `MIN_CONFIDENCE` del intérprete sigue protegiendo contra predicciones débiles.

## 5. Procedimiento de Calibración con `calibrate-clip.mjs`

Para ejecutar la suite de calibración con imágenes de prueba:

```bash
# Calibrar contra el microservicio en ejecución
node scripts/calibrate-clip.mjs --url http://localhost:8001

# Evaluar una imagen individual
node scripts/calibrate-clip.mjs --url http://localhost:8001 --image /ruta/a/imagen.png

# Evaluar un directorio completo de imágenes OOD
node scripts/calibrate-clip.mjs --url http://localhost:8001 --dir /ruta/a/dataset/
```

## 6. Reinicio requerido

El daemon de inferencia (`scripts/inference_ensemble.py`) carga CLIP y los modelos Keras **una sola vez al arrancar**. Después de modificar etiquetas, umbrales o el código del filtro es necesario reiniciar el backend:

```bash
# Desarrollo local
npm run dev

# Docker
docker compose restart api ensemble-inference clip-validator
```
