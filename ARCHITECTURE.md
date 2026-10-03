# Arquitectura del Backend de AgroGuard

Este documento describe la estructura y diseño técnico del backend de **AgroGuard**, implementado bajo los principios de **Clean Architecture** (Arquitectura Limpia) y **SOLID**.

---

## 🏛️ Las 4 Capas de la Arquitectura

```text
               +-------------------------------------------------+
               |              Presentation (HTTP)               |
               |       (Express 5, Controllers, Middlewares)    |
               +-----------------------+-------------------------+
                                       |
                                       v
               +-------------------------------------------------+
               |                   Application                   |
               |          (Use Cases, DTOs, Ports/JSDoc)         |
               +-----------------------+-------------------------+
                                       |
                                       v
+--------------+-------------------------------------------------+--------------+
|              |                     Domain                      |              |
|              |    (Entities, Value Objects, Domain Services,   |              |
|              |                 Domain Errors)                  |              |
|              +-------------------------------------------------+              |
|                                      ^                                        |
|                                      |                                        |
+--------------------------------------+----------------------------------------+
               |                 Infrastructure                  |
               |   (Mongo Mappers/Repos, Sharp, Pino, System)   |
               +-------------------------------------------------+
                                       ^
                                       |
               +-------------------------------------------------+
               |                      Main                       |
               |        (Composition Root: container.js, server) |
               +-------------------------------------------------+
```

### 1. Dominio (`src/domain/`)
- **Propósito**: Reglas de negocio puras, lógica fitopatológica y validaciones intrínsecas.
- **Dependencias**: Cero dependencias externas (sin Express, Mongoose, Sharp, etc.).
- **Componentes**:
  - `entities/`: Entidades centrales (`User`, `Diagnosis`, `Condition`, `Feedback`).
  - `value-objects/`: Objetos de valor inmutables (`Email`, `Confidence`, `ClassKey`, `HealthStatus`, `ImageInfo`).
  - `services/`: Servicios de dominio puros (`DiagnosisInterpreter`, `ClassKeyParser`).
  - `errors/`: Jerarquía de errores de dominio tipados (`DomainError`, `ValidationError`, etc.).

### 2. Aplicación (`src/application/`)
- **Propósito**: Orquestar los flujos de interacción y casos de uso del sistema.
- **Dependencias**: Únicamente conoce la capa de `domain`.
- **Componentes**:
  - `use-cases/`: Cada caso de uso es una clase con un único método `execute()`.
  - `ports/`: Interfaces abstractas documentadas con JSDoc (`UserRepository`, `InferenceEngine`, `Clock`, `IdGenerator`, etc.).
  - `dtos/`: Estructuras de datos de entrada y salida para los casos de uso.

### 3. Infraestructura (`src/infrastructure/`)
- **Propósito**: Implementar los adaptadores técnicos y conectarse con servicios externos, frameworks y bases de datos.
- **Dependencias**: Conoce `application` y `domain`.
- **Componentes**:
  - `config/`: Validación de variables de entorno con Zod y carga de datos.
  - `logging/`: Logger estructurado Pino.
  - `system/`: Adaptadores concretos de sistema (`SystemClock`, `UuidGenerator`).
  - `persistence/mongo/`: Esquemas Mongoose, mappers y repositorios de MongoDB.
  - `inference/`: Adaptadores del motor de inferencia (`MockInferenceEngine`, `HttpInferenceEngine`).
  - `storage/`: Almacenamiento local de imágenes (`LocalDiskImageStorage`).
  - `image/`: Normalización y saneamiento de imágenes con `SharpImageProcessor`.

### 4. Presentación (`src/presentation/http/`)
- **Propósito**: Exponer la API REST a través del protocolo HTTP.
- **Dependencias**: Conoce `application` y `domain`.
- **Componentes**:
  - `controllers/`: Controladores delgados que validan la entrada, invocan el caso de uso y formatean la respuesta.
  - `middlewares/`: Autenticación, rate limiting, `X-Request-Id`, saneamiento y manejador central de errores RFC 9457.
  - `routes/`: Definición de enrutadores Express versionados (`/api/v1/`).

### 5. Composición y Arranque (`src/main/`)
- **Propósito**: Composition Root manual.
- **Componentes**:
  - `container.js`: Instancia todas las implementaciones concretas y las inyecta en los casos de uso y controladores.
  - `server.js`: Arranca el servidor HTTP y gestiona el apagado ordenado (*graceful shutdown*).

---

## 🔒 Regla de Dependencias

Las dependencias **solo pueden apuntar hacia adentro**:
- `domain` no importa a ninguna otra capa ni paquetes externos de NPM.
- `application` solo importa de `domain`.
- `infrastructure` y `presentation` importan de `application` y `domain`, **nunca entre sí**.
- `main` es el único módulo con visibilidad de todas las capas para realizar la inyección de dependencias.

Esta regla se audita de forma automática con `dependency-cruiser` ejecutando:

```bash
npm run arch:check
```
