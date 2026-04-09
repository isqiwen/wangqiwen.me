#!/usr/bin/env bash
set -euo pipefail

# Bootstrap a fresh Ubuntu 24.04 server for self-hosting this project.
# Installs:
# - Node.js (via NodeSource)
# - corepack/pnpm
# - Nginx
# - PM2
# - common deployment tools
#
# Optional env vars:
#   NODE_MAJOR=20             Node.js major version to install
#   SERVICE_USER=nextjs       System user that owns the app
#   SERVICE_HOME=/srv/nextjs  Home directory for the service user
#   APP_DIR=/srv/nextjs/app   Deployment directory for the repo
#   CREATE_SERVICE_USER=1     Create SERVICE_USER if it does not exist
#   INSTALL_CERTBOT=1         Install certbot + nginx plugin
#   INSTALL_UFW=0             Install ufw and open SSH/Nginx rules
#   CONFIGURE_PM2_STARTUP=1   Register pm2 startup service for SERVICE_USER

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_MAJOR="${NODE_MAJOR:-20}"
SERVICE_USER="${SERVICE_USER:-nextjs}"
SERVICE_HOME="${SERVICE_HOME:-/srv/${SERVICE_USER}}"
APP_DIR="${APP_DIR:-${SERVICE_HOME}/app}"
CREATE_SERVICE_USER="${CREATE_SERVICE_USER:-1}"
INSTALL_CERTBOT="${INSTALL_CERTBOT:-1}"
INSTALL_UFW="${INSTALL_UFW:-0}"
CONFIGURE_PM2_STARTUP="${CONFIGURE_PM2_STARTUP:-1}"

if ! [[ "${NODE_MAJOR}" =~ ^[0-9]+$ ]]; then
  echo "NODE_MAJOR must be a number, got: ${NODE_MAJOR}" >&2
  exit 1
fi

if [[ -r /etc/os-release ]]; then
  # shellcheck disable=SC1091
  source /etc/os-release
  if [[ "${ID:-}" != "ubuntu" || "${VERSION_ID:-}" != "24.04" ]]; then
    echo "Warning: this script is intended for Ubuntu 24.04. Detected ${PRETTY_NAME:-unknown}." >&2
  fi
fi

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

echo "==> Installing base packages"
as_root apt-get update

APT_PACKAGES=(
  ca-certificates
  curl
  gnupg
  git
  build-essential
  unzip
  nginx
)

if [[ "${INSTALL_CERTBOT}" == "1" ]]; then
  APT_PACKAGES+=(
    certbot
    python3-certbot-nginx
  )
fi

if [[ "${INSTALL_UFW}" == "1" ]]; then
  APT_PACKAGES+=(
    ufw
  )
fi

as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y "${APT_PACKAGES[@]}"

if [[ "${CREATE_SERVICE_USER}" == "1" ]]; then
  if id "${SERVICE_USER}" >/dev/null 2>&1; then
    echo "==> Service user ${SERVICE_USER} already exists"
  else
    echo "==> Creating service user ${SERVICE_USER}"
    as_root adduser --system --group --home "${SERVICE_HOME}" --shell /usr/sbin/nologin "${SERVICE_USER}"
  fi
fi

if ! id "${SERVICE_USER}" >/dev/null 2>&1; then
  echo "Service user ${SERVICE_USER} does not exist. Set CREATE_SERVICE_USER=1 or create it manually." >&2
  exit 1
fi

echo "==> Ensuring service directories"
as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" "${SERVICE_HOME}"
as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" "${APP_DIR}"
as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" "${SERVICE_HOME}/logs"
as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" "${SERVICE_HOME}/shared"

echo "==> Installing Node.js ${NODE_MAJOR}.x from NodeSource"
curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | as_root bash -
as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs

echo "==> Enabling corepack"
as_root env PATH="${PATH}" COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack enable

PNPM_SPEC=""
cd "${ROOT_DIR}"
if [[ -f package.json ]]; then
  PNPM_SPEC="$(
    node -p "(() => {
      try {
        const value = require('./package.json').packageManager;
        return typeof value === 'string' ? value.replace(/\\+.*/, '') : '';
      } catch {
        return '';
      }
    })()"
  )"
fi

if [[ "${PNPM_SPEC}" == pnpm@* ]]; then
  echo "==> Activating ${PNPM_SPEC} via corepack"
  as_root env PATH="${PATH}" COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack prepare "${PNPM_SPEC}" --activate
  as_user "${SERVICE_USER}" env PATH="${PATH}" COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack prepare "${PNPM_SPEC}" --activate
else
  echo "==> Activating latest pnpm via corepack"
  as_root env PATH="${PATH}" COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack prepare pnpm@latest --activate
  as_user "${SERVICE_USER}" env PATH="${PATH}" COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack prepare pnpm@latest --activate
fi

echo "==> Installing pm2"
as_root npm install -g pm2

echo "==> Enabling Nginx"
as_root systemctl enable nginx
as_root systemctl restart nginx

if [[ "${INSTALL_UFW}" == "1" ]]; then
  echo "==> Opening UFW rules for SSH and Nginx"
  as_root ufw allow OpenSSH
  as_root ufw allow 'Nginx Full'
fi

if [[ "${CONFIGURE_PM2_STARTUP}" == "1" ]]; then
  if [[ "${SERVICE_USER}" != "root" ]]; then
    APP_HOME="$(getent passwd "${SERVICE_USER}" | cut -d: -f6)"
    if [[ -n "${APP_HOME}" ]]; then
      echo "==> Configuring pm2 startup for ${SERVICE_USER}"
      as_root env PATH="${PATH}" pm2 startup systemd -u "${SERVICE_USER}" --hp "${APP_HOME}"
      echo "Run this after your app is online to persist the process list:"
      echo "    sudo -u ${SERVICE_USER} -H pm2 save"
    else
      echo "Skipping pm2 startup: could not resolve home directory for ${SERVICE_USER}."
    fi
  else
    echo "Skipping pm2 startup auto-config for root."
  fi
fi

echo "==> Installed versions"
node -v
npm -v
pnpm -v
nginx -v 2>&1
npm list -g pm2 --depth=0

echo
echo "==> Next steps"
echo "    1. Clone the repo as ${SERVICE_USER}:"
echo "       sudo -u ${SERVICE_USER} -H git clone <repo-url> ${APP_DIR}"
echo "    2. Create your production env file in ${APP_DIR}."
echo "    3. Deploy the app as ${SERVICE_USER}:"
echo "       cd ${APP_DIR} && sudo -u ${SERVICE_USER} -H env APP_NAME=my-blog bash scripts/deploy-ubuntu.sh"
echo "    4. Configure Nginx for public access:"
echo "       sudo env DOMAIN=example.com SERVER_ALIASES=www.example.com APP_PORT=3000 bash ${APP_DIR}/scripts/configure-ubuntu-site.sh"
echo "    5. Optionally request HTTPS once DNS points to this server:"
echo "       sudo env DOMAIN=example.com SERVER_ALIASES=www.example.com ENABLE_HTTPS=1 CERTBOT_EMAIL=admin@example.com bash ${APP_DIR}/scripts/configure-ubuntu-site.sh"
echo
if [[ "${INSTALL_UFW}" == "1" ]]; then
  echo "UFW rules were added but the firewall was not enabled automatically."
  echo "Review them first, then run: sudo ufw enable"
fi
