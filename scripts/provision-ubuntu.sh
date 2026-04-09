#!/usr/bin/env bash
set -euo pipefail

# One-command Ubuntu 24.04 provisioning flow for this app.
# It can:
# - install server dependencies
# - create the service user and directories
# - deploy a prebuilt standalone artifact without running `next build`
# - configure Nginx and optionally request HTTPS
#
# Common env vars:
#   APP_NAME=my-blog
#   SERVICE_USER=nextjs
#   DOMAIN=example.com
#   SERVER_ALIASES="www.example.com"
#   ENABLE_HTTPS=1
#   CERTBOT_EMAIL=admin@example.com
#   ARTIFACT_TARBALL=/tmp/my-artifact.tar.gz
#   ARTIFACT_URL=https://example.com/my-artifact.tar.gz
#   ENV_FILE_PATH=/tmp/prod.env
#
# Advanced env vars are inherited by the underlying scripts:
#   NODE_MAJOR, CREATE_SERVICE_USER
#   INSTALL_CERTBOT, INSTALL_UFW, CONFIGURE_PM2_STARTUP
#   APP_HOST, APP_PORT, SITE_NAME, REMOVE_DEFAULT_SITE, CLIENT_MAX_BODY_SIZE
#   RUN_INSTALL=1, RUN_DEPLOY=1, RUN_SITE_CONFIG=1

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

APP_NAME="${APP_NAME:-personal-blog}"
DOMAIN="${DOMAIN:-}"
SERVER_ALIASES="${SERVER_ALIASES:-}"
ENABLE_HTTPS="${ENABLE_HTTPS:-0}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
ARTIFACT_TARBALL="${ARTIFACT_TARBALL:-}"
ARTIFACT_URL="${ARTIFACT_URL:-}"
ENV_FILE_PATH="${ENV_FILE_PATH:-}"

SERVICE_USER="${SERVICE_USER:-nextjs}"
SERVICE_HOME="/srv/${SERVICE_USER}"
APP_DIR="${SERVICE_HOME}/${APP_NAME}"
APP_HOST="${APP_HOST:-127.0.0.1}"
APP_PORT="${APP_PORT:-3000}"

RUN_INSTALL="${RUN_INSTALL:-1}"
RUN_DEPLOY="${RUN_DEPLOY:-1}"
RUN_SITE_CONFIG="${RUN_SITE_CONFIG:-1}"

if [[ "$(id -u)" -eq 0 ]]; then
  SUDO_BIN=""
else
  if ! command -v sudo >/dev/null 2>&1; then
    echo "sudo is required when not running as root." >&2
    exit 1
  fi
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
  local target_path="${incoming_dir}/$(basename "${artifact_source}")"

  as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" "${incoming_dir}"
  as_root cp "${artifact_source}" "${target_path}"
  as_root chown "${SERVICE_USER}:${SERVICE_USER}" "${target_path}"

  printf '%s\n' "${target_path}"
}

download_artifact() {
  local incoming_dir="${SERVICE_HOME}/shared/incoming"
  local target_path="${incoming_dir}/artifact-$(date +%Y%m%d%H%M%S).tar.gz"

  as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" "${incoming_dir}"
  as_root curl -fL "${ARTIFACT_URL}" -o "${target_path}"
  as_root chown "${SERVICE_USER}:${SERVICE_USER}" "${target_path}"

  printf '%s\n' "${target_path}"
}

echo "==> Provisioning Ubuntu app stack"
echo "    app dir: ${APP_DIR}"
echo "    service user: ${SERVICE_USER}"
if [[ -n "${DOMAIN}" ]]; then
  echo "    domain: ${DOMAIN}"
fi

if [[ "${RUN_INSTALL}" == "1" ]]; then
  echo "==> Running environment bootstrap"
  as_root env \
    NODE_MAJOR="${NODE_MAJOR:-20}" \
    APP_NAME="${APP_NAME}" \
    SERVICE_USER="${SERVICE_USER}" \
    CREATE_SERVICE_USER="${CREATE_SERVICE_USER:-1}" \
    INSTALL_CERTBOT="${INSTALL_CERTBOT:-1}" \
    INSTALL_UFW="${INSTALL_UFW:-0}" \
    CONFIGURE_PM2_STARTUP="${CONFIGURE_PM2_STARTUP:-1}" \
    bash "${ROOT_DIR}/scripts/install-ubuntu-env.sh"
fi

if ! id "${SERVICE_USER}" >/dev/null 2>&1; then
  echo "Service user ${SERVICE_USER} does not exist." >&2
  exit 1
fi

if [[ -n "${ENV_FILE_PATH}" ]]; then
  echo "==> Installing production env file into ${APP_DIR}/.env.local"
  as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" "${APP_DIR}"
  as_root cp "${ENV_FILE_PATH}" "${APP_DIR}/.env.local"
  as_root chown "${SERVICE_USER}:${SERVICE_USER}" "${APP_DIR}/.env.local"
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
      SERVICE_USER="${SERVICE_USER}" \
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
  echo "==> Configuring public Nginx site"
  as_root env \
    APP_NAME="${APP_NAME}" \
    APP_HOST="${APP_HOST}" \
    APP_PORT="${APP_PORT}" \
    DOMAIN="${DOMAIN}" \
    SERVER_ALIASES="${SERVER_ALIASES}" \
    SITE_NAME="${SITE_NAME:-}" \
    ENABLE_HTTPS="${ENABLE_HTTPS}" \
    CERTBOT_EMAIL="${CERTBOT_EMAIL}" \
    REMOVE_DEFAULT_SITE="${REMOVE_DEFAULT_SITE:-1}" \
    CLIENT_MAX_BODY_SIZE="${CLIENT_MAX_BODY_SIZE:-32m}" \
    bash "${ROOT_DIR}/scripts/configure-ubuntu-site.sh"
fi

echo
echo "==> Provisioning complete"
echo "App directory: ${APP_DIR}"
echo "PM2 app name: ${APP_NAME}"
echo "Proxy target: http://${APP_HOST}:${APP_PORT}"
if [[ -n "${DOMAIN}" ]]; then
  echo "Domain: ${DOMAIN}"
fi
if [[ "${ENABLE_HTTPS}" == "1" ]]; then
  echo "HTTPS: requested"
else
  echo "HTTPS: not requested"
fi
echo "Remember to point DNS to this server and allow ports 80/443 in your firewall or cloud security group."
