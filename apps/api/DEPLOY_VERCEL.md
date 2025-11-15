# Guía de Deploy en Vercel

## ⚠️ Configuración en Vercel Dashboard

### 1. Configuración del Proyecto

- **Framework Preset:** Otro (No usar NestJS preset)
- **Root Directory:** `apps/api`
- **Project Name:** `salud-project-api`

### 2. Build and Output Settings

Haz clic en "Build and Output Settings" y configura:

- **Build Command:** `npm install && npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 3. Environment Variables

```env
DATABASE_URL=postgresql://postgres:DOendYdBmhRXVeAjZazjXIUCSNCcRBrQ@postgres-production-8227.up.railway.app:5432/railway
JWT_SECRET=tu_secreto_jwt_super_seguro_minimo_32_caracteres
FRONTEND_URL=*
NODE_ENV=production
```

### 4. Deploy

Haz clic en "Deploy"

## 🔧 Alternativa Recomendada: Railway

Para el backend, te recomiendo usar Railway en lugar de Vercel porque:
- Mejor soporte para aplicaciones con estado
- Integración más simple con PostgreSQL
- Sin límites de tiempo de ejecución
