#!/usr/bin/env bats

setup() {
  TEST_ROOT="$(mktemp -d)"
  CONFIG_DIR="${TEST_ROOT}/caddy"
  BIN_DIR="${TEST_ROOT}/bin"
  CADDYFILE="${CONFIG_DIR}/Caddyfile"

  mkdir -p "${CONFIG_DIR}" "${BIN_DIR}"

  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'printf "%s\\n" "$*" >> "${TEST_ROOT}/caddy.log"' \
    'if [[ "${1:-}" == "validate" && "${FAKE_CADDY_VALIDATE_EXIT:-0}" != "0" ]]; then' \
    '  exit "${FAKE_CADDY_VALIDATE_EXIT}"' \
    'fi' > "${BIN_DIR}/caddy"
  chmod +x "${BIN_DIR}/caddy"

  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'printf "%s\\n" "$*" >> "${TEST_ROOT}/systemctl.log"' > "${BIN_DIR}/systemctl"
  chmod +x "${BIN_DIR}/systemctl"

  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'exec "$@"' > "${BIN_DIR}/sudo"
  chmod +x "${BIN_DIR}/sudo"
}

teardown() {
  rm -rf "${TEST_ROOT}"
}

run_configure() {
  local overwrite="${1:-ask}"
  local confirmation="${2:-}"
  local script_path="${BATS_TEST_DIRNAME}/../../scripts/vps/configure-caddy.sh"

  if [[ -n "${confirmation}" ]]; then
    run bash -c '
      printf "%s\\n" "$1" | env \
        TEST_ROOT="$2" \
        PATH="$3" \
        CADDY_CONFIG_FILE="$4" \
        DOMAIN="wangqiwen.me" \
        SERVER_ALIASES="www.wangqiwen.me" \
        APP_HOST="127.0.0.1" \
        APP_PORT="3000" \
        CADDY_OVERWRITE="$5" \
        bash "$6"
    ' bash "${confirmation}" "${TEST_ROOT}" "${BIN_DIR}:${PATH}" "${CADDYFILE}" "${overwrite}" "${script_path}"
    return
  fi

  run env \
    TEST_ROOT="${TEST_ROOT}" \
    PATH="${BIN_DIR}:${PATH}" \
    CADDY_CONFIG_FILE="${CADDYFILE}" \
    DOMAIN="wangqiwen.me" \
    SERVER_ALIASES="www.wangqiwen.me" \
    APP_HOST="127.0.0.1" \
    APP_PORT="3000" \
    CADDY_OVERWRITE="${overwrite}" \
    bash "${script_path}"
}

@test "matching app sites leave unrelated Caddy blocks and service untouched" {
  printf '%s\n' \
    'files.wangqiwen.me {' \
    '    reverse_proxy 127.0.0.1:61080' \
    '}' \
    '' \
    'frp.wangqiwen.me {' \
    '    reverse_proxy 127.0.0.1:7500' \
    '}' \
    '' \
    'wangqiwen.me {' \
    '    reverse_proxy 127.0.0.1:3000' \
    '}' \
    '' \
    'www.wangqiwen.me {' \
    '    redir https://wangqiwen.me{uri} permanent' \
    '}' > "${CADDYFILE}"
  cp "${CADDYFILE}" "${TEST_ROOT}/before"

  run_configure

  [ "${status}" -eq 0 ]
  cmp "${TEST_ROOT}/before" "${CADDYFILE}"
  [ ! -e "${TEST_ROOT}/systemctl.log" ]
  [[ "${output}" == *"no file was written"* ]]
}

@test "missing app sites are appended while unrelated Caddy blocks are preserved" {
  printf '%s\n' \
    'files.wangqiwen.me {' \
    '    reverse_proxy 127.0.0.1:61080' \
    '}' \
    '' \
    'frp.wangqiwen.me {' \
    '    reverse_proxy 127.0.0.1:7500' \
    '}' > "${CADDYFILE}"

  run_configure

  [ "${status}" -eq 0 ]
  grep -Eq '^[[:space:]]+reverse_proxy 127\.0\.0\.1:61080$' "${CADDYFILE}"
  grep -Eq '^[[:space:]]+reverse_proxy 127\.0\.0\.1:7500$' "${CADDYFILE}"
  grep -Fqx 'wangqiwen.me {' "${CADDYFILE}"
  grep -Eq '^[[:space:]]+reverse_proxy 127\.0\.0\.1:3000$' "${CADDYFILE}"
  grep -Fqx 'www.wangqiwen.me {' "${CADDYFILE}"
  grep -Eq '^[[:space:]]+redir https://wangqiwen\.me\{uri\} permanent$' "${CADDYFILE}"
  grep -Fqx 'reload caddy' "${TEST_ROOT}/systemctl.log"
}

@test "a conflicting site remains untouched when replacement is declined" {
  printf '%s\n' \
    'files.wangqiwen.me {' \
    '    reverse_proxy 127.0.0.1:61080' \
    '}' \
    '' \
    'wangqiwen.me {' \
    '    reverse_proxy 127.0.0.1:4000' \
    '}' \
    '' \
    'www.wangqiwen.me {' \
    '    redir https://wangqiwen.me{uri} permanent' \
    '}' > "${CADDYFILE}"
  cp "${CADDYFILE}" "${TEST_ROOT}/before"

  run_configure 0

  [ "${status}" -ne 0 ]
  cmp "${TEST_ROOT}/before" "${CADDYFILE}"
  [ ! -e "${TEST_ROOT}/systemctl.log" ]
}

@test "an approved scoped replacement preserves unrelated sites" {
  printf '%s\n' \
    'files.wangqiwen.me {' \
    '    reverse_proxy 127.0.0.1:61080' \
    '}' \
    '' \
    'frp.wangqiwen.me {' \
    '    reverse_proxy 127.0.0.1:7500' \
    '}' \
    '' \
    'wangqiwen.me {' \
    '    reverse_proxy 127.0.0.1:4000' \
    '}' \
    '' \
    'www.wangqiwen.me {' \
    '    redir https://wangqiwen.me{uri} permanent' \
    '}' > "${CADDYFILE}"

  run_configure 1

  [ "${status}" -eq 0 ]
  grep -Eq '^[[:space:]]+reverse_proxy 127\.0\.0\.1:61080$' "${CADDYFILE}"
  grep -Eq '^[[:space:]]+reverse_proxy 127\.0\.0\.1:7500$' "${CADDYFILE}"
  grep -Eq '^[[:space:]]+reverse_proxy 127\.0\.0\.1:3000$' "${CADDYFILE}"
  ! grep -Fq '127.0.0.1:4000' "${CADDYFILE}"
  grep -Eq '^[[:space:]]+redir https://wangqiwen\.me\{uri\} permanent$' "${CADDYFILE}"
  grep -Fqx 'reload caddy' "${TEST_ROOT}/systemctl.log"
}

@test "a conflicting standalone site asks and accepts an interactive confirmation" {
  printf '%s\n' \
    'files.wangqiwen.me {' \
    '    reverse_proxy 127.0.0.1:61080' \
    '}' \
    '' \
    'wangqiwen.me {' \
    '    reverse_proxy 127.0.0.1:4000' \
    '}' \
    '' \
    'www.wangqiwen.me {' \
    '    redir https://wangqiwen.me{uri} permanent' \
    '}' > "${CADDYFILE}"

  run_configure ask y

  [ "${status}" -eq 0 ]
  [[ "${output}" == *"Replace only those standalone site block"* ]]
  grep -Eq '^[[:space:]]+reverse_proxy 127\.0\.0\.1:3000$' "${CADDYFILE}"
  ! grep -Fq '127.0.0.1:4000' "${CADDYFILE}"
}

@test "invalid candidate configuration leaves the live Caddyfile unchanged" {
  printf '%s\n' \
    'files.wangqiwen.me {' \
    '    reverse_proxy 127.0.0.1:61080' \
    '}' > "${CADDYFILE}"
  cp "${CADDYFILE}" "${TEST_ROOT}/before"

  FAKE_CADDY_VALIDATE_EXIT=1 run_configure

  [ "${status}" -ne 0 ]
  cmp "${TEST_ROOT}/before" "${CADDYFILE}"
  [ ! -e "${TEST_ROOT}/systemctl.log" ]
}
