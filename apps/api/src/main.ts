import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { execSync } from 'child_process';
import { AppModule } from './app.module';

async function bootstrap() {
  // Ejecutar migraciones automáticamente en producción
  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 Running database migrations...');
    console.log('Current working directory:', process.cwd());
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // Determinar la ruta correcta del schema
    // En producción, el schema está en /app/prisma/schema.prisma
    const schemaPath = process.cwd().includes('/app/apps/api') 
      ? '../../prisma/schema.prisma'
      : './prisma/schema.prisma';
    
    console.log('Using schema path:', schemaPath);
    
    try {
      // Intentar db push primero (más confiable para primera vez)
      console.log('Attempting db push...');
      execSync(`npx prisma db push --schema=${schemaPath} --accept-data-loss --skip-generate`, {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env },
      });
      console.log('✅ Database schema synchronized successfully');
    } catch (error: any) {
      console.error('❌ Database migration failed:', error.message);
      console.error('Error details:', error);
      // En producción, es crítico que las tablas existan
      throw new Error(`Database migration failed: ${error.message}`);
    }
  }

  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  
  // Configurar CORS para aceptar todas las URLs de Vercel
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:3000'];
  
  // Función para validar origen (acepta localhost y cualquier URL de vercel.app)
  const originValidator = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      // Permitir requests sin origin (ej: Postman, curl)
      return callback(null, true);
    }
    
    // Permitir localhost en desarrollo
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Permitir cualquier URL de Vercel
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Permitir orígenes explícitos en FRONTEND_URL
    if (allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed))) {
      return callback(null, true);
    }
    
    callback(null, false);
  };
  
  app.enableCors({
    origin: originValidator,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        console.error('Validation errors:', errors);
        return errors;
      },
    }),
  );

  // Manejo global de errores
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Global error handler:', err);
    if (res.headersSent) {
      return next(err);
    }
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal server error';
    res.status(status).json({
      statusCode: status,
      message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
}

bootstrap();

