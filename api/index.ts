import 'reflect-metadata';
import { createApp } from '../src/main';

let appPromise: Promise<any>;

async function bootstrap() {
    const app = await createApp();
    await app.init();
    return app.getHttpAdapter().getInstance();
}

export default async function handler(req, res) {
    appPromise = appPromise ?? bootstrap();
    const app = await appPromise;
    app(req, res);
}
