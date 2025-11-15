import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

// Importar desde dist después del build
let cachedApp: express.Express;
let nestApp: any;

async function bootstrap() {
  if (cachedApp) {
    return cachedApp;
  }

  try {
    // Intentar importar desde dist (producción) o src (desarrollo)
    let AppModule;
    try {
      // @ts-ignore - dist se genera en build time
      AppModule = (await import('../dist/app.module')).AppModule;
    } catch {
      // Fallback a src si dist no existe (desarrollo)
      AppModule = (await import('../src/app.module')).AppModule;
    }
    
    const expressApp = express();
    nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    nestApp.use(cookieParser());
    nestApp.enableCors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
    });

    nestApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await nestApp.init();
    cachedApp = expressApp;

    return expressApp;
  } catch (error) {
    console.error('Error bootstrapping app:', error);
    throw error;
  }
}

export default async function handler(req: express.Request, res: express.Response) {
  try {
    const app = await bootstrap();
    app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
