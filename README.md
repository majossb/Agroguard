# 🌱 AgroGuard Backend — API REST para Diagnóstico Fitopatológico

Backend robusto, modular y testeable para la plataforma **AgroGuard**, diseñado para el diagnóstico temprano y gestión agronómica de enfermedades en hojas de cultivos agrícolas asistido por Visión por Computadora y Deep Learning.

Desarrollado bajo los principios de **Clean Architecture (Arquitectura Hexagonal)** en **Node.js (ES Modules)**, con **Express 5**, **MongoDB / Mongoose**, **Sharp** y contratos desacoplados de inferencia.

---

> ⚠️ **AVISO SOBRE DATOS PROVISIONALES Y EVALUACIÓN DEL MODELO**
> 1. **Clases del Modelo (`data/class_names.json`):** El archivo actual contiene 38 clases en orden provisional estándar de PlantVillage. Al entrenar y exportar el modelo definitivo, reemplace este archivo con el exportado por el notebook asegurando el orden exacto de salida de la capa softmax.
> 2. **Métricas de Rendimiento:** Las métricas del modelo están marcadas como `null` en el manifiesto y en la API (`/api/v1/model/info`), pendientes de validación reproducible e independiente.
> 3. **Catálogo Agronómico:** Las recomendaciones químicas y biológicas están pendientes de revisión agronómica especializada (`PENDING_REVIEW`). No se deben aplicar tratamientos sin supervisión profesional.

---

## 🏛️ Arquitectura del Sistema

El proyecto sigue una estricta separación en capas concéntricas con regla de dependencia unidireccional hacia el centro:

```
src/
├── domain/                  # Capa Central de Dominio (Sin dependencias externas)
│   ├── entities/            # Entidades de negocio (Diagnosis, User, Condition, Feedback)
│   ├── value-objects/       # Objetos de valor inmutables (Email, Confidence, ClassKey, etc.)
│   ├── services/            # Servicios de dominio puros (DiagnosisInterpreter, ClassKeyParser)
│   └── errors/              # Jerarquía de errores tipados (DomainError, NotFoundError, etc.)
│
├── application/             # Capa de Aplicación (Casos de Uso y Puertos)
│   ├── use-cases/           # Orquestación de lógica (diagnosis, auth, catalog, model)
│   ├── ports/               # Interfaces/Contratos abstractos (InferenceEngine, ImageStorage, etc.)
│   └── dtos/                # Data Transfer Objects
│
├── infrastructure/          # Capa de Infraestructura (Adaptadores y Drivers)
│   ├── config/              # Validación de variables de entorno con Zod
│   ├── logging/             # Logger estructurado Pino con traceId
│   ├── security/            # Hashing Bcrypt (costo 12) y emisión JWT / Refresh Tokens opacos
│   ├── system/              # SystemClock y UuidGenerator
│   ├── image/               # Normalización y sanitización de imágenes con Sharp
│   ├── storage/             # Almacenamiento estructurado en disco local
│   ├── inference/           # Adaptadores Mock determinista y cliente HTTP resiliente
│   └── persistence/mongo/   # Mongoose Schemas, Mappers y Repositorios con índices y TTL
│
├── presentation/            # Capa de Presentación (HTTP / REST)
│   └── http/
│       ├── controllers/     # Controladores delgados Express
│       ├── middlewares/     # Auth (estricta/opcional), RequestId, ErrorHandler RFC 9457
│       ├── validators/      # Esquemas de validación con Zod
│       └── routes/          # Enrutamiento modularizado /api/v1 y Swagger UI /docs
│
└── main/                    # Punto de Entrada y Composition Root
    ├── container.js         # Inyección de dependencias centralizada
    └── server.js            # Arranque del servidor HTTP y Graceful Shutdown
```

---

## 🚀 Requisitos Previos

- **Node.js**: `>= 20.0.0` (recomendado Node 22 LTS).
- **npm**: `>= 10.0.0`.
- **Docker y Docker Compose** (opcional, para ejecutar MongoDB y la aplicación contenerizada).

---

## ⚙️ Instalación y Configuración

1. **Clonar el repositorio y entrar al directorio:**
   ```bash
   cd AgroGuard
   ```

2. **Instalar dependencias del proyecto:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Copia el archivo de ejemplo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
   *Edita `.env` para ajustar los valores según tu entorno local (puerto, conexión a MongoDB, claves secretas JWT).*

4. **Sembrar el catálogo fitopatológico inicial:**
   ```bash
   npm run seed:catalog
   ```

---

## 🏃‍♂️ Ejecución

### Modo Desarrollo
Inicia el servidor con recarga automática ante cambios:
```bash
npm run dev
```
La API estará disponible en `http://localhost:3000`.

### Con Docker Compose (API + MongoDB)
```bash
docker-compose up --build
```

---

## 🧪 Pruebas y Control de Calidad

El proyecto cuenta con suites de pruebas unitarias, de integración con `mongodb-memory-server` y pruebas de extremo a extremo (E2E) con Supertest:

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo observador
npm run test:watch

# Generar reporte de cobertura de código
npm run test:coverage

# Análisis estático de código (ESLint)
npm run lint

# Corrección automática de formato
npm run lint:fix

# Validación estricta de reglas de arquitectura y dependencias (Dependency Cruiser)
npm run arch:check
```

---

## 📚 Documentación Interactiva de la API (Swagger UI)

Una vez iniciado el servidor, accede a la documentación interactiva OpenAPI 3.1 en tu navegador:

- **Swagger UI:** `http://localhost:3000/docs`
- **Especificación JSON:** `http://localhost:3000/docs/openapi.json`
- **Especificación YAML:** `http://localhost:3000/docs/openapi.yaml`

---

## 📡 Tabla de Endpoints Disponibles (`/api/v1`)

| Método | Endpoint | Autenticación | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Pública | Estado de disponibilidad general, MongoDB e inferencia |
| `POST` | `/auth/register` | Pública | Registro de nuevo agricultor (rol FARMER) |
| `POST` | `/auth/login` | Pública | Inicio de sesión (Access Token JWT + Cookie Refresh) |
| `POST` | `/auth/refresh` | Cookie | Rotación estricta de Refresh Token con anti-reuso |
| `POST` | `/auth/logout` | Cookie | Cierre de sesión y revocación de token |
| `GET` | `/users/me` | Bearer JWT | Datos de perfil del agricultor autenticado |
| `DELETE` | `/users/me` | Bearer JWT | **Borrado en cascada:** cuenta, diagnósticos, fotos y sesiones |
| `POST` | `/diagnoses` | Opcional | Diagnóstico por imagen (anónimo o guardado en historial) |
| `GET` | `/diagnoses` | Bearer JWT | Historial paginado con filtros (`healthStatus`, `cropKey`, etc.) |
| `GET` | `/diagnoses/:id` | Bearer JWT | Detalle del diagnóstico y recomendaciones |
| `PATCH` | `/diagnoses/:id` | Bearer JWT | Actualización de nombre de lote y notas |
| `DELETE` | `/diagnoses/:id` | Bearer JWT | Eliminación de diagnóstico y archivo físico de imagen |
| `GET` | `/diagnoses/:id/image` | Bearer JWT | Descarga de la imagen procesada |
| `POST` | `/diagnoses/:id/feedback` | Bearer JWT | Envío de retroalimentación de precisión en campo |
| `GET` | `/catalog/conditions` | Pública | Listado de condiciones fitopatológicas |
| `GET` | `/catalog/conditions/:classKey` | Pública | Detalle técnico, síntomas y manejo agronómico |
| `GET` | `/catalog/crops` | Pública | Lista de cultivos soportados y número de condiciones |
| `GET` | `/model/info` | Pública | Especificaciones técnicas y metadatos del modelo IA |

---

## 🔒 Consideraciones de Seguridad Implementadas

- **Protección contra Reutilización de Tokens:** Detección automática de reuso de Refresh Tokens que invalida inmediatamente toda la familia de sesiones activas.
- **Cookies Seguras:** `httpOnly: true`, `SameSite: Lax`, `Path: /api/v1/auth`, `Secure` configurable por entorno.
- **Validación de Origen en Operaciones Sensibles:** Comprobación estricta de cabecera `Origin` en rutas basadas en cookies.
- **Sanitización de Imágenes:** Stripping completo de metadatos EXIF (geolocalización, cámara) con Sharp, límite estricto de entrada (`limitInputPixels: 40000000`) para mitigar ataques de decompresión (*pixel flood*), y validación de tipos por número mágico con `file-type`.
- **Formato RFC 9457:** Todos los errores retornan `application/problem+json` con código estandarizado y `traceId` único.
- **Guardia de Arranque:** Prohibición estricta de arranque en producción con motor simulado (`INFERENCE_DRIVER=mock`) salvo autorización explícita.
- **Autorización Silenciosa:** Los intentos de acceso a recursos de otros usuarios responden siempre `404 Not Found` en lugar de `403 Forbidden` para evitar la enumeración de identificadores.
