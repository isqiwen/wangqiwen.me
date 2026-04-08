#!/usr/bin/env bash
set -euo pipefail

# Development setup for macOS/Linux (bash)
# - Ensures pnpm via corepack
# - Installs dependencies
# - Copies .env.example if missing
# - Synchronizes post metadata so the local manifest is ready

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

echo "==> Synchronizing post metadata"
pnpm sync:posts -- --silent

echo "==> Done. Next steps:"
echo "    1. Update .env.local if needed"
echo "    2. Run: pnpm dev"
echo "    3. Open: http://localhost:3000"
