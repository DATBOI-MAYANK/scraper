export interface BigDataDocumentSummary {
  id: string;
  connector_id?: string;
  file_name?: string;
  content_type?: string;
  status: string;
  published_at?: string;
  updated_at?: string;
  tags?: Array<{ name: string }>;
}

export interface BigDataAnnotatedDocument {
  document?: Record<string, unknown>;
  content?: { title?: string; body?: unknown };
  analytics?: { entities?: unknown[]; events?: unknown[] };
}
