#!/bin/bash
# Simple Day 6 Test

BASE_URL="http://localhost:5000/v1"

echo "=== Day 6 Features Test ==="
echo ""

# Login
echo "1. Logging in..."
LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@fiscalnext.com",
    "password": "Test123!"
  }')

TOKEN=$(echo $LOGIN | jq -r '.data.token // .token // empty')

if [ -z "$TOKEN" ]; then
    echo "ERROR: Login failed"
    echo "Response: $LOGIN"
    exit 1
fi

echo "✓ Logged in successfully"
echo ""

# Test Employees
echo "2. Testing /v1/employees (GET)..."
curl -s -X GET "$BASE_URL/employees" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test Loyalty
echo "3. Testing /v1/loyalty/rewards (GET)..."
curl -s -X GET "$BASE_URL/loyalty/rewards" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test Promotions
echo "4. Testing /v1/promotions (GET)..."
curl -s -X GET "$BASE_URL/promotions" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test Notifications
echo "5. Testing /v1/notifications/templates (GET)..."
curl -s -X GET "$BASE_URL/notifications/templates" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test Audit
echo "6. Testing /v1/audit (GET)..."
curl -s -X GET "$BASE_URL/audit?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo "=== All tests completed! ==="
