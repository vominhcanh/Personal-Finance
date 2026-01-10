import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  return app;
}

async function bootstrap() {
  const app = await createApp();
  // Vercel deployment requires port to be set, but we don't listen in serverless handler
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(process.env.PORT ?? 3000);
  }
}
bootstrap();
