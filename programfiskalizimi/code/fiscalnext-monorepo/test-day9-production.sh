#!/bin/bash

BASE_URL="http://localhost:5000"

echo "🧪 DAY 9 PRODUCTION TESTING"
echo "================================"

# Get auth token
echo ""
echo "🔑 Getting auth token..."
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test-day5@fiscalnext.com","password":"Test123!@#"}')

TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  # Try creating a new user
  echo "Creating test user..."
  TIMESTAMP=$(date +%s)
  REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"testday9$TIMESTAMP@test.com\",\"password\":\"Test123456\",\"name\":\"Test User\",\"businessName\":\"Test Business\",\"country\":\"AL\"}")
  TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token"
  exit 1
fi

echo "✅ Token obtained"

# Test Day 9 endpoints
echo ""
echo "📊 TESTING DAY 9 FEATURES"
echo "================================"

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
  BODY=$(echo "$RESPONSE" | head -n -1)
  
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "201" ]; then
    echo "  ✅ $name (HTTP $STATUS)"
    ((PASS++))
  else
    echo "  ❌ $name (HTTP $STATUS)"
    echo "     Response: $(echo $BODY | head -c 100)"
    ((FAIL++))
  fi
}

echo ""
echo "1️⃣ DASHBOARDS"
test_endpoint "Get Dashboards" "GET" "/v1/dashboards"
test_endpoint "Create Dashboard" "POST" "/v1/dashboards" '{"name":"Test Dashboard","widgets":[]}'

echo ""
echo "2️⃣ ADVANCED REPORTS"
test_endpoint "Get Report Templates" "GET" "/v1/advanced-reports/templates"
test_endpoint "Get Reports" "GET" "/v1/advanced-reports"

echo ""
echo "3️⃣ AUTOMATIONS"
test_endpoint "Get Automations" "GET" "/v1/automations"
test_endpoint "Get Automation Templates" "GET" "/v1/automations/templates"

echo ""
echo "4️⃣ BUSINESS INTELLIGENCE"
test_endpoint "Get Customer Segments" "GET" "/v1/forecasts/customer-segments"
test_endpoint "Get Product ABC Analysis" "GET" "/v1/forecasts/product-abc"

echo ""
echo "================================"
echo "📊 TEST RESULTS"
echo "================================"
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"

TOTAL=$((PASS + FAIL))
PERCENTAGE=$((PASS * 100 / TOTAL))
echo "Success Rate: $PERCENTAGE%"
echo "================================"

if [ $FAIL -eq 0 ]; then
  echo "🎉 ALL DAY 9 ENDPOINTS WORKING!"
  exit 0
elif [ $PERCENTAGE -ge 75 ]; then
  echo "✅ MOSTLY WORKING ($PERCENTAGE%)"
  exit 0
else
  echo "⚠️  NEEDS ATTENTION ($PERCENTAGE%)"
  exit 1
fi
