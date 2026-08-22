import cron from 'node-cron';
import { env } from '../../config/env.js';
import { syncService } from './sync.service.js';

export function startSyncScheduler(): void {
  cron.schedule(env.SYNC_CRON, async () => {
    try {
      const result = await syncService.syncConnector();
      console.info('BigData sync complete', result);
    } catch (error) {
      console.error('BigData sync failed', error);
    }
  });
  console.info(`Sync scheduler started: ${env.SYNC_CRON}`);
}
