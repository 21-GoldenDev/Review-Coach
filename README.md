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

   Optional: `PORT` (default `5000`), `ADMIN_EMAIL` (only needed for Gmail/SMTP).

   For the **Advertise with us** form, set `VITE_WEB3FORMS_ACCESS_KEY` — see [Advertise form email](#advertise-form-email) below.

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

This repo includes `vercel.json` with `@vercel/static-build` (frontend → `dist/public`) and a bundled `api/index.cjs` (Express API, built during install/build). Requires Node 20.19+ for Vite 7. Set `DATABASE_URL` and `SESSION_SECRET` on Vercel; run `npm run db:push` against that database. Mark coaches as **featured** in the admin dashboard for them to appear on the home page.

1. Connect the GitHub repo in Vercel (Framework Preset: **Other** — do not set Output Directory to `dist` alone).
2. Add environment variables in the Vercel project (Settings → Environment Variables), then redeploy:
   - `DATABASE_URL` — PostgreSQL connection string (e.g. Neon). Use the pooled URL and include `?sslmode=require` if needed.
   - `SESSION_SECRET` — long random string (same value you use locally)
3. Run `npm run db:push` once against that database so tables exist (from your machine with `DATABASE_URL` set).
4. Redeploy after pushing code changes.

If login returns **404 NOT_FOUND** (plain Vercel error page, not JSON), the API function was not reached — redeploy after pulling the latest `vercel.json` (API routes must be listed before the `filesystem` handle).

If login returns **500 / FUNCTION_INVOCATION_FAILED**, open Vercel → Deployments → Functions → Logs. Usually `DATABASE_URL` is missing or the database is unreachable without SSL.

**Note:** Uploaded files are stored on disk locally; on Vercel they are ephemeral. For production uploads, use object storage (S3, etc.) later.

For a traditional single-port server (Railway, Render, Fly.io, Linux VPS), use `npm run build` and `npm start` instead.

### Deploy on a Linux VPS (quick start)

Profile photos are stored on disk (not in git) and served at `/uploads/...`. Use the included scripts so uploads survive redeploys.

**First time on the VPS** (after `git clone` and `npm install`):

```bash
chmod +x script/setup-vps.sh script/deploy-vps.sh
cp .env.production.example .env   # edit DATABASE_URL + SESSION_SECRET
npm run setup:vps                 # creates /var/lib/ratemycoach/uploads and sets UPLOADS_DIR in .env
npm run db:push
npm run deploy:vps                # build + start/restart PM2 if installed
```

**Every update** (after `git pull`):

```bash
npm run deploy:vps
```

**nginx** — proxy the whole site to Node (do not serve `dist/public` alone):

```bash
# Edit deploy/nginx-ratemycoach.conf (set YOUR_DOMAIN), then:
sudo cp deploy/nginx-ratemycoach.conf /etc/nginx/sites-available/ratemycoach
sudo ln -sf /etc/nginx/sites-available/ratemycoach /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**PM2** (optional): `pm2 start ecosystem.config.cjs && pm2 save && pm2 startup`

**Verify photos:** `ls /var/lib/ratemycoach/uploads/avatars/` and open `https://yourdomain.com/uploads/avatars/<filename>` in the browser.

## Scripts

| Command        | Description                          |
|----------------|--------------------------------------|
| `npm run dev`  | Dev server with hot reload (port 5000) |
| `npm run build`| Build client + server bundle         |
| `npm start`    | Run production build                 |
| `npm run db:push` | Apply schema to PostgreSQL        |
| `npm run check`| TypeScript check                     |
| `npm run setup:vps` | Create `/var/lib/ratemycoach/uploads`, configure `.env` (Linux) |
| `npm run deploy:vps` | Build and restart app on VPS after `git pull` |

## Advertise form email (Web3Forms)

The **Advertise with us** dialog submits directly from the browser to [Web3Forms](https://web3forms.com) (free tier; no SMTP). After changing `.env`, restart dev or rebuild for production.

1. Open [https://web3forms.com](https://web3forms.com).
2. Enter the inbox for advertising requests (e.g. `admin@ratemycoach.site`).
3. Create an **Access Key** and copy it.
4. In `.env` (must use the `VITE_` prefix):

   ```env
   VITE_WEB3FORMS_ACCESS_KEY=paste-your-key-here
   ```

5. Restart (`npm run dev`) and test the form on the home page.

**Production:** add `VITE_WEB3FORMS_ACCESS_KEY` in Vercel or VPS `.env`, then **rebuild** (`npm run build`) so the key is included in the client bundle.

## Troubleshooting

- **`DATABASE_URL must be set`** — Create `.env` from `.env.example` and set `DATABASE_URL`.
- **Advertise form: not configured** — Set `VITE_WEB3FORMS_ACCESS_KEY` in `.env`, restart dev, or rebuild for production.
- **Admin Users shows HTML/JSON error** — Restart `npm run dev` after pulling new code. For production, run `npm run build` then `npm start`.
- **Port in use** — Set `PORT=3000` (or another port) in `.env`.

## Replit

This project can ignore `.replit` and `.local/` — they are not used for local development.
