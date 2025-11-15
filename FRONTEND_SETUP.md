# 🎨 Configuración del Frontend

## 📋 Pasos para Conectar el Frontend con el Backend

### 1. Obtener la URL del Backend en Railway

1. Ve a **Railway Dashboard**
2. Selecciona tu proyecto
3. Haz clic en el servicio **`@queplan-clone/api`**
4. Ve a **Settings** → **Networking** o **Deployments**
5. Copia la **URL pública** del servicio
   - Ejemplo: `https://tu-api-production.up.railway.app`

### 2. Configurar Variable de Entorno en Vercel

1. Ve a **Vercel Dashboard**
2. Selecciona tu proyecto del frontend
3. Ve a **Settings** → **Environment Variables**
4. Agrega una nueva variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** La URL de Railway que copiaste (ej: `https://tu-api-production.up.railway.app`)
   - **Environments:** Selecciona `Production`, `Preview`, y `Development`
5. Haz clic en **Save**

### 3. Configurar CORS en Railway (si es necesario)

Asegúrate de que en Railway, el servicio API tenga la variable:
- **Name:** `FRONTEND_URL`
- **Value:** La URL de tu frontend en Vercel (ej: `https://tu-frontend.vercel.app`)
  - O usa `*` para permitir todas las URLs (solo para desarrollo)

### 4. Redeploy del Frontend

Después de agregar la variable de entorno:

1. En Vercel Dashboard, ve a **Deployments**
2. Haz clic en los **3 puntos (⋯)** del último deployment
3. Selecciona **Redeploy**
4. O simplemente haz un nuevo push a tu repositorio

### 5. Verificar que Funciona

1. Abre tu frontend en el navegador
2. Abre la **Consola del Navegador** (F12 → Console)
3. Navega a diferentes páginas:
   - `/comparador` - Debería cargar los planes
   - `/plan/[slug]` - Debería mostrar el detalle de un plan
   - `/auth/login` - Debería permitir iniciar sesión
   - `/crm/leads` - Debería mostrar los leads (requiere autenticación)

4. En la consola, verifica que:
   - No haya errores de CORS
   - Las peticiones al API se hagan correctamente
   - Los datos se carguen correctamente

## 🔍 Páginas Disponibles para Probar

### Públicas (sin autenticación)

- **`/`** - Landing page
- **`/comparador`** - Comparador de planes de salud
  - Filtros por región, edad, cargas, precio
  - Muestra grid de planes
- **`/plan/[slug]`** - Detalle de un plan específico
  - Información completa del plan
  - Precios por región
  - Beneficios y coberturas

### Protegidas (requieren autenticación)

- **`/auth/login`** - Página de login
  - Email y contraseña
  - Redirige a `/crm` después del login
- **`/crm`** - Dashboard del CRM
- **`/crm/leads`** - Gestión de leads
  - Tabla con todos los leads
  - Filtros y búsqueda
  - Edición de estado y notas
  - Requiere rol ADMIN o MANAGER

## 🧪 Cómo Probar desde el Frontend

### 1. Probar el Comparador

1. Ve a `/comparador`
2. Usa los filtros:
   - Selecciona una región
   - Ajusta la edad
   - Selecciona número de cargas
   - Ajusta el precio máximo
3. Verifica que los planes se filtren correctamente
4. Haz clic en un plan para ver el detalle

### 2. Probar la Autenticación

1. Ve a `/auth/login`
2. Si no tienes usuario, primero regístrate (puedes hacerlo desde el API o crear un endpoint de registro)
3. Inicia sesión con tus credenciales
4. Deberías ser redirigido a `/crm`

### 3. Probar el CRM de Leads

1. Después de iniciar sesión, ve a `/crm/leads`
2. Verifica que:
   - La tabla de leads se carga
   - Puedes buscar leads
   - Puedes cambiar el estado de un lead
   - Puedes editar las notas

### 4. Probar Creación de Leads

1. Desde el comparador o detalle de plan
2. Debería haber un formulario para crear un lead
3. Completa el formulario y envía
4. Verifica que el lead aparezca en `/crm/leads`

## 🐛 Solución de Problemas

### Error: "Network Error" o "CORS Error"

**Solución:**
1. Verifica que `FRONTEND_URL` en Railway esté configurada correctamente
2. Verifica que `NEXT_PUBLIC_API_URL` en Vercel tenga la URL correcta
3. Asegúrate de que la URL no termine con `/` (ej: `https://api.railway.app` no `https://api.railway.app/`)

### Error: "401 Unauthorized"

**Solución:**
- Asegúrate de haber iniciado sesión primero
- Verifica que las cookies se estén enviando correctamente
- Revisa que `withCredentials: true` esté en la configuración de axios

### Error: "404 Not Found"

**Solución:**
- Verifica que el endpoint exista en el backend
- Revisa la consola del navegador para ver la URL exacta que se está llamando
- Verifica que la variable `NEXT_PUBLIC_API_URL` esté correctamente configurada

### Los Datos No Se Cargan

**Solución:**
1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Network**
3. Busca las peticiones al API
4. Verifica:
   - Que las peticiones se hagan a la URL correcta
   - Que el status code sea 200 (éxito)
   - Que la respuesta contenga datos

## 📝 Notas Importantes

- **Variables de Entorno:** Las variables que empiezan con `NEXT_PUBLIC_` son accesibles desde el cliente (navegador)
- **CORS:** El backend debe tener configurado CORS para permitir peticiones desde el frontend
- **Cookies:** Las cookies se envían automáticamente gracias a `withCredentials: true` en axios
- **Autenticación:** El JWT se guarda en una cookie `httpOnly`, por lo que no es accesible desde JavaScript

## ✅ Checklist

- [ ] URL del backend copiada de Railway
- [ ] Variable `NEXT_PUBLIC_API_URL` configurada en Vercel
- [ ] Variable `FRONTEND_URL` configurada en Railway
- [ ] Frontend redeployado en Vercel
- [ ] Comparador de planes funciona
- [ ] Login funciona
- [ ] CRM de leads funciona
- [ ] No hay errores en la consola del navegador

