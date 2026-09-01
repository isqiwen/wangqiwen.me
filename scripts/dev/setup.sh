#!/usr/bin/env bash
set -euo pipefail

# Development setup for macOS/Linux (bash)
# - Ensures pnpm via corepack
# - Installs dependencies
# - Leaves .env.local optional
# - Synchronizes post metadata so the local manifest is ready

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# Corepack downloads pnpm before pnpm can read this project's .npmrc.
# It appends the package name itself, so normalize away a trailing slash.
COREPACK_NPM_REGISTRY="${COREPACK_NPM_REGISTRY:-https://registry.npmmirror.com}"
COREPACK_NPM_REGISTRY="${COREPACK_NPM_REGISTRY%/}"

get_pnpm_spec() {
  node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); const v=p.packageManager || ''; console.log(typeof v === 'string' ? v.replace(/\\+.*/, '') : '')" "${ROOT_DIR}/package.json"
}

print_node_help() {
  cat <<'EOF'
Node.js/corepack is not ready.

On Ubuntu, install an official Node.js package first:

  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  sudo corepack enable

Then rerun:

  bash scripts/dev/setup.sh
EOF
}

enable_corepack() {
  if corepack enable >/dev/null 2>&1; then
    return 0
  fi

  if command -v sudo >/dev/null 2>&1; then
    echo "corepack enable needs elevated permissions; running sudo corepack enable."
    sudo corepack enable
  else
    echo "corepack enable failed and sudo is not available." >&2
    exit 1
  fi
}

if [[ -s "${NVM_DIR:-${HOME}/.nvm}/nvm.sh" ]]; then
  # shellcheck disable=SC1090,SC1091
  . "${NVM_DIR:-${HOME}/.nvm}/nvm.sh"
fi

if [[ -f "${ROOT_DIR}/.nvmrc" ]] && command -v nvm >/dev/null 2>&1; then
  echo "==> Using project Node.js version from .nvmrc"
  nvm use >/dev/null
fi

echo "==> Ensuring Node.js and pnpm"
if ! command -v node >/dev/null 2>&1; then
  echo "node not found. Please install Node.js 20.9+."
  print_node_help
  exit 1
fi
if ! node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major > 20 || (major === 20 && minor >= 9) ? 0 : 1)'; then
  echo "Node.js 20.9 or newer is required. Found: $(node -v)" >&2
  exit 1
fi

PNPM_SPEC="$(get_pnpm_spec)"

if command -v corepack >/dev/null 2>&1; then
  enable_corepack
  if [[ "${PNPM_SPEC}" == pnpm@* ]]; then
    COREPACK_NPM_REGISTRY="${COREPACK_NPM_REGISTRY}" corepack prepare "${PNPM_SPEC}" --activate
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

echo "==> Synchronizing post metadata"
pnpm sync:posts -- --silent

echo "==> Done. Next steps:"
echo "    1. Run: pnpm dev"
echo "    2. Open: http://localhost:3000"
echo "    3. Create .env.local only if you need real external services locally"
