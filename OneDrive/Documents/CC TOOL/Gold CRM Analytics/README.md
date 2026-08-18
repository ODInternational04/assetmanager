# Gold CRM Analytics

A custom React + Vite dashboard scaffold built for Zoho CRM analytics.

## Project setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Preview locally

```bash
npm run preview
```

## Deploy to Vercel **preview only**

Run this for non-production preview deployments:

```bash
npm run deploy:preview
```

If you ever need production deployment:

```bash
npm run deploy:prod
```

## Environment variables

- `VITE_ZOHO_SOURCE`: optional label showing in the top-right data source badge.
- `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_ORG_ID`, `ZOHO_API_BASE`: keep these in Vercel project environment settings (server-side), not in git.

Copy `.env.example` to `.env` for local development tests only.

## API route (Vercel)

A serverless function is available at:

```text
/api/zoho
```

Example:

```bash
GET /api/zoho?module=Deals&per_page=200
``

Example response shape:

```json
{
  "kpis": [...],
  "stageDistribution": [...],
  "events": [...],
  "count": 23,
  "refreshedAt": "2026-08-18T10:00:00.000Z"
}
```

The endpoint uses your server-side Zoho env vars and never exposes credentials to the browser.
