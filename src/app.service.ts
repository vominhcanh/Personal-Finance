import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Personal Finance API</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            margin: 0;
            text-align: center;
          }
          .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
          }
          h1 { margin-bottom: 0.5rem; font-size: 2.5rem; }
          p { margin-bottom: 1.5rem; font-size: 1.1rem; opacity: 0.9; }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background: white;
            color: #764ba2;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          }
          .status {
            margin-top: 1rem;
            font-size: 0.9rem;
            opacity: 0.7;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 Personal Finance API</h1>
          <p>Secure, fast, and scalable backend services.</p>
          <a href="/api" class="btn">View API Docs (Swagger)</a>
          <div class="status">System Status: 🟢 Operational</div>
        </div>
      </body>
      </html>
    `;
  }
}
