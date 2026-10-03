# ==============================================================================
# Etapa 1: Dependencias de desarrollo para pruebas y validación
# ==============================================================================
FROM node:22-alpine AS dependencies
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ==============================================================================
# Etapa 2: Dependencias exclusivas de producción
# ==============================================================================
FROM node:22-alpine AS production-deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ==============================================================================
# Etapa 3: Imagen final optimizada y segura para ejecución en producción
# ==============================================================================
FROM node:22-alpine AS runner
WORKDIR /app

# Metadatos del contenedor
LABEL org.opencontainers.image.title="AgroGuard Backend" \
      org.opencontainers.image.description="API REST de AgroGuard para diagnóstico fitopatológico" \
      org.opencontainers.image.version="1.0.0"

ENV NODE_ENV=production \
    PORT=3000 \
    STORAGE_DIR=uploads/images

# Crear directorio de almacenamiento con permisos para el usuario no-root 'node'
RUN mkdir -p /app/uploads/images && chown -R node:node /app

# Copiar dependencias de producción y código fuente con propiedad del usuario node
COPY --chown=node:node --from=production-deps /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node data ./data
COPY --chown=node:node docs ./docs
COPY --chown=node:node src ./src
COPY --chown=node:node scripts ./scripts

# Ejecutar como usuario no privilegiado (Seguridad)
USER node

EXPOSE 3000

# Verificación de salud del contenedor
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["node", "src/main/server.js"]
