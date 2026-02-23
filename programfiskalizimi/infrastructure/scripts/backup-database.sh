#!/bin/bash

# ========================================
# Tafa Platform - Manual Database Backup
# ========================================
# Purpose: Create manual database backup

set -e

cd "$(dirname "$0")/.."

echo "🔄 Starting database backup..."

# Load environment variables
if [ -f .env.db ]; then
    export $(cat .env.db | grep -v '^#' | xargs)
else
    echo "❌ Error: .env.db file not found!"
    exit 1
fi

# Create backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/manual"
BACKUP_FILE="${BACKUP_DIR}/tafa_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

# Create backup
echo "📦 Creating backup: ${BACKUP_FILE}"
docker exec tafa-postgres pg_dump -U "${DB_USER}" -d "${DB_NAME}" -Fc | gzip > "${BACKUP_FILE}"

# Verify backup
if [ -f "${BACKUP_FILE}" ]; then
    SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "✅ Backup created successfully!"
    echo "   File: ${BACKUP_FILE}"
    echo "   Size: ${SIZE}"
    
    # Store metadata
    echo "{
  \"timestamp\": \"${TIMESTAMP}\",
  \"database\": \"${DB_NAME}\",
  \"file\": \"${BACKUP_FILE}\",
  \"size\": \"${SIZE}\",
  \"type\": \"manual\"
}" > "${BACKUP_DIR}/tafa_${TIMESTAMP}.json"
    
else
    echo "❌ Backup failed!"
    exit 1
fi

echo ""
echo "🎯 Backup complete! To restore:"
echo "   ./scripts/restore-database.sh ${BACKUP_FILE}"
