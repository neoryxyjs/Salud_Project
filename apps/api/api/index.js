// Vercel serverless function handler for NestJS
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const express = require('express');

let app;

async function bootstrap() {
  if (!app) {
    const expressApp = express();
    const nestApp = await NestFactory.create(AppModule, {
      bodyParser: true,
    });
    
    await nestApp.init();
    nestApp.use(expressApp);
    
    app = expressApp;
  }
  return app;
}

module.exports = async (req, res) => {
  const app = await bootstrap();
  return app(req, res);
};

