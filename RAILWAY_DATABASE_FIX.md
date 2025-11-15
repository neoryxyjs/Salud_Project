# 🔧 Solución: Error de Autenticación de Base de Datos en Railway

## ✅ Estado Actual

- ✅ **Build exitoso:** El Dockerfile funciona correctamente
- ✅ **Aplicación iniciando:** Todos los módulos se cargan correctamente
- ❌ **Error de autenticación:** Las credenciales de PostgreSQL no son válidas

## 🔍 Diagnóstico

El error indica:
```
PrismaClientInitializationError: Authentication failed against database server, 
the provided database credentials for `postgres` are not valid.
```

## 🛠️ Solución: Verificar y Actualizar DATABASE_URL

### Paso 1: Obtener la URL Correcta de PostgreSQL en Railway

1. Ve a **Railway Dashboard**
2. Selecciona tu proyecto
3. Encuentra el servicio **PostgreSQL** (no el del API)
4. Ve a la pestaña **"Variables"** o **"Connect"**
5. Busca la variable `DATABASE_URL` o `POSTGRES_URL`

**Opciones:**

#### Opción A: Usar la Variable Automática de Railway
Railway crea automáticamente una variable `DATABASE_URL` cuando conectas un servicio PostgreSQL. 

1. En el servicio del **API** (no PostgreSQL)
2. Ve a **Settings → Variables**
3. Busca si hay una variable `DATABASE_URL` generada automáticamente
4. Si no existe, ve al paso siguiente

#### Opción B: Obtener la URL Manualmente
1. En el servicio **PostgreSQL**
2. Ve a la pestaña **"Connect"** o **"Variables"**
3. Copia la URL de conexión que aparece ahí
4. Debería verse así:
   ```
   postgresql://postgres:PASSWORD@HOST:PORT/railway
   ```

#### Opción C: Usar la URL Pública (si está habilitada)
Si tienes **Public Networking** habilitado, puedes usar:
```
postgresql://postgres:PASSWORD@postgres-production-XXXX.up.railway.app:5432/railway
```

### Paso 2: Actualizar la Variable en el Servicio API

1. Ve al servicio **`@queplan-clone/api`** en Railway
2. Ve a **Settings → Variables**
3. Busca o crea la variable `DATABASE_URL`
4. Actualiza el valor con la URL correcta que obtuviste en el Paso 1

**Formato esperado:**
```env
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/DATABASE
```

### Paso 3: Verificar Otras Variables de Entorno

Asegúrate de que estas variables estén configuradas:

```env
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway
JWT_SECRET=tu_secreto_jwt_super_seguro_minimo_32_caracteres
FRONTEND_URL=https://tu-frontend.vercel.app
NODE_ENV=production
PORT=3001
```

### Paso 4: Conectar el Servicio PostgreSQL al API

Si aún no lo has hecho:

1. En el servicio del **API**
2. Haz clic en **"+ Add"** → **"Database"**
3. Selecciona tu servicio **PostgreSQL** existente
4. Railway creará automáticamente la variable `DATABASE_URL`

### Paso 5: Ejecutar Migraciones

Después de actualizar `DATABASE_URL`, necesitas ejecutar las migraciones:

**Opción A: Desde Railway (Recomendado)**

1. Ve al servicio del **API**
2. Ve a la pestaña **"Deployments"**
3. Haz clic en los **3 puntos (⋯)** del último deployment
4. Selecciona **"Open Shell"** o **"Run Command"**
5. Ejecuta:
   ```bash
   cd apps/api
   npx prisma migrate deploy --schema=./prisma/schema.prisma
   ```

**Opción B: Agregar al Dockerfile (Automático)**

Puedes agregar la migración al Dockerfile para que se ejecute automáticamente en cada deploy.

### Paso 6: Redeploy

1. Después de actualizar las variables
2. Ve a **Deployments**
3. Haz clic en **"Redeploy"** o espera a que Railway detecte los cambios
4. Verifica los logs para confirmar que la conexión funciona

## 🔍 Verificar la Conexión

Después del redeploy, verifica los logs. Deberías ver:

```
✅ [NestFactory] Starting Nest application...
✅ [InstanceLoader] PrismaModule dependencies initialized
✅ Application is running on: http://0.0.0.0:3001
```

**NO deberías ver:**
```
❌ PrismaClientInitializationError: Authentication failed
```

## 📝 Notas Importantes

1. **URL Interna vs Externa:**
   - `postgres.railway.internal` → Solo funciona dentro de Railway
   - `postgres-production-XXXX.up.railway.app` → Funciona desde fuera (si Public Networking está habilitado)

2. **Contraseña:** Asegúrate de que la contraseña en la URL esté correctamente codificada (URL-encoded)

3. **Base de Datos:** Verifica que el nombre de la base de datos sea correcto (generalmente `railway`)

## 🆘 Si el Problema Persiste

1. Verifica que el servicio PostgreSQL esté **activo** y **running**
2. Verifica que el servicio API tenga **acceso** al servicio PostgreSQL
3. Intenta crear una nueva base de datos PostgreSQL en Railway
4. Verifica los logs del servicio PostgreSQL para ver si hay errores

