import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { syncService } from '../modules/sync/sync.service.js';

async function run() {
  await connectDatabase();
  console.info(await syncService.syncConnector());
  await disconnectDatabase();
}

run().catch(async (error) => { console.error(error); await disconnectDatabase(); process.exit(1); });
