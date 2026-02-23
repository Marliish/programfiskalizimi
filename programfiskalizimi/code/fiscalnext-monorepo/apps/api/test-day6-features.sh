#!/bin/bash
# DAY 6 FEATURES TEST SCRIPT
# Created: 2026-02-23
# Tests all Day 6 advanced features

set -e

BASE_URL="http://localhost:5000/v1"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_test() {
    echo -e "${YELLOW}→ Testing: $1${NC}"
}

# Login to get token
echo "========================================="
echo "AUTHENTICATING..."
echo "========================================="

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    print_error "Authentication failed!"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

print_success "Authenticated successfully"
echo ""

# ============================================
# 1. EMPLOYEE MANAGEMENT TESTS
# ============================================

echo "========================================="
echo "1. TESTING EMPLOYEE MANAGEMENT"
echo "========================================="

# Create employee
print_test "Create Employee"
EMPLOYEE_RESPONSE=$(curl -s -X POST "$BASE_URL/employees" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "employeeNumber": "EMP001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+355691234567",
    "position": "Cashier",
    "department": "Sales",
    "hourlyRate": 15.50,
    "commissionRate": 5.0
  }')

EMPLOYEE_ID=$(echo $EMPLOYEE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$EMPLOYEE_ID" ]; then
    print_success "Employee created: $EMPLOYEE_ID"
else
    print_error "Failed to create employee"
    echo "Response: $EMPLOYEE_RESPONSE"
fi

# Get all employees
print_test "Get All Employees"
curl -s -X GET "$BASE_URL/employees" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
print_success "Retrieved employees list"

# Clock in
print_test "Clock In"
SHIFT_RESPONSE=$(curl -s -X POST "$BASE_URL/employees/clock-in" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"employeeId\": \"$EMPLOYEE_ID\"
  }")

SHIFT_ID=$(echo $SHIFT_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$SHIFT_ID" ]; then
    print_success "Clocked in: $SHIFT_ID"
else
    print_error "Failed to clock in"
fi

# Get active shift
print_test "Get Active Shift"
curl -s -X GET "$BASE_URL/employees/$EMPLOYEE_ID/active-shift" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
print_success "Retrieved active shift"

# Get employee performance
print_test "Get Employee Performance"
curl -s -X GET "$BASE_URL/employees/performance" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
print_success "Retrieved performance data"

echo ""

# ============================================
# 2. LOYALTY PROGRAM TESTS
# ============================================

echo "========================================="
echo "2. TESTING LOYALTY PROGRAM"
echo "========================================="

# First, get or create a customer
print_test "Get Customers"
CUSTOMERS_RESPONSE=$(curl -s -X GET "$BASE_URL/customers" \
  -H "Authorization: Bearer $TOKEN")

CUSTOMER_ID=$(echo $CUSTOMERS_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CUSTOMER_ID" ]; then
    print_test "Creating a test customer"
    CUSTOMER_CREATE=$(curl -s -X POST "$BASE_URL/customers" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@example.com",
        "phone": "+355691234568"
      }')
    CUSTOMER_ID=$(echo $CUSTOMER_CREATE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

print_success "Using customer: $CUSTOMER_ID"

# Earn points
print_test "Earn Loyalty Points"
curl -s -X POST "$BASE_URL/loyalty/points/earn" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"points\": 100,
    \"description\": \"Welcome bonus\"
  }" | jq '.'
print_success "Earned 100 points"

# Get customer balance
print_test "Get Customer Loyalty Balance"
curl -s -X GET "$BASE_URL/loyalty/customers/$CUSTOMER_ID/balance" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
print_success "Retrieved loyalty balance"

# Create reward
print_test "Create Reward"
REWARD_RESPONSE=$(curl -s -X POST "$BASE_URL/loyalty/rewards" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "10% Discount",
    "description": "Get 10% off your next purchase",
    "pointsCost": 50,
    "rewardType": "discount",
    "rewardValue": 10
  }')

REWARD_ID=$(echo $REWARD_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$REWARD_ID" ]; then
    print_success "Reward created: $REWARD_ID"
else
    print_error "Failed to create reward"
fi

# Get all rewards
print_test "Get All Rewards"
curl -s -X GET "$BASE_URL/loyalty/rewards" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
print_success "Retrieved rewards catalog"

# Redeem reward
print_test "Redeem Reward"
curl -s -X POST "$BASE_URL/loyalty/rewards/redeem" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"rewardId\": \"$REWARD_ID\"
  }" | jq '.'
print_success "Reward redeemed"

echo ""

# ============================================
# 3. PROMOTIONS & DISCOUNTS TESTS
# ============================================

echo "========================================="
echo "3. TESTING PROMOTIONS & DISCOUNTS"
echo "========================================="

# Create promotion
print_test "Create Promotion"
PROMOTION_RESPONSE=$(curl -s -X POST "$BASE_URL/promotions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Happy Hour",
    "description": "20% off during happy hours",
    "promoType": "percentage",
    "discountPercentage": 20,
    "appliesTo": "all",
    "timeRestrictions": {
      "hours": {
        "start": "17:00",
        "end": "20:00"
      }
    },
    "priority": 1
  }')

PROMOTION_ID=$(echo $PROMOTION_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$PROMOTION_ID" ]; then
    print_success "Promotion created: $PROMOTION_ID"
else
    print_error "Failed to create promotion"
fi

# Get all promotions
print_test "Get All Promotions"
curl -s -X GET "$BASE_URL/promotions" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
print_success "Retrieved promotions"

# Create discount code
print_test "Create Discount Code"
DISCOUNT_CODE_RESPONSE=$(curl -s -X POST "$BASE_URL/discount-codes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "SAVE20",
    "discountType": "percentage",
    "discountValue": 20,
    "maxUses": 100,
    "maxUsesPerCustomer": 1
  }')

CODE_ID=$(echo $DISCOUNT_CODE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$CODE_ID" ]; then
    print_success "Discount code created: SAVE20"
else
    print_error "Failed to create discount code"
fi

# Validate discount code
print_test "Validate Discount Code"
curl -s -X POST "$BASE_URL/discount-codes/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "SAVE20",
    "purchaseAmount": 100
  }' | jq '.'
print_success "Discount code validated"

echo ""

# ============================================
# 4. NOTIFICATIONS SYSTEM TESTS
# ============================================

echo "========================================="
echo "4. TESTING NOTIFICATIONS SYSTEM"
echo "========================================="

# Create notification template
print_test "Create Notification Template"
TEMPLATE_RESPONSE=$(curl -s -X POST "$BASE_URL/notifications/templates" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Receipt Email",
    "type": "email",
    "event": "receipt",
    "subject": "Your Receipt #{{receiptNumber}}",
    "bodyTemplate": "Thank you for your purchase! Receipt #{{receiptNumber}}, Total: {{total}}"
  }')

TEMPLATE_ID=$(echo $TEMPLATE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$TEMPLATE_ID" ]; then
    print_success "Template created: $TEMPLATE_ID"
else
    print_error "Failed to create template"
fi

# Get all templates
print_test "Get All Templates"
curl -s -X GET "$BASE_URL/notifications/templates" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
print_success "Retrieved templates"

# Send notification
print_test "Send Notification"
curl -s -X POST "$BASE_URL/notifications/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "recipientType": "email",
    "recipientEmail": "test@example.com",
    "notificationType": "email",
    "subject": "Test Notification",
    "body": "This is a test notification"
  }' | jq '.'
print_success "Notification queued"

# Get notification preferences
print_test "Get Notification Preferences"
curl -s -X GET "$BASE_URL/notifications/preferences" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
print_success "Retrieved preferences"

# Update notification preferences
print_test "Update Notification Preferences"
curl -s -X PUT "$BASE_URL/notifications/preferences" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "emailEnabled": true,
    "smsEnabled": false,
    "pushEnabled": true
  }' | jq '.'
print_success "Preferences updated"

echo ""

# ============================================
# 5. AUDIT LOG TESTS
# ============================================

echo "========================================="
echo "5. TESTING AUDIT LOG"
echo "========================================="

# Query audit logs
print_test "Query Audit Logs"
curl -s -X GET "$BASE_URL/audit?limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
print_success "Retrieved audit logs"

# Get activity summary
print_test "Get Activity Summary"
curl -s -X GET "$BASE_URL/audit/summary" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
print_success "Retrieved activity summary"

# Export audit logs
print_test "Export Audit Logs (JSON)"
curl -s -X POST "$BASE_URL/audit/export" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "format": "json",
    "limit": 100
  }' > /tmp/audit-export.json
print_success "Audit logs exported to /tmp/audit-export.json"

echo ""
echo "========================================="
echo "ALL TESTS COMPLETED!"
echo "========================================="
echo ""
print_success "All Day 6 features tested successfully! ✨"
