#!/usr/bin/env bash
set -euo pipefail

# Simple deployment helper for Ubuntu server.
# Assumes:
# - repo already cloned on server
# - Node.js 18+ available (with corepack)
# - ENV vars set (see .env.example)
# - app files owned by a non-root deploy user such as nextjs

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="${SCRIPT_DIR}/$(basename "${BASH_SOURCE[0]}")"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
APP_NAME="${APP_NAME:-personal-blog}"
APP_USER="${APP_USER:-nextjs}"
APP_PORT="${APP_PORT:-3000}"
APP_HOST="${APP_HOST:-127.0.0.1}"

if [[ "$(id -un)" != "${APP_USER}" ]]; then
  if ! id "${APP_USER}" >/dev/null 2>&1; then
    echo "APP_USER ${APP_USER} does not exist." >&2
    exit 1
  fi

  echo "==> Switching to deploy user ${APP_USER}"
  if command -v sudo >/dev/null 2>&1; then
    exec sudo -u "${APP_USER}" -H env PATH="${PATH}" APP_NAME="${APP_NAME}" APP_USER="${APP_USER}" APP_PORT="${APP_PORT}" APP_HOST="${APP_HOST}" bash "${SCRIPT_PATH}"
  elif [[ "$(id -u)" -eq 0 ]]; then
    exec runuser -u "${APP_USER}" -- env PATH="${PATH}" APP_NAME="${APP_NAME}" APP_USER="${APP_USER}" APP_PORT="${APP_PORT}" APP_HOST="${APP_HOST}" bash "${SCRIPT_PATH}"
  else
    echo "Need sudo or root privileges to switch to ${APP_USER}." >&2
    exit 1
  fi
fi

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
  pm2 restart "${APP_NAME}" || pm2 start pnpm --name "${APP_NAME}" -- start -- --hostname "${APP_HOST}" --port "${APP_PORT}"
  pm2 save >/dev/null
else
  echo "pm2 not found; start manually with: pnpm start"
fi

echo "==> Done."
