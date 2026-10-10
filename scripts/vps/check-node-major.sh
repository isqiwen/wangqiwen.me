#!/usr/bin/env bash
set -euo pipefail

# Fail unless a Node.js binary has the expected major version.
#
# Usage:
#   check-node-major.sh EXPECTED_MAJOR [NODE_BIN]

EXPECTED_MAJOR="${1:-}"
NODE_BIN="${2:-node}"

if [[ ! "${EXPECTED_MAJOR}" =~ ^[0-9]+$ ]]; then
  echo "Usage: check-node-major.sh EXPECTED_MAJOR [NODE_BIN]" >&2
  exit 2
fi

if ! ACTUAL_VERSION="$("${NODE_BIN}" -v 2>/dev/null)"; then
  echo "Node.js ${EXPECTED_MAJOR} is required, but ${NODE_BIN} could not be run." >&2
  exit 1
fi

ACTUAL_MAJOR="${ACTUAL_VERSION#v}"
ACTUAL_MAJOR="${ACTUAL_MAJOR%%.*}"

if [[ "${ACTUAL_MAJOR}" != "${EXPECTED_MAJOR}" ]]; then
  echo "Node.js ${EXPECTED_MAJOR} is required, but ${NODE_BIN} is ${ACTUAL_VERSION}." >&2
  exit 1
fi

echo "==> Node.js runtime: ${ACTUAL_VERSION} (${NODE_BIN})"
