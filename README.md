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
