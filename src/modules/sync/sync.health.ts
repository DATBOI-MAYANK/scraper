export type SyncResult = {
  processed: number;
  skipped: number;
  failed: number;
  failures: Array<{ documentId: string; message: string }>;
};

export type SyncHealth = {
  status: 'idle' | 'running' | 'healthy' | 'degraded' | 'failed';
  lastStartedAt?: string;
  lastCompletedAt?: string;
  lastResult?: Omit<SyncResult, 'failures'>;
  lastError?: string;
};

let health: SyncHealth = { status: 'idle' };

export const syncHealth = {
  get: (): SyncHealth => health,
  started: () => { health = { ...health, status: 'running', lastStartedAt: new Date().toISOString(), lastError: undefined }; },
  succeeded: (result: SyncResult) => {
    const { failures: _failures, ...summary } = result;
    health = { status: result.failed ? 'degraded' : 'healthy', lastStartedAt: health.lastStartedAt, lastCompletedAt: new Date().toISOString(), lastResult: summary };
  },
  failed: (error: unknown) => {
    health = { ...health, status: 'failed', lastCompletedAt: new Date().toISOString(), lastError: error instanceof Error ? error.message : String(error) };
  },
};
