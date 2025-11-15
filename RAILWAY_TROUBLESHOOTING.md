# Troubleshooting Railway - Build no genera dist/main.js

## 🔍 Diagnóstico

El error `Cannot find module '/app/apps/api/dist/main.js'` indica que:
1. El build no se está ejecutando, O
2. El build falla silenciosamente, O
3. Railway tiene Root Directory configurado incorrectamente

## ✅ Verificaciones en Railway Dashboard

### 1. Verificar Root Directory

**Settings → Service → Root Directory:**
- ✅ Debe estar **VACÍO** (raíz del proyecto)
- ❌ NO debe ser `apps/api`

Si está en `apps/api`, los comandos `cd apps/api` en nixpacks.toml fallarán.

### 2. Verificar Logs del Build

En Railway Dashboard:
1. Ve a tu servicio `@queplan-clone/api`
2. Abre el último deployment
3. Revisa la sección **"Build"**
4. Busca estos mensajes:
   - `✅ SUCCESS: main.js exists` → Build OK
   - `❌ ERROR: main.js NOT FOUND` → Build falló
   - `PRISMA GENERATE FAILED` → Prisma falló
   - `BUILD FAILED` → NestJS build falló

### 3. Si Root Directory está en `apps/api`

Si Railway tiene Root Directory = `apps/api`, necesitas cambiar `nixpacks.toml`:

```toml
[phases.build]
cmds = [
  "pwd",  # Debe mostrar /app (no /app/apps/api)
  "npm install",
  "npx prisma generate --schema=./prisma/schema.prisma",
  "npm run build",
  "ls -la dist/"
]
```

## 🔧 Solución Alternativa: Usar Root Directory = apps/api

Si prefieres configurar Railway con Root Directory = `apps/api`:

1. En Railway: Settings → Service → Root Directory = `apps/api`
2. Actualizar `nixpacks.toml` para NO usar `cd apps/api`

