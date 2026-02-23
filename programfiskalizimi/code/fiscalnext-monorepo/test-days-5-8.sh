#!/bin/bash

BASE_URL="http://localhost:5000"
TOKEN=""

echo "🧪 TESTING DAYS 5-8 FEATURES"
echo "================================"

# Get auth token
echo ""
echo "🔑 Getting auth token..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@fiscalnext.com","password":"test123"}')
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi
echo "✅ Token obtained"

# DAY 5 TESTS
echo ""
echo "📅 DAY 5 TESTING"
echo "----------------"

# Test locations
echo "Testing locations API..."
curl -s -X GET "$BASE_URL/v1/locations" \
  -H "Authorization: Bearer $TOKEN" | grep -q "locations" && echo "✅ Locations API" || echo "❌ Locations API"

# Test analytics
echo "Testing analytics API..."
curl -s -X GET "$BASE_URL/v1/analytics/dashboard" \
  -H "Authorization: Bearer $TOKEN" | grep -q "totalRevenue" && echo "✅ Analytics Dashboard" || echo "❌ Analytics Dashboard"

curl -s -X GET "$BASE_URL/v1/analytics/sales-trends?period=daily" \
  -H "Authorization: Bearer $TOKEN" | grep -q "trends" && echo "✅ Sales Trends" || echo "❌ Sales Trends"

# Test tax settings
echo "Testing tax integration..."
curl -s -X GET "$BASE_URL/v1/tax-integration/settings" \
  -H "Authorization: Bearer $TOKEN" | grep -q "country" && echo "✅ Tax Settings" || echo "❌ Tax Settings"

# DAY 6 TESTS
echo ""
echo "📅 DAY 6 TESTING"
echo "----------------"

# Test employees
echo "Testing employees API..."
curl -s -X GET "$BASE_URL/v1/employees" \
  -H "Authorization: Bearer $TOKEN" | grep -q "employees" && echo "✅ Employees API" || echo "❌ Employees API"

# Test loyalty
echo "Testing loyalty API..."
curl -s -X GET "$BASE_URL/v1/loyalty/rewards" \
  -H "Authorization: Bearer $TOKEN" | grep -q "rewards" && echo "✅ Loyalty Rewards" || echo "❌ Loyalty Rewards"

# Test promotions
echo "Testing promotions API..."
curl -s -X GET "$BASE_URL/v1/promotions" \
  -H "Authorization: Bearer $TOKEN" | grep -q "promotions" && echo "✅ Promotions API" || echo "❌ Promotions API"

# Test notifications
echo "Testing notifications API..."
curl -s -X GET "$BASE_URL/v1/notifications" \
  -H "Authorization: Bearer $TOKEN" | grep -q "notifications" && echo "✅ Notifications API" || echo "❌ Notifications API"

# Test audit logs
echo "Testing audit logs API..."
curl -s -X GET "$BASE_URL/v1/audit-logs?limit=10" \
  -H "Authorization: Bearer $TOKEN" | grep -q "logs" && echo "✅ Audit Logs API" || echo "❌ Audit Logs API"

# DAY 7 TESTS
echo ""
echo "📅 DAY 7 TESTING"
echo "----------------"

# Test exports
echo "Testing accounting exports..."
curl -s -X GET "$BASE_URL/v1/exports/quickbooks?startDate=2026-01-01&endDate=2026-02-28" \
  -H "Authorization: Bearer $TOKEN" | grep -q "TRNS" && echo "✅ QuickBooks Export" || echo "❌ QuickBooks Export"

# Test payments
echo "Testing payment gateways..."
curl -s -X GET "$BASE_URL/v1/payments/methods" \
  -H "Authorization: Bearer $TOKEN" | grep -q "stripe" && echo "✅ Payment Methods" || echo "❌ Payment Methods"

# Test email marketing
echo "Testing email marketing..."
curl -s -X GET "$BASE_URL/v1/email-marketing/campaigns" \
  -H "Authorization: Bearer $TOKEN" | grep -q "campaigns" && echo "✅ Email Campaigns" || echo "❌ Email Campaigns"

# Test barcodes
echo "Testing barcode generation..."
curl -s -X POST "$BASE_URL/v1/barcode-printer/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"ean13","data":"1234567890123"}' | grep -q "base64" && echo "✅ Barcode Generation" || echo "❌ Barcode Generation"

# Test backups
echo "Testing backup system..."
curl -s -X GET "$BASE_URL/v1/backup/list" \
  -H "Authorization: Bearer $TOKEN" | grep -q "backups" && echo "✅ Backup List" || echo "❌ Backup List"

echo ""
echo "================================"
echo "✅ TESTING COMPLETE"
