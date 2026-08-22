import { env } from '../../config/env.js';
import { bigDataClient } from '../bigdata/bigdata.client.js';
import { documentRepository } from '../documents/document.repository.js';
import type { BigDataDocumentSummary } from '../documents/document.types.js';
import { withRetry } from './retry.js';
import { syncHealth, type SyncResult } from './sync.health.js';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {};
}

function stringField(record: UnknownRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function numberField(record: UnknownRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    const number = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return undefined;
}

function asText(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map((item) => asText(item)).filter(Boolean).join('\n');
  const record = asRecord(value);
  return stringField(record, 'text', 'content', 'body');
}

function normalizeJob(content: Awaited<ReturnType<typeof bigDataClient.getAnnotatedDocument>>) {
  const document = asRecord(content.document);
  const job = asRecord(document.job ?? document);
  const tags = Array.isArray(job.tags) ? job.tags.filter((tag): tag is string => typeof tag === 'string') : [];
  const remoteValue = job.remote;
  const remote = remoteValue === true || remoteValue === 'true' || /remote/i.test(stringField(job, 'location') ?? '');
  const role = stringField(job, 'role', 'title', 'position') ?? content.content?.title;

  return {
    externalId: stringField(job, 'external_id', 'externalId', 'job_id', 'jobId', 'id'),
    company: stringField(job, 'company', 'company_name', 'companyName'),
    role,
    location: stringField(job, 'location'),
    remote,
    type: stringField(job, 'type', 'job_type', 'jobType'),
    salaryMin: numberField(job, 'salary_min', 'salaryMin', 'min_salary'),
    salaryMax: numberField(job, 'salary_max', 'salaryMax', 'max_salary', 'salary'),
    salaryLabel: stringField(job, 'salary_label', 'salaryLabel'),
    applyUrl: stringField(job, 'apply_url', 'applyUrl', 'url', 'canonical_url'),
    tags,
    description: stringField(job, 'description') ?? asText(content.content?.body),
  };
}

function stableSourceKey(connectorId: string, bigDataDocumentId: string, job: ReturnType<typeof normalizeJob>): string {
  // Prefer an ID or canonical URL controlled by the original job source, not BigData's document ID.
  if (job.externalId) return `${connectorId}:id:${job.externalId}`;
  if (job.applyUrl) return `${connectorId}:url:${job.applyUrl.toLowerCase().replace(/\/$/, '')}`;
  // This fallback remains idempotent for the same BigData document, but a changed document is a new record.
  // It is safer than incorrectly merging two different jobs without a stable source identifier.
  return `${connectorId}:unlinked:${bigDataDocumentId}`;
}

function toDate(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}

function createRecord(summary: BigDataDocumentSummary, content: Awaited<ReturnType<typeof bigDataClient.getAnnotatedDocument>>) {
  const connectorId = summary.connector_id ?? env.BIGDATA_CONNECTOR_ID;
  const job = normalizeJob(content);
  return {
    bigdataDocumentId: summary.id,
    sourceKey: stableSourceKey(connectorId, summary.id, job),
    connectorId,
    source: 'bigdata',
    status: summary.status,
    title: content.content?.title ?? summary.file_name,
    content: content.content?.body,
    metadata: { document: content.document, fileName: summary.file_name, contentType: summary.content_type, tags: summary.tags?.map((tag) => tag.name) ?? [] },
    analytics: content.analytics ?? {},
    job,
    publishedAt: toDate(summary.published_at),
    bigdataUpdatedAt: toDate(summary.updated_at),
    syncedAt: new Date(),
  };
}

export const syncService = {
  syncConnector(): Promise<SyncResult> {
    if (activeSync) return activeSync;
    activeSync = this.runConnector().finally(() => { activeSync = undefined; });
    return activeSync;
  },

  async runConnector(): Promise<SyncResult> {
    syncHealth.started();
    try {
      const documents = await withRetry(
        () => bigDataClient.listDocuments(env.BIGDATA_CONNECTOR_ID),
        { attempts: env.SYNC_RETRY_ATTEMPTS, baseDelayMs: env.SYNC_RETRY_BASE_DELAY_MS, operationName: 'Listing BigData documents' },
      );
      let processed = 0;
      let skipped = 0;
      const failures: SyncResult['failures'] = [];

      for (const summary of documents) {
        if (summary.status !== 'completed') {
          skipped += 1;
          continue;
        }

        try {
          await withRetry(async () => {
            const content = await bigDataClient.getAnnotatedDocument(summary.id);
            await documentRepository.upsert(createRecord(summary, content));
          }, { attempts: env.SYNC_RETRY_ATTEMPTS, baseDelayMs: env.SYNC_RETRY_BASE_DELAY_MS, operationName: `Syncing document ${summary.id}` });
          processed += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Unable to sync document ${summary.id}; it will be retried on the next run`, error);
          failures.push({ documentId: summary.id, message });
        }
      }

      const result = { processed, skipped, failed: failures.length, failures };
      syncHealth.succeeded(result);
      return result;
    } catch (error) {
      syncHealth.failed(error);
      throw error;
    }
  },
};

let activeSync: Promise<SyncResult> | undefined;
