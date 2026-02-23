#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkYTk2MWE0OS02NTNiLTRhOWYtYjAyNS1mNjdlY2RlNzM2NDUiLCJ0ZW5hbnRJZCI6IjI2Nzg5Y2JlLWZlODYtNDhhZS05NGIzLTNiYzZhYjU5OWY4ZiIsImVtYWlsIjoidGVzdC1kYXk1QGZpc2NhbG5leHQuY29tIiwicm9sZXMiOlsib3duZXIiXSwicGVybWlzc2lvbnMiOltdLCJpYXQiOjE3NzE4NzM1MTF9.PGHNXlzAUEPcOaI_d3_HgZd3OrGpIuhS3hEJxGkI32Q"

PASS=0
FAIL=0
TOTAL=0

test_api() {
  local name=$1
  local endpoint=$2
  local check=$3
  
  ((TOTAL++))
  RESPONSE=$(curl -s "http://localhost:5000$endpoint" -H "Authorization: Bearer $TOKEN")
  
  if echo "$RESPONSE" | grep -q "$check"; then
    echo "  ✅ $name"
    ((PASS++))
    return 0
  else
    echo "  ❌ $name"
    ((FAIL++))
    return 1
  fi
}

echo "🧪 FINAL COMPREHENSIVE TEST REPORT"
echo "=========================================="

echo ""
echo "📅 DAY 5 - Advanced Features (5 tests)"
test_api "Locations API" "/v1/locations" "locations"
test_api "Dashboard Summary" "/v1/analytics/dashboard-summary" "summary"
test_api "Sales Trends" "/v1/analytics/sales-trends?period=daily" "trends"
test_api "Top Products" "/v1/analytics/top-products?period=month&limit=10" "products"
test_api "Tax Settings" "/v1/tax-integration/settings" "country"

echo ""
echo "📅 DAY 6 - Enterprise Features (11 tests)"
test_api "Employees List" "/v1/employees" "success"
test_api "Employee Performance" "/v1/employees/performance" "performance"
test_api "Loyalty Rewards" "/v1/loyalty/rewards" "success"
test_api "Customer Tiers" "/v1/loyalty/tiers" "tiers"
test_api "Loyalty Points" "/v1/loyalty/points" "points"
test_api "Promotions List" "/v1/promotions" "success"
test_api "Active Promotions" "/v1/promotions/active" "promotions"
test_api "Notifications" "/v1/notifications" "success"
test_api "Notification Preferences" "/v1/notifications/preferences" "preferences"
test_api "Audit Logs" "/v1/audit-logs?limit=10" "logs"
test_api "Activity Summary" "/v1/audit-logs/activity-summary" "summary"

echo ""
echo "📅 DAY 7 - Integrations (8 tests)"
test_api "Payment Methods" "/v1/payments/methods" "stripe"
test_api "Payment Stats" "/v1/payments/stats" "stats"
test_api "Email Campaigns" "/v1/email-marketing/campaigns" "campaigns"
test_api "Email Templates" "/v1/email-marketing/templates" "templates"
test_api "Barcode Types" "/v1/barcode-printer/types" "types"
test_api "Printer Config" "/v1/barcode-printer/printers" "printers"
test_api "Backup List" "/v1/backup/list" "backups"
test_api "Backup Stats" "/v1/backup/stats" "totalBackups"

echo ""
echo "=========================================="
echo "📊 FINAL RESULTS"
echo "=========================================="
echo "Total Tests:  $TOTAL"
echo "✅ Passed:    $PASS"
echo "❌ Failed:    $FAIL"
PERCENTAGE=$((PASS * 100 / TOTAL))
echo "Success Rate: $PERCENTAGE%"
echo "=========================================="

if [ $FAIL -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED!"
elif [ $PERCENTAGE -ge 80 ]; then
  echo "✅ MOSTLY WORKING ($PERCENTAGE% pass rate)"
else
  echo "⚠️  NEEDS ATTENTION ($PERCENTAGE% pass rate)"
fi
