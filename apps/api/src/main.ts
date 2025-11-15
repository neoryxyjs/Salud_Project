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
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
}

bootstrap();

