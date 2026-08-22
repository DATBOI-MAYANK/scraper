import axios from 'axios';
import { env } from '../../config/env.js';
import type { BigDataAnnotatedDocument, BigDataDocumentSummary } from '../documents/document.types.js';

const client = axios.create({
  baseURL: 'https://api.bigdata.com',
  headers: { 'X-API-KEY': env.BIGDATA_API_KEY },
  timeout: 30_000,
});

export const bigDataClient = {
  async listDocuments(connectorId: string): Promise<BigDataDocumentSummary[]> {
    const { data } = await client.get<{ results: BigDataDocumentSummary[] }>('/contents/v1/documents', {
      params: { connector_id: connectorId },
    });
    return data.results;
  },

  async getAnnotatedDocument(documentId: string): Promise<BigDataAnnotatedDocument> {
    const { data } = await client.get<{ url: string }>(`/v1/documents/${documentId}`);
    const content = await axios.get<BigDataAnnotatedDocument>(data.url, { timeout: 30_000 });
    return content.data;
  },
};
