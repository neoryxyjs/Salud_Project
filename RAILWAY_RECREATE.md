# 🔄 Recrear Servicio en Railway

## Pasos para Eliminar y Recrear el Servicio

### Paso 1: Eliminar el Servicio Actual

1. Ve a Railway Dashboard
2. Selecciona tu proyecto
3. Encuentra el servicio `@queplan-clone/api`
4. Haz clic en los **3 puntos (⋯)** del servicio
5. Selecciona **"Delete Service"**
6. Confirma la eliminación

**⚠️ IMPORTANTE:** NO elimines el servicio de PostgreSQL, solo el del API.

### Paso 2: Crear Nuevo Servicio

1. En el mismo proyecto de Railway
2. Haz clic en **"+ New"** o **"Add Service"**
3. Selecciona **"GitHub Repo"**
4. Conecta tu cuenta de GitHub si no está conectada
5. Selecciona el repositorio: `neoryxyjs/Salud_Project`
6. Railway detectará automáticamente el `Dockerfile`

### Paso 3: Configuración del Nuevo Servicio

Railway debería detectar automáticamente:
- ✅ **Builder:** Dockerfile (no Nixpacks)
- ✅ **Dockerfile:** Detectado automáticamente

**Verifica en Settings → Service:**
- **Root Directory:** (dejar vacío - raíz del proyecto)
- **Build Command:** (dejar vacío - usa Dockerfile)
- **Start Command:** (dejar vacío - usa Dockerfile)

### Paso 4: Variables de Entorno

Agrega estas variables de entorno:

```env
DATABASE_URL=postgresql://postgres:DOendYdBmhRXVeAjZazjXIUCSNCcRBrQ@postgres.railway.internal:5432/railway
JWT_SECRET=tu_secreto_jwt_super_seguro_minimo_32_caracteres
FRONTEND_URL=https://tu-frontend.vercel.app
NODE_ENV=production
```

### Paso 5: Conectar con PostgreSQL

1. En el nuevo servicio del API
2. Haz clic en **"+ Add"** → **"Database"**
3. Selecciona tu servicio PostgreSQL existente
4. O usa la variable `DATABASE_URL` que ya tienes

### Paso 6: Deploy

Railway debería hacer deploy automáticamente. Si no:
1. Ve a la pestaña **"Deployments"**
2. Haz clic en **"Deploy"**

## ✅ Ventajas de Recrear

- Railway detectará el Dockerfile desde cero
- No habrá conflictos con configuraciones anteriores
- Se usará la última versión del código
- Configuración limpia

## 📋 Checklist

- [ ] Servicio anterior eliminado
- [ ] Nuevo servicio creado desde GitHub
- [ ] Dockerfile detectado automáticamente
- [ ] Variables de entorno configuradas
- [ ] PostgreSQL conectado
- [ ] Deploy iniciado
- [ ] Logs del build revisados

