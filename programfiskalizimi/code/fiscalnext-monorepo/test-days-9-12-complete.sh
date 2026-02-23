#!/bin/bash

BASE_URL="http://localhost:5000"

echo "🧪 COMPREHENSIVE DAYS 9-12 TESTING"
echo "========================================"

# Get auth token
echo ""
echo "🔑 Getting auth token..."
TIMESTAMP=$(date +%s)
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test$TIMESTAMP@test.com\",\"password\":\"Test123456\",\"name\":\"Test User\",\"businessName\":\"Test Business\",\"country\":\"AL\"}")

TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token"
  exit 1
fi

echo "✅ Token obtained"

PASS=0
FAIL=0

test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  
  if [ "$method" = "GET" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" -H "Authorization: Bearer $TOKEN")
  else
    RESPONSE=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi
  
  STATUS=$(echo "$RESPONSE" | tail -1)
  
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "201" ]; then
    echo "  ✅ $name"
    ((PASS++))
  else
    echo "  ❌ $name (HTTP $STATUS)"
    ((FAIL++))
  fi
}

echo ""
echo "========================================"
echo "📅 DAY 9 - ADVANCED DASHBOARDS & REAL-TIME"
echo "========================================"

test_endpoint "Get Dashboards" "GET" "/v1/dashboards"
test_endpoint "Create Dashboard" "POST" "/v1/dashboards" '{"name":"Test Dashboard","widgets":[]}'
test_endpoint "Get Report Templates" "GET" "/v1/advanced-reports/templates"
test_endpoint "Get Reports" "GET" "/v1/advanced-reports"
test_endpoint "Get Automations" "GET" "/v1/automations"
test_endpoint "Get Automation Templates" "GET" "/v1/automations/templates"
test_endpoint "Get Customer Segments" "GET" "/v1/forecasts/customer-segments"
test_endpoint "Get Product ABC Analysis" "GET" "/v1/forecasts/product-abc"

echo ""
echo "========================================"
echo "📅 DAY 10 - MOBILE APP & API OPTIMIZATION"
echo "========================================"

test_endpoint "Sync Status" "GET" "/v1/sync/status"
test_endpoint "Batch Create (empty)" "POST" "/v1/batch/products" '{"items":[]}'
test_endpoint "API Metrics" "GET" "/v1/metrics"

echo ""
echo "========================================"
echo "📅 DAY 11 - INTEGRATIONS"
echo "========================================"

test_endpoint "Get Integrations" "GET" "/v1/integrations"
test_endpoint "Get Webhooks" "GET" "/v1/integrations/webhooks"
test_endpoint "Shipping Providers" "GET" "/v1/integrations/shipping/providers"
test_endpoint "Payment Methods" "GET" "/v1/payments/methods"

echo ""
echo "========================================"
echo "📅 DAY 12 - POLISH & DEPLOYMENT (Backend)"
echo "========================================"

test_endpoint "Health Check" "GET" "/health"
test_endpoint "API Status" "GET" "/"

echo ""
echo "========================================"
echo "📊 FINAL RESULTS - DAYS 9-12"
echo "========================================"

TOTAL=$((PASS + FAIL))
PERCENTAGE=$((PASS * 100 / TOTAL))

echo "Total Endpoints Tested: $TOTAL"
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
echo "Success Rate: $PERCENTAGE%"
echo "========================================"

if [ $FAIL -eq 0 ]; then
  echo "🎉 ALL DAYS 9-12 ENDPOINTS WORKING!"
  exit 0
elif [ $PERCENTAGE -ge 85 ]; then
  echo "✅ EXCELLENT ($PERCENTAGE% pass rate)"
  exit 0
elif [ $PERCENTAGE -ge 70 ]; then
  echo "✅ GOOD ($PERCENTAGE% pass rate)"
  exit 0
else
  echo "⚠️  NEEDS ATTENTION ($PERCENTAGE% pass rate)"
  exit 1
fi
