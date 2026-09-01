#!/usr/bin/env bats

setup() {
  TEST_ROOT="$(mktemp -d)"
  BIN_DIR="${TEST_ROOT}/bin"
  ARTIFACT_DIR="${TEST_ROOT}/artifacts"
  ENV_FILE="${TEST_ROOT}/.env.production"
  DEPLOY_CONFIG="${TEST_ROOT}/deploy.env"
  SSH_LOG="${TEST_ROOT}/ssh.log"
  SCP_LOG="${TEST_ROOT}/scp.log"
  REPO_ROOT="$(cd "${BATS_TEST_DIRNAME}/../.." && pwd)"
  REMOTE_TMP="/tmp/deploy-private-test"
  REMOTE_WORK_DIR="${REMOTE_TMP}/wangqiwen-me-deploy-testrev-20260101000000.abcdef"

  mkdir -p "${BIN_DIR}" "${ARTIFACT_DIR}"
  printf 'SECRET=value\n' > "${ENV_FILE}"
  chmod 0644 "${ENV_FILE}"

  printf '%s\n' \
    'DEPLOY_HOST="root@example.test"' \
    'APP_NAME="wangqiwen-me"' \
    'SERVICE_USER="nextjs"' \
    'DOMAIN="wangqiwen.me"' \
    'SERVER_ALIASES="www.wangqiwen.me"' \
    'APP_HOST="127.0.0.1"' \
    'APP_PORT="3000"' > "${DEPLOY_CONFIG}"

  write_fake git \
    '#!/bin/bash' \
    'if [[ "$*" == *"rev-parse --short HEAD"* ]]; then printf "testrev\\n"; fi'
  write_fake pnpm \
    '#!/bin/bash' \
    'exit 0'
  write_fake node \
    '#!/bin/bash' \
    'exit 0'
  write_fake date \
    '#!/bin/bash' \
    'printf "20260101000000\\n"'
  write_fake uname \
    '#!/bin/bash' \
    'case "${1:-}" in' \
    '  -s) printf "Linux\\n" ;;' \
    '  -m) printf "x86_64\\n" ;;' \
    '  *) /usr/bin/uname "$@" ;;' \
    'esac'
  write_fake bash \
    '#!/bin/bash' \
    'if [[ "${1:-}" == "${REPO_ROOT}/scripts/vps/build-artifact.sh" ]]; then' \
    '  mkdir -p "${ARTIFACT_DIR}"' \
    '  : > "${ARTIFACT_DIR}/${ARTIFACT_NAME}"' \
    '  exit 0' \
    'fi' \
    'exec /bin/bash "$@"'
  write_fake tar \
    '#!/bin/bash' \
    'exit 0'
  write_fake scp \
    '#!/bin/bash' \
    'printf "%s\\n" "$*" >> "${SCP_LOG}"'
  write_fake ssh \
    '#!/bin/bash' \
    'set -euo pipefail' \
    'printf "%s\\n" "$*" >> "${SSH_LOG}"' \
    'last="${!#}"' \
    'case "${last}" in' \
    '  "uname -m") printf "x86_64\\n" ;;' \
    '  *"mktemp -d"*) printf "%s\\n" "${FAKE_REMOTE_WORK_DIR}" ;;' \
    '  *"tar -xzf - -C"*) cat >/dev/null ;;' \
    'esac'
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

@test "uploads secrets only into a private unique remote work directory" {
  run env \
    PATH="${BIN_DIR}:${PATH}" \
    REPO_ROOT="${REPO_ROOT}" \
    ARTIFACT_DIR="${ARTIFACT_DIR}" \
    ARTIFACT_NAME="release.tar.gz" \
    DEPLOY_CONFIG="${DEPLOY_CONFIG}" \
    ENV_FILE="${ENV_FILE}" \
    UPLOAD_ENV=1 \
    REMOTE_TMP="${REMOTE_TMP}" \
    FAKE_REMOTE_WORK_DIR="${REMOTE_WORK_DIR}" \
    SSH_LOG="${SSH_LOG}" \
    SCP_LOG="${SCP_LOG}" \
    SSH_CONTROL=0 \
    /bin/bash "${REPO_ROOT}/scripts/vps/deploy.sh"

  [ "${status}" -eq 0 ]
  grep -Fq "umask 077 && mktemp -d '${REMOTE_TMP}/wangqiwen-me-deploy-testrev-20260101000000.XXXXXX'" "${SSH_LOG}"
  grep -Fqx "root@example.test chmod 700 '${REMOTE_WORK_DIR}'" "${SSH_LOG}"
  grep -Fqx "root@example.test chmod 600 '${REMOTE_WORK_DIR}/prod.env'" "${SSH_LOG}"
  grep -Fqx "${ARTIFACT_DIR}/release.tar.gz root@example.test:${REMOTE_WORK_DIR}/release.tar.gz" "${SCP_LOG}"
  grep -Fqx "${ENV_FILE} root@example.test:${REMOTE_WORK_DIR}/prod.env" "${SCP_LOG}"
  grep -Fq "COREPACK_NPM_REGISTRY='https://registry.npmmirror.com'" "${SSH_LOG}"
  ! grep -Fq '/tmp/prod.env' "${SCP_LOG}"
  grep -Fq "rm -rf '${REMOTE_WORK_DIR}'" "${SSH_LOG}"
}
