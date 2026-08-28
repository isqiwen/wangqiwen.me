#!/usr/bin/env bash
set -euo pipefail

# Configure only this app's Caddy site without taking ownership of unrelated
# Caddy configuration. Existing site blocks that already point to this app are
# left exactly as they are. Missing blocks are appended. A conflicting,
# standalone site block needs explicit confirmation before it is replaced.
#
# Optional env vars:
#   APP_NAME=nextjs-app
#   APP_PORT=3000
#   APP_HOST=127.0.0.1
#   DOMAIN=example.com
#   SERVER_ALIASES="www.example.com"
#   CADDY_CONFIG_FILE=/etc/caddy/Caddyfile
#   CADDY_SERVICE_NAME=caddy
#   CADDY_OVERWRITE=ask  # ask, 1/yes, or 0/no

APP_NAME="${APP_NAME:-nextjs-app}"
APP_PORT="${APP_PORT:-3000}"
APP_HOST="${APP_HOST:-127.0.0.1}"
DOMAIN="${DOMAIN:-}"
SERVER_ALIASES="${SERVER_ALIASES:-}"
CADDY_CONFIG_FILE="${CADDY_CONFIG_FILE:-/etc/caddy/Caddyfile}"
CADDY_SERVICE_NAME="${CADDY_SERVICE_NAME:-caddy}"
CADDY_OVERWRITE="${CADDY_OVERWRITE:-ask}"

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

fail() {
  echo "$*" >&2
  exit 1
}

if ! [[ "${APP_PORT}" =~ ^[0-9]+$ ]]; then
  fail "APP_PORT must be a number, got: ${APP_PORT}"
fi

if [[ -z "${DOMAIN}" ]]; then
  fail "DOMAIN is required to configure a Caddy site."
fi

case "${CADDY_OVERWRITE}" in
  ask | 1 | yes | 0 | no) ;;
  *) fail "CADDY_OVERWRITE must be ask, 1/yes, or 0/no." ;;
esac

if ! command -v caddy >/dev/null 2>&1; then
  fail "Caddy is not installed. Run scripts/vps/install-runtime.sh first."
fi

CADDY_CONFIG_FILE="$(realpath -m -- "${CADDY_CONFIG_FILE}")"
if ! as_root test -f "${CADDY_CONFIG_FILE}"; then
  fail "Caddy config does not exist: ${CADDY_CONFIG_FILE}"
fi

# Caddyfile site labels are space- or comma-separated. This function only
# extracts top-level blocks whose label contains the requested exact name.
extract_site_blocks() {
  local site="$1"
  local config_file="${2:-${CADDY_CONFIG_FILE}}"

  # shellcheck disable=SC2016
  as_root awk -v site="${site}" '
    function without_comment(line) {
      sub(/[[:space:]]*#.*/, "", line)
      return line
    }

    function normalize_site_token(token) {
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", token)
      sub(/^https?:\/\//, "", token)
      sub(/:[0-9]+$/, "", token)
      return token
    }

    function header_has_site(line, header, count, i, token) {
      header = line
      sub(/\{.*/, "", header)
      gsub(/,/, " ", header)
      count = split(header, tokens, /[[:space:]]+/)
      for (i = 1; i <= count; i += 1) {
        token = normalize_site_token(tokens[i])
        if (token == site) {
          return 1
        }
      }
      return 0
    }

    function brace_delta(line, opening, closing) {
      opening = line
      closing = line
      return gsub(/\{/, "", opening) - gsub(/\}/, "", closing)
    }

    {
      clean = without_comment($0)
      delta = brace_delta(clean)

      if (capturing) {
        print
        capture_depth += delta
        if (capture_depth <= 0) {
          print "@@END_CADDY_SITE@@"
          capturing = 0
          capture_depth = 0
        }
        next
      }

      if (depth == 0 && index(clean, "{") > 0 && header_has_site(clean)) {
        print "@@BEGIN_CADDY_SITE@@"
        print
        capturing = 1
        capture_depth = delta
        if (capture_depth <= 0) {
          print "@@END_CADDY_SITE@@"
          capturing = 0
          capture_depth = 0
        }
        next
      }

      depth += delta
      if (depth < 0) {
        depth = 0
      }
    }
  ' "${config_file}"
}

site_block_count() {
  local site="$1"
  local blocks

  blocks="$(extract_site_blocks "${site}")"
  if [[ -z "${blocks}" ]]; then
    printf '0'
  else
    printf '%s\n' "${blocks}" | awk '/^@@BEGIN_CADDY_SITE@@$/ { count += 1 } END { print count + 0 }'
  fi
}

site_block_is_satisfied() {
  local site="$1"
  local blocks

  blocks="$(extract_site_blocks "${site}")"

  if [[ "${site}" == "${DOMAIN}" ]]; then
    printf '%s\n' "${blocks}" | awk -v target="${APP_HOST}:${APP_PORT}" '
      {
        line = $0
        sub(/[[:space:]]*#.*/, "", line)
        sub(/^[[:space:]]+/, "", line)
        split(line, fields, /[[:space:]]+/)
        if (fields[1] == "reverse_proxy" && fields[2] == target) {
          found = 1
        }
      }
      END { exit found ? 0 : 1 }
    '
  else
    printf '%s\n' "${blocks}" | awk -v target="https://${DOMAIN}{uri}" '
      {
        line = $0
        sub(/[[:space:]]*#.*/, "", line)
        sub(/^[[:space:]]+/, "", line)
        split(line, fields, /[[:space:]]+/)
        if (fields[1] == "redir" && fields[2] == target && fields[3] == "permanent") {
          found = 1
        }
      }
      END { exit found ? 0 : 1 }
    '
  fi
}

site_header_is_standalone() {
  local site="$1"
  local blocks
  local header
  local header_without_brace
  local normalized
  local labels=()

  blocks="$(extract_site_blocks "${site}")"
  header="$(printf '%s\n' "${blocks}" | awk '/^@@BEGIN_CADDY_SITE@@$/ { getline; print; exit }')"
  header_without_brace="${header%%\{}"
  header_without_brace="${header_without_brace%%#*}"
  header_without_brace="${header_without_brace//,/ }"

  # Caddy site labels do not contain whitespace. Word splitting is deliberate.
  # shellcheck disable=SC2206
  labels=(${header_without_brace})
  if [[ "${#labels[@]}" -ne 1 ]]; then
    return 1
  fi

  normalized="${labels[0]#http://}"
  normalized="${normalized#https://}"
  normalized="${normalized%%:*}"
  [[ "${normalized}" == "${site}" ]]
}

site_block() {
  local site="$1"

  if [[ "${site}" == "${DOMAIN}" ]]; then
    printf '%s {\n\treverse_proxy %s:%s\n}\n' "${DOMAIN}" "${APP_HOST}" "${APP_PORT}"
  else
    printf '%s {\n\tredir https://%s{uri} permanent\n}\n' "${site}" "${DOMAIN}"
  fi
}

append_site_block() {
  local file="$1"
  local site="$2"

  printf '\n' >> "${file}"
  site_block "${site}" >> "${file}"
}

replace_site_block() {
  local input_file="$1"
  local output_file="$2"
  local site="$3"
  local replacement_file="$4"

  awk -v site="${site}" -v replacement_file="${replacement_file}" '
    function without_comment(line) {
      sub(/[[:space:]]*#.*/, "", line)
      return line
    }

    function normalize_site_token(token) {
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", token)
      sub(/^https?:\/\//, "", token)
      sub(/:[0-9]+$/, "", token)
      return token
    }

    function header_has_site(line, header, count, i, token) {
      header = line
      sub(/\{.*/, "", header)
      gsub(/,/, " ", header)
      count = split(header, tokens, /[[:space:]]+/)
      for (i = 1; i <= count; i += 1) {
        token = normalize_site_token(tokens[i])
        if (token == site) {
          return 1
        }
      }
      return 0
    }

    function brace_delta(line, opening, closing) {
      opening = line
      closing = line
      return gsub(/\{/, "", opening) - gsub(/\}/, "", closing)
    }

    function print_replacement(line) {
      while ((getline line < replacement_file) > 0) {
        print line
      }
      close(replacement_file)
    }

    {
      clean = without_comment($0)
      delta = brace_delta(clean)

      if (skipping) {
        skip_depth += delta
        if (skip_depth <= 0) {
          print_replacement()
          skipping = 0
          skip_depth = 0
        }
        next
      }

      if (depth == 0 && index(clean, "{") > 0 && header_has_site(clean)) {
        skipping = 1
        skip_depth = delta
        if (skip_depth <= 0) {
          print_replacement()
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
  ' "${input_file}" > "${output_file}"
}

confirm_overwrite() {
  local sites="$1"
  local answer=""
  local site

  case "${CADDY_OVERWRITE}" in
    1 | yes)
      return 0
      ;;
    0 | no)
      return 1
      ;;
  esac

  echo >&2
  echo "Existing Caddy site definition(s) for ${sites} do not match this app:" >&2
  # shellcheck disable=SC2086
  for site in ${sites}; do
    extract_site_blocks "${site}" >&2
  done
  echo >&2
  printf 'Replace only those standalone site block(s), preserving every other Caddy block? [y/N] ' >&2
  if ! IFS= read -r answer; then
    echo >&2
    echo "No confirmation was received. Re-run with CADDY_OVERWRITE=1 only after reviewing the shown blocks." >&2
    return 1
  fi

  [[ "${answer}" == "y" || "${answer}" == "Y" || "${answer}" == "yes" || "${answer}" == "YES" ]]
}

check_for_external_site_references() {
  local site="$1"
  local config_dir
  local file
  local found=""

  config_dir="$(dirname "${CADDY_CONFIG_FILE}")"
  while IFS= read -r file; do
    if [[ "${file}" == "${CADDY_CONFIG_FILE}" ]]; then
      continue
    fi
    if [[ -n "$(extract_site_blocks "${site}" "${file}")" ]]; then
      found+="${file}"$'\n'
    fi
  done < <(as_root find "${config_dir}" -type f \( -name 'Caddyfile' -o -name '*.caddy' \) -print 2>/dev/null)

  if [[ -n "${found}" ]]; then
    echo "Caddy configuration for ${site} is also present outside ${CADDY_CONFIG_FILE}:" >&2
    printf '%s' "${found}" >&2
    echo "Refusing to guess which imported file owns that site. Review it manually; no Caddy files were changed." >&2
    return 1
  fi
}

ORIGINAL_CONFIG="$(mktemp)"
CANDIDATE_CONFIG="$(mktemp)"
REPLACEMENT_CONFIG="$(mktemp)"
cleanup() {
  rm -f "${ORIGINAL_CONFIG}" "${CANDIDATE_CONFIG}" "${REPLACEMENT_CONFIG}"
}
trap cleanup EXIT

as_root cat "${CADDY_CONFIG_FILE}" > "${ORIGINAL_CONFIG}"
cp "${ORIGINAL_CONFIG}" "${CANDIDATE_CONFIG}"

MANAGED_SITES=("${DOMAIN}")
if [[ -n "${SERVER_ALIASES}" ]]; then
  NORMALIZED_ALIASES="${SERVER_ALIASES//,/ }"
  # shellcheck disable=SC2206
  ALIASES=(${NORMALIZED_ALIASES})
  for alias in "${ALIASES[@]}"; do
    if [[ -n "${alias}" ]]; then
      MANAGED_SITES+=("${alias}")
    fi
  done
fi

for site in "${MANAGED_SITES[@]}"; do
  check_for_external_site_references "${site}"
done

CONFLICTING_SITES=()
CHANGED="0"
for site in "${MANAGED_SITES[@]}"; do
  block_count="$(site_block_count "${site}")"
  if [[ "${block_count}" == "0" ]]; then
    echo "==> Adding missing Caddy site: ${site}"
    append_site_block "${CANDIDATE_CONFIG}" "${site}"
    CHANGED="1"
  elif [[ "${block_count}" == "1" ]] && site_block_is_satisfied "${site}"; then
    echo "==> Existing Caddy site already satisfies this app: ${site}"
  else
    if ! site_header_is_standalone "${site}"; then
      fail "${site} is defined in a combined or duplicate Caddy site block. Refusing to replace it automatically; no Caddy files were changed."
    fi
    CONFLICTING_SITES+=("${site}")
  fi
done

if [[ "${#CONFLICTING_SITES[@]}" -gt 0 ]]; then
  conflict_list="${CONFLICTING_SITES[*]}"
  if ! confirm_overwrite "${conflict_list}"; then
    fail "Caddy configuration was not changed. Set CADDY_OVERWRITE=1 to approve this scoped replacement non-interactively."
  fi

  for site in "${CONFLICTING_SITES[@]}"; do
    echo "==> Replacing confirmed Caddy site: ${site}"
    site_block "${site}" > "${REPLACEMENT_CONFIG}"
    NEXT_CANDIDATE="$(mktemp)"
    replace_site_block "${CANDIDATE_CONFIG}" "${NEXT_CANDIDATE}" "${site}" "${REPLACEMENT_CONFIG}"
    mv "${NEXT_CANDIDATE}" "${CANDIDATE_CONFIG}"
    CHANGED="1"
  done
fi

if [[ "${CHANGED}" != "1" ]]; then
  echo "==> Caddy configuration is already suitable; no file was written and Caddy was not reloaded."
  exit 0
fi

echo "==> Validating candidate Caddy config"
if ! as_root caddy validate --config "${CANDIDATE_CONFIG}" --adapter caddyfile; then
  fail "Candidate Caddy config is invalid. ${CADDY_CONFIG_FILE} was not changed."
fi

CONFIG_MODE="$(as_root stat -c '%a' "${CADDY_CONFIG_FILE}")"
CONFIG_OWNER="$(as_root stat -c '%u' "${CADDY_CONFIG_FILE}")"
CONFIG_GROUP="$(as_root stat -c '%g' "${CADDY_CONFIG_FILE}")"

echo "==> Applying only this app's Caddy site changes"
as_root install -m "${CONFIG_MODE}" -o "${CONFIG_OWNER}" -g "${CONFIG_GROUP}" "${CANDIDATE_CONFIG}" "${CADDY_CONFIG_FILE}"

echo "==> Gracefully reloading Caddy"
if ! as_root systemctl reload "${CADDY_SERVICE_NAME}"; then
  echo "Caddy reload failed; restoring the original config file." >&2
  as_root install -m "${CONFIG_MODE}" -o "${CONFIG_OWNER}" -g "${CONFIG_GROUP}" "${ORIGINAL_CONFIG}" "${CADDY_CONFIG_FILE}"
  echo "Caddy was not restarted. Check its status before making another configuration change." >&2
  exit 1
fi

echo
echo "Caddy site configuration is ready."
echo "Config file: ${CADDY_CONFIG_FILE}"
echo "Proxy target: http://${APP_HOST}:${APP_PORT}"
