#!/usr/bin/env bash
set -euo pipefail

# One-command Ubuntu 24.04 provisioning flow for this app.
# It can:
# - install server dependencies
# - create the service user and directories
# - clone or reuse the repo in the target app directory
# - deploy the app with pm2
# - configure Nginx and optionally request HTTPS
#
# Common env vars:
#   REPO_URL=https://github.com/me/my-blog.git
#   REPO_BRANCH=main
#   APP_NAME=my-blog
#   DOMAIN=example.com
#   SERVER_ALIASES="www.example.com"
#   ENABLE_HTTPS=1
#   CERTBOT_EMAIL=admin@example.com
#
# Advanced env vars are inherited by the underlying scripts:
#   NODE_MAJOR, SERVICE_USER, SERVICE_HOME, APP_DIR, CREATE_SERVICE_USER
#   INSTALL_CERTBOT, INSTALL_UFW, CONFIGURE_PM2_STARTUP
#   APP_HOST, APP_PORT, SITE_NAME, REMOVE_DEFAULT_SITE, CLIENT_MAX_BODY_SIZE
#   RUN_INSTALL=1, RUN_DEPLOY=1, RUN_SITE_CONFIG=1

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

REPO_URL="${REPO_URL:-}"
REPO_BRANCH="${REPO_BRANCH:-}"
APP_NAME="${APP_NAME:-personal-blog}"
DOMAIN="${DOMAIN:-}"
SERVER_ALIASES="${SERVER_ALIASES:-}"
ENABLE_HTTPS="${ENABLE_HTTPS:-0}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

SERVICE_USER="${SERVICE_USER:-nextjs}"
SERVICE_HOME="${SERVICE_HOME:-/srv/${SERVICE_USER}}"
APP_DIR="${APP_DIR:-${SERVICE_HOME}/app}"
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

as_user() {
  local target_user="$1"
  shift

  if [[ "$(id -un)" == "${target_user}" ]]; then
    "$@"
  elif [[ -n "${SUDO_BIN}" ]]; then
    "${SUDO_BIN}" -u "${target_user}" -H "$@"
  else
    runuser -u "${target_user}" -- "$@"
  fi
}

if [[ -z "${REPO_URL}" ]]; then
  REPO_URL="$(git -C "${ROOT_DIR}" remote get-url origin 2>/dev/null || true)"
fi

clone_repo_if_needed() {
  if [[ -d "${APP_DIR}/.git" ]]; then
    echo "==> Repo already present at ${APP_DIR}"
    return
  fi

  if [[ -z "${REPO_URL}" ]]; then
    echo "REPO_URL is required when ${APP_DIR} does not already contain a git repo." >&2
    exit 1
  fi

  if [[ -d "${APP_DIR}" ]] && [[ -n "$(find "${APP_DIR}" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]]; then
    echo "${APP_DIR} exists and is not empty, but is not a git repo. Refusing to overwrite it." >&2
    exit 1
  fi

  echo "==> Cloning repo into ${APP_DIR}"
  if [[ -n "${REPO_BRANCH}" ]]; then
    as_user "${SERVICE_USER}" git clone --branch "${REPO_BRANCH}" --single-branch "${REPO_URL}" "${APP_DIR}"
  else
    as_user "${SERVICE_USER}" git clone "${REPO_URL}" "${APP_DIR}"
  fi
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
    SERVICE_USER="${SERVICE_USER}" \
    SERVICE_HOME="${SERVICE_HOME}" \
    APP_DIR="${APP_DIR}" \
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

clone_repo_if_needed

if [[ "${RUN_DEPLOY}" == "1" ]]; then
  echo "==> Deploying application"
  (
    cd "${APP_DIR}"
    as_user "${SERVICE_USER}" env \
      APP_NAME="${APP_NAME}" \
      APP_USER="${SERVICE_USER}" \
      APP_HOST="${APP_HOST}" \
      APP_PORT="${APP_PORT}" \
      bash scripts/deploy-ubuntu.sh
  )
fi

if [[ "${RUN_SITE_CONFIG}" == "1" ]]; then
  echo "==> Configuring public Nginx site"
  (
    cd "${APP_DIR}"
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
      bash scripts/configure-ubuntu-site.sh
  )
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
