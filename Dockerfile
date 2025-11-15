# Dockerfile para Railway - Backend API
FROM node:18-alpine AS base

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar archivos de configuración
COPY package.json package-lock.json* ./
COPY turbo.json ./

# Instalar dependencias de la raíz
RUN npm install

# Copiar código fuente del API
COPY apps/api ./apps/api
COPY prisma ./prisma

# Build del API
WORKDIR /app/apps/api

# Generar Prisma Client
RUN echo "Generating Prisma Client..." && npx prisma generate --schema=./prisma/schema.prisma

# Verificar estructura antes del build
RUN echo "Current directory:" && pwd && echo "Files:" && ls -la

# Build de NestJS
RUN echo "Building NestJS..." && npm run build

# Verificar estructura después del build
RUN echo "After build - Current directory:" && pwd && echo "Files in current dir:" && ls -la && echo "Files in dist:" && ls -la dist/ || echo "dist directory does not exist"

# Verificar que main.js existe (puede estar en dist/src/main.js)
RUN if [ -f dist/main.js ]; then \
      echo "✅ main.js found in dist/"; \
    elif [ -f dist/src/main.js ]; then \
      echo "✅ main.js found in dist/src/, moving to dist/"; \
      mv dist/src/main.js dist/main.js && \
      mv dist/src/*.js dist/ 2>/dev/null || true; \
    else \
      echo "❌ ERROR: main.js not found" && \
      echo "Contents of dist:" && ls -la dist/ && \
      find dist -name "main.js" && \
      exit 1; \
    fi

# Verificar que main.js existe en dist/
RUN test -f dist/main.js && echo "✅ Final verification: main.js exists in dist/" || (echo "❌ ERROR: main.js still not in dist/" && exit 1)

# Producción
FROM node:18-alpine AS runner

WORKDIR /app

# Copiar solo lo necesario
COPY --from=base /app/apps/api/dist ./dist
COPY --from=base /app/apps/api/node_modules ./node_modules
COPY --from=base /app/apps/api/package.json ./
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["node", "dist/main.js"]

