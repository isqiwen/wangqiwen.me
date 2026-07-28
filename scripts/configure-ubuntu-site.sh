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
#   REPLACE_EXISTING_SITE_CONFIG=1

APP_NAME="${APP_NAME:-wangqiwen-me}"
APP_PORT="${APP_PORT:-3000}"
APP_HOST="${APP_HOST:-127.0.0.1}"
DOMAIN="${DOMAIN:-}"
SERVER_ALIASES="${SERVER_ALIASES:-}"
SITE_NAME="${SITE_NAME:-${DOMAIN:-${APP_NAME}}}"
REPLACE_EXISTING_SITE_CONFIG="${REPLACE_EXISTING_SITE_CONFIG:-1}"

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

remove_site_blocks_from_main_caddyfile() {
  local names="$1"
  local tmp_caddyfile

  if ! as_root test -f /etc/caddy/Caddyfile; then
    return
  fi

  tmp_caddyfile="$(mktemp)"
  # shellcheck disable=SC2016
  as_root awk -v names="${names}" '
    BEGIN {
      split(names, raw_names, /[ \t]+/)
      for (i in raw_names) {
        if (raw_names[i] != "") {
          wanted[raw_names[i]] = 1
        }
      }
      depth = 0
      skipping = 0
      skip_depth = 0
    }

    function normalize_token(value) {
      sub(/^https?:\/\//, "", value)
      sub(/:.*/, "", value)
      return value
    }

    function line_has_site_name(line, cleaned, count, i, token) {
      cleaned = line
      sub(/[ \t]*#.*/, "", cleaned)
      gsub(/[{},]/, " ", cleaned)
      count = split(cleaned, tokens, /[ \t]+/)

      for (i = 1; i <= count; i += 1) {
        token = normalize_token(tokens[i])
        if (token in wanted) {
          return 1
        }
      }

      return 0
    }

    function brace_delta(line, opens_text, closes_text, opens, closes) {
      opens_text = line
      closes_text = line
      opens = gsub(/\{/, "", opens_text)
      closes = gsub(/\}/, "", closes_text)
      return opens - closes
    }

    {
      delta = brace_delta($0)

      if (skipping) {
        skip_depth += delta
        if (skip_depth <= 0) {
          skipping = 0
          skip_depth = 0
        }
        next
      }

      if (depth == 0 && index($0, "{") > 0 && line_has_site_name($0)) {
        skipping = 1
        skip_depth = delta
        if (skip_depth <= 0) {
          skipping = 0
          skip_depth = 0
        }
        next
      }

      print
      depth += delta
      if (depth < 0) {
        depth = 0
      }
    }
  ' /etc/caddy/Caddyfile > "${tmp_caddyfile}"

  as_root install -m 0644 -o root -g root "${tmp_caddyfile}" /etc/caddy/Caddyfile
  rm -f "${tmp_caddyfile}"
}

remove_conflicting_caddy_snippets() {
  local file
  local name
  local should_remove

  if ! as_root test -d /etc/caddy/Caddyfile.d; then
    return
  fi

  while IFS= read -r file; do
    if [[ "${file}" == "${SITE_FILE}" ]]; then
      continue
    fi

    should_remove="0"
    for name in "${SERVER_NAMES[@]}"; do
      if as_root grep -Fq "${name}" "${file}"; then
        should_remove="1"
        break
      fi
    done

    if [[ "${should_remove}" == "1" ]]; then
      echo "==> Removing existing Caddy site snippet ${file}"
      as_root rm -f "${file}"
    fi
  done < <(as_root find /etc/caddy/Caddyfile.d -type f -name "*.caddy" -print 2>/dev/null)
}

replace_existing_site_config() {
  local names

  if [[ "${REPLACE_EXISTING_SITE_CONFIG}" != "1" || "${#SERVER_NAMES[@]}" -eq 0 ]]; then
    return
  fi

  names="${SERVER_NAMES[*]}"
  echo "==> Replacing existing Caddy site config for: ${names}"
  remove_site_blocks_from_main_caddyfile "${names}"
  remove_conflicting_caddy_snippets
}

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

replace_existing_site_config
ensure_caddyfile_import

echo "==> Writing Caddy site config to ${SITE_FILE}"
TMP_CONFIG="$(mktemp)"
cat > "${TMP_CONFIG}" <<EOF
${SITE_ADDRESSES} {
	encode zstd gzip
	request_body {
		max_size 20MB
	}
	reverse_proxy ${APP_HOST}:${APP_PORT} {
		header_up -X-Middleware-Subrequest
	}
}
EOF

as_root install -m 0644 -o root -g root "${TMP_CONFIG}" "${SITE_FILE}"
rm -f "${TMP_CONFIG}"

echo "==> Validating Caddy config"
if ! as_root caddy validate --config /etc/caddy/Caddyfile; then
  echo >&2
  echo "Caddy config validation failed." >&2
  echo "If the error says \"ambiguous site definition\", a duplicate site definition still exists." >&2
  if [[ "${#SERVER_NAMES[@]}" -gt 0 ]]; then
    echo "Find existing definitions with:" >&2
    echo "  sudo grep -Rni \"${SERVER_NAMES[0]}\" /etc/caddy" >&2
  fi
  echo "Remove the remaining duplicate site block, then rerun this script." >&2
  exit 1
fi

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
