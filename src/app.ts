/**
 * Express application factory.
 *
 * What: Wires middleware, routes, and error handlers.
 * Why: server.ts only bootstraps; app.ts is importable in tests via supertest.
 */

import express from 'express';
import productRoutes from './routes/productRoutes';
import { corsMiddleware } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(corsMiddleware);
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/products', productRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
