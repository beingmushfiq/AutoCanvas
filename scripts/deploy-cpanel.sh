#!/usr/bin/env bash
# ==============================================================================
# AutoCanvas - cPanel Production Deployment Script
# Domain: autocanvas.devcenterpoint.com
# Environment: cPanel / LiteSpeed / Apache Shared Hosting
# ==============================================================================

set -euo pipefail

# --- Color Tokens ---
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}🚀  AutoCanvas Production Deployment (cPanel / LiteSpeed)      ${NC}"
echo -e "${BLUE}    Target: autocanvas.devcenterpoint.com                       ${NC}"
echo -e "${BLUE}================================================================${NC}"

# --- Configuration & Paths ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"

# Configurable web root - default cPanel public_html subfolder or symlink target
PUBLIC_HTML_TARGET="${CPANEL_PUBLIC_HTML:-${HOME:-/home}/public_html/autocanvas.devcenterpoint.com}"
PHP_BIN="${PHP_BIN:-$(which ea-php83 2>/dev/null || which php83 2>/dev/null || which php 2>/dev/null || echo "php")}"
COMPOSER_BIN="${COMPOSER_BIN:-$(which composer 2>/dev/null || echo "composer")}"
NPM_BIN="${NPM_BIN:-$(which npm 2>/dev/null || echo "npm")}"

echo -e "${YELLOW}Deploying from:${NC} ${PROJECT_ROOT}"
echo -e "${YELLOW}Backend Dir:${NC}   ${BACKEND_DIR}"
echo -e "${YELLOW}Frontend Dir:${NC}  ${FRONTEND_DIR}"
echo -e "${YELLOW}Web Root:${NC}      ${PUBLIC_HTML_TARGET}"
echo -e "${YELLOW}PHP Binary:${NC}    $(${PHP_BIN} -v | head -n 1)"

# --- Step 1: Pre-flight Verification ---
echo -e "\n${BLUE}▶ [1/7] Running pre-flight checks...${NC}"
if [ ! -f "${BACKEND_DIR}/artisan" ]; then
    echo -e "${RED}Error: artisan not found in ${BACKEND_DIR}.${NC}"
    exit 1
fi

if [ ! -f "${BACKEND_DIR}/.env" ]; then
    echo -e "${RED}Error: .env file missing in ${BACKEND_DIR}. Create it before deploying.${NC}"
    exit 1
fi

# Ensure storage directory structure exists with writable permissions
mkdir -p "${BACKEND_DIR}/storage/framework/cache/data"
mkdir -p "${BACKEND_DIR}/storage/framework/app"
mkdir -p "${BACKEND_DIR}/storage/framework/sessions"
mkdir -p "${BACKEND_DIR}/storage/framework/views"
mkdir -p "${BACKEND_DIR}/storage/logs"
chmod -R 775 "${BACKEND_DIR}/storage" "${BACKEND_DIR}/bootstrap/cache" 2>/dev/null || true

# --- Step 2: Graceful Maintenance Mode ---
echo -e "\n${BLUE}▶ [2/7] Entering maintenance mode...${NC}"
cd "${BACKEND_DIR}"
${PHP_BIN} artisan down --retry=60 --secret="autocanvas-deploy-bypass-$(date +%s)" || true

# --- Step 3: Install/Update Composer Dependencies ---
echo -e "\n${BLUE}▶ [3/7] Installing production PHP dependencies...${NC}"
${COMPOSER_BIN} install --no-dev --prefer-dist --optimize-autoloader --no-interaction --quiet

# --- Step 4: Run Safe Database Migrations ---
echo -e "\n${BLUE}▶ [4/7] Running database schema migrations...${NC}"
${PHP_BIN} artisan migrate --force --no-interaction

# --- Step 5: Build Frontend Single Page App Assets ---
echo -e "\n${BLUE}▶ [5/7] Building frontend assets...${NC}"
if [ -d "${FRONTEND_DIR}" ] && command -v "${NPM_BIN}" >/dev/null 2>&1; then
    cd "${FRONTEND_DIR}"
    if [ -f "package.json" ]; then
        ${NPM_BIN} ci --prefer-offline --no-audit 2>/dev/null || ${NPM_BIN} install --no-audit
        ${NPM_BIN} run build
        echo -e "${GREEN}✓ Frontend compiled successfully to ${FRONTEND_DIR}/dist${NC}"

        # Copy built SPA dist into backend public root
        cp -r "${FRONTEND_DIR}/dist/"* "${BACKEND_DIR}/public/" 2>/dev/null || true
    fi
else
    echo -e "${YELLOW}Notice: Node.js/NPM not found on hosting tier; skipping local frontend build.${NC}"
    echo -e "${YELLOW}Ensure pre-built frontend/dist was committed or synced to backend/public.${NC}"
fi

# --- Step 6: Link Storage & Warm Framework Caches ---
echo -e "\n${BLUE}▶ [6/7] Optimizing framework cache & symlinks...${NC}"
cd "${BACKEND_DIR}"
${PHP_BIN} artisan storage:link || true
${PHP_BIN} artisan config:clear
${PHP_BIN} artisan config:cache
${PHP_BIN} artisan route:cache
${PHP_BIN} artisan view:cache
${PHP_BIN} artisan event:cache

# --- Step 7: Web Root Integration & Health Check ---
echo -e "\n${BLUE}▶ [7/7] Synchronizing web root & exiting maintenance mode...${NC}"

# If PUBLIC_HTML_TARGET exists and is different from backend/public, mirror or symlink
if [ -d "${PUBLIC_HTML_TARGET}" ] && [ "$(realpath "${PUBLIC_HTML_TARGET}")" != "$(realpath "${BACKEND_DIR}/public")" ]; then
    echo -e "Syncing backend/public into ${PUBLIC_HTML_TARGET}..."
    cp -r "${BACKEND_DIR}/public/"* "${PUBLIC_HTML_TARGET}/" 2>/dev/null || true
    cp "${BACKEND_DIR}/public/.htaccess" "${PUBLIC_HTML_TARGET}/.htaccess" 2>/dev/null || true
fi

# Restore service
${PHP_BIN} artisan up

# Run Health Probe
echo -e "\n${BLUE}▶ Performing health check verification...${NC}"
HEALTH_STATUS=0
if command -v curl >/dev/null 2>&1; then
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1/api/health" 2>/dev/null || curl -s -o /dev/null -w "%{http_code}" "https://autocanvas.devcenterpoint.com/api/health" 2>/dev/null || echo "000")
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓ Health probe succeeded (HTTP ${RESPONSE})!${NC}"
    else
        echo -e "${YELLOW}! Health probe returned HTTP ${RESPONSE} (Verify Apache/LiteSpeed vhost binding).${NC}"
    fi
fi

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}🎉 AutoCanvas deployed successfully to autocanvas.devcenterpoint.com!${NC}"
echo -e "${GREEN}================================================================${NC}"

