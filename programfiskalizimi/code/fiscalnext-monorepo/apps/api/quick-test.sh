#!/bin/bash
# Quick Day 6 Features Test

BASE_URL="http://localhost:5000/v1"

echo "Testing Day 6 Features..."
echo ""

# Try to register a new user for testing
echo "1. Creating test user..."
REGISTER=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Test Company",
    "tenantSlug": "test-company",
    "email": "day6-test@fiscalnext.com",
    "password": "Test123!@#",
    "firstName": "Day6",
    "lastName": "Tester"
  }')

echo "$REGISTER" | jq '.'

# Login
echo ""
echo "2. Logging in..."
LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "day6-test@fiscalnext.com",
    "password": "Test123!@#"
  }')

TOKEN=$(echo $LOGIN | jq -r '.data.token // .token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "Login failed. Trying existing user..."
    
    LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test-day5@fiscalnext.com",
        "password": "password123"
      }')
    
    TOKEN=$(echo $LOGIN | jq -r '.data.token // .token')
fi

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "ERROR: Could not get token"
    echo "Login response: $LOGIN"
    exit 1
fi

echo "✓ Logged in successfully"
echo "Token: ${TOKEN:0:50}..."

# Test Employee endpoint
echo ""
echo "3. Testing Employee Management..."
EMPLOYEE=$(curl -s -X POST "$BASE_URL/employees" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "employeeNumber": "TEST001",
    "firstName": "Test",
    "lastName": "Employee",
    "position": "Cashier",
    "hourlyRate": 15.0
  }')

echo "$EMPLOYEE" | jq '.'

# Test Loyalty endpoint
echo ""
echo "4. Testing Loyalty Program..."
REWARDS=$(curl -s -X GET "$BASE_URL/loyalty/rewards" \
  -H "Authorization: Bearer $TOKEN")

echo "$REWARDS" | jq '.data | length' || echo "$REWARDS"

# Test Promotions endpoint
echo ""
echo "5. Testing Promotions..."
PROMOTIONS=$(curl -s -X GET "$BASE_URL/promotions" \
  -H "Authorization: Bearer $TOKEN")

echo "$PROMOTIONS" | jq '.data | length' || echo "$PROMOTIONS"

# Test Notifications endpoint
echo ""
echo "6. Testing Notifications..."
TEMPLATES=$(curl -s -X GET "$BASE_URL/notifications/templates" \
  -H "Authorization: Bearer $TOKEN")

echo "$TEMPLATES" | jq '.data | length' || echo "$TEMPLATES"

# Test Audit endpoint
echo ""
echo "7. Testing Audit Logs..."
AUDIT=$(curl -s -X GET "$BASE_URL/audit?limit=5" \
  -H "Authorization: Bearer $TOKEN")

echo "$AUDIT" | jq '.data | length' || echo "$AUDIT"

echo ""
echo "✓ Basic Day 6 features test complete!"
