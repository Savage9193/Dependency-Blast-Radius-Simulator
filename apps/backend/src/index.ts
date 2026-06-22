import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { v1Router } from './routes/v1';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { swaggerSpec } from './config/swagger';
import { getEnv } from './config/env';
import { initSocketServer } from './sockets';

dotenv.config();

export function createApp() {
  const env = getEnv();
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use('/api/v1', v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export function startServer() {
  const env = getEnv();
  const app = createApp();
  const httpServer = createServer(app);

  initSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
    console.log(`API docs: http://localhost:${env.PORT}/api/docs`);
  });

  return httpServer;
}

if (require.main === module) {
  startServer();
}
