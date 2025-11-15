# QuePlan Clone - Plataforma de Comparación de Planes de Salud

Plataforma completa tipo QuePlan.cl para comparar planes de salud (Isapres) con CRM interno para gestión de leads.

## 🏗️ Estructura del Proyecto

```
queplan-clone/
├── apps/
│   ├── web/              # Next.js 14 + TailwindCSS + shadcn/ui
│   └── api/              # NestJS + Prisma ORM + JWT
├── prisma/
│   ├── schema.prisma     # Esquema de base de datos
│   └── seed.ts           # Seed con datos dummy
├── turbo.json
└── package.json
```

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

### Monorepo
- Turborepo

## 📦 Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**

Crear `.env` en la raíz del proyecto:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/queplan?schema=public"
JWT_SECRET="supersecreto"
NEXT_PUBLIC_API_URL="http://localhost:3001"
PORT=3001
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

3. **Configurar Prisma:**
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

4. **Iniciar desarrollo:**
```bash
npm run dev
```

Esto iniciará:
- Frontend en `http://localhost:3000`
- Backend en `http://localhost:3001`

## 🔐 Credenciales de Prueba

- **Admin:** admin@queplan.cl / admin123
- **Manager:** manager@queplan.cl / manager123

## 📚 Endpoints del API

### Auth
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrarse
- `GET /auth/me` - Obtener usuario actual

### Insurers
- `GET /insurers` - Listar todas las Isapres
- `GET /insurers/:slug` - Obtener Isapre por slug

### Plans
- `GET /plans` - Listar planes (con filtros: region, age, cargas, maxPrice)
- `GET /plans/:id` - Obtener plan por ID
- `GET /plans/slug/:slug` - Obtener planes por slug de Isapre

### Leads
- `POST /leads` - Crear lead (público)
- `GET /leads` - Listar leads (ADMIN, MANAGER)
- `PATCH /leads/:id` - Actualizar lead (ADMIN, MANAGER)

## 🎨 Páginas del Frontend

- `/` - Landing page
- `/comparador` - Comparador de planes con filtros
- `/plan/[slug]` - Detalle del plan
- `/auth/login` - Login CRM
- `/crm` - Dashboard CRM
- `/crm/leads` - Gestión de leads

## 🗄️ Base de Datos

El esquema incluye:
- **User** - Usuarios del sistema (roles: ADMIN, MANAGER, SUPPORT, USER)
- **Insurer** - Isapres
- **Plan** - Planes de salud
- **PriceTier** - Precios por edad, cargas y región
- **Lead** - Leads generados

## 🚢 Deploy

### Railway (Backend)
1. Conectar repositorio
2. Configurar variables de entorno
3. Deploy automático

### Vercel (Frontend)
1. Conectar repositorio
2. Configurar `NEXT_PUBLIC_API_URL`
3. Deploy automático

## 📝 Scripts Disponibles

- `npm run dev` - Iniciar desarrollo
- `npm run build` - Build de producción
- `npm run lint` - Linter
- `npm run db:generate` - Generar Prisma Client
- `npm run db:migrate` - Ejecutar migraciones
- `npm run db:seed` - Ejecutar seed

## 🛠️ Desarrollo

El proyecto usa Turborepo para gestionar el monorepo. Cada aplicación puede ejecutarse independientemente o todas juntas con `npm run dev`.

