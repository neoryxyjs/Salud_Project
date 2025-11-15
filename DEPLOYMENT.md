# Guía de Deployment

## 🚀 Frontend en Vercel

### Configuración en Vercel Dashboard

1. **Nuevo Proyecto** → Importar desde GitHub → `neoryxyjs/Salud_Project`

2. **Configuración del Proyecto:**
   - **Framework Preset:** Next.js (auto-detectado)
   - **Root Directory:** `apps/web` ⚠️ IMPORTANTE
   - **Project Name:** `salud-project-web`

3. **Build and Output Settings:**
   - **Build Command:** `npm run build` (automático)
   - **Output Directory:** `.next` (automático)
   - **Install Command:** `npm install` (automático)

4. **Environment Variables:**
   ```env
   NEXT_PUBLIC_API_URL=https://tu-api.railway.app
   ```

### ⚠️ Problema Actual

El `vercel.json` en la raíz está configurado para el API y está interfiriendo con el deploy del frontend. **Solución:** Eliminar o mover ese archivo.

---

## 🔧 Backend en Railway

### Configuración en Railway Dashboard

1. **Nuevo Proyecto** → Add Service → GitHub Repo → `neoryxyjs/Salud_Project`

2. **Settings → Service:**
   - **Root Directory:** (vacío - raíz del proyecto) ⚠️ IMPORTANTE
   - Railway usará `nixpacks.toml` automáticamente

3. **Variables de Entorno:**
   ```env
   DATABASE_URL=postgresql://postgres:DOendYdBmhRXVeAjZazjXIUCSNCcRBrQ@postgres.railway.internal:5432/railway
   JWT_SECRET=tu_secreto_jwt_super_seguro_minimo_32_caracteres
   FRONTEND_URL=https://tu-frontend.vercel.app
   NODE_ENV=production
   ```

4. **Post-Deploy:**
   - Ejecutar migraciones: `cd apps/api && npm run db:migrate`
   - Ejecutar seed (opcional): `cd apps/api && npm run db:seed`

### ⚠️ Problema Actual

El build no está generando `dist/main.js`. Revisar logs del build en Railway para ver el error específico.

---

## 📋 Checklist de Deployment

### Frontend (Vercel)
- [ ] Root Directory configurado como `apps/web`
- [ ] `vercel.json` de la raíz eliminado o movido
- [ ] `NEXT_PUBLIC_API_URL` configurado con URL de Railway
- [ ] Deploy exitoso

### Backend (Railway)
- [ ] Root Directory vacío (raíz del proyecto)
- [ ] Variables de entorno configuradas
- [ ] Build completado exitosamente
- [ ] `dist/main.js` generado
- [ ] Migraciones ejecutadas
- [ ] Servicio corriendo

