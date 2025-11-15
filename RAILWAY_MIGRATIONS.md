# 🗄️ Ejecutar Migraciones en Railway

## Método 1: Usando Railway Shell (Recomendado)

### Paso 1: Abrir el Shell de Railway

1. Ve a **Railway Dashboard**
2. Selecciona tu proyecto
3. Haz clic en el servicio **`@queplan-clone/api`**
4. En la parte superior, busca la pestaña **"Deployments"** o **"Logs"**
5. Haz clic en el último deployment (el más reciente)
6. Busca el botón **"Shell"** o **"Open Shell"** (generalmente está en la parte superior derecha)
7. Haz clic para abrir una terminal interactiva

### Paso 2: Ejecutar las Migraciones

Una vez que se abra el shell, ejecuta estos comandos:

```bash
# Navegar al directorio del API
cd apps/api

# Ejecutar las migraciones
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

**Nota:** El comando `migrate deploy` aplica todas las migraciones pendientes sin crear nuevas. Es el comando correcto para producción.

### Paso 3: Verificar

Deberías ver algo como:

```
✅ Applied migration: 20231115_initial_migration
✅ Applied migration: 20231115_add_indexes
```

## Método 2: Usando Railway CLI (Alternativa)

Si prefieres usar la CLI de Railway desde tu máquina local:

### Paso 1: Instalar Railway CLI

```bash
npm i -g @railway/cli
```

### Paso 2: Iniciar Sesión

```bash
railway login
```

### Paso 3: Conectar al Proyecto

```bash
railway link
```

### Paso 4: Ejecutar Migraciones

```bash
railway run --service @queplan-clone/api sh -c "cd apps/api && npx prisma migrate deploy --schema=./prisma/schema.prisma"
```

## Método 3: Agregar al Dockerfile (Automático)

Si quieres que las migraciones se ejecuten automáticamente en cada deploy, puedes modificar el Dockerfile:

### Modificar el Dockerfile

Agrega este paso después del build y antes del CMD:

```dockerfile
# Ejecutar migraciones (solo en producción)
RUN if [ "$NODE_ENV" = "production" ]; then \
      echo "Running migrations..." && \
      cd apps/api && \
      npx prisma migrate deploy --schema=./prisma/schema.prisma || echo "Migrations failed or already applied"; \
    fi
```

**⚠️ Nota:** Este método puede ser problemático porque:
- Las migraciones se ejecutan durante el build, no en runtime
- Si la base de datos no está disponible durante el build, fallará
- Es mejor ejecutarlas manualmente o en un script de inicio

## Método 4: Script de Inicio (Recomendado para Producción)

Crear un script que ejecute las migraciones antes de iniciar la aplicación:

### Crear el Script

Crea `apps/api/start.sh`:

```bash
#!/bin/sh
set -e

echo "Running database migrations..."
cd apps/api
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "Starting application..."
node dist/main.js
```

### Modificar el Dockerfile

Cambia el CMD en el Dockerfile:

```dockerfile
# Hacer el script ejecutable
RUN chmod +x apps/api/start.sh

# Comando de inicio
CMD ["sh", "apps/api/start.sh"]
```

## ✅ Verificar que las Migraciones se Aplicaron

Después de ejecutar las migraciones, puedes verificar:

### Opción 1: Usando Prisma Studio (Local)

```bash
cd apps/api
npx prisma studio --schema=./prisma/schema.prisma
```

### Opción 2: Verificar en Railway

1. Abre el shell de Railway
2. Ejecuta:
   ```bash
   cd apps/api
   npx prisma db pull --schema=./prisma/schema.prisma
   ```

### Opción 3: Probar un Endpoint

Haz una petición a tu API:
```bash
curl https://tu-api.railway.app/insurers
```

Si devuelve datos (aunque sea un array vacío), significa que la conexión funciona.

## 🎯 Recomendación

**Para empezar:** Usa el **Método 1** (Railway Shell) - es el más simple y directo.

**Para producción:** Considera el **Método 4** (Script de inicio) para automatizar las migraciones en cada deploy.

## 📝 Notas Importantes

1. **`migrate deploy` vs `migrate dev`:**
   - `migrate deploy` → Para producción (aplica migraciones existentes)
   - `migrate dev` → Para desarrollo (crea nuevas migraciones)

2. **Primera vez:** Si es la primera vez, es posible que necesites crear las migraciones primero:
   ```bash
   npx prisma migrate dev --schema=./prisma/schema.prisma --name initial
   ```
   Luego haz commit y push de la carpeta `prisma/migrations`

3. **Si no hay migraciones:** Si nunca has creado migraciones, puedes usar:
   ```bash
   npx prisma db push --schema=./prisma/schema.prisma
   ```
   Esto sincroniza el esquema sin crear archivos de migración.

