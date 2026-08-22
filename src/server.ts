import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { documentRepository } from './modules/documents/document.repository.js';
import { startSyncScheduler } from './modules/sync/sync.scheduler.js';
import { syncService } from './modules/sync/sync.service.js';

async function bootstrap() {
  await connectDatabase();
  if (await documentRepository.isEmpty()) {
    try {
      const result = await syncService.syncConnector();
      console.info('Initial BigData sync complete', result);
    } catch (error) {
      console.error('Initial BigData sync failed', error);
    }
  }
  startSyncScheduler();
  createApp().listen(env.PORT, () => console.info(`API listening on port ${env.PORT}`));
}

bootstrap().catch((error) => { console.error('Startup failed', error); process.exit(1); });
