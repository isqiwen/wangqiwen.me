#!/usr/bin/env bats

setup() {
  TEST_ROOT="$(mktemp -d)"
  BIN_DIR="${TEST_ROOT}/bin"
  CURL_LOG="${TEST_ROOT}/curl.log"
  REPO_ROOT="$(cd "${BATS_TEST_DIRNAME}/../.." && pwd)"
  CHECK_SCRIPT="${REPO_ROOT}/scripts/vps/check-node-major.sh"

  mkdir -p "${BIN_DIR}"

  write_fake node \
    '#!/bin/bash' \
    'if [[ "${1:-}" == "-v" ]]; then' \
    '  [[ -n "${FAKE_NODE_VERSION:-}" ]] || exit 127' \
    '  printf "%s\\n" "${FAKE_NODE_VERSION}"' \
    'else' \
    '  printf "pnpm@10.33.0\\n"' \
    'fi'
  write_fake curl \
    '#!/bin/bash' \
    'printf "%s\\n" "$*" >> "${CURL_LOG}"'
  write_fake sudo \
    '#!/bin/bash' \
    'exec "$@"'
  for name in apt-get corepack npm pnpm id adduser install systemctl; do
    write_fake "${name}" \
      '#!/bin/bash' \
      'exit 0'
  done
}

teardown() {
  rm -rf "${TEST_ROOT}"
}

write_fake() {
  local name="$1"
  shift
  printf '%s\n' "$@" > "${BIN_DIR}/${name}"
  chmod +x "${BIN_DIR}/${name}"
}

run_provision() {
  run env \
    PATH="${BIN_DIR}:${PATH}" \
    CURL_LOG="${CURL_LOG}" \
    NODE_BIN="${BIN_DIR}/node" \
    APP_NAME="wangqiwen-me" \
    RUN_INSTALL=1 \
    RUN_DEPLOY=0 \
    INSTALL_CADDY=0 \
    "$@" \
    /bin/bash "${REPO_ROOT}/scripts/vps/provision.sh"
}

@test "accepts the expected Node.js major" {
  FAKE_NODE_VERSION="v24.14.1" run /bin/bash "${CHECK_SCRIPT}" 24 "${BIN_DIR}/node"

  [ "${status}" -eq 0 ]
  [[ "${output}" == *"v24.14.1"* ]]
}

@test "rejects another Node.js major and names the installed version" {
  FAKE_NODE_VERSION="v20.19.5" run /bin/bash "${CHECK_SCRIPT}" 24 "${BIN_DIR}/node"

  [ "${status}" -eq 1 ]
  [[ "${output}" == *"Node.js 24 is required"* ]]
  [[ "${output}" == *"v20.19.5"* ]]
}

@test "rejects a missing Node.js binary and an invalid expected major" {
  run /bin/bash "${CHECK_SCRIPT}" 24 "${TEST_ROOT}/missing-node"
  [ "${status}" -eq 1 ]
  [[ "${output}" == *"could not be run"* ]]

  run /bin/bash "${CHECK_SCRIPT}" latest "${BIN_DIR}/node"
  [ "${status}" -eq 2 ]
}

@test "server setup installs Node.js 24 unless another major is requested" {
  run_provision FAKE_NODE_VERSION="v24.14.1"

  [ "${status}" -eq 0 ]
  grep -Fq "https://deb.nodesource.com/setup_24.x" "${CURL_LOG}"
  ! grep -Fq "setup_20.x" "${CURL_LOG}"

  : > "${CURL_LOG}"
  run_provision FAKE_NODE_VERSION="v22.11.0" NODE_MAJOR=22

  [ "${status}" -eq 0 ]
  grep -Fq "https://deb.nodesource.com/setup_22.x" "${CURL_LOG}"
}

@test "server setup fails when the host keeps another Node.js major" {
  run_provision FAKE_NODE_VERSION="v20.19.5"

  [ "${status}" -ne 0 ]
  [[ "${output}" == *"Node.js 24 is required"* ]]
  [[ "${output}" == *"did not leave Node.js 24.x"* ]]
}
