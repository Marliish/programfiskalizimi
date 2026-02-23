#!/bin/bash

BASE_URL="http://localhost:5000"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkYTk2MWE0OS02NTNiLTRhOWYtYjAyNS1mNjdlY2RlNzM2NDUiLCJ0ZW5hbnRJZCI6IjI2Nzg5Y2JlLWZlODYtNDhhZS05NGIzLTNiYzZhYjU5OWY4ZiIsImVtYWlsIjoidGVzdC1kYXk1QGZpc2NhbG5leHQuY29tIiwicm9sZXMiOlsib3duZXIiXSwicGVybWlzc2lvbnMiOltdLCJpYXQiOjE3NzE4NzM1MTF9.PGHNXlzAUEPcOaI_d3_HgZd3OrGpIuhS3hEJxGkI32Q"

PASS=0
FAIL=0

test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local check=$5
  
  if [ "$method" = "GET" ]; then
    RESPONSE=$(curl -s -X GET "$BASE_URL$endpoint" -H "Authorization: Bearer $TOKEN")
  else
    RESPONSE=$(curl -s -X $method "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi
  
  if echo "$RESPONSE" | grep -q "$check"; then
    echo "✅ $name"
    ((PASS++))
  else
    echo "❌ $name"
    ((FAIL++))
  fi
}

echo "🧪 COMPREHENSIVE TESTING - DAYS 5-8"
echo "========================================"

# DAY 5 TESTS
echo ""
echo "📅 DAY 5 - Polish & Advanced Features"
test_endpoint "Locations List" "GET" "/v1/locations" "" "locations"
test_endpoint "Analytics Dashboard" "GET" "/v1/analytics/dashboard" "" "totalRevenue"
test_endpoint "Sales Trends Daily" "GET" "/v1/analytics/sales-trends?period=daily" "" "trends"
test_endpoint "Top Products" "GET" "/v1/analytics/top-products?period=month&limit=10" "" "products"
test_endpoint "Tax Settings" "GET" "/v1/tax-integration/settings" "" "country"

# DAY 6 TESTS
echo ""
echo "📅 DAY 6 - Employee & Loyalty"
test_endpoint "Employees List" "GET" "/v1/employees" "" "employees"
test_endpoint "Loyalty Rewards" "GET" "/v1/loyalty/rewards" "" "rewards"
test_endpoint "Customer Tiers" "GET" "/v1/loyalty/tiers" "" "tiers"
test_endpoint "Promotions List" "GET" "/v1/promotions" "" "promotions"
test_endpoint "Notifications List" "GET" "/v1/notifications" "" "notifications"
test_endpoint "Audit Logs" "GET" "/v1/audit-logs?limit=10" "" "logs"

# DAY 7 TESTS
echo ""
echo "📅 DAY 7 - Integrations & Exports"
test_endpoint "QuickBooks Export" "GET" "/v1/exports/quickbooks?startDate=2026-01-01&endDate=2026-02-28" "" "TRNS"
test_endpoint "Payment Methods" "GET" "/v1/payments/methods" "" "stripe"
test_endpoint "Email Campaigns" "GET" "/v1/email-marketing/campaigns" "" "campaigns"
test_endpoint "Backup List" "GET" "/v1/backup/list" "" "backups"

# Summary
echo ""
echo "========================================"
echo "📊 TEST RESULTS"
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
echo "========================================"

if [ $FAIL -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED!"
  exit 0
else
  echo "⚠️  SOME TESTS FAILED"
  exit 1
fi
