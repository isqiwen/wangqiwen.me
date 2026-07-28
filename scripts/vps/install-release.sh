#!/usr/bin/env bash
set -euo pipefail

# Install a prebuilt standalone release on the VPS.
#
# Usage:
#   ARTIFACT_TARBALL=dist/nextjs-standalone-xxxx.tar.gz ./scripts/vps/install-release.sh
#
# The artifact must contain Next.js standalone output with server.js at root.

APP_NAME="${APP_NAME:-wangqiwen-me}"
SYSTEMD_SERVICE_NAME="${SYSTEMD_SERVICE_NAME:-${APP_NAME}}"
SERVICE_USER="${SERVICE_USER:-nextjs}"
SERVICE_HOME="${SERVICE_HOME:-/srv/${SERVICE_USER}}"
APP_DIR="${APP_DIR:-${SERVICE_HOME}/${APP_NAME}}"
APP_PORT="${APP_PORT:-3000}"
APP_HOST="${APP_HOST:-127.0.0.1}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://${APP_HOST}:${APP_PORT}/api/health}"
HEALTHCHECK_ATTEMPTS="${HEALTHCHECK_ATTEMPTS:-30}"
HEALTHCHECK_DELAY_SECONDS="${HEALTHCHECK_DELAY_SECONDS:-2}"
ARTIFACT_TARBALL="${ARTIFACT_TARBALL:-${1:-}}"
STAGE_DIR=""
ROLLBACK_DIR=""

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

assert_safe_paths() {
  APP_DIR="$(realpath -m -- "${APP_DIR}")"
  SERVICE_HOME="$(realpath -m -- "${SERVICE_HOME}")"

  case "${APP_DIR}" in
    /srv/*) ;;
    *)
      echo "Refusing to deploy outside /srv: ${APP_DIR}" >&2
      exit 1
      ;;
  esac

  case "${SERVICE_HOME}" in
    /srv/*) ;;
    *)
      echo "Refusing to use a service home outside /srv: ${SERVICE_HOME}" >&2
      exit 1
      ;;
  esac
}

ensure_service_user() {
  if ! id "${SERVICE_USER}" >/dev/null 2>&1; then
    echo "Service user does not exist: ${SERVICE_USER}" >&2
    echo "Run scripts/vps/install-runtime.sh first." >&2
    exit 1
  fi
}

normalize_artifact_path() {
  if [[ -n "${ARTIFACT_TARBALL}" ]]; then
    ARTIFACT_TARBALL="$(cd "$(dirname "${ARTIFACT_TARBALL}")" && pwd)/$(basename "${ARTIFACT_TARBALL}")"
  fi
}

preserve_env_files() {
  local source_dir="$1"
  local dest_dir="$2"
  local env_file

  for env_file in .env .env.production .env.local; do
    if as_root test -f "${source_dir}/${env_file}" && ! as_root test -f "${dest_dir}/${env_file}"; then
      as_root cp -p "${source_dir}/${env_file}" "${dest_dir}/${env_file}"
    fi
  done
}

write_systemd_unit() {
  local exec_start="$1"
  local unit_file="/etc/systemd/system/${SYSTEMD_SERVICE_NAME}.service"
  local tmp_unit

  tmp_unit="$(mktemp)"
  cat > "${tmp_unit}" <<EOF
[Unit]
Description=${APP_NAME} Next.js app
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=PORT=${APP_PORT}
Environment=HOSTNAME=${APP_HOST}
Environment=PATH=/usr/local/bin:/usr/bin:/bin
EnvironmentFile=-${APP_DIR}/.env
EnvironmentFile=-${APP_DIR}/.env.production
EnvironmentFile=-${APP_DIR}/.env.local
ExecStart=${exec_start}
Restart=always
RestartSec=5
KillSignal=SIGINT
TimeoutStopSec=30
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
LockPersonality=true
RestrictRealtime=true
SystemCallArchitectures=native
ReadWritePaths=${APP_DIR} ${SERVICE_HOME}/shared ${SERVICE_HOME}/logs

[Install]
WantedBy=multi-user.target
EOF

  as_root install -m 0644 -o root -g root "${tmp_unit}" "${unit_file}" || return
  rm -f "${tmp_unit}" || return

  echo "==> Reloading systemd"
  as_root systemctl daemon-reload || return
  as_root systemctl enable "${SYSTEMD_SERVICE_NAME}.service" >/dev/null || return
}

restart_service() {
  echo "==> Restarting ${SYSTEMD_SERVICE_NAME}.service"
  as_root systemctl restart "${SYSTEMD_SERVICE_NAME}.service"
  as_root systemctl is-active --quiet "${SYSTEMD_SERVICE_NAME}.service"
}

wait_for_health() {
  local attempt

  echo "==> Waiting for ${HEALTHCHECK_URL}"
  for ((attempt = 1; attempt <= HEALTHCHECK_ATTEMPTS; attempt += 1)); do
    if curl --fail --silent --show-error --max-time 5 "${HEALTHCHECK_URL}" >/dev/null; then
      echo "==> Health check passed"
      return 0
    fi
    sleep "${HEALTHCHECK_DELAY_SECONDS}"
  done

  echo "Health check failed after ${HEALTHCHECK_ATTEMPTS} attempts." >&2
  return 1
}

validate_artifact_entries() {
  local invalid_entry

  invalid_entry="$(
    tar -tzf "${ARTIFACT_TARBALL}" |
      awk '/^\// || /(^|\/)\.\.(\/|$)/ { print }'
  )"
  if [[ -n "${invalid_entry}" ]]; then
    echo "Invalid artifact path: ${invalid_entry}" >&2
    return 1
  fi
}

rollback_artifact() {
  echo "==> Deployment failed; restoring the previous release" >&2
  as_root systemctl stop "${SYSTEMD_SERVICE_NAME}.service" || true
  as_root rm -rf "${APP_DIR}"

  if [[ -n "${ROLLBACK_DIR}" ]] && as_root test -d "${ROLLBACK_DIR}"; then
    as_root mv "${ROLLBACK_DIR}" "${APP_DIR}"
    ROLLBACK_DIR=""
    as_root systemctl restart "${SYSTEMD_SERVICE_NAME}.service"
    if ! wait_for_health; then
      echo "Previous release was restored but did not pass its health check." >&2
      return 1
    fi
    echo "==> Previous release restored"
    return 0
  fi

  echo "No previous release was available to restore." >&2
  return 1
}

deploy_artifact() {
  local parent_dir
  local app_basename

  if [[ ! -f "${ARTIFACT_TARBALL}" ]]; then
    echo "Artifact not found: ${ARTIFACT_TARBALL}" >&2
    exit 1
  fi

  parent_dir="$(dirname "${APP_DIR}")"
  app_basename="$(basename "${APP_DIR}")"

  echo "==> Deploying standalone artifact"
  echo "    artifact: ${ARTIFACT_TARBALL}"
  echo "    app dir:  ${APP_DIR}"

  as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" -m 0755 "${parent_dir}"
  as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" -m 0755 "${SERVICE_HOME}/shared"
  as_root install -d -o "${SERVICE_USER}" -g "${SERVICE_USER}" -m 0755 "${SERVICE_HOME}/logs"

  validate_artifact_entries
  STAGE_DIR="$(as_root mktemp -d "${parent_dir}/.${app_basename}.stage.XXXXXX")"
  cleanup_stage() {
    if [[ -n "${STAGE_DIR}" ]]; then
      as_root rm -rf "${STAGE_DIR}"
    fi
  }
  trap cleanup_stage EXIT

  as_root tar -xzf "${ARTIFACT_TARBALL}" -C "${STAGE_DIR}"

  if ! as_root test -f "${STAGE_DIR}/server.js"; then
    echo "Invalid artifact: server.js is missing at artifact root." >&2
    exit 1
  fi

  if as_root test -d "${APP_DIR}"; then
    preserve_env_files "${APP_DIR}" "${STAGE_DIR}"
  fi

  ROLLBACK_DIR="${parent_dir}/.${app_basename}.rollback"
  as_root rm -rf "${ROLLBACK_DIR}"
  if as_root test -d "${APP_DIR}"; then
    as_root mv "${APP_DIR}" "${ROLLBACK_DIR}"
  fi
  as_root mv "${STAGE_DIR}" "${APP_DIR}"
  STAGE_DIR=""
  trap - EXIT

  if ! as_root chown -R "${SERVICE_USER}:${SERVICE_USER}" "${APP_DIR}" ||
    ! write_systemd_unit "/usr/bin/node ${APP_DIR}/server.js" ||
    ! restart_service ||
    ! wait_for_health; then
    rollback_artifact || true
    exit 1
  fi

  echo "==> Artifact deploy complete"
  if [[ -n "${ROLLBACK_DIR}" ]] && as_root test -d "${ROLLBACK_DIR}"; then
    echo "    previous release: ${ROLLBACK_DIR}"
  fi
}

assert_safe_paths
ensure_service_user
normalize_artifact_path

if [[ -z "${ARTIFACT_TARBALL}" ]]; then
  echo "ARTIFACT_TARBALL is required. Build with scripts/vps/build-artifact.sh first." >&2
  exit 1
fi

deploy_artifact
