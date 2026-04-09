#!/usr/bin/env bash
set -euo pipefail

# Configure an Ubuntu Nginx site for this app and optionally request HTTPS.
#
# Optional env vars:
#   APP_NAME=personal-blog          Used for the site file name fallback
#   APP_PORT=3000                   Local app port proxied by Nginx
#   APP_HOST=127.0.0.1              Local app host proxied by Nginx
#   DOMAIN=example.com              Primary public domain
#   SERVER_ALIASES="www.example.com" Extra server_name entries, space or comma separated
#   SITE_NAME=example.com           Nginx site file name; defaults to DOMAIN or APP_NAME
#   ENABLE_HTTPS=0                  Request a Let's Encrypt certificate with certbot
#   CERTBOT_EMAIL=admin@example.com Email required when ENABLE_HTTPS=1
#   REMOVE_DEFAULT_SITE=1           Disable the default Nginx site
#   CLIENT_MAX_BODY_SIZE=32m        Upload size limit for Nginx

APP_NAME="${APP_NAME:-personal-blog}"
APP_PORT="${APP_PORT:-3000}"
APP_HOST="${APP_HOST:-127.0.0.1}"
DOMAIN="${DOMAIN:-}"
SERVER_ALIASES="${SERVER_ALIASES:-}"
ENABLE_HTTPS="${ENABLE_HTTPS:-0}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
REMOVE_DEFAULT_SITE="${REMOVE_DEFAULT_SITE:-1}"
CLIENT_MAX_BODY_SIZE="${CLIENT_MAX_BODY_SIZE:-32m}"
SITE_NAME="${SITE_NAME:-${DOMAIN:-${APP_NAME}}}"

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

if ! [[ "${APP_PORT}" =~ ^[0-9]+$ ]]; then
  echo "APP_PORT must be a number, got: ${APP_PORT}" >&2
  exit 1
fi

SITE_NAME_SANITIZED="$(printf '%s' "${SITE_NAME}" | tr -cs 'A-Za-z0-9._-' '-')"
SITE_AVAILABLE="/etc/nginx/sites-available/${SITE_NAME_SANITIZED}"
SITE_ENABLED="/etc/nginx/sites-enabled/${SITE_NAME_SANITIZED}"

SERVER_NAMES=()
if [[ -n "${DOMAIN}" ]]; then
  SERVER_NAMES+=("${DOMAIN}")
fi

if [[ -n "${SERVER_ALIASES}" ]]; then
  NORMALIZED_ALIASES="${SERVER_ALIASES//,/ }"
  # shellcheck disable=SC2206
  ALIAS_LIST=(${NORMALIZED_ALIASES})
  for alias in "${ALIAS_LIST[@]}"; do
    if [[ -n "${alias}" ]]; then
      SERVER_NAMES+=("${alias}")
    fi
  done
fi

if [[ "${#SERVER_NAMES[@]}" -eq 0 ]]; then
  SERVER_NAME_VALUE="_"
else
  SERVER_NAME_VALUE="${SERVER_NAMES[*]}"
fi

echo "==> Writing Nginx site config to ${SITE_AVAILABLE}"
TMP_CONFIG="$(mktemp)"
cat > "${TMP_CONFIG}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAME_VALUE};

    client_max_body_size ${CLIENT_MAX_BODY_SIZE};

    location / {
        proxy_pass http://${APP_HOST}:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

as_root install -m 0644 "${TMP_CONFIG}" "${SITE_AVAILABLE}"
rm -f "${TMP_CONFIG}"

echo "==> Enabling Nginx site ${SITE_NAME_SANITIZED}"
as_root ln -sfn "${SITE_AVAILABLE}" "${SITE_ENABLED}"

if [[ "${REMOVE_DEFAULT_SITE}" == "1" ]]; then
  echo "==> Disabling default Nginx site"
  as_root rm -f /etc/nginx/sites-enabled/default
fi

echo "==> Validating Nginx config"
as_root nginx -t

echo "==> Reloading Nginx"
as_root systemctl reload nginx

if [[ "${ENABLE_HTTPS}" == "1" ]]; then
  if [[ -z "${DOMAIN}" ]]; then
    echo "ENABLE_HTTPS=1 requires DOMAIN to be set." >&2
    exit 1
  fi

  if [[ -z "${CERTBOT_EMAIL}" ]]; then
    echo "ENABLE_HTTPS=1 requires CERTBOT_EMAIL to be set." >&2
    exit 1
  fi

  if ! command -v certbot >/dev/null 2>&1; then
    echo "certbot is not installed. Re-run install-ubuntu-env.sh with INSTALL_CERTBOT=1." >&2
    exit 1
  fi

  CERTBOT_DOMAINS=(-d "${DOMAIN}")
  if [[ "${#SERVER_NAMES[@]}" -gt 1 ]]; then
    for ((i = 1; i < ${#SERVER_NAMES[@]}; i++)); do
      CERTBOT_DOMAINS+=(-d "${SERVER_NAMES[i]}")
    done
  fi

  echo "==> Requesting HTTPS certificate with Certbot"
  if ! as_root certbot --nginx --non-interactive --agree-tos --redirect -m "${CERTBOT_EMAIL}" "${CERTBOT_DOMAINS[@]}"; then
    echo "Certbot failed. The HTTP Nginx site is still configured, but HTTPS was not enabled." >&2
    exit 1
  fi
fi

echo
echo "==> Done"
echo "Site file: ${SITE_AVAILABLE}"
if [[ -n "${DOMAIN}" ]]; then
  echo "Primary domain: ${DOMAIN}"
fi
echo "Proxy target: http://${APP_HOST}:${APP_PORT}"
if [[ "${ENABLE_HTTPS}" == "1" ]]; then
  echo "HTTPS: enabled via Certbot"
else
  echo "HTTPS: not requested by this run"
fi
