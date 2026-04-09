#!/usr/bin/env bash
set -euo pipefail

# Deployment helper for Ubuntu servers.
#
# Recommended mode:
# - artifact deploy: extract a prebuilt standalone tarball onto the server
#
# Legacy mode:
# - source deploy: git pull + build on the server when no artifact is provided

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="${SCRIPT_DIR}/$(basename "${BASH_SOURCE[0]}")"

APP_NAME="${APP_NAME:-personal-blog}"
SERVICE_USER="${SERVICE_USER:-nextjs}"
APP_DIR="/srv/${SERVICE_USER}/${APP_NAME}"
APP_PORT="${APP_PORT:-3000}"
APP_HOST="${APP_HOST:-127.0.0.1}"
ARTIFACT_TARBALL="${ARTIFACT_TARBALL:-${1:-}}"

if [[ -n "${ARTIFACT_TARBALL}" ]]; then
  ARTIFACT_TARBALL="$(cd "$(dirname "${ARTIFACT_TARBALL}")" && pwd)/$(basename "${ARTIFACT_TARBALL}")"
fi

if [[ "$(id -un)" != "${SERVICE_USER}" ]]; then
  if ! id "${SERVICE_USER}" >/dev/null 2>&1; then
    echo "SERVICE_USER ${SERVICE_USER} does not exist." >&2
    exit 1
  fi

  echo "==> Switching to deploy user ${SERVICE_USER}"
  if command -v sudo >/dev/null 2>&1; then
    exec sudo -u "${SERVICE_USER}" -H env PATH="${PATH}" APP_NAME="${APP_NAME}" SERVICE_USER="${SERVICE_USER}" APP_PORT="${APP_PORT}" APP_HOST="${APP_HOST}" ARTIFACT_TARBALL="${ARTIFACT_TARBALL}" bash "${SCRIPT_PATH}"
  elif [[ "$(id -u)" -eq 0 ]]; then
    exec runuser -u "${SERVICE_USER}" -- env PATH="${PATH}" APP_NAME="${APP_NAME}" SERVICE_USER="${SERVICE_USER}" APP_PORT="${APP_PORT}" APP_HOST="${APP_HOST}" ARTIFACT_TARBALL="${ARTIFACT_TARBALL}" bash "${SCRIPT_PATH}"
  else
    echo "Need sudo or root privileges to switch to ${SERVICE_USER}." >&2
    exit 1
  fi
fi

start_pm2_artifact() {
  local target_dir="$1"

  echo "==> Starting standalone server with pm2"
  if command -v pm2 >/dev/null 2>&1; then
    pm2 delete "${APP_NAME}" >/dev/null 2>&1 || true
    PORT="${APP_PORT}" HOSTNAME="${APP_HOST}" NODE_ENV=production pm2 start server.js --name "${APP_NAME}" --cwd "${target_dir}"
    pm2 save >/dev/null
  else
    echo "pm2 not found; start manually with: PORT=${APP_PORT} HOSTNAME=${APP_HOST} node server.js"
  fi
}

preserve_env_files() {
  local source_dir="$1"
  local dest_dir="$2"
  local env_file

  for env_file in .env .env.production .env.local; do
    if [[ -f "${source_dir}/${env_file}" && ! -f "${dest_dir}/${env_file}" ]]; then
      cp -p "${source_dir}/${env_file}" "${dest_dir}/${env_file}"
    fi
  done
}

deploy_artifact() {
  local parent_dir
  local app_basename
  local stage_dir
  local backup_dir=""

  if [[ ! -f "${ARTIFACT_TARBALL}" ]]; then
    echo "Artifact not found: ${ARTIFACT_TARBALL}" >&2
    exit 1
  fi

  echo "==> Deploying prebuilt artifact"
  echo "    target dir: ${APP_DIR}"
  echo "    artifact: ${ARTIFACT_TARBALL}"

  parent_dir="$(dirname "${APP_DIR}")"
  app_basename="$(basename "${APP_DIR}")"
  mkdir -p "${parent_dir}"

  stage_dir="$(mktemp -d "${parent_dir}/.${app_basename}.stage.XXXXXX")"

  cleanup_stage() {
    rm -rf "${stage_dir}"
  }
  trap cleanup_stage EXIT

  tar -xzf "${ARTIFACT_TARBALL}" -C "${stage_dir}"

  if [[ ! -f "${stage_dir}/server.js" ]]; then
    echo "The artifact does not look like a standalone Next.js bundle: server.js is missing." >&2
    exit 1
  fi

  if [[ -d "${APP_DIR}" ]]; then
    preserve_env_files "${APP_DIR}" "${stage_dir}"
  fi

  cd "${parent_dir}"
  if [[ -d "${APP_DIR}" ]]; then
    backup_dir="${parent_dir}/.${app_basename}.backup.$(date +%Y%m%d%H%M%S)"
    echo "==> Backing up current app to ${backup_dir}"
    mv "${APP_DIR}" "${backup_dir}"
  fi

  mv "${stage_dir}" "${APP_DIR}"
  trap - EXIT

  cd "${APP_DIR}"
  start_pm2_artifact "${APP_DIR}"

  echo "==> Artifact deploy complete"
  if [[ -n "${backup_dir}" ]]; then
    echo "    previous release backup: ${backup_dir}"
  fi
}

deploy_source() {
  cd "${APP_DIR}"

  echo "==> Pulling latest code"
  git pull --ff-only

  echo "==> Ensuring corepack/pnpm"
  if ! command -v corepack >/dev/null 2>&1; then
    echo "corepack not found. Install Node.js 18+ and rerun." >&2
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

  echo "==> Restarting app (legacy source-build mode)"
  if command -v pm2 >/dev/null 2>&1; then
    pm2 restart "${APP_NAME}" || pm2 start pnpm --name "${APP_NAME}" -- start -- --hostname "${APP_HOST}" --port "${APP_PORT}"
    pm2 save >/dev/null
  else
    echo "pm2 not found; start manually with: pnpm start"
  fi
}

if [[ -n "${ARTIFACT_TARBALL}" ]]; then
  deploy_artifact
else
  deploy_source
fi
