# 🔧 Solución Definitiva para Railway

## ⚠️ Problema

Railway no encuentra `/app/apps/api/dist/main.js`. Esto puede deberse a:

1. **Root Directory incorrecto** en Railway
2. **Build no se ejecuta** correctamente
3. **Build falla silenciosamente**

## ✅ Solución Paso a Paso

### Paso 1: Verificar Root Directory en Railway

1. Ve a Railway Dashboard
2. Selecciona tu servicio `@queplan-clone/api`
3. Settings → Service
4. Revisa **Root Directory**:
   - Si está **VACÍO** → Usa `nixpacks.toml` actual
   - Si está en **`apps/api`** → Necesitas cambiar la configuración

### Paso 2A: Si Root Directory está VACÍO (raíz)

**No hagas nada**, la configuración actual debería funcionar.

**Verifica los logs del build** y busca:
- `✅ SUCCESS: main.js exists` → Build OK
- `❌ ERROR: main.js NOT FOUND` → Comparte los logs completos

### Paso 2B: Si Root Directory = `apps/api`

1. **Renombra el archivo:**
   ```bash
   mv nixpacks-root-api.toml nixpacks.toml
   ```

2. **Haz commit y push:**
   ```bash
   git add nixpacks.toml
   git commit -m "Fix: Configurar nixpacks para Root Directory apps/api"
   git push
   ```

3. **Railway hará redeploy automáticamente**

### Paso 3: Revisar Logs del Build

En Railway Dashboard:
1. Ve a Deployments
2. Abre el último deployment
3. Revisa la sección **"Build"**
4. Busca estos mensajes clave:
   - `Current directory (should be /app/apps/api):` → Muestra dónde está ejecutando
   - `✅ SUCCESS: main.js exists` → Build exitoso
   - `❌ ERROR: main.js NOT FOUND` → Build falló
   - `PRISMA GENERATE FAILED` → Prisma falló
   - `BUILD FAILED` → NestJS build falló

### Paso 4: Si el Build Falla

**Comparte los logs completos del build** (especialmente la sección "Build") para diagnosticar el problema específico.

## 🔍 Diagnóstico Rápido

Ejecuta esto en Railway (Settings → Service → Deploy → View Logs):

```bash
# Verificar estructura
pwd
ls -la
cd apps/api 2>/dev/null && pwd || echo "Cannot cd to apps/api"
```

Si `cd apps/api` falla, Railway tiene Root Directory = `apps/api` y necesitas usar `nixpacks-root-api.toml`.

