# Configuración Railway - Solo Backend (API)

## ⚠️ Problema: Railway detectó 2 servicios

Railway detectó automáticamente ambos workspaces (`@queplan-clone/web` y `@queplan-clone/api`) y creó 2 servicios separados.

## ✅ Solución: Configurar solo el servicio del API

### Opción 1: Eliminar el servicio del Frontend (Recomendado)

1. En Railway Dashboard, ve a tu proyecto
2. Encuentra el servicio `@queplan-clone/web` (el del frontend)
3. Haz clic en los 3 puntos (⋯) → **Delete Service**
4. Confirma la eliminación

**Razón:** El frontend debe estar en Vercel, no en Railway.

### Opción 2: Desactivar el servicio del Frontend

1. En Railway Dashboard, ve al servicio `@queplan-clone/web`
2. Settings → **Pause Service** o **Disable Auto-Deploy**
3. Esto evitará que se despliegue automáticamente

## 🔧 Configuración del Servicio API

Asegúrate de que el servicio `@queplan-clone/api` tenga:

### Settings → Service
- **Root Directory:** (vacío - raíz del proyecto)
- **Build Command:** (dejar vacío - usa nixpacks.toml)
- **Start Command:** (dejar vacío - usa nixpacks.toml)

### Variables de Entorno
```env
DATABASE_URL=postgresql://postgres:DOendYdBmhRXVeAjZazjXIUCSNCcRBrQ@postgres.railway.internal:5432/railway
JWT_SECRET=tu_secreto_jwt_super_seguro_minimo_32_caracteres
FRONTEND_URL=https://tu-frontend.vercel.app
NODE_ENV=production
```

## 📋 Resumen

- **Railway:** Solo el servicio `@queplan-clone/api` (backend)
- **Vercel:** El servicio `@queplan-clone/web` (frontend)
- **Eliminar o pausar:** El servicio `@queplan-clone/web` en Railway

