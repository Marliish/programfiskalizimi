#!/bin/bash

# ========================================
# Tafa Platform - Vault Setup Script
# ========================================
# Purpose: Initialize and configure HashiCorp Vault

set -e

cd "$(dirname "$0")/.."

echo "🔐 Starting HashiCorp Vault setup..."

# Start Vault
echo "📦 Starting Vault container..."
docker-compose -f docker-compose.vault.yml up -d

# Wait for Vault to be ready
echo "⏳ Waiting for Vault to be ready..."
sleep 5

# Check if Vault is already initialized
if docker exec tafa-vault vault status 2>&1 | grep -q "Initialized.*true"; then
    echo "✅ Vault is already initialized!"
    echo ""
    echo "🔑 Unseal keys and root token should be in: vault-config/unseal-keys.txt"
    echo ""
    exit 0
fi

# Initialize Vault
echo "🎯 Initializing Vault..."
INIT_OUTPUT=$(docker exec tafa-vault vault operator init -key-shares=5 -key-threshold=3 -format=json)

# Save unseal keys and root token
echo "$INIT_OUTPUT" > vault-config/init-output.json
chmod 600 vault-config/init-output.json

# Extract keys and token
UNSEAL_KEY_1=$(echo "$INIT_OUTPUT" | jq -r '.unseal_keys_b64[0]')
UNSEAL_KEY_2=$(echo "$INIT_OUTPUT" | jq -r '.unseal_keys_b64[1]')
UNSEAL_KEY_3=$(echo "$INIT_OUTPUT" | jq -r '.unseal_keys_b64[2]')
UNSEAL_KEY_4=$(echo "$INIT_OUTPUT" | jq -r '.unseal_keys_b64[3]')
UNSEAL_KEY_5=$(echo "$INIT_OUTPUT" | jq -r '.unseal_keys_b64[4]')
ROOT_TOKEN=$(echo "$INIT_OUTPUT" | jq -r '.root_token')

# Save to readable format
cat > vault-config/unseal-keys.txt << EOF
========================================
Tafa Platform - Vault Unseal Keys
========================================
Generated: $(date)

⚠️  CRITICAL: Store these securely and never commit to git!

Unseal Key 1: ${UNSEAL_KEY_1}
Unseal Key 2: ${UNSEAL_KEY_2}
Unseal Key 3: ${UNSEAL_KEY_3}
Unseal Key 4: ${UNSEAL_KEY_4}
Unseal Key 5: ${UNSEAL_KEY_5}

Root Token: ${ROOT_TOKEN}

Instructions:
- Need 3 of 5 keys to unseal Vault
- Keep these in separate secure locations
- Use root token to login to Vault UI: http://localhost:8200
========================================
EOF

chmod 600 vault-config/unseal-keys.txt

# Unseal Vault
echo "🔓 Unsealing Vault..."
docker exec tafa-vault vault operator unseal "$UNSEAL_KEY_1" > /dev/null
docker exec tafa-vault vault operator unseal "$UNSEAL_KEY_2" > /dev/null
docker exec tafa-vault vault operator unseal "$UNSEAL_KEY_3" > /dev/null

# Login and configure
echo "🔧 Configuring Vault..."
docker exec -e VAULT_TOKEN="$ROOT_TOKEN" tafa-vault vault secrets enable -version=2 -path=tafa kv || true
docker exec -e VAULT_TOKEN="$ROOT_TOKEN" tafa-vault vault secrets enable -path=database database || true

# Store database secrets
echo "📝 Storing database secrets in Vault..."
docker exec -e VAULT_TOKEN="$ROOT_TOKEN" tafa-vault vault kv put tafa/database \
    DB_USER="tafa_admin" \
    DB_PASSWORD="$(grep DB_PASSWORD ../.env.db | cut -d= -f2)" \
    DB_NAME="tafa_production" \
    DB_HOST="tafa-postgres" \
    DB_PORT="5432" \
    REDIS_PASSWORD="$(grep REDIS_PASSWORD ../.env.db | cut -d= -f2)" \
    || echo "Note: Secrets already exist or env file not found"

echo ""
echo "✅ Vault setup complete!"
echo ""
echo "📋 Important information saved to: vault-config/unseal-keys.txt"
echo ""
echo "🌐 Access Vault UI: http://localhost:8200"
echo "🔑 Root Token: ${ROOT_TOKEN}"
echo ""
echo "⚠️  NEXT STEPS:"
echo "   1. Copy vault-config/unseal-keys.txt to your password manager"
echo "   2. Delete or encrypt unseal-keys.txt after saving"
echo "   3. Never commit these files to git"
echo "   4. Set up Vault policies for application access"
echo ""
