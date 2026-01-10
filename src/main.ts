import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS for Vercel/Frontend

  // Register Global Response Formatters
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Personal Finance API')
    .setDescription('The Personal Finance API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Personal Finance API',
    swaggerOptions: {
      persistAuthorization: true,
    },
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui.min.css',
    ],
  });

  return app;
}

async function bootstrap() {
  const app = await createApp();
  // Vercel deployment requires port to be set, but we don't listen in serverless handler
  // Only listen if NOT running on Vercel (e.g. Local development or VPS)
  if (!process.env.VERCEL) {
    const port = process.env.PORT || 3000;
    await app.listen(port);
  }
}
bootstrap();
