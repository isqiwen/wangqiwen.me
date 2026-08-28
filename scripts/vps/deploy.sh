#!/usr/bin/env bash
set -euo pipefail

# Build locally, upload the artifact, and deploy it to the VPS.
#
# Normal release:
#   pnpm deploy:vps
#
# First VPS setup with env upload:
#   UPLOAD_ENV=1 SETUP_SERVER=1 pnpm deploy:vps
#
# Common env vars:
#   DEPLOY_HOST=user@example.com
#   ENV_FILE=.env.production
#   UPLOAD_ENV=0
#   SETUP_SERVER=0
#   INSTALL_CADDY=1  # during SETUP_SERVER=1; use 0 to skip on a fresh host
#   RUN_SITE_CONFIG=0
#   CADDY_OVERWRITE=ask
#   ALLOW_NON_LINUX_BUILD=0
#   DOCKER_IMAGE=node:20-bookworm-slim
#   SKIP_REMOTE_PLATFORM_CHECK=0
#   SKIP_REMOTE_SUDO_CHECK=0
#   SSH_CONTROL=1
#   CLEAN_REMOTE_ON_EXIT=1
#
# Before any SSH connection, deploys install locked dependencies and run:
#   pnpm test
#   pnpm check

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_CONFIG="${DEPLOY_CONFIG:-${ROOT_DIR}/deploy.env}"

if [[ "${DEPLOY_CONFIG}" != /* ]]; then
  DEPLOY_CONFIG="${ROOT_DIR}/${DEPLOY_CONFIG}"
fi

# Keep explicit command-line environment variables above tracked config values.
load_deploy_config() {
  local config_file="$1"
  local configurable_vars=(
    DEPLOY_HOST
    APP_NAME
    SERVICE_USER
    DOMAIN
    SERVER_ALIASES
    APP_HOST
    APP_PORT
    RUN_INSTALL
    INSTALL_CADDY
    RUN_SITE_CONFIG
    CADDY_OVERWRITE
  )
  local override_names=()
  local override_values=()
  local name
  local index

  if [[ ! -f "${config_file}" ]]; then
    echo "Deployment config not found: ${config_file}" >&2
    exit 1
  fi

  for name in "${configurable_vars[@]}"; do
    # Bash 3.2 (the macOS system Bash) has no `[[ -v var ]]` test.
    if [[ -n "${!name+x}" ]]; then
      override_names+=("${name}")
      override_values+=("${!name}")
    fi
  done

  # deploy.env is a trusted, tracked shell configuration file.
  # shellcheck disable=SC1090
  source "${config_file}"

  for index in "${!override_names[@]}"; do
    printf -v "${override_names[$index]}" "%s" "${override_values[$index]}"
  done
}

load_deploy_config "${DEPLOY_CONFIG}"

APP_NAME="${APP_NAME:-}"
SERVICE_USER="${SERVICE_USER:-nextjs}"
SERVICE_HOME="${SERVICE_HOME:-/srv/${SERVICE_USER}}"
DEPLOY_HOST="${DEPLOY_HOST:-}"
DOMAIN="${DOMAIN:-}"
SERVER_ALIASES="${SERVER_ALIASES:-}"
APP_HOST="${APP_HOST:-127.0.0.1}"
APP_PORT="${APP_PORT:-3000}"

DEFAULT_ENV_FILE="${ROOT_DIR}/.env.production"
ENV_FILE="${ENV_FILE:-${DEFAULT_ENV_FILE}}"
UPLOAD_ENV="${UPLOAD_ENV:-0}"
SETUP_SERVER="${SETUP_SERVER:-0}"
RUN_INSTALL="${RUN_INSTALL:-${SETUP_SERVER}}"
RUN_SITE_CONFIG="${RUN_SITE_CONFIG:-${SETUP_SERVER}}"
INSTALL_CADDY="${INSTALL_CADDY:-${SETUP_SERVER}}"
CADDY_OVERWRITE="${CADDY_OVERWRITE:-ask}"
ALLOW_DIRTY="${ALLOW_DIRTY:-0}"
ALLOW_NON_LINUX_BUILD="${ALLOW_NON_LINUX_BUILD:-0}"
DOCKER_IMAGE="${DOCKER_IMAGE:-node:20-bookworm-slim}"
SKIP_REMOTE_PLATFORM_CHECK="${SKIP_REMOTE_PLATFORM_CHECK:-0}"
SKIP_REMOTE_SUDO_CHECK="${SKIP_REMOTE_SUDO_CHECK:-0}"
SSH_CONTROL="${SSH_CONTROL:-1}"
CLEAN_REMOTE_ON_EXIT="${CLEAN_REMOTE_ON_EXIT:-1}"

REMOTE_TMP="${REMOTE_TMP:-/tmp}"
REMOTE_TMP="${REMOTE_TMP%/}"
if [[ -z "${REMOTE_TMP}" || "${REMOTE_TMP}" == "/" || "${REMOTE_TMP}" != /* ]]; then
  echo "REMOTE_TMP must be an absolute directory other than /, got: ${REMOTE_TMP:-/}" >&2
  exit 1
fi
ARTIFACT_DIR="${ARTIFACT_DIR:-${ROOT_DIR}/dist}"
if [[ "${ARTIFACT_DIR}" != /* ]]; then
  ARTIFACT_DIR="${ROOT_DIR}/${ARTIFACT_DIR}"
fi
REVISION="$(git -C "${ROOT_DIR}" rev-parse --short HEAD 2>/dev/null || date -u +%Y%m%d%H%M%S)"
STAMP="$(date -u +%Y%m%d%H%M%S)"
ARTIFACT_NAME="${ARTIFACT_NAME:-nextjs-standalone-${REVISION}-${STAMP}.tar.gz}"
ARTIFACT_PATH="${ARTIFACT_DIR}/${ARTIFACT_NAME}"
REMOTE_WORK_DIR_TEMPLATE="${REMOTE_TMP}/${APP_NAME}-deploy-${REVISION}-${STAMP}.XXXXXX"
REMOTE_WORK_DIR=""
REMOTE_ARTIFACT=""
REMOTE_ENV=""
REMOTE_INCOMING_ARTIFACT="${SERVICE_HOME}/shared/incoming/${ARTIFACT_NAME}"
# macOS's per-user TMPDIR is long enough to exceed SSH's Unix-socket limit.
SSH_CONTROL_PATH="${SSH_CONTROL_PATH:-/tmp/${APP_NAME}-ssh-${REVISION}-${STAMP}.sock}"
CLEANUP_ARMED="0"

usage() {
  cat <<'EOF'
Deploy the site to the Ubuntu VPS.

Normal release:
  pnpm deploy:vps

First setup with env upload:
  UPLOAD_ENV=1 SETUP_SERVER=1 pnpm deploy:vps

First setup adds only missing wangqiwen.me Caddy blocks. If a conflicting site
block exists, the deployment asks before replacing that block.

Useful env vars:
  DEPLOY_CONFIG=deploy.env          Deployment config file
  DEPLOY_HOST=user@example.com      Override the configured SSH target
  ENV_FILE=.env.production          Production env file to upload when UPLOAD_ENV=1
  UPLOAD_ENV=1                      Upload ENV_FILE as the server's .env.local
  INSTALL_CADDY=0                   Skip Caddy installation on a fresh server
  RUN_SITE_CONFIG=0                 Leave Caddy configuration untouched
  CADDY_OVERWRITE=1                 Approve a scoped conflicting-site replacement
  ALLOW_DIRTY=1                     Build from an uncommitted working tree
  DOCKER_IMAGE=node:20-bookworm-slim Linux image for automatic non-Linux builds
  ALLOW_NON_LINUX_BUILD=1           Allow an unsafe local non-Linux build
  SKIP_REMOTE_PLATFORM_CHECK=1      Skip local/VPS architecture comparison
  SKIP_REMOTE_SUDO_CHECK=1          Skip passwordless sudo preflight
  SSH_CONTROL=0                     Disable SSH connection reuse
  CLEAN_REMOTE_ON_EXIT=0            Keep private temp files; avoid with UPLOAD_ENV=1
EOF
}

remote_quote() {
  local value="$1"

  printf "'"
  while [[ "${value}" == *"'"* ]]; do
    printf "%s" "${value%%\'*}"
    printf "%s" "'\\''"
    value="${value#*\'}"
  done
  printf "%s'" "${value}"
}

append_remote_env() {
  local name="$1"
  local value="$2"
  local quoted_value

  quoted_value="$(remote_quote "${value}")"
  REMOTE_CMD="${REMOTE_CMD} ${name}=${quoted_value}"
}

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1" >&2
    exit 1
  fi
}

normalize_architecture() {
  case "$1" in
    x86_64 | amd64)
      printf "amd64"
      ;;
    aarch64 | arm64)
      printf "arm64"
      ;;
    *)
      printf "%s" "$1"
      ;;
  esac
}

build_artifact_with_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required to build a Linux VPS artifact from $(uname -s)." >&2
    echo "Install and start Docker, or build on matching Linux hardware." >&2
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    echo "Docker is installed but its daemon is unavailable. Start Docker and retry." >&2
    exit 1
  fi

  echo "==> Building Linux artifact with Docker (${DOCKER_PLATFORM})"
  mkdir -p "${ARTIFACT_DIR}"
  docker run --rm \
    --platform "${DOCKER_PLATFORM}" \
    --volume "${ROOT_DIR}:/workspace" \
    --volume "${ARTIFACT_DIR}:/artifacts" \
    --workdir /workspace \
    --env ARTIFACT_DIR=/artifacts \
    --env ARTIFACT_NAME="${ARTIFACT_NAME}" \
    --env RUN_LINT_POSTS=0 \
    "${DOCKER_IMAGE}" \
    bash scripts/vps/build-artifact.sh
}

ssh_options() {
  if [[ "${SSH_CONTROL}" == "1" ]]; then
    printf "%s\n" \
      -o ControlMaster=auto \
      -o ControlPersist=10m \
      -o "ControlPath=${SSH_CONTROL_PATH}"
  fi
}

ssh_cmd() {
  local options=()
  while IFS= read -r option; do
    options+=("${option}")
  done < <(ssh_options)

  # shellcheck disable=SC2029
  ssh "${options[@]}" "$@"
}

scp_cmd() {
  local options=()
  while IFS= read -r option; do
    options+=("${option}")
  done < <(ssh_options)

  scp "${options[@]}" "$@"
}

start_ssh_control() {
  if [[ "${SSH_CONTROL}" != "1" ]]; then
    return
  fi

  echo "==> Opening shared SSH connection"
  ssh_cmd -Nf "${DEPLOY_HOST}"
}

close_ssh_control() {
  if [[ "${SSH_CONTROL}" != "1" ]]; then
    return
  fi

  ssh_cmd -O exit "${DEPLOY_HOST}" >/dev/null 2>&1 || true
  rm -f "${SSH_CONTROL_PATH}" || true
}

cleanup_remote() {
  if [[ "${CLEAN_REMOTE_ON_EXIT}" != "1" || "${CLEANUP_ARMED}" != "1" ]]; then
    return
  fi

  local cleanup_cmd
  cleanup_cmd="rm -rf $(remote_quote "${REMOTE_WORK_DIR}")"
  if is_root_ssh_user; then
    cleanup_cmd+="; rm -f $(remote_quote "${REMOTE_INCOMING_ARTIFACT}")"
  else
    cleanup_cmd+="; sudo rm -f $(remote_quote "${REMOTE_INCOMING_ARTIFACT}")"
  fi

  echo "==> Cleaning remote temporary files"
  # shellcheck disable=SC2029
  ssh_cmd "${DEPLOY_HOST}" "${cleanup_cmd}" >/dev/null 2>&1 || true
}

remote_ssh_user() {
  if [[ "${DEPLOY_HOST}" == *@* ]]; then
    printf "%s" "${DEPLOY_HOST%%@*}"
  else
    printf "%s" "${USER:-your-ssh-user}"
  fi
}

is_root_ssh_user() {
  [[ "$(remote_ssh_user)" == "root" ]]
}

remote_env_prefix() {
  if is_root_ssh_user; then
    printf 'env'
  else
    printf 'sudo env'
  fi
}

check_remote_sudo() {
  local ssh_user
  ssh_user="$(remote_ssh_user)"

  if [[ "${ssh_user}" == "root" ]]; then
    echo "==> SSH user is root; no sudo preflight is needed"
    return
  fi

  echo "==> Checking passwordless sudo on ${DEPLOY_HOST}"
  if ssh_cmd "${DEPLOY_HOST}" "sudo -n true" >/dev/null 2>&1; then
    echo "==> Passwordless sudo is ready"
    return
  fi

  cat >&2 <<EOF
Passwordless sudo is required before deploying.

The SSH user must pass this check:

  ssh ${DEPLOY_HOST} 'sudo -n true'

On the VPS, configure it with:

  sudo visudo -f /etc/sudoers.d/${APP_NAME}-deploy

Then add:

  ${ssh_user} ALL=(root) NOPASSWD: ALL

Set SKIP_REMOTE_SUDO_CHECK=1 only if you know the remote sudo command will work.
EOF
  exit 1
}

run_pre_deploy_checks() {
  cd "${ROOT_DIR}"

  echo "==> Installing dependencies for pre-deploy checks"
  pnpm install --frozen-lockfile

  echo "==> Running unit tests"
  pnpm test

  echo "==> Running project checks"
  pnpm check
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

need_cmd git
need_cmd ssh
need_cmd scp
need_cmd tar
need_cmd node
need_cmd pnpm

if [[ -z "${DEPLOY_HOST}" ]]; then
  echo "DEPLOY_HOST is required in ${DEPLOY_CONFIG} or the command environment." >&2
  exit 1
fi

if [[ -z "${APP_NAME}" ]]; then
  echo "APP_NAME is required in ${DEPLOY_CONFIG} or the command environment." >&2
  exit 1
fi

if [[ -z "${DOMAIN}" ]]; then
  echo "DOMAIN is required in ${DEPLOY_CONFIG} or the command environment." >&2
  exit 1
fi

if [[ "${ALLOW_DIRTY}" != "1" ]]; then
  if ! git -C "${ROOT_DIR}" diff --quiet || ! git -C "${ROOT_DIR}" diff --cached --quiet; then
    echo "Working tree has uncommitted changes. Commit them first or set ALLOW_DIRTY=1." >&2
    exit 1
  fi
fi

run_pre_deploy_checks

trap close_ssh_control EXIT
start_ssh_control

LOCAL_UNAME_S="$(uname -s)"
LOCAL_UNAME_M="$(uname -m)"
LOCAL_ARCH="$(normalize_architecture "${LOCAL_UNAME_M}")"
REMOTE_UNAME_M=""
REMOTE_ARCH=""
BUILD_WITH_DOCKER="0"

if [[ "${SKIP_REMOTE_PLATFORM_CHECK}" != "1" || ( "${LOCAL_UNAME_S}" != "Linux" && "${ALLOW_NON_LINUX_BUILD}" != "1" ) ]]; then
  echo "==> Checking target platform"
  # shellcheck disable=SC2029
  REMOTE_UNAME_M="$(ssh_cmd "${DEPLOY_HOST}" "uname -m" | tr -d '\r')"
  REMOTE_ARCH="$(normalize_architecture "${REMOTE_UNAME_M}")"
  if [[ "${SKIP_REMOTE_PLATFORM_CHECK}" != "1" && "${LOCAL_UNAME_S}" == "Linux" && -n "${REMOTE_UNAME_M}" && "${REMOTE_ARCH}" != "${LOCAL_ARCH}" ]]; then
    echo "Build host architecture (${LOCAL_UNAME_M}) does not match VPS (${REMOTE_UNAME_M})." >&2
    echo "Build the artifact on matching Linux hardware or set SKIP_REMOTE_PLATFORM_CHECK=1." >&2
    exit 1
  fi
fi

if [[ "${LOCAL_UNAME_S}" != "Linux" && "${ALLOW_NON_LINUX_BUILD}" != "1" ]]; then
  if [[ -z "${REMOTE_ARCH}" ]]; then
    echo "The VPS architecture is needed for a Docker build." >&2
    echo "Leave SKIP_REMOTE_PLATFORM_CHECK unset, or build on matching Linux hardware." >&2
    exit 1
  fi

  case "${REMOTE_ARCH}" in
    amd64 | arm64)
      DOCKER_PLATFORM="linux/${REMOTE_ARCH}"
      BUILD_WITH_DOCKER="1"
      ;;
    *)
      echo "Unsupported VPS architecture for Docker build: ${REMOTE_UNAME_M}" >&2
      echo "Build the artifact on matching Linux hardware." >&2
      exit 1
      ;;
  esac
fi

if [[ "${SKIP_REMOTE_SUDO_CHECK}" != "1" ]]; then
  check_remote_sudo
fi

if [[ "${UPLOAD_ENV}" == "1" && ! -f "${ENV_FILE}" ]]; then
  echo "Production env file not found: ${ENV_FILE}" >&2
  if [[ "${ENV_FILE}" == "${DEFAULT_ENV_FILE}" ]]; then
    echo "Create it with: cp .env.example .env.production" >&2
  else
    printf 'Create it with: cp %q %q\n' "${ROOT_DIR}/.env.example" "${ENV_FILE}" >&2
  fi
  echo "Or leave UPLOAD_ENV=0 to keep the server env file." >&2
  exit 1
fi

echo "==> Deploying ${APP_NAME} to ${DEPLOY_HOST}"
echo "    config: ${DEPLOY_CONFIG}"
echo "    revision: ${REVISION}"
echo "    setup server: ${SETUP_SERVER}"
echo "    install Caddy: ${INSTALL_CADDY}"
echo "    configure site: ${RUN_SITE_CONFIG}"

if [[ "${BUILD_WITH_DOCKER}" == "1" ]]; then
  build_artifact_with_docker
else
  ARTIFACT_DIR="${ARTIFACT_DIR}" \
  ARTIFACT_NAME="${ARTIFACT_NAME}" \
  RUN_LINT_POSTS=0 \
    bash "${ROOT_DIR}/scripts/vps/build-artifact.sh"
fi

if [[ ! -f "${ARTIFACT_PATH}" ]]; then
  echo "Artifact was not created: ${ARTIFACT_PATH}" >&2
  exit 1
fi

echo "==> Preparing remote work directory"
REMOTE_WORK_DIR="$(
  ssh_cmd "${DEPLOY_HOST}" "umask 077 && mktemp -d $(remote_quote "${REMOTE_WORK_DIR_TEMPLATE}")" | tr -d '\r'
)"
case "${REMOTE_WORK_DIR}" in
  "${REMOTE_TMP}"/*) ;;
  *)
    echo "Remote work directory is outside REMOTE_TMP: ${REMOTE_WORK_DIR:-<empty>}" >&2
    exit 1
    ;;
esac
REMOTE_ARTIFACT="${REMOTE_WORK_DIR}/${ARTIFACT_NAME}"
REMOTE_ENV="${REMOTE_WORK_DIR}/prod.env"
REMOTE_MKDIR_CMD="chmod 700 $(remote_quote "${REMOTE_WORK_DIR}")"
# shellcheck disable=SC2029
ssh_cmd "${DEPLOY_HOST}" "${REMOTE_MKDIR_CMD}"
CLEANUP_ARMED="1"
trap 'cleanup_remote; close_ssh_control' EXIT

echo "==> Uploading deploy scripts"
REMOTE_UNPACK_CMD="tar -xzf - -C $(remote_quote "${REMOTE_WORK_DIR}")"
# shellcheck disable=SC2029
tar --no-xattrs -C "${ROOT_DIR}" -czf - scripts package.json |
  ssh_cmd "${DEPLOY_HOST}" "${REMOTE_UNPACK_CMD}"

echo "==> Uploading artifact"
scp_cmd "${ARTIFACT_PATH}" "${DEPLOY_HOST}:${REMOTE_ARTIFACT}"

if [[ "${UPLOAD_ENV}" == "1" ]]; then
  echo "==> Uploading production env"
  scp_cmd "${ENV_FILE}" "${DEPLOY_HOST}:${REMOTE_ENV}"
  # The work directory is 0700; set the file mode explicitly as well so the
  # secret remains private even if SCP preserves a broader local source mode.
  ssh_cmd "${DEPLOY_HOST}" "chmod 600 $(remote_quote "${REMOTE_ENV}")"
fi

REMOTE_CMD="$(remote_env_prefix)"
append_remote_env APP_NAME "${APP_NAME}"
append_remote_env SERVICE_USER "${SERVICE_USER}"
append_remote_env SERVICE_HOME "${SERVICE_HOME}"
append_remote_env DOMAIN "${DOMAIN}"
append_remote_env SERVER_ALIASES "${SERVER_ALIASES}"
append_remote_env APP_HOST "${APP_HOST}"
append_remote_env APP_PORT "${APP_PORT}"
append_remote_env RUN_INSTALL "${RUN_INSTALL}"
append_remote_env INSTALL_CADDY "${INSTALL_CADDY}"
REMOTE_CMD="${REMOTE_CMD} RUN_DEPLOY=1"
append_remote_env RUN_SITE_CONFIG "${RUN_SITE_CONFIG}"
append_remote_env CADDY_OVERWRITE "${CADDY_OVERWRITE}"
append_remote_env ARTIFACT_TARBALL "${REMOTE_ARTIFACT}"
if [[ "${UPLOAD_ENV}" == "1" ]]; then
  append_remote_env ENV_FILE_PATH "${REMOTE_ENV}"
fi
REMOTE_CMD="${REMOTE_CMD} bash $(remote_quote "${REMOTE_WORK_DIR}/scripts/vps/provision.sh")"

echo "==> Running remote deployment"
# shellcheck disable=SC2029
ssh_cmd "${DEPLOY_HOST}" "${REMOTE_CMD}"

echo
echo "==> VPS deploy complete"
echo "Check: https://${DOMAIN}"
if is_root_ssh_user; then
  echo "Logs:  ssh ${DEPLOY_HOST} 'journalctl -u ${APP_NAME} -n 100 --no-pager'"
else
  echo "Logs:  ssh ${DEPLOY_HOST} 'sudo journalctl -u ${APP_NAME} -n 100 --no-pager'"
fi
