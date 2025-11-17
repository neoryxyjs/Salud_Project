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

# Instalar dependencias del workspace (esto instalará dependencias de todos los workspaces)
# Volver a la raíz para instalar dependencias del workspace
WORKDIR /app
RUN echo "Installing workspace dependencies..." && npm install

# Build del API
WORKDIR /app/apps/api

# Verificar que las dependencias estén instaladas y si no, instalarlas directamente
RUN echo "Checking dependencies..." && \
    (npm list axios rss-parser 2>/dev/null || (echo "Installing missing dependencies..." && npm install axios@^1.13.2 rss-parser@^3.13.0))

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
COPY --from=base /app/apps/api/package.json ./
COPY --from=base /app/prisma ./prisma

# Copiar node_modules desde la raíz del monorepo (workspaces)
COPY --from=base /app/node_modules ./node_modules

# Exponer puerto
EXPOSE 3001

# Comando de inicio (las migraciones se ejecutarán automáticamente en main.ts)
CMD ["node", "dist/main.js"]

