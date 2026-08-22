import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { startSyncScheduler } from './modules/sync/sync.scheduler.js';

async function bootstrap() {
  await connectDatabase();
  startSyncScheduler();
  createApp().listen(env.PORT, () => console.info(`API listening on port ${env.PORT}`));
}

bootstrap().catch((error) => { console.error('Startup failed', error); process.exit(1); });
