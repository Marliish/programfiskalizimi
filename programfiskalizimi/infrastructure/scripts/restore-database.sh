#!/bin/bash

# ========================================
# Tafa Platform - Database Restore
# ========================================
# Purpose: Restore database from backup

set -e

cd "$(dirname "$0")/.."

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "❌ Error: Backup file not specified!"
    echo ""
    echo "Usage: ./restore-database.sh <backup_file>"
    echo ""
    echo "Available backups:"
    find ./backups -name "*.sql.gz" -type f | sort -r | head -10
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

# Load environment variables
if [ -f .env.db ]; then
    export $(cat .env.db | grep -v '^#' | xargs)
else
    echo "❌ Error: .env.db file not found!"
    exit 1
fi

echo "⚠️  WARNING: This will restore the database from backup!"
echo "   Database: ${DB_NAME}"
echo "   Backup: ${BACKUP_FILE}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled."
    exit 0
fi

echo ""
echo "🔄 Starting database restore..."

# Stop applications if running (to prevent connections)
echo "📢 Stopping application containers..."
docker-compose -f docker-compose.app.yml down || true

# Drop and recreate database
echo "🗑️  Dropping existing database..."
docker exec tafa-postgres psql -U "${DB_USER}" -c "DROP DATABASE IF EXISTS ${DB_NAME};" postgres
docker exec tafa-postgres psql -U "${DB_USER}" -c "CREATE DATABASE ${DB_NAME};" postgres

# Restore backup
echo "📥 Restoring backup..."
gunzip -c "${BACKUP_FILE}" | docker exec -i tafa-postgres pg_restore -U "${DB_USER}" -d "${DB_NAME}" --no-owner --no-acl

# Run post-restore scripts
echo "🔧 Running post-restore tasks..."
docker exec tafa-postgres psql -U "${DB_USER}" -d "${DB_NAME}" -c "VACUUM ANALYZE;"

echo ""
echo "✅ Database restored successfully!"
echo ""
echo "🚀 Next steps:"
echo "   1. Verify data integrity"
echo "   2. Restart application: docker-compose -f docker-compose.app.yml up -d"
echo "   3. Test application functionality"
