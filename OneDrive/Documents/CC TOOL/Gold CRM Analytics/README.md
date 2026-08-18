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
