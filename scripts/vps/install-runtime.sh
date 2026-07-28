#!/usr/bin/env bash
set -euo pipefail

# Bootstrap an Ubuntu server for a Next.js standalone app managed by systemd
# and exposed through Caddy.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

NODE_MAJOR="${NODE_MAJOR:-20}"
APP_NAME="${APP_NAME:-wangqiwen-me}"
SERVICE_USER="${SERVICE_USER:-nextjs}"
SERVICE_HOME="${SERVICE_HOME:-/srv/${SERVICE_USER}}"
APP_DIR="${APP_DIR:-${SERVICE_HOME}/${APP_NAME}}"

CREATE_SERVICE_USER="${CREATE_SERVICE_USER:-1}"
INSTALL_CADDY="${INSTALL_CADDY:-1}"
INSTALL_UFW="${INSTALL_UFW:-0}"
OPEN_HTTP3="${OPEN_HTTP3:-0}"

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

as_user() {
  local user="$1"
  shift
  if command -v sudo >/dev/null 2>&1; then
    as_root sudo -u "${user}" -H "$@"
  elif [[ "${EUID}" -eq 0 ]]; then
    runuser -u "${user}" -- "$@"
  else
    echo "sudo is required when not running as root." >&2
    exit 1
  fi
}

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1" >&2
    exit 1
  fi
}

echo "==> Checking host"
if [[ -r /etc/os-release ]]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  if [[ "${ID:-}" != "ubuntu" ]]; then
    echo "Warning: this script is written for Ubuntu. Detected: ${PRETTY_NAME:-unknown}"
  else
    echo "Detected: ${PRETTY_NAME:-Ubuntu}"
  fi
fi

echo "==> Installing base packages"
as_root apt-get update
as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ca-certificates \
  curl \
  gnupg \
  git \
  build-essential \
  unzip \
  tar

echo "==> Installing Node.js ${NODE_MAJOR}.x"
curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | as_root bash -
as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs

echo "==> Enabling corepack/pnpm"
as_root env COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack enable

PNPM_SPEC=""
if [[ -f "${ROOT_DIR}/package.json" ]]; then
  PNPM_SPEC="$(
    node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); const v=p.packageManager || ''; console.log(typeof v === 'string' ? v.replace(/\\+.*/, '') : '')" "${ROOT_DIR}/package.json"
  )"
fi

if [[ "${PNPM_SPEC}" == pnpm@* ]]; then
  as_root env COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack prepare "${PNPM_SPEC}" --activate
else
  as_root env COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack prepare pnpm@latest --activate
fi

install_caddy() {
  if command -v caddy >/dev/null 2>&1; then
    echo "Caddy already installed: $(caddy version)"
    as_root systemctl enable --now caddy
    return
  fi

  echo "==> Installing Caddy"
  as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y \
    debian-keyring \
    debian-archive-keyring \
    apt-transport-https

  local key_tmp
  local list_tmp
  key_tmp="$(mktemp)"
  list_tmp="$(mktemp)"

  curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/gpg.key" -o "${key_tmp}"
  as_root gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg "${key_tmp}"
  rm -f "${key_tmp}"

  curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt" -o "${list_tmp}"
  as_root install -m 0644 "${list_tmp}" /etc/apt/sources.list.d/caddy-stable.list
  rm -f "${list_tmp}"

  as_root chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  as_root chmod o+r /etc/apt/sources.list.d/caddy-stable.list

  as_root apt-get update
  as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y caddy
  as_root systemctl enable --now caddy
}

if [[ "${INSTALL_CADDY}" == "1" ]]; then
  install_caddy
fi

echo "==> Preparing service user and directories"
if [[ "${CREATE_SERVICE_USER}" == "1" ]] && ! id "${SERVICE_USER}" >/dev/null 2>&1; then
  as_root adduser \
    --system \
    --group \
    --home "${SERVICE_HOME}" \
    --shell /usr/sbin/nologin \
    "${SERVICE_USER}"
fi

if ! id "${SERVICE_USER}" >/dev/null 2>&1; then
  echo "Service user does not exist: ${SERVICE_USER}" >&2
  exit 1
fi

as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" -m 0755 "${SERVICE_HOME}"
as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" -m 0755 "${APP_DIR}"
as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" -m 0755 "${SERVICE_HOME}/shared"
as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" -m 0755 "${SERVICE_HOME}/logs"

if [[ "${INSTALL_UFW}" == "1" ]]; then
  echo "==> Configuring UFW"
  as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y ufw
  as_root ufw allow OpenSSH
  as_root ufw allow 80/tcp comment "HTTP"
  as_root ufw allow 443/tcp comment "HTTPS"
  if [[ "${OPEN_HTTP3}" == "1" ]]; then
    as_root ufw allow 443/udp comment "HTTP/3"
  fi
  as_root ufw --force enable
fi

need_cmd node
need_cmd npm
need_cmd pnpm

echo
echo "Bootstrap complete."
echo "Node: $(node -v)"
echo "npm: $(npm -v)"
echo "pnpm: $(pnpm -v)"
if command -v caddy >/dev/null 2>&1; then
  echo "Caddy: $(caddy version)"
fi
echo "Service user: ${SERVICE_USER}"
echo "Application directory: ${APP_DIR}"
