#!/usr/bin/env bash
# AutoCanvas - One-Click Deployment Shortcut
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "${DIR}/scripts/deploy-cpanel.sh" "$@"

