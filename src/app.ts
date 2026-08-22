import express from 'express';
import { errorHandler } from './common/middleware/error-handler.js';
import { documentRepository } from './modules/documents/document.repository.js';
import { syncService } from './modules/sync/sync.service.js';
import { syncHealth } from './modules/sync/sync.health.js';

export function createApp() {
  const app = express();
  app.use(express.json());

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
  app.post('/api/sync', async (_request, response, next) => {
    try { response.json(await syncService.syncConnector()); } catch (error) { next(error); }
  });

  app.use(errorHandler);
  return app;
}
