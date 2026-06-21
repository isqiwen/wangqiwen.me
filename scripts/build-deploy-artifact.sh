#!/usr/bin/env bash
set -euo pipefail

# Build a standalone deployment bundle on a machine with enough memory.
# The resulting tarball can be uploaded to a small Ubuntu server and deployed
# there without running `next build` again.
#
# Optional env vars:
#   ARTIFACT_DIR=dist                 Output directory for generated tarballs
#   ARTIFACT_NAME=blog-<sha>.tar.gz   Override the artifact file name
#   SKIP_INSTALL=0                    Skip `pnpm install --frozen-lockfile`
#   RUN_LINT_POSTS=1                  Run `pnpm lint:posts` before the build

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACT_DIR="${ARTIFACT_DIR:-${ROOT_DIR}/dist}"
SKIP_INSTALL="${SKIP_INSTALL:-0}"
RUN_LINT_POSTS="${RUN_LINT_POSTS:-1}"

REVISION="$(git -C "${ROOT_DIR}" rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)"
ARTIFACT_NAME="${ARTIFACT_NAME:-nextjs-standalone-${REVISION}.tar.gz}"
ARTIFACT_PATH="${ARTIFACT_DIR}/${ARTIFACT_NAME}"

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

  bash scripts/build-deploy-artifact.sh
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
  # shellcheck disable=SC1090
  . "${NVM_DIR:-${HOME}/.nvm}/nvm.sh"
fi

if [[ -f "${ROOT_DIR}/.nvmrc" ]] && command -v nvm >/dev/null 2>&1; then
  echo "==> Using project Node.js version from .nvmrc"
  nvm use >/dev/null
fi

echo "==> Ensuring Node.js and pnpm"
if ! command -v node >/dev/null 2>&1; then
  echo "node not found. Install Node.js 18+ and rerun." >&2
  print_node_help
  exit 1
fi

PNPM_SPEC="$(get_pnpm_spec)"

if command -v corepack >/dev/null 2>&1; then
  enable_corepack
  if [[ "${PNPM_SPEC}" == pnpm@* ]]; then
    corepack prepare "${PNPM_SPEC}" --activate
  fi
elif command -v pnpm >/dev/null 2>&1; then
  echo "corepack not found; using existing pnpm $(pnpm -v)."
else
  echo "corepack and pnpm were not found." >&2
  print_node_help
  exit 1
fi

cd "${ROOT_DIR}"

if [[ "${SKIP_INSTALL}" != "1" ]]; then
  echo "==> Installing dependencies"
  pnpm install --frozen-lockfile
fi

echo "==> Synchronizing post metadata"
pnpm sync:posts -- --silent

if [[ "${RUN_LINT_POSTS}" == "1" ]]; then
  echo "==> Validating post metadata"
  pnpm lint:posts
fi

echo "==> Building standalone output"
pnpm build

if [[ ! -d ".next/standalone" ]]; then
  echo ".next/standalone was not created. Check that next.config.js enables output=\"standalone\"." >&2
  exit 1
fi

if [[ ! -d ".next/static" ]]; then
  echo ".next/static is missing after build." >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
BUNDLE_DIR="${TMP_DIR}/bundle"
mkdir -p "${BUNDLE_DIR}"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

echo "==> Collecting source files needed at runtime"
tar \
  --exclude=".git" \
  --exclude="node_modules" \
  --exclude=".next" \
  --exclude="dist" \
  --exclude=".vercel" \
  --exclude=".env" \
  --exclude=".env.local" \
  --exclude=".env.production" \
  --exclude=".env.development" \
  --exclude=".env.test" \
  --exclude=".env*.local" \
  -C "${ROOT_DIR}" \
  -cf - . | tar -C "${BUNDLE_DIR}" -xf -

echo "==> Overlaying standalone server output"
tar -C "${ROOT_DIR}/.next/standalone" -cf - . | tar -C "${BUNDLE_DIR}" -xf -
mkdir -p "${BUNDLE_DIR}/.next"
cp -R "${ROOT_DIR}/.next/static" "${BUNDLE_DIR}/.next/static"
cp "${ROOT_DIR}/package.json" "${BUNDLE_DIR}/package.json"

cat > "${BUNDLE_DIR}/DEPLOY_ARTIFACT_META.txt" <<EOF
revision=${REVISION}
built_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

mkdir -p "${ARTIFACT_DIR}"
rm -f "${ARTIFACT_PATH}"

echo "==> Writing ${ARTIFACT_PATH}"
tar -C "${BUNDLE_DIR}" -czf "${ARTIFACT_PATH}" .

echo "==> Artifact ready"
echo "${ARTIFACT_PATH}"
