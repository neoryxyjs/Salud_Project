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
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build de NestJS
RUN npm run build

# Verificar que main.js existe
RUN test -f dist/main.js || (echo "ERROR: dist/main.js not found" && ls -la dist/ && exit 1)

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

