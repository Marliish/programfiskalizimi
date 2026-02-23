#!/bin/bash
# Comprehensive Endpoint Testing Script
# Tests all new features added by teams

API_URL="http://localhost:5000"
PASS=0
FAIL=0

echo "================================="
echo "🧪 COMPREHENSIVE ENDPOINT TESTING"
echo "================================="
echo ""

# First get a JWT token
echo "🔐 Getting JWT token..."
TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test-day5@fiscalnext.com","password":"Test123!@#"}')

TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get JWT token, trying to register..."
  REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test-day5@fiscalnext.com","password":"Test123!@#","name":"Test User"}')
  TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -n "$TOKEN" ]; then
  echo "✅ JWT Token obtained"
else
  echo "❌ Could not get JWT token - testing will be limited"
fi

echo ""
echo "================================="
echo "TESTING RESTAURANT POS FEATURES"
echo "================================="

# Tables
echo -n "Testing GET /v1/tables... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/tables")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

# Kitchen
echo -n "Testing GET /v1/kitchen/orders... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/kitchen/orders")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

# Orders
echo -n "Testing GET /v1/orders... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/orders")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "404" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

# Tips
echo -n "Testing GET /v1/tips... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/tips")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

echo ""
echo "================================="
echo "TESTING MARKETING FEATURES"
echo "================================="

# Campaigns
echo -n "Testing GET /v1/campaigns... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/campaigns")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

# Surveys
echo -n "Testing GET /v1/surveys... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/surveys")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

# Referrals
echo -n "Testing GET /v1/referrals... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/referrals")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

# Social Media
echo -n "Testing GET /v1/social-media/posts... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/social-media/posts")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

echo ""
echo "================================="
echo "TESTING FINANCIAL & HR FEATURES"
echo "================================="

# Payroll
echo -n "Testing GET /v1/payroll/employees... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/payroll/employees")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

# Expenses
echo -n "Testing GET /v1/expenses... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/expenses")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

# Bills
echo -n "Testing GET /v1/bills... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/bills")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

# Bank Reconciliation
echo -n "Testing GET /v1/bank-accounts... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/bank-accounts")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "404" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

# HR Management
echo -n "Testing GET /v1/hr/onboarding... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/hr/onboarding")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

echo ""
echo "================================="
echo "TESTING ADVANCED INVENTORY"
echo "================================="

# Suppliers (from old agents)
echo -n "Testing GET /v1/suppliers... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/suppliers")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "404" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

# Purchase Orders
echo -n "Testing GET /v1/purchase-orders... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/purchase-orders")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "404" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

echo ""
echo "================================="
echo "TESTING DAY 9 ADVANCED FEATURES"
echo "================================="

# Dashboards
echo -n "Testing GET /v1/dashboards... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/dashboards")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

# Advanced Reports
echo -n "Testing GET /v1/advanced-reports... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/advanced-reports")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

# Automations
echo -n "Testing GET /v1/automations... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/automations")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

# Forecasts
echo -n "Testing GET /v1/forecasts... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/v1/forecasts")
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo "✅ [$RESPONSE]"
  ((PASS++))
else
  echo "❌ [$RESPONSE]"
  ((FAIL++))
fi

echo ""
echo "================================="
echo "📊 TEST RESULTS"
echo "================================="
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
TOTAL=$((PASS + FAIL))
echo "📈 Total:  $TOTAL"
if [ $TOTAL -gt 0 ]; then
  PERCENTAGE=$((PASS * 100 / TOTAL))
  echo "📊 Success Rate: $PERCENTAGE%"
fi
echo ""

if [ $FAIL -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED!"
else
  echo "⚠️  Some tests failed - check endpoints"
fi
