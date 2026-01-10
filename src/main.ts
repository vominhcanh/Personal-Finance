import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

export async function createApp() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Personal Finance API')
    .setDescription('The Personal Finance API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  return app;
}

async function bootstrap() {
  const app = await createApp();
  // Vercel deployment requires port to be set, but we don't listen in serverless handler
  // Only listen if NOT running on Vercel (e.g. Local development or VPS)
  if (!process.env.VERCEL) {
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Application is running on: ${await app.getUrl()}`);
  }
}
bootstrap();
