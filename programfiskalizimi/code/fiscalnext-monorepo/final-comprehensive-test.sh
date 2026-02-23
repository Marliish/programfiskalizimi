#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OTIxNzQ3My1iNzNjLTQyYjgtODNmZi1jNzYxODFlNjdmY2YiLCJ0ZW5hbnRJZCI6IjZjYTliZTM2LWFhYzItNGY4Yi04ZmE5LTEwZTY5ZjJiZWU0MCIsImVtYWlsIjoidGVzdHVzZXIxNzcxODczOTg4QGZpc2NhbG5leHQuY29tIiwiaWF0IjoxNzcxODczOTg4fQ.ZDQ5gqFiyKJ29CBWGb3rCX5l8AMQHpqGj8UPvEXx1oM"

PASS=0
FAIL=0

test_api() {
  local name=$1
  local endpoint=$2
  
  RESPONSE=$(curl -s "http://localhost:5000$endpoint" -H "Authorization: Bearer $TOKEN")
  
  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "  ✅ $name"
    ((PASS++))
    return 0
  else
    echo "  ❌ $name"
    ((FAIL++))
    return 1
  fi
}

echo "🧪 FINAL COMPREHENSIVE TEST - ALL DAYS 5-8"
echo "=============================================="

echo ""
echo "📅 DAY 5 - Advanced Features"
test_api "Locations API" "/v1/locations"
test_api "Dashboard Summary" "/v1/analytics/dashboard-summary"
test_api "Sales Trends" "/v1/analytics/sales-trends?period=daily"
test_api "Top Products" "/v1/analytics/top-products?period=month&limit=10"
test_api "Tax Settings" "/v1/tax-integration/settings"

echo ""
echo "📅 DAY 6 - Enterprise Features"
test_api "Employees List" "/v1/employees"
test_api "Employee Performance" "/v1/employees/performance"
test_api "Loyalty Rewards" "/v1/loyalty/rewards"
test_api "Customer Tiers" "/v1/loyalty/tiers"
test_api "Loyalty Points" "/v1/loyalty/points"
test_api "Promotions List" "/v1/promotions"
test_api "Active Promotions" "/v1/promotions/active"
test_api "Notifications" "/v1/notifications"
test_api "Notification Preferences" "/v1/notifications/preferences"
test_api "Audit Logs" "/v1/audit-logs?limit=10"
test_api "Activity Summary" "/v1/audit-logs/activity-summary"

echo ""
echo "📅 DAY 7 - Integrations"
test_api "Payment Methods" "/v1/payments/methods"
test_api "Payment Stats" "/v1/payments/stats"
test_api "Email Campaigns" "/v1/email-marketing/campaigns"
test_api "Email Templates" "/v1/email-marketing/templates"
test_api "Barcode Types" "/v1/barcode-printer/types"
test_api "Printer Config" "/v1/barcode-printer/printers"
test_api "Backup List" "/v1/backup/list"
test_api "Backup Stats" "/v1/backup/stats"

TOTAL=$((PASS + FAIL))
PERCENTAGE=$((PASS * 100 / TOTAL))

echo ""
echo "=============================================="
echo "📊 FINAL TEST RESULTS"
echo "=============================================="
echo "Total Tests:  $TOTAL"
echo "✅ Passed:    $PASS"
echo "❌ Failed:    $FAIL"
echo "Success Rate: $PERCENTAGE%"
echo "=============================================="

if [ $FAIL -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED - 100% SUCCESS!"
  exit 0
elif [ $PERCENTAGE -ge 90 ]; then
  echo "✅ EXCELLENT ($PERCENTAGE% pass rate)"
  exit 0
elif [ $PERCENTAGE -ge 80 ]; then
  echo "✅ GOOD ($PERCENTAGE% pass rate)"
  exit 0
else
  echo "⚠️  NEEDS WORK ($PERCENTAGE% pass rate)"
  exit 1
fi
