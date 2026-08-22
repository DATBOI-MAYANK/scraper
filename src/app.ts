import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './common/middleware/error-handler.js';
import { documentRepository } from './modules/documents/document.repository.js';
import { syncService } from './modules/sync/sync.service.js';
import { syncHealth } from './modules/sync/sync.health.js';

export function createApp() {
  const app = express();
  app.use(express.json());
  const allowedOrigins = new Set(env.CORS_ORIGINS
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean));

  app.use((request, response, next) => {
    const origin = request.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Vary', 'Origin');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (request.method === 'OPTIONS') return response.sendStatus(204);
    }
    next();
  });

  app.get('/health', (_request, response) => {
    const sync = syncHealth.get();
    response.status(sync.status === 'failed' ? 503 : 200).json({ status: sync.status === 'failed' ? 'unhealthy' : 'ok', sync });
  });
  app.get('/api/documents', async (request, response, next) => {
    try {
      const limit = Math.min(Number(request.query.limit) || 25, 100);
      response.json(await documentRepository.list(limit));
    } catch (error) { next(error); }
  });
  app.get('/api/jobs', async (request, response, next) => {
    try {
      const type = typeof request.query.type === 'string' && request.query.type !== 'All' ? request.query.type : undefined;
      const minimumSalary = Math.max(0, Number(request.query.minimumSalary) || 0);
      const remoteOnly = request.query.remoteOnly === 'true';
      const limit = Math.min(Math.max(Number(request.query.limit) || 100, 1), 100);
      const results = await documentRepository.listJobs({ type, minimumSalary, remoteOnly, limit });
      response.json({ results });
    } catch (error) { next(error); }
  });
  app.post('/api/sync', async (request, response, next) => {
    // This endpoint is for an authenticated operator, not the public frontend.
    if (!env.SYNC_API_TOKEN || request.headers.authorization !== `Bearer ${env.SYNC_API_TOKEN}`) return response.sendStatus(404);
    try { response.json(await syncService.syncConnector()); } catch (error) { next(error); }
  });

  app.use(errorHandler);
  return app;
}
