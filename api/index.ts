import serverlessExpress from '@vendia/serverless-express';
import { createApp } from '../src/main';

let server: any;

async function bootstrap() {
    const app = await createApp();
    await app.init();

    const expressApp = app.getHttpAdapter().getInstance();
    return serverlessExpress({ app: expressApp });
}

export default async function handler(req, res) {
    server = server ?? (await bootstrap());
    return server(req, res);
}
