#!/usr/bin/env bash
set -euo pipefail

# Cross-platform dev setup for macOS/Linux (bash)
# - Installs pnpm via corepack (without changing global npm)
# - Installs dependencies
# - Copies .env.example if missing

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Ensuring corepack is enabled (pnpm)"
if ! command -v corepack >/dev/null 2>&1; then
  echo "corepack not found. Please install Node.js 18+ (includes corepack) and rerun."
  exit 1
fi
corepack enable

echo "==> Using project Node.js version (if .nvmrc exists)"
if [[ -f "${ROOT_DIR}/.nvmrc" ]] && command -v nvm >/dev/null 2>&1; then
  nvm use >/dev/null
fi

echo "==> Installing dependencies via pnpm"
cd "${ROOT_DIR}"
pnpm install

echo "==> Preparing env file"
if [[ -f ".env.example" && ! -f ".env.local" ]]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example"
fi

echo "==> Done. Next steps:"
echo "    pnpm dev --filter blog   # start dev server"
