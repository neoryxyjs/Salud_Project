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
    // En producción (Railway), el schema está en /app/prisma/schema.prisma
    // En desarrollo local, puede estar en ./prisma/schema.prisma o ../../prisma/schema.prisma
    let schemaPath = './prisma/schema.prisma';
    
    // Verificar si el schema existe en la ruta actual
    const fs = require('fs');
    if (!fs.existsSync(schemaPath)) {
      // Intentar ruta relativa desde apps/api
      schemaPath = '../../prisma/schema.prisma';
      if (!fs.existsSync(schemaPath)) {
        // Intentar ruta absoluta
        schemaPath = '/app/prisma/schema.prisma';
      }
    }
    
    console.log('Using schema path:', schemaPath);
    console.log('Schema exists:', fs.existsSync(schemaPath));
    
    try {
      // Primero intentar agregar la columna updatedAt manualmente si no existe
      // Esto evita el error cuando hay datos existentes
      try {
        console.log('Preparing updatedAt column for existing data...');
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        // Ejecutar SQL directamente para agregar la columna si no existe
        await prisma.$executeRawUnsafe(`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'Lead' AND column_name = 'updatedAt'
            ) THEN
              ALTER TABLE "Lead" 
              ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
              RAISE NOTICE 'Column updatedAt added successfully';
            ELSE
              RAISE NOTICE 'Column updatedAt already exists';
            END IF;
          END $$;
        `);
        
        await prisma.$disconnect();
        console.log('✅ updatedAt column prepared');
      } catch (colError: any) {
        // Si falla, continuar con db push normal
        console.log('⚠️  Could not pre-add updatedAt column, will try db push...');
        console.log('   Error:', colError.message);
      }

      // Intentar db push (más confiable para primera vez)
      console.log('Attempting db push...');
      execSync(`npx prisma db push --schema=${schemaPath} --accept-data-loss --skip-generate`, {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env },
      });
      console.log('✅ Database schema synchronized successfully');
      
      // Ejecutar seed automáticamente después de crear las tablas
      // Solo si la variable RUN_SEED está explícitamente configurada como 'true'
      // NO ejecutar automáticamente para evitar crear leads de ejemplo
      if (process.env.RUN_SEED === 'true') {
        try {
          console.log('🌱 Running database seed...');
          const seedPath = schemaPath.replace('schema.prisma', 'seed.ts');
          // Intentar diferentes rutas para el seed
          let seedFile = seedPath;
          if (!fs.existsSync(seedFile)) {
            seedFile = seedPath.replace('./prisma/', '../../prisma/');
          }
          if (!fs.existsSync(seedFile)) {
            seedFile = '/app/prisma/seed.ts';
          }
          
          console.log('Using seed path:', seedFile);
          console.log('Seed file exists:', fs.existsSync(seedFile));
          
          if (fs.existsSync(seedFile)) {
            // Intentar con ts-node primero con opciones ESM
            try {
              execSync(`npx ts-node --compiler-options '{"module":"commonjs"}' ${seedFile}`, {
                stdio: 'inherit',
                cwd: process.cwd(),
                env: { ...process.env, TS_NODE_COMPILER_OPTIONS: '{"module":"commonjs"}' },
              });
              console.log('✅ Database seeded successfully');
              // Marcar que el seed se ejecutó
              process.env.SEED_EXECUTED = 'true';
            } catch (tsNodeError: any) {
              console.warn('⚠️ ts-node failed, trying with tsx...');
              try {
                // Intentar con tsx (soporta ES modules mejor)
                execSync(`npx tsx ${seedFile}`, {
                  stdio: 'inherit',
                  cwd: process.cwd(),
                  env: { ...process.env },
                });
                console.log('✅ Database seeded successfully');
                process.env.SEED_EXECUTED = 'true';
              } catch (tsxError: any) {
                console.warn('⚠️ tsx also failed, seed may need to be run manually');
                // No fallar completamente, solo advertir
              }
            }
          } else {
            console.warn('⚠️ Seed file not found, skipping seed');
          }
        } catch (seedError: any) {
          console.warn('⚠️ Seed failed (may already be seeded):', seedError.message);
          // No fallar si el seed ya se ejecutó
        }
      } else {
        console.log('⏭️  Skipping seed (already executed or RUN_SEED not set)');
      }
    } catch (error: any) {
      console.error('❌ Database migration failed:', error.message);
      console.error('Error details:', error);
      // En producción, es crítico que las tablas existan
      throw new Error(`Database migration failed: ${error.message}`);
    }
  }

  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  
  // Middleware de logging para todas las requests
  app.use((req: any, res: any, next: any) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    if (req.path.includes('/export')) {
      console.log('📥 EXPORT REQUEST:', {
        method: req.method,
        path: req.path,
        headers: {
          'content-type': req.headers['content-type'],
          'authorization': req.headers['authorization'] ? 'present' : 'missing',
          'cookie': req.headers['cookie'] ? 'present' : 'missing',
        },
        cookies: req.cookies ? Object.keys(req.cookies) : 'no cookies parsed',
        access_token: req.cookies?.access_token ? 'present' : 'missing',
      });
    }
    next();
  });
  
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
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Type', 'Authorization'],
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

