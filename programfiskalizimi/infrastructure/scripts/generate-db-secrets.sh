#!/bin/bash

# ========================================
# Tafa Platform - Generate Database Secrets
# ========================================
# Purpose: Generate secure passwords and create .env.db file

set -e

echo "🔐 Generating secure database credentials..."

# Function to generate secure password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Generate passwords
DB_PASSWORD=$(generate_password)
REDIS_PASSWORD=$(generate_password)
PGADMIN_PASSWORD=$(generate_password)

# Create .env.db file
cat > .env.db << EOF
# ========================================
# Tafa Platform - Database Configuration
# ========================================
# Generated: $(date)
# IMPORTANT: Store these in HashiCorp Vault or AWS Secrets Manager

# PostgreSQL Database Configuration
DB_USER=tafa_admin
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=tafa_production
DB_PORT=5432
DB_REPLICA_PORT=5433

# Redis Configuration
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_PORT=6379

# PgAdmin Configuration (dev/staging only)
PGADMIN_EMAIL=admin@tafa.al
PGADMIN_PASSWORD=${PGADMIN_PASSWORD}
PGADMIN_PORT=5050

# Database Connection String
DATABASE_URL=postgresql://\${DB_USER}:\${DB_PASSWORD}@localhost:\${DB_PORT}/\${DB_NAME}?schema=public&sslmode=prefer&connect_timeout=10

# Redis Connection String
REDIS_URL=redis://:\${REDIS_PASSWORD}@localhost:\${REDIS_PORT}/0
EOF

# Set secure permissions
chmod 600 .env.db

echo "✅ Secrets generated successfully!"
echo ""
echo "📝 Database credentials saved to: .env.db"
echo ""
echo "⚠️  IMPORTANT SECURITY STEPS:"
echo "   1. Copy .env.db to your password manager or Vault"
echo "   2. Never commit .env.db to git"
echo "   3. Use environment-specific secrets in production"
echo ""
echo "🔑 Quick reference (save these securely):"
echo "   DB Password:      ${DB_PASSWORD}"
echo "   Redis Password:   ${REDIS_PASSWORD}"
echo "   PgAdmin Password: ${PGADMIN_PASSWORD}"
echo ""
echo "🚀 Next steps:"
echo "   1. Move secrets to Vault: ./scripts/vault-setup.sh"
echo "   2. Start database: docker-compose -f docker-compose.db.yml up -d"
echo "   3. Run migrations: cd ../code/backend && pnpm prisma migrate deploy"
echo ""
