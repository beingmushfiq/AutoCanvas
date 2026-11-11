#!/usr/bin/env bash
# ==============================================================================
# AutoCanvas - Enterprise VPS / Linux Server Deployment Script
# Target Host: autocanvas.devcenterpoint.com
# Compatible with Ubuntu 22.04/24.04 LTS, Debian 12, NGINX + PHP 8.3-FPM + Redis
# ==============================================================================

set -euo pipefail

# --- Color Tokens ---
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}🚀  AutoCanvas VPS Production Deployment Engine                 ${NC}"
echo -e "${CYAN}    Target: autocanvas.devcenterpoint.com                       ${NC}"
echo -e "${CYAN}================================================================${NC}"

# --- Paths & Defaults ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${APP_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
PHP_BIN="${PHP_BIN:-php}"
COMPOSER_BIN="${COMPOSER_BIN:-composer}"
NPM_BIN="${NPM_BIN:-npm}"

echo -e "${BLUE}▶ Working Directory:${NC}  ${PROJECT_ROOT}"
echo -e "${BLUE}▶ PHP Version:${NC}        $(${PHP_BIN} -r 'echo PHP_VERSION;')"

# Trap unexpected errors and print diagnostics
cleanup() {
    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo -e "\n${RED}================================================================${NC}"
        echo -e "${RED}❌ Deployment aborted due to an error (exit code: ${EXIT_CODE})!${NC}"
        echo -e "${RED}Restoring application from maintenance mode if down...          ${NC}"
        echo -e "${RED}================================================================${NC}"
        if [ -f "${BACKEND_DIR}/artisan" ]; then
            cd "${BACKEND_DIR}"
            ${PHP_BIN} artisan up 2>/dev/null || true
        fi
    fi
}
trap cleanup EXIT

# --- Step 1: Pre-flight Verification ---
echo -e "\n${CYAN}▶ [1/8] Verifying environment & system requirements...${NC}"
if [ ! -f "${BACKEND_DIR}/.env" ]; then
    echo -e "${RED}Fatal: Production .env not found in ${BACKEND_DIR}.${NC}"
    exit 1
fi

# Ensure storage subdirectories exist with correct permissions
mkdir -p "${BACKEND_DIR}/storage/framework"/{sessions,views,cache/data}
mkdir -p "${BACKEND_DIR}/storage/logs"
mkdir -p "${BACKEND_DIR}/bootstrap/cache"
chmod -R 775 "${BACKEND_DIR}/storage" "${BACKEND_DIR}/bootstrap/cache" 2>/dev/null || true

# --- Step 2: Git Synchronization (if under version control) ---
echo -e "\n${CYAN}▶ [2/8] Checking repository status...${NC}"
if [ -d "${PROJECT_ROOT}/.git" ]; then
    CURRENT_BRANCH=$(git -C "${PROJECT_ROOT}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    echo -e "Current git branch: ${YELLOW}${CURRENT_BRANCH}${NC}"
    if [ "${DEPLOY_PULL:-false}" = "true" ]; then
        echo -e "Fetching and merging latest release commits..."
        git -C "${PROJECT_ROOT}" pull --ff-only origin "${CURRENT_BRANCH}"
    fi
fi

# --- Step 3: Activate Zero-Downtime Maintenance Mode ---
echo -e "\n${CYAN}▶ [3/8] Setting graceful maintenance mode...${NC}"
cd "${BACKEND_DIR}"
MAINT_BYPASS_TOKEN="autocanvas-deploy-$(date +%s)"
${PHP_BIN} artisan down --retry=30 --secret="${MAINT_BYPASS_TOKEN}" || true

# --- Step 4: Install Production PHP Dependencies ---
echo -e "\n${CYAN}▶ [4/8] Installing production PHP dependencies...${NC}"
${COMPOSER_BIN} install \
    --no-dev \
    --prefer-dist \
    --optimize-autoloader \
    --classmap-authoritative \
    --no-interaction \
    --quiet

# --- Step 5: Run Database Migrations ---
echo -e "\n${CYAN}▶ [5/8] Running database migrations...${NC}"
${PHP_BIN} artisan migrate --force --no-interaction

# --- Step 6: Build & Publish Frontend Single-Page App ---
echo -e "\n${CYAN}▶ [6/8] Compiling frontend production bundle...${NC}"
if [ -d "${FRONTEND_DIR}" ]; then
    cd "${FRONTEND_DIR}"
    if [ -f "package.json" ]; then
        ${NPM_BIN} ci --prefer-offline 2>/dev/null || ${NPM_BIN} install
        ${NPM_BIN} run build
        echo -e "${GREEN}✓ Frontend build complete.${NC}"
        
        # Mirror compiled dist into backend public folder for single-origin serving
        mkdir -p "${BACKEND_DIR}/public/assets"
        cp -r "${FRONTEND_DIR}/dist/"* "${BACKEND_DIR}/public/" 2>/dev/null || true
    fi
fi

# --- Step 7: Warm Framework Caches & Restart Queue Workers ---
echo -e "\n${CYAN}▶ [7/8] Optimizing configuration & restarting background daemons...${NC}"
cd "${BACKEND_DIR}"
${PHP_BIN} artisan storage:link || true
${PHP_BIN} artisan config:clear
${PHP_BIN} artisan config:cache
${PHP_BIN} artisan route:cache
${PHP_BIN} artisan view:cache
${PHP_BIN} artisan event:cache

# Restart Laravel queue workers so they pick up new application code
echo -e "Signaling queue workers to restart gracefully..."
${PHP_BIN} artisan queue:restart

# If supervisor is running autocanvas workers, restart them
if command -v supervisorctl >/dev/null 2>&1; then
    echo -e "Restarting supervisor workers..."
    supervisorctl restart autocanvas-worker:* 2>/dev/null || true
fi

# Reload PHP-FPM if running as service (optional, non-fatal)
if command -v systemctl >/dev/null 2>&1; then
    for FPM_SERVICE in php8.3-fpm php8.2-fpm php8.4-fpm; do
        if systemctl is-active --quiet "${FPM_SERVICE}" 2>/dev/null; then
            echo -e "Reloading ${FPM_SERVICE}..."
            sudo systemctl reload "${FPM_SERVICE}" 2>/dev/null || true
            break
        fi
    done
fi

# --- Step 8: Exit Maintenance Mode & Verify Health ---
echo -e "\n${CYAN}▶ [8/8] Bringing application online & validating health...${NC}"
${PHP_BIN} artisan up

# Run Health Probe
echo -e "Performing local health probe..."
HEALTH_CHECK_URL="${HEALTH_URL:-http://127.0.0.1/api/health}"
if command -v curl >/dev/null 2>&1; then
    HEALTH_RESP=$(curl -s "${HEALTH_CHECK_URL}" || echo "")
    if echo "${HEALTH_RESP}" | grep -q '"status":"ok"'; then
        echo -e "${GREEN}✓ System health check passed! Endpoint returned status: ok${NC}"
    else
        echo -e "${YELLOW}! System health probe output: ${HEALTH_RESP}${NC}"
    fi
fi

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}🎉 Production VPS deployment complete for autocanvas.devcenterpoint.com!${NC}"
echo -e "${GREEN}================================================================${NC}"

