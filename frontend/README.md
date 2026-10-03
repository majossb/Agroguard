# 🌱 AgroGuard Frontend — Interfaz de Usuario para Diagnóstico Fitopatológico

Frontend moderno y responsivo para **AgroGuard**, construido en **React (ESM)** con **Tailwind CSS**, **TanStack Query** y **Vite**.

Diseñado bajo una estética editorial cuidada con enfoque **mobile-first**, accesible (WCAG AA) y desacoplado del backend mediante contratos **OpenAPI**.

---

## 🏛️ Estructura del Proyecto

```
src/
├── app/                 # Router, Providers (QueryClient, AuthContext), Layout (Header, Footer)
├── features/            # Módulos por dominio de negocio
│   ├── home/            # Landing page con estadísticas reales y metodología
│   ├── diagnosis/       # Módulo de captura, escáner y visualizador de resultados
│   ├── history/         # Historial paginado de diagnósticos y detalle con feedback
│   ├── catalog/         # Consulta de cultivos y fichas fitopatológicas
│   ├── account/         # Perfil de usuario y eliminación de cuenta en cascada
│   └── system/          # Estado del servicio (/health) y metadatos del modelo (/model/info)
├── shared/
│   ├── api/             # httpClient con RFC 9457, tokenStorage en memoria y DTOs
│   ├── ui/              # Componentes de diseño (Button, Card, Badge, CornerFrame, etc.)
│   ├── config/          # Tokens de color, rutas, variables de entorno y copy.es.js
│   └── lib/             # Sanitización de rutas (Open Redirect), formateadores
```

---

## 🚀 Requisitos Previos

- **Node.js**: `>= 20.0.0`
- **npm**: `>= 10.0.0`
- **Backend de AgroGuard** corriendo en `http://localhost:3000`

---

## ⚙️ Configuración y Ejecución

### 1. Instalar dependencias
```bash
cd frontend
npm install
```

### 2. Variables de entorno (opcional)
Por defecto, Vite se conecta mediante proxy a `http://localhost:3000`:
- `VITE_API_BASE_URL`: `/api/v1` (por defecto)
- `VITE_MAX_UPLOAD_MB`: `8` (por defecto)

### 3. Iniciar en modo desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.
En desarrollo, puedes visitar `http://localhost:5173/_ui` para ver el catálogo interactivo de componentes base y tokens de color.

### 4. Compilar para producción
```bash
npm run build
```

---

## 🧪 Pruebas y Calidad de Código

```bash
# Ejecutar todas las pruebas con Vitest y MSW
npm test

# Modo observador de pruebas
npm run test:watch

# Cobertura de código
npm run test:coverage

# Análisis estático con ESLint (incluye reglas de accesibilidad jsx-a11y)
npm run lint

# Corrección automática de estilo
npm run lint:fix

# Verificación de seguridad en el bundle compilado (sin secretos filtrados)
npm run check:bundle
```

---

## 🔒 Consideraciones de Seguridad Implementadas

1. **Tokens estrictamente en memoria:** El Access Token JWT nunca se guarda en `localStorage` ni `sessionStorage` para mitigar ataques XSS.
2. **Cookies Seguras:** La sesión se restaura de forma transparente mediante la cookie `httpOnly` de refresh gestionada por el navegador.
3. **Mappers con Lista Blanca:** Todas las respuestas de la API pasan por funciones de transformación que descartan atributos inesperados o internos.
4. **Prevención de Open Redirects:** La función `sanitizeReturnTo` valida cualquier parámetro de retorno impidiendo URLs externas o maliciosas.
5. **Sin funciones peligrosas:** No se utilizan `dangerouslySetInnerHTML`, `eval` ni `new Function`.
