# Solucion Salud - Plataforma de Comparación de Planes de Salud

Plataforma completa tipo QuePlan.cl para comparar planes de salud (Isapres) con CRM interno para gestión de leads.

**Dominio de producción:** https://www.soluciondesalud.cl

## 🚀 Stack Tecnológico

### Frontend
- Next.js 14 (App Router)
- React 18
- TailwindCSS
- shadcn/ui
- React Query (TanStack Query)
- Axios
- TypeScript

### Backend
- NestJS
- Prisma ORM
- PostgreSQL
- JWT Auth (roles)
- Class-Validator
- Cookie-based authentication

## ⚙️ Configuración para Producción

### Variables de Entorno

#### Frontend (Next.js - Vercel)
Crea un archivo `.env.local` o configura las variables en Vercel:

```env
# URL de la API backend
NEXT_PUBLIC_API_URL=https://api.soluciondesalud.cl
# O si la API está en Railway, usa la URL de Railway
# NEXT_PUBLIC_API_URL=https://tu-api.railway.app

# Número de WhatsApp para contacto
NEXT_PUBLIC_WHATSAPP_NUMBER=+56994959513
```

#### Backend (NestJS - Railway/Vercel)
Configura las siguientes variables de entorno:

```env
# URL del frontend (puede ser múltiple separada por comas)
FRONTEND_URL=https://www.soluciondesalud.cl,https://soluciondesalud.cl

# Base de datos PostgreSQL
DATABASE_URL=postgresql://usuario:password@host:puerto/database

# JWT Secret (genera uno seguro)
JWT_SECRET=tu-secret-jwt-super-seguro

# Puerto del servidor (Railway lo configura automáticamente)
PORT=3001

# Entorno
NODE_ENV=production

# Opcional: Ejecutar seed automáticamente (solo si es necesario)
RUN_SEED=false
```

### Configuración de Dominio

El proyecto está configurado para funcionar con el dominio **https://www.soluciondesalud.cl**

#### Configuración de CORS
- El backend acepta automáticamente requests desde:
  - `https://www.soluciondesalud.cl`
  - `https://soluciondesalud.cl` (sin www)
  - URLs de Vercel (`.vercel.app`)
  - Localhost (solo en desarrollo)

#### Pasos para Despliegue

1. **Frontend (Vercel)**
   - Conecta tu repositorio a Vercel
   - Configura el dominio personalizado: `www.soluciondesalud.cl`
   - Añade las variables de entorno del frontend
   - El build se ejecutará automáticamente

2. **Backend (Railway o Vercel)**
   - Si usas Railway: conecta el repositorio y configura las variables de entorno
   - Si usas Vercel: el backend está en `apps/api` y se despliega como serverless functions
   - Asegúrate de configurar `FRONTEND_URL` con el dominio de producción
   - Configura `DATABASE_URL` con tu base de datos PostgreSQL

3. **Base de Datos**
   - Asegúrate de que la base de datos esté accesible desde tu proveedor de hosting
   - Ejecuta las migraciones de Prisma si es necesario

### Notas Importantes

- Las cookies de autenticación están configuradas con `sameSite: 'none'` y `secure: true` en producción para permitir cross-origin requests
- El CORS está configurado para aceptar el dominio de producción automáticamente
- En desarrollo local, el frontend usa `http://localhost:3001` como URL de API por defecto

