# Rate My Coach

Run the app locally on your machine (no Replit required). One process serves both the API and the React frontend.

## Requirements

- [Node.js](https://nodejs.org/) 20 or newer
- PostgreSQL database ([Neon](https://neon.tech) free tier works)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**

   Copy the example file and edit it:

   ```bash
   copy .env.example .env
   ```

   On macOS/Linux:

   ```bash
   cp .env.example .env
   ```

   Required in `.env`:

   - `DATABASE_URL` — PostgreSQL connection string
   - `SESSION_SECRET` — any long random string (for login sessions)

   Optional: `PORT` (default `5000`), `ADMIN_EMAIL`, SMTP settings for contact email.

3. **Database schema**

   ```bash
   npm run db:push
   ```

4. **Run in development**

   ```bash
   npm run dev
   ```

   Open **http://localhost:5000** in your browser.

   The dev server loads variables from `.env` automatically.

## Admin login

On first start, an admin user is created if it does not exist:

- Email: `admin@ratemycoach.site`
- Password: `ABerry#2026`

Change this password after first login via the admin Users tab, or update the seed in `server/index.ts`.

Admin dashboard: **http://localhost:5000/admin**

## Production build

```bash
npm run build
npm start
```

Uses `dist/index.cjs` and serves the built client from `dist/public`.

## Deploy on Vercel

This repo includes `vercel.json` so Vercel serves the React app from `dist/public` and routes `/api` and `/uploads` to a serverless function. `npm run build` bundles the API into `api/[...path].cjs` (catch-all handler for `/api/*`; generated at build time; requires Node 20.19+ for Vite 7).

1. Connect the GitHub repo in Vercel (Framework Preset: **Other** — do not set Output Directory to `dist` alone).
2. Add environment variables in the Vercel project (Settings → Environment Variables), then redeploy:
   - `DATABASE_URL` — PostgreSQL connection string (e.g. Neon). Use the pooled URL and include `?sslmode=require` if needed.
   - `SESSION_SECRET` — long random string (same value you use locally)
3. Run `npm run db:push` once against that database so tables exist (from your machine with `DATABASE_URL` set).
4. Redeploy after pushing code changes.

If login returns **500 / FUNCTION_INVOCATION_FAILED**, open Vercel → Deployments → Functions → Logs. Usually `DATABASE_URL` is missing or the database is unreachable without SSL.

**Note:** Uploaded files are stored on disk locally; on Vercel they are ephemeral. For production uploads, use object storage (S3, etc.) later.

For a traditional single-port server (Railway, Render, Fly.io), use `npm run build` and `npm start` instead.

## Scripts

| Command        | Description                          |
|----------------|--------------------------------------|
| `npm run dev`  | Dev server with hot reload (port 5000) |
| `npm run build`| Build client + server bundle         |
| `npm start`    | Run production build                 |
| `npm run db:push` | Apply schema to PostgreSQL        |
| `npm run check`| TypeScript check                     |

## Troubleshooting

- **`DATABASE_URL must be set`** — Create `.env` from `.env.example` and set `DATABASE_URL`.
- **Admin Users shows HTML/JSON error** — Restart `npm run dev` after pulling new code. For production, run `npm run build` then `npm start`.
- **Port in use** — Set `PORT=3000` (or another port) in `.env`.

## Replit

This project can ignore `.replit` and `.local/` — they are not used for local development.
