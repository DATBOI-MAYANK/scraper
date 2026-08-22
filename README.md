# BigData Collector Sync

A TypeScript service that copies completed documents from one BigData collector to MongoDB.

## Structure

```
src/
  config/              Environment validation and MongoDB connection
  common/              Shared errors and Express middleware
  modules/
    bigdata/           BigData API client
    documents/         MongoDB schema and persistence
    sync/              Sync workflow and scheduled execution
  scripts/             One-off command-line jobs
  app.ts               HTTP routes
  server.ts            Application entry point
```

## Run it

1. Install Node.js 20+ and MongoDB.
2. Run `npm install`.
3. Copy `.env.example` to `.env`, then set the BigData API key and connector ID.
4. Run `npm run dev`.

The worker starts automatically and syncs according to `SYNC_CRON` (Sunday at midnight by default). For a one-time sync, use `npm run sync`. `POST /api/sync` runs a manual sync and `GET /api/documents` reads saved documents.

## Self-healing sync

Transient BigData and MongoDB failures are retried with exponential backoff (three attempts by default). One failed document does not stop the rest of the batch; its failure is returned in the sync result and it is retried on the next scheduled or manual run. Concurrent triggers share one active run, preventing duplicate ingestion. `GET /health` includes the last sync state and returns HTTP 503 only when the entire sync fails.

Tune recovery with `SYNC_RETRY_ATTEMPTS` and `SYNC_RETRY_BASE_DELAY_MS`. Invalid credentials, missing documents, and other non-retryable client errors fail fast.

## Deploy: Vercel + Render

Keep this repository layout: `client/` is the Vite frontend and the repository root is the Express backend.

1. Create a Render **Web Service** from this repository. Use build command `npm ci && npm run build` and start command `npm start`.
2. Add the backend environment variables from `.env.example` in Render. Set `NODE_ENV=production`, and set `CORS_ORIGINS` to your Vercel domain, for example `https://your-app.vercel.app`. Keep the uptime service pointed at `https://your-api.onrender.com/health`.
3. Create a Vercel project from the same repository and set its Root Directory to `client`. Add `VITE_API_URL=https://your-api.onrender.com` in Vercel's production environment variables, then deploy.

`POST /api/sync` is disabled until `SYNC_API_TOKEN` is set. If enabled, call it only with `Authorization: Bearer <SYNC_API_TOKEN>`; the public frontend does not need this credential.

`GET /api/jobs` is the frontend-facing endpoint. It supports `type`, `minimumSalary`, and `remoteOnly` query parameters; filtering happens in MongoDB, not in the browser.

## Job identity and changed documents

The application never uses a BigData document ID as a job's permanent identity. The sync worker builds `sourceKey` from the source job's `external_id` / `job_id`, falling back to its canonical `apply_url`. When BigData creates a new document ID for an edited job, the worker updates the existing MongoDB job record and appends the incoming ID to `bigdataDocumentIdHistory`.

For this to work reliably, the collected job payload must include at least one stable source field. The preferred shape within BigData's `document` metadata is:

```json
{
  "job": {
    "external_id": "acme-frontend-123",
    "company": "Acme",
    "role": "Frontend Engineer",
    "location": "Bengaluru, IN",
    "remote": true,
    "type": "Full-time",
    "salary_min": 1200000,
    "salary_max": 1800000,
    "apply_url": "https://example.com/jobs/frontend-123",
    "tags": ["React", "TypeScript"]
  }
}
```

Without a stable source ID or canonical URL, there is no safe way to prove that two changed documents are the same job; the service deliberately stores them as separate records rather than incorrectly merging them.

## Security

Keep `.env` private. The API key is used only by the server and never returned by any route.
