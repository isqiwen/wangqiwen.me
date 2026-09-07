#!/usr/bin/env bash
set -euo pipefail

# Build a standalone deployment bundle without running next build on the VPS.
# Optional: ARTIFACT_DIR, ARTIFACT_NAME, RUN_LINT_POSTS, BUILD_WITH_REMOTE_REDIS.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARTIFACT_DIR="${ARTIFACT_DIR:-${ROOT_DIR}/dist}"
RUN_LINT_POSTS="${RUN_LINT_POSTS:-1}"
BUILD_WITH_REMOTE_REDIS="${BUILD_WITH_REMOTE_REDIS:-0}"
COREPACK_NPM_REGISTRY="${COREPACK_NPM_REGISTRY:-https://registry.npmmirror.com}"
COREPACK_NPM_REGISTRY="${COREPACK_NPM_REGISTRY%/}"
REVISION="$(git -C "${ROOT_DIR}" rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)"
ARTIFACT_NAME="${ARTIFACT_NAME:-nextjs-standalone-${REVISION}.tar.gz}"
ARTIFACT_PATH="${ARTIFACT_DIR}/${ARTIFACT_NAME}"

if [[ -s "${NVM_DIR:-${HOME}/.nvm}/nvm.sh" ]]; then
  # shellcheck disable=SC1090,SC1091
  . "${NVM_DIR:-${HOME}/.nvm}/nvm.sh"
fi
if [[ -f "${ROOT_DIR}/.nvmrc" ]] && command -v nvm >/dev/null 2>&1; then
  nvm use "$(cat "${ROOT_DIR}/.nvmrc")" >/dev/null
fi
if ! command -v node >/dev/null 2>&1 ||
  ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) === 24 ? 0 : 1)'; then
  echo "Node.js 24 LTS is required. Install it before building." >&2
  exit 1
fi
PNPM_SPEC="$(node -p "require(process.argv[1]).packageManager.replace(/\\+.*/, '')" "${ROOT_DIR}/package.json")"
if command -v corepack >/dev/null 2>&1; then
  if ! corepack enable >/dev/null 2>&1; then
    if command -v sudo >/dev/null 2>&1; then
      sudo corepack enable
    else
      echo "corepack enable failed; enable it or install the pinned pnpm version." >&2
      exit 1
    fi
  fi
  COREPACK_NPM_REGISTRY="${COREPACK_NPM_REGISTRY}" corepack prepare "${PNPM_SPEC}" --activate
elif ! command -v pnpm >/dev/null 2>&1; then
  echo "Install Corepack or the pinned pnpm version before building." >&2
  exit 1
fi

BUILD_TMP_DIR="$(mktemp -d)"
BUILD_ROOT="${BUILD_TMP_DIR}/workspace"
BUNDLE_DIR="${BUILD_TMP_DIR}/bundle"
cleanup() { rm -rf "${BUILD_TMP_DIR}"; }
trap cleanup EXIT
trap 'exit 130' INT TERM

echo "==> Creating isolated build workspace"
mkdir -p "${BUILD_ROOT}" "${BUNDLE_DIR}"
# Local private data must not enter even the temporary build workspace.
# The final runtime is assembled separately from an explicit allowlist.
tar \
  --exclude=".git" \
  --exclude="node_modules" \
  --exclude=".next*" \
  --exclude="dist" \
  --exclude=".pnpm-store" \
  --exclude="backups" \
  --exclude=".env*" \
  --exclude="playwright-report" \
  --exclude="test-results" \
  -C "${ROOT_DIR}" -cf - . | tar -C "${BUILD_ROOT}" -xf -
cd "${BUILD_ROOT}"
pnpm install --frozen-lockfile
pnpm sync:posts -- --silent
if [[ "${RUN_LINT_POSTS}" == "1" ]]; then pnpm lint:posts; fi

if [[ "${BUILD_WITH_REMOTE_REDIS}" == "1" ]]; then
  BUILD_WITH_REMOTE_REDIS=1 pnpm build
else
  UPSTASH_REDIS_REST_URL='' UPSTASH_REDIS_REST_TOKEN='' pnpm build
fi

pnpm sync:posts -- --published-only --silent
node scripts/vps/assemble-artifact.cjs "${BUILD_ROOT}" "${BUNDLE_DIR}"
cat > "${BUNDLE_DIR}/DEPLOY_ARTIFACT_META.txt" <<META
revision=${REVISION}
built_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
node_version=$(node -v)
META
mkdir -p "${ARTIFACT_DIR}"
tar -C "${BUNDLE_DIR}" -czf "${ARTIFACT_PATH}" .
echo "==> Artifact ready: ${ARTIFACT_PATH}"
