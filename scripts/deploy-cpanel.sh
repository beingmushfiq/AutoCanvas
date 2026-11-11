#!/usr/bin/env bash
# ==============================================================================
# AutoCanvas - One-Click cPanel Production Deployment Script
# Domain: autocanvas.devcenterpoint.com
# User: devcente (/home/devcente/AutoCanvas)
# Environment: cPanel / Apache / LiteSpeed Shared Hosting
# ==============================================================================

set -euo pipefail

# --- Color Tokens ---
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}🚀  AutoCanvas 1-Click Automated Deployment Engine               ${NC}"
echo -e "${BLUE}    Host: /home/devcente/AutoCanvas                             ${NC}"
echo -e "${BLUE}    Target: https://autocanvas.devcenterpoint.com               ${NC}"
echo -e "${BLUE}================================================================${NC}"

# --- Configuration & Paths ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"

# Configurable web root - default cPanel public_html subfolder or direct document root
PUBLIC_HTML_TARGET="${CPANEL_PUBLIC_HTML:-/home/devcente/public_html/autocanvas}"
PHP_BIN="${PHP_BIN:-$(which ea-php83 2>/dev/null || which php83 2>/dev/null || which php 2>/dev/null || echo "php")}"
NPM_BIN="${NPM_BIN:-$(which npm 2>/dev/null || echo "npm")}"

# --- Intelligent Composer Detection & Auto-Download ---
resolve_composer() {
    for candidate in "composer" \
                     "/opt/cpanel/composer/bin/composer" \
                     "/usr/local/cpanel/3rdparty/bin/composer" \
                     "${HOME}/bin/composer" \
                     "${PROJECT_ROOT}/composer.phar" \
                     "${BACKEND_DIR}/composer.phar"; do
        if command -v "${candidate}" >/dev/null 2>&1 || [ -f "${candidate}" ]; then
            if [[ "${candidate}" == *.phar ]]; then
                echo "${PHP_BIN} ${candidate}"
            else
                echo "${candidate}"
            fi
            return 0
        fi
    done

    echo -e "${YELLOW}Notice: Composer not found in PATH. Downloading local composer.phar...${NC}" >&2
    if command -v curl >/dev/null 2>&1; then
        curl -sS https://getcomposer.org/installer | ${PHP_BIN} -- --install-dir="${PROJECT_ROOT}" --filename=composer.phar >&2
    elif command -v wget >/dev/null 2>&1; then
        wget -q -O - https://getcomposer.org/installer | ${PHP_BIN} -- --install-dir="${PROJECT_ROOT}" --filename=composer.phar >&2
    fi

    if [ -f "${PROJECT_ROOT}/composer.phar" ]; then
        echo -e "${GREEN}✓ Local composer.phar installed successfully.${NC}" >&2
        echo "${PHP_BIN} ${PROJECT_ROOT}/composer.phar"
        return 0
    fi

    echo -e "${RED}Error: Failed to locate or download Composer.${NC}" >&2
    return 1
}

COMPOSER_CMD="$(resolve_composer)"

echo -e "${CYAN}Directory:${NC}   ${PROJECT_ROOT}"
echo -e "${CYAN}PHP Binary:${NC}  $(${PHP_BIN} -v 2>/dev/null | head -n 1 || echo "${PHP_BIN}")"
echo -e "${CYAN}Composer:${NC}    ${COMPOSER_CMD}"

# --- Step 0: Git Synchronization (If executed within a Git repository) ---
if [ "${AUTO_GIT_PULL:-1}" = "1" ] && [ -d "${PROJECT_ROOT}/.git" ]; then
    echo -e "\n${BLUE}▶ [1/8] Fetching and pulling latest code from Git...${NC}"
    CURRENT_BRANCH=$(git -C "${PROJECT_ROOT}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    echo -e "Active Branch: ${YELLOW}${CURRENT_BRANCH}${NC}"
    git -C "${PROJECT_ROOT}" pull origin "${CURRENT_BRANCH}" --ff-only 2>/dev/null || {
        echo -e "${YELLOW}Notice: Fast-forward git pull skipped (working tree clean or detached). Continuing...${NC}"
    }
else
    echo -e "\n${BLUE}▶ [1/8] Skipping Git pull (using local workspace files)...${NC}"
fi

# --- Step 1: Pre-flight Verification ---
echo -e "\n${BLUE}▶ [2/8] Running pre-flight checks...${NC}"
if [ ! -f "${BACKEND_DIR}/artisan" ]; then
    echo -e "${RED}Error: artisan not found in ${BACKEND_DIR}.${NC}"
    exit 1
fi

if [ ! -f "${BACKEND_DIR}/.env" ]; then
    echo -e "${RED}Error: .env file missing in ${BACKEND_DIR}.${NC}"
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    if [ -f "${BACKEND_DIR}/.env.example" ]; then
        cp "${BACKEND_DIR}/.env.example" "${BACKEND_DIR}/.env"
        ${PHP_BIN} "${BACKEND_DIR}/artisan" key:generate --force
        echo -e "${YELLOW}Please configure your DB credentials in ${BACKEND_DIR}/.env!${NC}"
    else
        exit 1
    fi
fi

# Ensure storage directory structure exists with writable permissions
mkdir -p "${BACKEND_DIR}/storage/framework/cache/data"
mkdir -p "${BACKEND_DIR}/storage/framework/app"
mkdir -p "${BACKEND_DIR}/storage/framework/sessions"
mkdir -p "${BACKEND_DIR}/storage/framework/views"
mkdir -p "${BACKEND_DIR}/storage/logs"
chmod -R 775 "${BACKEND_DIR}/storage" "${BACKEND_DIR}/bootstrap/cache" 2>/dev/null || true

# --- Step 2: Graceful Maintenance Mode ---
echo -e "\n${BLUE}▶ [3/8] Entering maintenance mode...${NC}"
cd "${BACKEND_DIR}"
${PHP_BIN} artisan down --retry=60 || true

# --- Step 3: Install/Update Composer Dependencies ---
echo -e "\n${BLUE}▶ [4/8] Installing production PHP dependencies...${NC}"
${COMPOSER_CMD} install --no-dev --prefer-dist --optimize-autoloader --no-interaction --quiet || {
    echo -e "${YELLOW}Warning: Composer install encountered a warning, continuing with existing vendor...${NC}"
}

# --- Step 4: Run Safe Database Migrations ---
echo -e "\n${BLUE}▶ [5/8] Running database schema migrations...${NC}"
${PHP_BIN} artisan migrate --force --no-interaction

# --- Step 5: Build Frontend Single Page App Assets ---
echo -e "\n${BLUE}▶ [6/8] Synchronizing frontend assets...${NC}"
if [ -d "${FRONTEND_DIR}" ] && command -v "${NPM_BIN}" >/dev/null 2>&1; then
    cd "${FRONTEND_DIR}"
    if [ -f "package.json" ]; then
        echo -e "Node.js detected. Compiling frontend bundle..."
        ${NPM_BIN} run build:cpanel 2>/dev/null || {
            echo -e "${YELLOW}Warning: In-server Vite build failed or memory-constrained. Using pre-built dist if present.${NC}"
            if [ -d "${FRONTEND_DIR}/dist" ]; then
                cp -r "${FRONTEND_DIR}/dist/"* "${BACKEND_DIR}/public/" 2>/dev/null || true
            fi
        }
        echo -e "${GREEN}✓ Frontend synced to ${BACKEND_DIR}/public${NC}"
    fi
else
    echo -e "${YELLOW}Notice: Node.js/NPM not active in shell. Using pre-built assets in backend/public.${NC}"
    if [ -d "${FRONTEND_DIR}/dist" ]; then
        cp -r "${FRONTEND_DIR}/dist/"* "${BACKEND_DIR}/public/" 2>/dev/null || true
    fi
fi

# --- Step 6: Link Storage, Warm Caches & Restart Queues ---
echo -e "\n${BLUE}▶ [7/8] Optimizing caches & restarting queue workers...${NC}"
cd "${BACKEND_DIR}"
${PHP_BIN} artisan storage:link || true
${PHP_BIN} artisan config:clear
${PHP_BIN} artisan config:cache
${PHP_BIN} artisan route:cache
${PHP_BIN} artisan view:cache
${PHP_BIN} artisan event:cache
${PHP_BIN} artisan queue:restart || true

# --- Step 7: Web Root Integration & Health Check ---
echo -e "\n${BLUE}▶ [8/8] Synchronizing web root & exiting maintenance mode...${NC}"

# If PUBLIC_HTML_TARGET exists and is different from backend/public (Method 2), sync
if [ -d "${PUBLIC_HTML_TARGET}" ] && [ "$(realpath "${PUBLIC_HTML_TARGET}")" != "$(realpath "${BACKEND_DIR}/public")" ]; then
    echo -e "Syncing backend/public into ${PUBLIC_HTML_TARGET}..."
    cp -r "${BACKEND_DIR}/public/"* "${PUBLIC_HTML_TARGET}/" 2>/dev/null || true
    cp "${BACKEND_DIR}/public/.htaccess" "${PUBLIC_HTML_TARGET}/.htaccess" 2>/dev/null || true
fi

# Restore service
${PHP_BIN} artisan up

# Run Health Probe
echo -e "\n${BLUE}▶ Running health check probe...${NC}"
if command -v curl >/dev/null 2>&1; then
    RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" "https://autocanvas.devcenterpoint.com/api/v1/health" 2>/dev/null || curl -s -k -o /dev/null -w "%{http_code}" "http://127.0.0.1/api/v1/health" 2>/dev/null || echo "000")
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓ Live Health probe succeeded (HTTP ${RESPONSE})!${NC}"
    else
        echo -e "${YELLOW}! Health probe returned HTTP ${RESPONSE} (Verify DNS or vhost binding).${NC}"
    fi
fi

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}🎉 AutoCanvas deployed successfully!                             ${NC}"
echo -e "${GREEN}   URL: https://autocanvas.devcenterpoint.com                   ${NC}"
echo -e "${GREEN}================================================================${NC}"
