#!/usr/bin/env bash
# ==============================================================================
# AutoCanvas - Production Database Backup Engine
# Supports SQLite & MySQL/MariaDB with Gzip Compression, Checksums & Retention
# ==============================================================================

set -euo pipefail

# --- Color Tokens ---
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Backup directory destination
BACKUP_DEST_DIR="${BACKUP_DIR:-${BACKEND_DIR}/storage/app/backups}"
mkdir -p "${BACKUP_DEST_DIR}"

RETENTION_DAYS="${RETENTION_DAYS:-14}"

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}🛡️  AutoCanvas Production Database Backup Engine                ${NC}"
echo -e "${BLUE}    Timestamp: ${TIMESTAMP}                                     ${NC}"
echo -e "${BLUE}================================================================${NC}"

# Ensure backend .env is available
ENV_FILE="${BACKEND_DIR}/.env"
if [ ! -f "${ENV_FILE}" ]; then
    echo -e "${RED}Error: .env file not found at ${ENV_FILE}${NC}"
    exit 1
fi

# Helper to read .env variable without sourcing whole file
get_env_val() {
    local key="$1"
    local default_val="${2:-}"
    local val
    val=$(grep -E "^${key}=" "${ENV_FILE}" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || echo "")
    if [ -z "${val}" ]; then
        echo "${default_val}"
    else
        echo "${val}"
    fi
}

DB_CONNECTION=$(get_env_val "DB_CONNECTION" "mysql")
DB_HOST=$(get_env_val "DB_HOST" "127.0.0.1")
DB_PORT=$(get_env_val "DB_PORT" "3306")
DB_DATABASE=$(get_env_val "DB_DATABASE" "autocanvas")
DB_USERNAME=$(get_env_val "DB_USERNAME" "root")
DB_PASSWORD=$(get_env_val "DB_PASSWORD" "")

echo -e "${YELLOW}Detected Connection:${NC} ${DB_CONNECTION}"
echo -e "${YELLOW}Target Database:${NC}     ${DB_DATABASE}"
echo -e "${YELLOW}Destination:${NC}         ${BACKUP_DEST_DIR}"

BACKUP_FILE=""

# --- Backup SQLite Database ---
if [ "${DB_CONNECTION}" = "sqlite" ]; then
    # In Laravel, SQLite DB can be a relative path or absolute
    SQLITE_PATH="${DB_DATABASE}"
    if [[ "${SQLITE_PATH}" != /* ]] && [[ "${SQLITE_PATH}" != ?:* ]]; then
        SQLITE_PATH="${BACKEND_DIR}/${SQLITE_PATH}"
    fi

    if [ ! -f "${SQLITE_PATH}" ]; then
        echo -e "${RED}Error: SQLite database file not found at ${SQLITE_PATH}${NC}"
        exit 1
    fi

    BACKUP_FILE="${BACKUP_DEST_DIR}/autocanvas_backup_sqlite_${TIMESTAMP}.sqlite.gz"
    TEMP_FILE="${BACKUP_DEST_DIR}/tmp_${TIMESTAMP}.sqlite"

    echo -e "\n${BLUE}▶ Creating consistent SQLite snapshot...${NC}"
    if command -v sqlite3 >/dev/null 2>&1; then
        sqlite3 "${SQLITE_PATH}" ".backup '${TEMP_FILE}'"
    else
        cp "${SQLITE_PATH}" "${TEMP_FILE}"
    fi

    gzip -9 -c "${TEMP_FILE}" > "${BACKUP_FILE}"
    rm -f "${TEMP_FILE}"

# --- Backup MySQL / MariaDB Database ---
elif [ "${DB_CONNECTION}" = "mysql" ] || [ "${DB_CONNECTION}" = "mariadb" ]; then
    BACKUP_FILE="${BACKUP_DEST_DIR}/autocanvas_backup_mysql_${TIMESTAMP}.sql.gz"

    echo -e "\n${BLUE}▶ Exporting MySQL database using mysqldump...${NC}"
    if ! command -v mysqldump >/dev/null 2>&1; then
        echo -e "${RED}Error: mysqldump CLI binary not found in PATH.${NC}"
        exit 1
    fi

    MYSQL_PWD="${DB_PASSWORD}" mysqldump \
        --host="${DB_HOST}" \
        --port="${DB_PORT}" \
        --user="${DB_USERNAME}" \
        --single-transaction \
        --quick \
        --skip-lock-tables \
        --routines \
        --triggers \
        "${DB_DATABASE}" | gzip -9 > "${BACKUP_FILE}"

else
    echo -e "${RED}Error: Unsupported DB_CONNECTION '${DB_CONNECTION}'. Supported: sqlite, mysql, mariadb.${NC}"
    exit 1
fi

# --- Generate Cryptographic Checksum ---
echo -e "\n${BLUE}▶ Generating SHA-256 integrity checksum...${NC}"
if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"
elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"
fi

FILE_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
echo -e "${GREEN}✓ Backup created successfully!${NC}"
echo -e "Archive:  ${YELLOW}${BACKUP_FILE}${NC} (${FILE_SIZE})"
if [ -f "${BACKUP_FILE}.sha256" ]; then
    echo -e "Checksum: ${YELLOW}$(cat "${BACKUP_FILE}.sha256" | awk '{print $1}')${NC}"
fi

# --- Retention Policy Cleanup ---
echo -e "\n${BLUE}▶ Pruning archives older than ${RETENTION_DAYS} days...${NC}"
if command -v find >/dev/null 2>&1; then
    find "${BACKUP_DEST_DIR}" -type f \( -name "autocanvas_backup_*.gz" -o -name "autocanvas_backup_*.sha256" \) -mtime "+${RETENTION_DAYS}" -exec rm -f {} + 2>/dev/null || true
    echo -e "${GREEN}✓ Expired backups pruned successfully.${NC}"
fi

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}🛡️  Database backup completed safely!                           ${NC}"
echo -e "${GREEN}================================================================${NC}"

