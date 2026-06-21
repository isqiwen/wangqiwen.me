#!/usr/bin/env bash
set -euo pipefail

# Configure a Caddy reverse proxy site for this app.
#
# Optional env vars:
#   APP_NAME=wangqiwen-me
#   APP_PORT=3000
#   APP_HOST=127.0.0.1
#   DOMAIN=wangqiwen.me
#   SERVER_ALIASES="www.wangqiwen.me"
#   SITE_NAME=wangqiwen.me

APP_NAME="${APP_NAME:-wangqiwen-me}"
APP_PORT="${APP_PORT:-3000}"
APP_HOST="${APP_HOST:-127.0.0.1}"
DOMAIN="${DOMAIN:-}"
SERVER_ALIASES="${SERVER_ALIASES:-}"
SITE_NAME="${SITE_NAME:-${DOMAIN:-${APP_NAME}}}"

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

if ! [[ "${APP_PORT}" =~ ^[0-9]+$ ]]; then
  echo "APP_PORT must be a number, got: ${APP_PORT}" >&2
  exit 1
fi

if ! command -v caddy >/dev/null 2>&1; then
  echo "Caddy is not installed. Run scripts/install-ubuntu-env.sh first." >&2
  exit 1
fi

SITE_NAME_SANITIZED="$(printf "%s" "${SITE_NAME}" | tr -cs "A-Za-z0-9._-" "-")"
SITE_FILE="/etc/caddy/Caddyfile.d/${SITE_NAME_SANITIZED}.caddy"

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
  SITE_ADDRESSES=":80"
else
  SITE_ADDRESSES="${SERVER_NAMES[*]}"
fi

ensure_caddyfile_import() {
  local tmp_caddyfile

  as_root install -d -m 0755 /etc/caddy/Caddyfile.d

  if ! as_root grep -qE "^[[:space:]]*import[[:space:]]+/etc/caddy/Caddyfile\.d/\*\.caddy" /etc/caddy/Caddyfile 2>/dev/null; then
    tmp_caddyfile="$(mktemp)"
    if as_root test -f /etc/caddy/Caddyfile; then
      as_root cat /etc/caddy/Caddyfile > "${tmp_caddyfile}"
    fi
    printf "\nimport /etc/caddy/Caddyfile.d/*.caddy\n" >> "${tmp_caddyfile}"
    as_root install -m 0644 -o root -g root "${tmp_caddyfile}" /etc/caddy/Caddyfile
    rm -f "${tmp_caddyfile}"
  fi
}

ensure_caddyfile_import

echo "==> Writing Caddy site config to ${SITE_FILE}"
TMP_CONFIG="$(mktemp)"
cat > "${TMP_CONFIG}" <<EOF
${SITE_ADDRESSES} {
	encode zstd gzip
	reverse_proxy ${APP_HOST}:${APP_PORT}
}
EOF

as_root install -m 0644 -o root -g root "${TMP_CONFIG}" "${SITE_FILE}"
rm -f "${TMP_CONFIG}"

echo "==> Validating Caddy config"
as_root caddy validate --config /etc/caddy/Caddyfile

echo "==> Reloading Caddy"
if ! as_root systemctl reload caddy; then
  as_root systemctl restart caddy
fi

echo
echo "Caddy site configured."
echo "Site file: ${SITE_FILE}"
echo "Site addresses: ${SITE_ADDRESSES}"
echo "Proxy target: http://${APP_HOST}:${APP_PORT}"
if [[ "${#SERVER_NAMES[@]}" -gt 0 ]]; then
  echo "HTTPS: managed automatically by Caddy when DNS points to this server."
else
  echo "HTTPS: disabled because no domain was configured."
fi
