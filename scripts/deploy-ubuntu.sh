#!/usr/bin/env bash
set -euo pipefail

# Simple deployment helper for Ubuntu server.
# Assumes:
# - repo already cloned on server
# - Node.js 18+ available (with corepack)
# - ENV vars set (see .env.example)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="${APP_NAME:-personal-blog}"
cd "${ROOT_DIR}"

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Ensuring corepack/pnpm"
if ! command -v corepack >/dev/null 2>&1; then
  echo "corepack not found. Install Node.js 18+ and rerun."
  exit 1
fi
corepack enable

echo "==> Installing deps"
pnpm install --frozen-lockfile

echo "==> Synchronizing post metadata"
pnpm sync:posts -- --silent

echo "==> Validating post metadata"
pnpm lint:posts

echo "==> Building"
pnpm build

echo "==> Restarting app (example using pm2)"
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart "${APP_NAME}" || pm2 start pnpm --name "${APP_NAME}" -- start
else
  echo "pm2 not found; start manually with: pnpm start"
fi

echo "==> Done."
