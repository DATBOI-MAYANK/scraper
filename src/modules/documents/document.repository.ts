import { DocumentModel } from './document.model.js';

export const documentRepository = {
  async upsert(document: Record<string, unknown>): Promise<void> {
    await DocumentModel.updateOne(
      { sourceKey: document.sourceKey },
      {
        $set: document,
        $addToSet: { bigdataDocumentIdHistory: document.bigdataDocumentId },
      },
      { upsert: true },
    );
  },

  async list(limit: number) {
    return DocumentModel.find().sort({ publishedAt: -1, createdAt: -1 }).limit(limit).lean();
  },

  async listJobs(filters: { type?: string; minimumSalary?: number; remoteOnly?: boolean; limit: number }) {
    const query: Record<string, unknown> = { status: 'completed', 'job.role': { $exists: true, $ne: '' } };
    if (filters.type) query['job.type'] = filters.type;
    if (filters.minimumSalary) query['job.salaryMax'] = { $gte: filters.minimumSalary };
    if (filters.remoteOnly) query['job.remote'] = true;

    return DocumentModel.find(query)
      .select({ sourceKey: 1, job: 1, publishedAt: 1, bigdataUpdatedAt: 1 })
      .sort({ publishedAt: -1, updatedAt: -1 })
      .limit(filters.limit)
      .lean();
  },
};
