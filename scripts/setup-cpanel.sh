#!/usr/bin/env bash
# ==============================================================================
# AutoCanvas - One-Time Initial cPanel Setup Script
# Run this once after first cloning the repository to /home/devcente/AutoCanvas
# ==============================================================================

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}🏛️  AutoCanvas Initial Production Setup (cPanel)                ${NC}"
echo -e "${BLUE}    Domain: https://autocanvas.devcenterpoint.com               ${NC}"
echo -e "${BLUE}================================================================${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"

PHP_BIN="${PHP_BIN:-$(which ea-php83 2>/dev/null || which php83 2>/dev/null || which php 2>/dev/null || echo "php")}"

echo -e "${CYAN}Directory:${NC}   ${PROJECT_ROOT}"
echo -e "${CYAN}PHP Binary:${NC}  $(${PHP_BIN} -v 2>/dev/null | head -n 1 || echo "${PHP_BIN}")"

# --- Intelligent Composer Detection & Auto-Download ---
resolve_composer() {
    # 1. Check known cPanel binary locations
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

    # 2. If not found anywhere, download local composer.phar automatically
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

    echo -e "${RED}Error: Failed to locate or download Composer. Please run 'curl -sS https://getcomposer.org/installer | php' manually.${NC}" >&2
    return 1
}

COMPOSER_CMD="$(resolve_composer)"
echo -e "${CYAN}Composer:${NC}    ${COMPOSER_CMD}"

cd "${BACKEND_DIR}"

echo -e "\n${BLUE}▶ [1/6] Preparing environment file...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env from .env.example${NC}"
    echo -e "${YELLOW}Please verify database credentials in ${BACKEND_DIR}/.env before continuing!${NC}"
else
    echo -e "${GREEN}✓ Existing .env file found.${NC}"
fi

echo -e "\n${BLUE}▶ [2/6] Setting directory permissions...${NC}"
mkdir -p storage/framework/{cache/data,app,sessions,views} storage/logs bootstrap/cache
chmod -R 775 storage bootstrap/cache 2>/dev/null || true
echo -e "${GREEN}✓ Storage permissions set to 775.${NC}"

echo -e "\n${BLUE}▶ [3/6] Installing backend dependencies...${NC}"
${COMPOSER_CMD} install --no-dev --prefer-dist --optimize-autoloader --no-interaction
echo -e "${GREEN}✓ Composer dependencies installed.${NC}"

echo -e "\n${BLUE}▶ [4/6] Generating encryption key & migrating database...${NC}"
${PHP_BIN} artisan key:generate --force
${PHP_BIN} artisan migrate --force || {
    echo -e "${YELLOW}Notice: Standard migrate encountered partially created tables from previous attempt. Retrying with migrate:fresh...${NC}"
    ${PHP_BIN} artisan migrate:fresh --force
}
${PHP_BIN} artisan db:seed --force
${PHP_BIN} artisan storage:link || true
echo -e "${GREEN}✓ Database schema and seeds initialized.${NC}"

echo -e "\n${BLUE}▶ [5/7] Provisioning Sovereign Platform Superadmin...${NC}"
ADMIN_EMAIL="${ADMIN_EMAIL:-hello@devcenterpoint.com}"
ADMIN_NAME="${ADMIN_NAME:-Platform Superadmin}"
ADMIN_PASS="${ADMIN_PASS:-Hello@DCP2026}"

${PHP_BIN} artisan control-plane:create-admin \
  --email="${ADMIN_EMAIL}" \
  --name="${ADMIN_NAME}" \
  --password="${ADMIN_PASS}" || {
    echo -e "${YELLOW}Notice: Superadmin provisioned or already exists.${NC}"
}

echo -e "\n${BLUE}▶ [6/7] Synchronizing compiled frontend assets...${NC}"
if [ -d "${PROJECT_ROOT}/frontend/dist" ]; then
    echo -e "Deploying pre-built assets from frontend/dist to backend/public..."
    cp -r "${PROJECT_ROOT}/frontend/dist/"* "${BACKEND_DIR}/public/" 2>/dev/null || true
    echo -e "${GREEN}✓ Frontend assets synchronized to backend/public.${NC}"
elif [ -f "${BACKEND_DIR}/public/index.html" ]; then
    echo -e "${GREEN}✓ Frontend assets already active in backend/public.${NC}"
else
    echo -e "${YELLOW}Warning: Neither frontend/dist nor backend/public/index.html found.${NC}"
fi

echo -e "\n${BLUE}▶ [7/7] Warming production caches...${NC}"
${PHP_BIN} artisan config:clear
${PHP_BIN} artisan config:cache
${PHP_BIN} artisan route:cache
${PHP_BIN} artisan view:cache
${PHP_BIN} artisan event:cache

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}✅ AutoCanvas Initial Setup Complete!                            ${NC}"
echo -e "${GREEN}   Superadmin Email: ${ADMIN_EMAIL}                              ${NC}"
echo -e "${GREEN}   Next deployments: simply run ./deploy.sh or click Deploy in Git${NC}"
echo -e "${GREEN}================================================================${NC}"
