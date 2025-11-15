# ✅ Guía de Verificación Completa - QuePlan Clone

## 🎯 Objetivo

Verificar que todos los componentes del sistema están funcionando correctamente después del deployment.

---

## 1️⃣ Verificar Backend en Railway

### Paso 1: Obtener la URL del API

1. Ve a **Railway Dashboard**
2. Selecciona tu proyecto
3. Haz clic en el servicio **`@queplan-clone/api`**
4. Ve a la pestaña **"Settings"** → **"Networking"** o **"Deployments"**
5. Busca la **URL pública** del servicio
   - Debería verse como: `https://tu-api-production.up.railway.app`
   - O en la pestaña **"Deployments"**, verás la URL en la parte superior

### Paso 2: Verificar que el API está Respondiendo

Abre tu navegador o usa `curl`:

```bash
# Reemplaza con tu URL real
curl https://tu-api-production.up.railway.app/insurers
```

**Respuesta esperada:**
- Si hay datos: `[{...}, {...}]` (array de objetos JSON)
- Si no hay datos: `[]` (array vacío)
- Si hay error: Mensaje de error

**✅ Éxito:** Si recibes un array (vacío o con datos), el API está funcionando.

---

## 2️⃣ Verificar Base de Datos

### Opción A: Verificar en los Logs de Railway

1. Ve a Railway Dashboard → Servicio API
2. Pestaña **"Logs"** o **"Deployments"** → Último deployment
3. Busca estos mensajes al inicio:
   ```
   🔄 Running database migrations...
   ✅ Migrations completed successfully
   ```
   O:
   ```
   ✅ Database schema synchronized
   ```

### Opción B: Probar un Endpoint que Requiere DB

```bash
# Probar endpoint de insurers (requiere conexión a DB)
curl https://tu-api-production.up.railway.app/insurers

# Probar endpoint de plans
curl https://tu-api-production.up.railway.app/plans
```

**✅ Éxito:** Si recibes respuestas (aunque sean arrays vacíos), la DB está conectada.

### Opción C: Verificar Tablas (Avanzado)

Si tienes acceso a Railway Shell o CLI:

```bash
railway run --service @queplan-clone/api sh -c "cd apps/api && npx prisma studio --schema=./prisma/schema.prisma"
```

---

## 3️⃣ Verificar Endpoints del API

### 🔐 Endpoints de Autenticación

#### 3.1. Registrar un Usuario

```bash
curl -X POST https://tu-api-production.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User"
  }'
```

**Respuesta esperada:**
```json
{
  "user": {
    "id": "...",
    "email": "test@example.com",
    "role": "USER"
  }
}
```

#### 3.2. Iniciar Sesión

```bash
curl -X POST https://tu-api-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }' \
  -c cookies.txt
```

**Respuesta esperada:**
```json
{
  "user": {
    "id": "...",
    "email": "test@example.com",
    "role": "USER"
  }
}
```

**Nota:** El token JWT se guarda en una cookie `access_token`.

#### 3.3. Obtener Usuario Actual (Requiere Autenticación)

```bash
curl https://tu-api-production.up.railway.app/auth/me \
  -b cookies.txt
```

**Respuesta esperada:**
```json
{
  "id": "...",
  "email": "test@example.com",
  "role": "USER"
}
```

### 📋 Endpoints de Isapres (Insurers)

#### 3.4. Listar Todas las Isapres

```bash
curl https://tu-api-production.up.railway.app/insurers
```

**Respuesta esperada:**
```json
[
  {
    "id": "...",
    "name": "Isapre 1",
    "slug": "isapre-1",
    "logoUrl": "...",
    "createdAt": "..."
  }
]
```

#### 3.5. Obtener Isapre por Slug

```bash
curl https://tu-api-production.up.railway.app/insurers/isapre-1
```

### 💼 Endpoints de Planes

#### 3.6. Listar Planes (con Filtros Opcionales)

```bash
# Todos los planes
curl https://tu-api-production.up.railway.app/plans

# Planes filtrados por región
curl "https://tu-api-production.up.railway.app/plans?region=Metropolitana"

# Planes filtrados por edad
curl "https://tu-api-production.up.railway.app/plans?age=30"

# Planes filtrados por cargas
curl "https://tu-api-production.up.railway.app/plans?cargas=2"

# Planes filtrados por precio máximo
curl "https://tu-api-production.up.railway.app/plans?maxPrice=100000"
```

#### 3.7. Obtener Plan por ID

```bash
curl https://tu-api-production.up.railway.app/plans/PLAN_ID
```

#### 3.8. Obtener Plan por Slug

```bash
curl https://tu-api-production.up.railway.app/plans/slug/plan-slug
```

### 👥 Endpoints de Usuarios (Requiere Autenticación)

#### 3.9. Listar Usuarios (Requiere rol ADMIN o MANAGER)

```bash
curl https://tu-api-production.up.railway.app/users \
  -b cookies.txt
```

#### 3.10. Obtener Usuario por ID

```bash
curl https://tu-api-production.up.railway.app/users/USER_ID \
  -b cookies.txt
```

### 📝 Endpoints de Leads

#### 3.11. Crear un Lead

```bash
curl -X POST https://tu-api-production.up.railway.app/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+56912345678",
    "region": "Metropolitana",
    "planId": "PLAN_ID"
  }'
```

**Respuesta esperada:**
```json
{
  "id": "...",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+56912345678",
  "region": "Metropolitana",
  "status": "new",
  "createdAt": "..."
}
```

#### 3.12. Listar Leads (Requiere Autenticación - ADMIN o MANAGER)

```bash
curl https://tu-api-production.up.railway.app/leads \
  -b cookies.txt
```

#### 3.13. Obtener Lead por ID

```bash
curl https://tu-api-production.up.railway.app/leads/LEAD_ID \
  -b cookies.txt
```

#### 3.14. Actualizar Lead (Requiere Autenticación - ADMIN o MANAGER)

```bash
curl -X PATCH https://tu-api-production.up.railway.app/leads/LEAD_ID \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "status": "contacted",
    "notes": "Cliente interesado en plan premium"
  }'
```

---

## 4️⃣ Verificar Variables de Entorno

En Railway Dashboard → Servicio API → **Settings** → **Variables**, verifica que tengas:

- ✅ `DATABASE_URL` - URL de conexión a PostgreSQL
- ✅ `JWT_SECRET` - Secreto para JWT (mínimo 32 caracteres)
- ✅ `FRONTEND_URL` - URL del frontend (o `*` para desarrollo)
- ✅ `NODE_ENV` - Debe ser `production`
- ✅ `PORT` - Puerto (Railway lo asigna automáticamente)

---

## 5️⃣ Verificar Logs de Railway

### Logs Esperados al Iniciar:

```
🔄 Running database migrations...
✅ Migrations completed successfully
[NestFactory] Starting Nest application...
[InstanceLoader] AppModule dependencies initialized
[InstanceLoader] PrismaModule dependencies initialized
[InstanceLoader] AuthModule dependencies initialized
...
[RouterExplorer] Mapped {/auth/login, POST} route
[RouterExplorer] Mapped {/auth/register, POST} route
...
[NestApplication] Nest application successfully started
🚀 API running on http://localhost:8080
```

**✅ Éxito:** Si ves todos estos mensajes, la aplicación está funcionando correctamente.

---

## 6️⃣ Verificar con Postman o Thunder Client

Si prefieres usar una herramienta visual:

1. **Importa la colección:**
   - Crea una nueva colección en Postman/Thunder Client
   - Agrega todas las URLs de los endpoints anteriores

2. **Configura la Base URL:**
   - Variable: `{{baseUrl}}` = `https://tu-api-production.up.railway.app`

3. **Prueba los endpoints:**
   - Empieza con endpoints públicos (insurers, plans)
   - Luego prueba autenticación (register, login)
   - Finalmente endpoints protegidos (con cookie de autenticación)

---

## 7️⃣ Verificar Frontend (Si ya está desplegado en Vercel)

### Paso 1: Obtener URL del Frontend

1. Ve a **Vercel Dashboard**
2. Selecciona tu proyecto
3. Copia la URL de producción

### Paso 2: Verificar Variables de Entorno en Vercel

En Vercel Dashboard → Proyecto → **Settings** → **Environment Variables**:

- ✅ `NEXT_PUBLIC_API_URL` - Debe ser la URL de Railway

### Paso 3: Probar el Frontend

1. Abre la URL del frontend en tu navegador
2. Verifica que:
   - La página carga correctamente
   - Puedes ver el comparador de planes
   - Los endpoints del API se llaman correctamente (revisa la consola del navegador)

---

## 8️⃣ Checklist Final

Marca cada item cuando esté funcionando:

- [ ] Backend responde en Railway
- [ ] Base de datos conectada (migraciones ejecutadas)
- [ ] Endpoint `/insurers` funciona
- [ ] Endpoint `/plans` funciona
- [ ] Endpoint `/auth/register` funciona
- [ ] Endpoint `/auth/login` funciona
- [ ] Endpoint `/auth/me` funciona (con autenticación)
- [ ] Endpoint `/leads` POST funciona
- [ ] Endpoint `/leads` GET funciona (con autenticación)
- [ ] Variables de entorno configuradas correctamente
- [ ] Logs sin errores críticos
- [ ] Frontend conectado al backend (si está desplegado)

---

## 🆘 Solución de Problemas

### Problema: "Cannot GET /"
**Solución:** Verifica que estés usando la URL correcta. Railway puede asignar rutas diferentes.

### Problema: "Authentication failed"
**Solución:** Verifica que `DATABASE_URL` esté correctamente configurada en Railway.

### Problema: "401 Unauthorized"
**Solución:** Asegúrate de incluir la cookie `access_token` en las peticiones protegidas.

### Problema: "404 Not Found"
**Solución:** Verifica que el endpoint esté correctamente escrito y que la aplicación esté desplegada.

---

## 📝 Notas

- **Primera vez:** Si es la primera vez que ejecutas, las tablas estarán vacías. Eso es normal.
- **Datos de prueba:** Puedes ejecutar el seed manualmente si necesitas datos de prueba (ver `prisma/seed.ts`).
- **CORS:** Si tienes problemas de CORS, verifica que `FRONTEND_URL` esté configurada correctamente.

---

## 🎉 ¡Listo!

Si todos los checks pasan, tu aplicación está completamente funcional y lista para usar.

