#!/usr/bin/env bash
# Run once on your Linux VPS after cloning the repo (from project root):
#   chmod +x script/setup-vps.sh script/deploy-vps.sh
#   npm run setup:vps
#
# Creates persistent upload storage and updates .env with UPLOADS_DIR.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

UPLOADS_ROOT="/var/lib/ratemycoach/uploads"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"
APP_USER="${APP_USER:-${SUDO_USER:-$USER}}"

echo "==> Rate My Coach VPS setup"
echo "    Project: $ROOT"
echo "    Uploads: $UPLOADS_ROOT"
echo "    App user: $APP_USER"

create_upload_dirs() {
  local base="$1"
  mkdir -p "$base/avatars" "$base/temp" "$base/files"
  chmod 755 "$base" "$base/avatars" "$base/temp" "$base/files"
}

if [[ -d "$UPLOADS_ROOT/avatars" ]]; then
  echo "==> Upload directories already exist"
else
  if [[ -w "$(dirname "$UPLOADS_ROOT")" ]] 2>/dev/null || [[ $EUID -eq 0 ]]; then
    echo "==> Creating $UPLOADS_ROOT"
    create_upload_dirs "$UPLOADS_ROOT"
    if [[ $EUID -eq 0 ]] && [[ -n "$APP_USER" ]] && [[ "$APP_USER" != "root" ]]; then
      chown -R "$APP_USER:$APP_USER" /var/lib/ratemycoach
    fi
  else
    echo "==> Need sudo to create $UPLOADS_ROOT"
    sudo mkdir -p "$UPLOADS_ROOT"
    sudo bash -c "$(declare -f create_upload_dirs); create_upload_dirs '$UPLOADS_ROOT'"
    sudo chown -R "$APP_USER:$APP_USER" /var/lib/ratemycoach
  fi
fi

echo "==> Upload folder contents:"
ls -la "$UPLOADS_ROOT" || true

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "$ROOT/.env.example" ]]; then
    cp "$ROOT/.env.example" "$ENV_FILE"
    echo "==> Created $ENV_FILE from .env.example — set DATABASE_URL and SESSION_SECRET"
  else
    touch "$ENV_FILE"
    echo "==> Created empty $ENV_FILE — add DATABASE_URL, SESSION_SECRET, UPLOADS_DIR"
  fi
fi

if grep -q '^UPLOADS_DIR=' "$ENV_FILE" 2>/dev/null; then
  if [[ "$(uname)" == "Darwin" ]]; then
    sed -i '' "s|^UPLOADS_DIR=.*|UPLOADS_DIR=$UPLOADS_ROOT|" "$ENV_FILE"
  else
    sed -i "s|^UPLOADS_DIR=.*|UPLOADS_DIR=$UPLOADS_ROOT|" "$ENV_FILE"
  fi
else
  echo "" >> "$ENV_FILE"
  echo "UPLOADS_DIR=$UPLOADS_ROOT" >> "$ENV_FILE"
fi

if ! grep -q '^NODE_ENV=' "$ENV_FILE" 2>/dev/null; then
  echo "NODE_ENV=production" >> "$ENV_FILE"
fi

echo ""
echo "==> Done."
echo "    1. Edit $ENV_FILE (DATABASE_URL, SESSION_SECRET, PORT if needed)"
echo "    2. npm run db:push"
echo "    3. npm run deploy:vps   (or: npm run build && npm start)"
echo ""
echo "    Optional nginx: sudo cp deploy/nginx-ratemycoach.conf /etc/nginx/sites-available/ratemycoach"
echo "    Optional systemd: see deploy/ratemycoach.service"
