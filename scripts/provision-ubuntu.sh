#!/usr/bin/env bash
set -euo pipefail

# One-command Ubuntu provisioning flow for wangqiwen.me.
# It can:
# - install Node.js, pnpm, Caddy, service user and directories
# - deploy a prebuilt Next.js standalone artifact
# - create/update the Caddy reverse proxy site
#
# Common env vars:
#   APP_NAME=wangqiwen-me
#   SERVICE_USER=nextjs
#   DOMAIN=wangqiwen.me
#   SERVER_ALIASES="www.wangqiwen.me"
#   ARTIFACT_TARBALL=/tmp/nextjs-standalone-xxxx.tar.gz
#   ARTIFACT_URL=https://example.com/nextjs-standalone-xxxx.tar.gz
#   ENV_FILE_PATH=/tmp/prod.env
#
# Advanced env vars:
#   NODE_MAJOR=20
#   CREATE_SERVICE_USER=1
#   INSTALL_CADDY=1
#   INSTALL_UFW=0
#   OPEN_HTTP3=0
#   APP_HOST=127.0.0.1
#   APP_PORT=3000
#   SITE_NAME=wangqiwen.me
#   RUN_INSTALL=1
#   RUN_DEPLOY=1
#   RUN_SITE_CONFIG=1

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

APP_NAME="${APP_NAME:-wangqiwen-me}"
DOMAIN="${DOMAIN:-}"
SERVER_ALIASES="${SERVER_ALIASES:-}"
ARTIFACT_TARBALL="${ARTIFACT_TARBALL:-}"
ARTIFACT_URL="${ARTIFACT_URL:-}"
ENV_FILE_PATH="${ENV_FILE_PATH:-}"

SERVICE_USER="${SERVICE_USER:-nextjs}"
SERVICE_HOME="${SERVICE_HOME:-/srv/${SERVICE_USER}}"
APP_DIR="${APP_DIR:-${SERVICE_HOME}/${APP_NAME}}"
APP_HOST="${APP_HOST:-127.0.0.1}"
APP_PORT="${APP_PORT:-3000}"
SYSTEMD_SERVICE_NAME="${SYSTEMD_SERVICE_NAME:-${APP_NAME}}"

RUN_INSTALL="${RUN_INSTALL:-1}"
RUN_DEPLOY="${RUN_DEPLOY:-1}"
RUN_SITE_CONFIG="${RUN_SITE_CONFIG:-1}"

SUDO_BIN=""
if [[ "${EUID}" -ne 0 ]]; then
  SUDO_BIN="sudo"
fi

as_root() {
  if [[ -n "${SUDO_BIN}" ]]; then
    "${SUDO_BIN}" "$@"
  else
    "$@"
  fi
}

prepare_artifact() {
  local artifact_source="$1"
  local incoming_dir="${SERVICE_HOME}/shared/incoming"
  local artifact_name
  local target_path
  artifact_name="$(basename "${artifact_source}")"
  target_path="${incoming_dir}/${artifact_name}"

  as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" -m 0755 "${incoming_dir}"
  as_root cp "${artifact_source}" "${target_path}"
  as_root chown "${SERVICE_USER}:${SERVICE_USER}" "${target_path}"

  printf "%s\n" "${target_path}"
}

download_artifact() {
  local incoming_dir="${SERVICE_HOME}/shared/incoming"
  local timestamp
  local target_path
  timestamp="$(date +%Y%m%d%H%M%S)"
  target_path="${incoming_dir}/artifact-${timestamp}.tar.gz"

  as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" -m 0755 "${incoming_dir}"
  as_root curl -fL "${ARTIFACT_URL}" -o "${target_path}"
  as_root chown "${SERVICE_USER}:${SERVICE_USER}" "${target_path}"

  printf "%s\n" "${target_path}"
}

echo "==> Provisioning Ubuntu app stack"
echo "    app dir: ${APP_DIR}"
echo "    service user: ${SERVICE_USER}"
echo "    systemd service: ${SYSTEMD_SERVICE_NAME}.service"
if [[ -n "${DOMAIN}" ]]; then
  echo "    domain: ${DOMAIN}"
fi

if [[ "${RUN_INSTALL}" == "1" ]]; then
  echo "==> Running environment bootstrap"
  as_root env \
    NODE_MAJOR="${NODE_MAJOR:-20}" \
    APP_NAME="${APP_NAME}" \
    SERVICE_USER="${SERVICE_USER}" \
    SERVICE_HOME="${SERVICE_HOME}" \
    APP_DIR="${APP_DIR}" \
    CREATE_SERVICE_USER="${CREATE_SERVICE_USER:-1}" \
    INSTALL_CADDY="${INSTALL_CADDY:-1}" \
    INSTALL_UFW="${INSTALL_UFW:-0}" \
    OPEN_HTTP3="${OPEN_HTTP3:-0}" \
    bash "${ROOT_DIR}/scripts/install-ubuntu-env.sh"
fi

if ! id "${SERVICE_USER}" >/dev/null 2>&1; then
  echo "Service user ${SERVICE_USER} does not exist." >&2
  exit 1
fi

if [[ -n "${ENV_FILE_PATH}" ]]; then
  echo "==> Installing production env file into ${APP_DIR}/.env.local"
  as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" -m 0755 "${APP_DIR}"
  as_root install -m 0600 -o "${SERVICE_USER}" -g "${SERVICE_USER}" "${ENV_FILE_PATH}" "${APP_DIR}/.env.local"
fi

if [[ "${RUN_DEPLOY}" == "1" ]]; then
  DEPLOYABLE_ARTIFACT=""

  if [[ -n "${ARTIFACT_TARBALL}" ]]; then
    echo "==> Preparing uploaded artifact for deployment"
    DEPLOYABLE_ARTIFACT="$(prepare_artifact "${ARTIFACT_TARBALL}")"
  elif [[ -n "${ARTIFACT_URL}" ]]; then
    echo "==> Downloading deployment artifact"
    DEPLOYABLE_ARTIFACT="$(download_artifact)"
  fi

  if [[ -n "${DEPLOYABLE_ARTIFACT}" ]]; then
    echo "==> Deploying application artifact"
    as_root env \
      APP_NAME="${APP_NAME}" \
      SYSTEMD_SERVICE_NAME="${SYSTEMD_SERVICE_NAME}" \
      SERVICE_USER="${SERVICE_USER}" \
      SERVICE_HOME="${SERVICE_HOME}" \
      APP_DIR="${APP_DIR}" \
      APP_HOST="${APP_HOST}" \
      APP_PORT="${APP_PORT}" \
      ARTIFACT_TARBALL="${DEPLOYABLE_ARTIFACT}" \
      bash "${ROOT_DIR}/scripts/deploy-ubuntu.sh"
  else
    echo "==> Skipping application deploy"
    echo "    Provide ARTIFACT_TARBALL=/path/to/artifact.tar.gz or ARTIFACT_URL=https://..."
  fi
fi

if [[ "${RUN_SITE_CONFIG}" == "1" ]]; then
  echo "==> Configuring public Caddy site"
  as_root env \
    APP_NAME="${APP_NAME}" \
    APP_HOST="${APP_HOST}" \
    APP_PORT="${APP_PORT}" \
    DOMAIN="${DOMAIN}" \
    SERVER_ALIASES="${SERVER_ALIASES}" \
    SITE_NAME="${SITE_NAME:-}" \
    bash "${ROOT_DIR}/scripts/configure-ubuntu-site.sh"
fi

echo
echo "==> Provisioning complete"
echo "App directory: ${APP_DIR}"
echo "Systemd service: ${SYSTEMD_SERVICE_NAME}.service"
echo "Proxy target: http://${APP_HOST}:${APP_PORT}"
if [[ -n "${DOMAIN}" ]]; then
  echo "Domain: ${DOMAIN}"
  echo "HTTPS: managed automatically by Caddy when DNS points to this server."
else
  echo "Domain: not configured"
fi
echo "Remember to allow inbound 80/tcp and 443/tcp on the server firewall and cloud firewall."
