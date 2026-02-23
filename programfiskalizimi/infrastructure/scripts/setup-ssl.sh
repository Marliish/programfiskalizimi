#!/bin/bash

# ========================================
# Tafa Platform - SSL Certificate Setup
# ========================================
# Purpose: Obtain Let's Encrypt SSL certificates

set -e

cd "$(dirname "$0")/.."

DOMAIN="${1:-staging.tafa.al}"
EMAIL="${2:-admin@tafa.al}"

echo "🔐 Setting up SSL certificate for: ${DOMAIN}"
echo "   Email: ${EMAIL}"
echo ""

# Start NGINX for Let's Encrypt challenge
echo "📦 Starting NGINX..."
docker-compose -f docker-compose.nginx.yml up -d nginx

# Wait for NGINX to be ready
sleep 5

# Obtain certificate
echo "🎯 Obtaining SSL certificate..."
docker-compose -f docker-compose.nginx.yml run --rm certbot \
    certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d "${DOMAIN}"

# Reload NGINX to use new certificate
echo "🔄 Reloading NGINX..."
docker-compose -f docker-compose.nginx.yml restart nginx

echo ""
echo "✅ SSL certificate obtained successfully!"
echo ""
echo "📋 Certificate details:"
docker-compose -f docker-compose.nginx.yml run --rm certbot certificates
echo ""
echo "🎯 Certificate will auto-renew every 12 hours"
echo ""
echo "🌐 Your site is now available at: https://${DOMAIN}"
