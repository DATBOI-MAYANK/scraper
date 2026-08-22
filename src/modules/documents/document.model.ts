import { model, Schema } from 'mongoose';

const documentSchema = new Schema(
  {
    bigdataDocumentId: { type: String, required: true, unique: true, index: true },
    // Stable identity from the original job source. BigData document IDs may change on re-ingestion.
    sourceKey: { type: String, required: true, unique: true, index: true },
    bigdataDocumentIdHistory: { type: [String], default: [] },
    connectorId: { type: String, required: true, index: true },
    source: { type: String, required: true, default: 'bigdata' },
    status: { type: String, required: true, index: true },
    title: { type: String },
    content: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed, default: {} },
    analytics: { type: Schema.Types.Mixed, default: {} },
    job: {
      externalId: String,
      company: { type: String, index: true },
      role: { type: String, index: true },
      location: String,
      remote: { type: Boolean, default: false, index: true },
      type: { type: String, index: true },
      salaryMin: { type: Number, index: true },
      salaryMax: Number,
      salaryLabel: String,
      applyUrl: String,
      tags: { type: [String], default: [] },
      description: String,
    },
    publishedAt: { type: Date, index: true },
    bigdataUpdatedAt: { type: Date, index: true },
    syncedAt: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false },
);

export const DocumentModel = model('Document', documentSchema);
