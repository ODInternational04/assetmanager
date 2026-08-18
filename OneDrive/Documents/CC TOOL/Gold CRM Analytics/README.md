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

### Quick local setup (`.env.local`)

Create `Gold CRM Analytics/.env.local` with:

```bash
VITE_ZOHO_SOURCE="Zoho CRM (local)"

ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=
ZOHO_ORG_ID=
ZOHO_API_BASE=https://www.zohoapis.com/crm/v2
```

What to fill:
- `ZOHO_CLIENT_ID`: from Zoho API Console client credentials.
- `ZOHO_CLIENT_SECRET`: from Zoho API Console client credentials.
- `ZOHO_REFRESH_TOKEN`: generated after OAuth authorize.
- `ZOHO_ORG_ID`: your Zoho CRM org id.
- `ZOHO_API_BASE`: choose your datacenter (`.com`, `.eu`, `.in`, etc.).

If you leave the `ZOHO_*` fields blank, the app still runs and shows local sample cards.

### Localhost not working?

Use:

```bash
npm run dev

# then open:
http://localhost:5173/
```

If another app is already on 5173:

```bash
npm run dev -- --host 0.0.0.0 --port 5174
```

Then open `http://localhost:5174/`.

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
