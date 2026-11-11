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
COMPOSER_BIN="${COMPOSER_BIN:-$(which composer 2>/dev/null || echo "composer")}"

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
${COMPOSER_BIN} install --no-dev --prefer-dist --optimize-autoloader --no-interaction
echo -e "${GREEN}✓ Composer dependencies installed.${NC}"

echo -e "\n${BLUE}▶ [4/6] Generating encryption key & migrating database...${NC}"
${PHP_BIN} artisan key:generate --force
${PHP_BIN} artisan migrate --force
${PHP_BIN} artisan db:seed --force
${PHP_BIN} artisan storage:link || true
echo -e "${GREEN}✓ Database schema and seeds initialized.${NC}"

echo -e "\n${BLUE}▶ [5/6] Provisioning Sovereign Platform Superadmin...${NC}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@devcenterpoint.com}"
ADMIN_NAME="${ADMIN_NAME:-Platform Superadmin}"
ADMIN_PASS="${ADMIN_PASS:-SuperAdminPassword123!}"

${PHP_BIN} artisan control-plane:create-admin \
  --email="${ADMIN_EMAIL}" \
  --name="${ADMIN_NAME}" \
  --password="${ADMIN_PASS}" || {
    echo -e "${YELLOW}Notice: Superadmin provisioned or already exists.${NC}"
}

echo -e "\n${BLUE}▶ [6/6] Warming production caches...${NC}"
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

