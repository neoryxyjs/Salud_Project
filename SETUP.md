# Guía de Configuración - QuePlan Clone

## 🚀 Inicio Rápido

### 1. Instalación de Dependencias

```bash
# Instalar dependencias del monorepo
npm install
```

### 2. Configuración de Base de Datos

1. **Crear base de datos PostgreSQL:**
   - Localmente o usar Railway/Neon/Supabase
   - Obtener la URL de conexión

2. **Configurar variables de entorno:**

   Crear `apps/api/.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/queplan?schema=public"
   JWT_SECRET="supersecreto"
   PORT=3001
   FRONTEND_URL="http://localhost:3000"
   NODE_ENV="development"
   ```

   Crear `apps/web/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   ```

### 3. Configurar Prisma

```bash
cd apps/api

# Generar Prisma Client
npm run db:generate

# Crear migraciones
npm run db:migrate

# Poblar base de datos con datos de prueba
npm run db:seed
```

### 4. Iniciar Desarrollo

Desde la raíz del proyecto:

```bash
npm run dev
```

Esto iniciará:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001

## 📋 Credenciales de Prueba

Después de ejecutar el seed, puedes usar:

- **Admin:** 
  - Email: `admin@queplan.cl`
  - Password: `admin123`

- **Manager:**
  - Email: `manager@queplan.cl`
  - Password: `manager123`

## 🗂️ Estructura del Proyecto

```
queplan-clone/
├── apps/
│   ├── web/                    # Next.js Frontend
│   │   ├── app/                # App Router pages
│   │   ├── components/         # React components
│   │   └── lib/                # Utilities
│   └── api/                    # NestJS Backend
│       ├── src/
│       │   ├── auth/           # Authentication module
│       │   ├── users/          # Users module
│       │   ├── insurers/       # Insurers module
│       │   ├── plans/          # Plans module
│       │   ├── leads/          # Leads module
│       │   └── prisma/         # Prisma service
│       └── prisma/              # Prisma schema & seed
├── prisma/                      # Root Prisma schema (backup)
└── package.json                 # Root package.json
```

## 🔧 Comandos Útiles

### Backend (apps/api)
```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Build de producción
npm run start        # Iniciar producción
npm run db:generate  # Generar Prisma Client
npm run db:migrate   # Ejecutar migraciones
npm run db:seed      # Poblar base de datos
npm run db:studio    # Abrir Prisma Studio
```

### Frontend (apps/web)
```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm run start        # Iniciar producción
npm run lint         # Linter
```

### Monorepo (raíz)
```bash
npm run dev          # Iniciar todo en desarrollo
npm run build        # Build de todo
npm run lint         # Linter de todo
```

## 🐛 Solución de Problemas

### Error: Prisma Client no generado
```bash
cd apps/api
npm run db:generate
```

### Error: Base de datos no conectada
- Verificar `DATABASE_URL` en `apps/api/.env`
- Asegurarse de que PostgreSQL esté corriendo
- Verificar credenciales de conexión

### Error: CORS en desarrollo
- Verificar `FRONTEND_URL` en `apps/api/.env`
- Asegurarse de que coincida con la URL del frontend

### Error: Next.js no encuentra módulos
```bash
cd apps/web
rm -rf .next node_modules
npm install
```

## 📚 Próximos Pasos

1. **Configurar producción:**
   - Railway para backend (PostgreSQL + API)
   - Vercel para frontend
   - Actualizar variables de entorno

2. **Personalizar:**
   - Agregar más planes e Isapres
   - Personalizar diseño
   - Agregar más funcionalidades al CRM

3. **Deploy:**
   - Configurar CI/CD
   - Configurar dominios
   - Configurar SSL

## 🆘 Soporte

Si encuentras problemas:
1. Verificar logs en consola
2. Revisar variables de entorno
3. Verificar que todas las dependencias estén instaladas
4. Ejecutar `npm run db:generate` si hay errores de Prisma

