import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { execSync } from 'child_process';
import { AppModule } from './app.module';

async function bootstrap() {
  // Ejecutar migraciones automáticamente en producción
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('🔄 Running database migrations...');
      // Intentar migrate deploy primero (si hay migraciones)
      try {
        execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', {
          stdio: 'inherit',
          cwd: process.cwd(),
        });
        console.log('✅ Migrations completed successfully');
      } catch (migrateError) {
        // Si migrate deploy falla, intentar db push (para primera vez)
        console.log('⚠️ migrate deploy failed, trying db push...');
        execSync('npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss', {
          stdio: 'inherit',
          cwd: process.cwd(),
        });
        console.log('✅ Database schema synchronized');
      }
    } catch (error) {
      console.error('⚠️ Migration error (may already be applied):', error.message);
      // No fallar si las migraciones ya están aplicadas
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

