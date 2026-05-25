#!/usr/bin/env bash
# Run on the VPS after each git pull (from project root):
#   npm run deploy:vps

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Deploying Rate My Coach"

if [[ ! -d /var/lib/ratemycoach/uploads/avatars ]]; then
  echo "==> Running first-time VPS setup..."
  bash "$ROOT/script/setup-vps.sh"
fi

if [[ ! -f "$ROOT/.env" ]]; then
  echo "ERROR: Missing .env — copy .env.example and set DATABASE_URL + SESSION_SECRET"
  exit 1
fi

echo "==> Installing dependencies"
npm ci

echo "==> Building"
npm run build

if [[ "${SKIP_DB_PUSH:-}" != "1" ]]; then
  echo "==> Applying database schema"
  npm run db:push
fi

if command -v pm2 >/dev/null 2>&1; then
  echo "==> Restarting PM2"
  if pm2 describe ratemycoach >/dev/null 2>&1; then
    pm2 restart ecosystem.config.cjs --update-env
  else
    pm2 start ecosystem.config.cjs
  fi
  pm2 save
  echo "==> PM2 status:"
  pm2 status ratemycoach
elif systemctl is-active --quiet ratemycoach 2>/dev/null; then
  echo "==> Restarting systemd service"
  sudo systemctl restart ratemycoach
  sudo systemctl status ratemycoach --no-pager
else
  echo "==> Build complete. Start manually: npm start"
  echo "    Or install PM2: npm i -g pm2 && pm2 start ecosystem.config.cjs && pm2 save"
fi

echo ""
echo "==> Deploy finished."
UPLOADS="$(grep '^UPLOADS_DIR=' .env 2>/dev/null | cut -d= -f2- || echo './uploads')"
echo "    Uploads: ${UPLOADS:-/var/lib/ratemycoach/uploads}"
echo "    Test a photo URL: https://YOUR_DOMAIN/uploads/avatars/<file>"
