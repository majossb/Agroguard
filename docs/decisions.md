# Registro de Decisiones de Arquitectura (ADRs) — AgroGuard Backend

## ADR-001: Clean Architecture en 4 capas estrictas
- **Estado:** Aceptado
- **Contexto:** Se requiere un backend altamente mantenible, testeable y desacoplado de tecnologías y frameworks para facilitar la evolución académica y profesional del proyecto.
- **Decisión:** Implementar 4 capas concéntricas (`domain`, `application`, `infrastructure`, `presentation`, coordinadas por `main`). Las dependencias solo apuntan hacia adentro y se validan con `dependency-cruiser` en CI/CD (`npm run arch:check`).
- **Consecuencias:** Reglas de negocio puras sin dependencias externas, adaptadores intercambiables (e.g. S3 vs disco local, Mock vs HTTP AI).

## ADR-002: Inyección de Dependencias Manual (Composition Root)
- **Estado:** Aceptado
- **Contexto:** Se busca evitar complejidad innecesaria y 'magia' de contenedores IoC en JavaScript (YAGNI).
- **Decisión:** Usar `src/main/container.js` como composition root manual donde se instancian las dependencias y se inyectan en constructores.
- **Consecuencias:** Claridad total del grafo de dependencias, tipado con JSDoc y facilidad para pruebas con Fakes.

## ADR-003: Simplificación de Roles en v1 (Solo FARMER)
- **Estado:** Aceptado
- **Contexto:** Para la versión 1.0 del producto, la funcionalidad se orienta exclusivamente al agricultor que realiza diagnósticos y consulta el catálogo.
- **Decisión:** En v1 solo existe y se soporta el rol `FARMER`. No se implementan roles `TECHNICIAN` ni `ADMIN` en la base de código inicial.
- **Consecuencias:** Reducción de código muerto y complejidad innecesaria en autorización.

## ADR-004: Formato de Errores Uniforme (Inspirado en RFC 9457)
- **Estado:** Aceptado
- **Contexto:** La API REST debe proveer respuestas de error consistentes y predecibles para el cliente.
- **Decisión:** Todas las respuestas de error siguen la estructura: `type`, `title`, `status`, `code`, `detail`, `traceId`, `errors`. Los errores de dominio se transforman en HTTP exclusivamente en `presentation/http/middlewares/errorHandler.js`.
- **Consecuencias:** Frontend recibe códigos de error estables en inglés y detalles descriptivos en español, sin fuga de trazas internas en producción.

## ADR-005: Desacoplamiento del Motor de Inferencia (Mock e HTTP)
- **Estado:** Aceptado
- **Contexto:** El modelo de IA está entrenado en TensorFlow/Keras pero no debe cargarse en el proceso Node.js.
- **Decisión:** Se define el puerto `InferenceEngine` con dos adaptadores: `MockInferenceEngine` (determinista con SHA-256 para desarrollo y pruebas) y `HttpInferenceEngine` (hacia un microservicio Python). El cambio entre ambos se realiza exclusivamente mediante la variable `INFERENCE_DRIVER`.
- **Consecuencias:** El backend Node no depende de TensorFlow/Python ni requiere GPU para pruebas.

## ADR-006: Manejo Seguro de Imágenes con Sharp y Magic Bytes
- **Estado:** Aceptado
- **Contexto:** Las imágenes subidas por usuarios pueden contener exploits, tamaños gigantescos (decompression bombs) o metadatos privados (GPS).
- **Decisión:** Validación mediante `file-type` (magic bytes), límite de píxeles (`MAX_INPUT_PIXELS: 40000000`), normalización a JPEG sRGB calidad 90, reducción a máx 1600px y eliminación de metadatos EXIF.
- **Consecuencias:** Protección contra ataques DoS y preservación de la privacidad del agricultor.

## ADR-007: Métricas del Modelo en Null hasta Verificación Reproducible
- **Estado:** Aceptado
- **Contexto:** Las métricas previas no han sido verificadas en un pipeline reproducible.
- **Decisión:** `model-manifest.json` y `GET /api/v1/model` expondrán `metrics: null` con nota explicativa hasta que se certifiquen las evaluaciones oficiales.
- **Consecuencias:** Transparencia y exactitud técnica en la información del sistema.
