#!/usr/bin/env bash
set -euo pipefail

# Development setup for macOS/Linux (bash)
# - Ensures pnpm via corepack
# - Installs dependencies
# - Leaves .env.local optional
# - Synchronizes post metadata so the local manifest is ready

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COREPACK_NPM_REGISTRY="${COREPACK_NPM_REGISTRY:-https://registry.npmmirror.com}"
COREPACK_NPM_REGISTRY="${COREPACK_NPM_REGISTRY%/}"

get_pnpm_spec() {
  node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); const v=p.packageManager || ''; console.log(typeof v === 'string' ? v.replace(/\\+.*/, '') : '')" "${ROOT_DIR}/package.json"
}

print_node_help() {
  cat <<'HELP'
Node.js/corepack is not ready. Install Node.js 24 LTS first.
With nvm, run `nvm install` in this repository, then rerun:

  bash scripts/dev/setup.sh
HELP
}

enable_corepack() {
  if corepack enable >/dev/null 2>&1; then return 0; fi
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
  nvm use "$(cat "${ROOT_DIR}/.nvmrc")" >/dev/null
fi

echo "==> Ensuring Node.js and pnpm"
if ! command -v node >/dev/null 2>&1 ||
  ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) === 24 ? 0 : 1)'; then
  print_node_help
  exit 1
fi
PNPM_SPEC="$(get_pnpm_spec)"
if command -v corepack >/dev/null 2>&1; then
  enable_corepack
  COREPACK_NPM_REGISTRY="${COREPACK_NPM_REGISTRY}" corepack prepare "${PNPM_SPEC}" --activate
elif command -v pnpm >/dev/null 2>&1; then
  echo "corepack not found; using existing pnpm $(pnpm -v)."
else
  print_node_help
  exit 1
fi

cd "${ROOT_DIR}"
pnpm install --frozen-lockfile
pnpm sync:posts -- --silent
echo "==> Done. Run pnpm dev and open http://127.0.0.1:3000."
echo "    Create .env.local only when real external services are needed locally."
