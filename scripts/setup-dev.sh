#!/usr/bin/env bash
set -euo pipefail

# Development setup for macOS/Linux (bash)
# - Ensures pnpm via corepack
# - Installs dependencies
# - Copies .env.example if missing
# - Synchronizes post metadata so the local manifest is ready

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

get_pnpm_spec() {
  node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); const v=p.packageManager || ''; console.log(typeof v === 'string' ? v.replace(/\\+.*/, '') : '')" "${ROOT_DIR}/package.json"
}

print_node_help() {
  cat <<'EOF'
Node.js/corepack is not ready.

On Ubuntu, install an official Node.js package first:

  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  corepack enable

Then rerun:

  bash scripts/setup-dev.sh
EOF
}

if [[ -s "${NVM_DIR:-${HOME}/.nvm}/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  . "${NVM_DIR:-${HOME}/.nvm}/nvm.sh"
fi

if [[ -f "${ROOT_DIR}/.nvmrc" ]] && command -v nvm >/dev/null 2>&1; then
  echo "==> Using project Node.js version from .nvmrc"
  nvm use >/dev/null
fi

echo "==> Ensuring Node.js and pnpm"
if ! command -v node >/dev/null 2>&1; then
  echo "node not found. Please install Node.js 18+."
  print_node_help
  exit 1
fi

PNPM_SPEC="$(get_pnpm_spec)"

if command -v corepack >/dev/null 2>&1; then
  corepack enable
  if [[ "${PNPM_SPEC}" == pnpm@* ]]; then
    corepack prepare "${PNPM_SPEC}" --activate
  fi
elif command -v pnpm >/dev/null 2>&1; then
  echo "corepack not found; using existing pnpm $(pnpm -v)."
else
  echo "corepack and pnpm were not found."
  print_node_help
  exit 1
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
