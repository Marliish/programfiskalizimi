#!/bin/bash

# Advanced POS Features Test Script
# Team: Tafa, Mela, Gesa
# Tests ALL 50 features

set -e

API_URL="${API_URL:-http://localhost:5000/v1}"
TOKEN=""
TENANT_ID=""
PRODUCT_ID=""
CUSTOMER_ID=""
TRANSACTION_ID=""
TILL_ID=""
TILL_SESSION_ID=""
GIFT_CARD_NUMBER=""
VOUCHER_CODE=""
LAYOUT_ID=""

echo "========================================="
echo "  ADVANCED POS FEATURES - 50 TESTS"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo -n "Testing: $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET \
            -H "Authorization: Bearer $TOKEN" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        echo "$body"
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "$body"
        FAILED=$((FAILED + 1))
    fi
    
    echo ""
}

# 1. Login and setup
echo -e "${BLUE}=== SETUP ===${NC}"
echo "Logging in..."
response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"admin123"}' \
    "$API_URL/auth/login")

TOKEN=$(echo $response | grep -o '"token":"[^"]*' | cut -d'"' -f4)
TENANT_ID=$(echo $response | grep -o '"tenantId":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to login. Creating test user...${NC}"
    # Try to register
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@test.com","password":"admin123","firstName":"Admin","lastName":"User"}' \
        "$API_URL/auth/register"
    
    # Login again
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@test.com","password":"admin123"}' \
        "$API_URL/auth/login")
    
    TOKEN=$(echo $response | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    TENANT_ID=$(echo $response | grep -o '"tenantId":"[^"]*' | cut -d'"' -f4)
fi

echo "Token: $TOKEN"
echo "Tenant ID: $TENANT_ID"
echo ""

# Create test product
echo "Creating test product..."
response=$(curl -s -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Product","sku":"TEST001","sellingPrice":10.00,"taxRate":20}' \
    "$API_URL/products")
PRODUCT_ID=$(echo $response | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
echo "Product ID: $PRODUCT_ID"
echo ""

# Create test customer
echo "Creating test customer..."
response=$(curl -s -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Customer","email":"customer@test.com","phone":"1234567890"}' \
    "$API_URL/customers")
CUSTOMER_ID=$(echo $response | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
echo "Customer ID: $CUSTOMER_ID"
echo ""

# Create test transaction
echo "Creating test transaction..."
response=$(curl -s -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":2,\"unitPrice\":10}],\"paymentMethod\":\"cash\"}" \
    "$API_URL/pos/transaction")
TRANSACTION_ID=$(echo $response | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
echo "Transaction ID: $TRANSACTION_ID"
echo ""

echo -e "${BLUE}=== SPLIT PAYMENTS (10 features) ===${NC}"

test_endpoint \
    "1. Add split payment" \
    "POST" \
    "/split-payments" \
    "{\"transactionId\":\"$TRANSACTION_ID\",\"paymentMethod\":\"cash\",\"amount\":10.00}"

test_endpoint \
    "2. Get split payments for transaction" \
    "GET" \
    "/split-payments/transaction/$TRANSACTION_ID"

test_endpoint \
    "3. Split by percentage" \
    "POST" \
    "/split-payments/by-percentage" \
    "{\"transactionId\":\"$TRANSACTION_ID\",\"payments\":[{\"method\":\"cash\",\"percentage\":50},{\"method\":\"card\",\"percentage\":50}]}"

test_endpoint \
    "4. Get payment history" \
    "GET" \
    "/split-payments/history/$TRANSACTION_ID"

test_endpoint \
    "5. Get payment method limits" \
    "GET" \
    "/payment-method-limits"

test_endpoint \
    "6. Create payment method limit" \
    "POST" \
    "/payment-method-limits" \
    "{\"paymentMethod\":\"cash\",\"minAmount\":0,\"maxAmount\":1000,\"isActive\":true}"

test_endpoint \
    "7. Get split payment analytics" \
    "GET" \
    "/split-payments/analytics"

test_endpoint \
    "8. Get payment reversals" \
    "GET" \
    "/payment-reversals"

echo -e "${BLUE}=== CUSTOM RECEIPTS (8 features) ===${NC}"

test_endpoint \
    "9. Create receipt template" \
    "POST" \
    "/receipt-templates" \
    "{\"name\":\"Standard Receipt\",\"templateType\":\"standard\",\"headerText\":\"Thank You!\",\"footerText\":\"Visit Again\",\"isDefault\":true}"

test_endpoint \
    "10. Get all receipt templates" \
    "GET" \
    "/receipt-templates"

test_endpoint \
    "11. Get default receipt template" \
    "GET" \
    "/receipt-templates/default"

test_endpoint \
    "12. Render receipt for transaction" \
    "GET" \
    "/receipt-templates/render/$TRANSACTION_ID"

echo -e "${BLUE}=== TILL MANAGEMENT (12 features) ===${NC}"

test_endpoint \
    "13. Create till" \
    "POST" \
    "/tills" \
    "{\"tillNumber\":\"TILL001\",\"name\":\"Main Till\"}"

# Get till ID
response=$(curl -s -X GET \
    -H "Authorization: Bearer $TOKEN" \
    "$API_URL/tills")
TILL_ID=$(echo $response | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
echo "Till ID: $TILL_ID"

test_endpoint \
    "14. Get all tills" \
    "GET" \
    "/tills"

test_endpoint \
    "15. Open till session" \
    "POST" \
    "/till-sessions/open" \
    "{\"tillId\":\"$TILL_ID\",\"openingFloat\":100.00}"

# Get session ID
response=$(curl -s -X GET \
    -H "Authorization: Bearer $TOKEN" \
    "$API_URL/till-sessions?tillId=$TILL_ID")
TILL_SESSION_ID=$(echo $response | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
echo "Till Session ID: $TILL_SESSION_ID"

test_endpoint \
    "16. Get till sessions" \
    "GET" \
    "/till-sessions"

test_endpoint \
    "17. Generate X-report" \
    "POST" \
    "/till-reports/x-report" \
    "{\"tillId\":\"$TILL_ID\"}"

test_endpoint \
    "18. Close till session" \
    "POST" \
    "/till-sessions/$TILL_SESSION_ID/close" \
    "{\"actualCash\":110.00,\"actualCard\":0}"

test_endpoint \
    "19. Generate Z-report" \
    "POST" \
    "/till-reports/z-report" \
    "{\"tillId\":\"$TILL_ID\",\"tillSessionId\":\"$TILL_SESSION_ID\"}"

test_endpoint \
    "20. Get till reports" \
    "GET" \
    "/till-reports"

test_endpoint \
    "21. Create till transfer" \
    "POST" \
    "/till-transfers" \
    "{\"fromTillId\":\"$TILL_ID\",\"toTillId\":\"$TILL_ID\",\"amount\":50.00,\"reason\":\"Balance adjustment\"}"

test_endpoint \
    "22. Get till audit trail" \
    "GET" \
    "/tills/$TILL_ID/audit"

test_endpoint \
    "23. Reconcile till session" \
    "POST" \
    "/till-sessions/$TILL_SESSION_ID/reconcile" \
    "{\"notes\":\"All good\"}"

echo -e "${BLUE}=== GIFT CARDS & VOUCHERS (8 features) ===${NC}"

test_endpoint \
    "24. Issue gift card" \
    "POST" \
    "/gift-cards" \
    "{\"initialBalance\":100.00,\"recipientName\":\"John Doe\",\"recipientEmail\":\"john@test.com\"}"

# Get gift card number
response=$(curl -s -X GET \
    -H "Authorization: Bearer $TOKEN" \
    "$API_URL/gift-cards")
GIFT_CARD_NUMBER=$(echo $response | grep -o '"cardNumber":"[^"]*' | cut -d'"' -f4 | head -1)
echo "Gift Card Number: $GIFT_CARD_NUMBER"

test_endpoint \
    "25. Check gift card balance" \
    "GET" \
    "/gift-cards/$GIFT_CARD_NUMBER/balance"

test_endpoint \
    "26. Redeem gift card" \
    "POST" \
    "/gift-cards/$GIFT_CARD_NUMBER/redeem" \
    "{\"amount\":20.00,\"posTransactionId\":\"$TRANSACTION_ID\"}"

test_endpoint \
    "27. Reload gift card" \
    "POST" \
    "/gift-cards/$GIFT_CARD_NUMBER/reload" \
    "{\"amount\":50.00}"

test_endpoint \
    "28. Get gift card reports" \
    "GET" \
    "/gift-cards/reports"

test_endpoint \
    "29. Create voucher" \
    "POST" \
    "/vouchers" \
    "{\"code\":\"SAVE20\",\"name\":\"20% Off\",\"discountType\":\"percentage\",\"discountValue\":20,\"status\":\"active\"}"

VOUCHER_CODE="SAVE20"

test_endpoint \
    "30. Validate voucher" \
    "POST" \
    "/vouchers/$VOUCHER_CODE/validate" \
    "{\"transactionTotal\":100.00}"

test_endpoint \
    "31. Get all vouchers" \
    "GET" \
    "/vouchers"

echo -e "${BLUE}=== ADVANCED PRICING (7 features) ===${NC}"

test_endpoint \
    "32. Create price schedule" \
    "POST" \
    "/price-schedules" \
    "{\"name\":\"Happy Hour\",\"scheduleType\":\"time_of_day\",\"timeRules\":{\"startTime\":\"17:00\",\"endTime\":\"19:00\"},\"adjustmentType\":\"percentage\",\"adjustmentValue\":-20}"

test_endpoint \
    "33. Get price schedules" \
    "GET" \
    "/price-schedules"

test_endpoint \
    "34. Calculate price with schedule" \
    "POST" \
    "/price-schedules/calculate" \
    "{\"productId\":\"$PRODUCT_ID\",\"basePrice\":10.00}"

test_endpoint \
    "35. Set customer-specific price" \
    "POST" \
    "/customer-specific-prices" \
    "{\"customerId\":\"$CUSTOMER_ID\",\"productId\":\"$PRODUCT_ID\",\"specialPrice\":8.50}"

test_endpoint \
    "36. Get customer-specific prices" \
    "GET" \
    "/customer-specific-prices?customerId=$CUSTOMER_ID"

test_endpoint \
    "37. Create volume pricing rule" \
    "POST" \
    "/volume-pricing-rules" \
    "{\"name\":\"Bulk Discount\",\"productId\":\"$PRODUCT_ID\",\"appliesTo\":\"product\",\"quantityTiers\":[{\"min\":10,\"max\":50,\"price\":9.00},{\"min\":51,\"price\":8.00}]}"

test_endpoint \
    "38. Calculate volume pricing" \
    "POST" \
    "/volume-pricing-rules/calculate" \
    "{\"productId\":\"$PRODUCT_ID\",\"quantity\":20,\"basePrice\":10.00}"

test_endpoint \
    "39. Get product pricing" \
    "GET" \
    "/products/$PRODUCT_ID/pricing?customerId=$CUSTOMER_ID"

echo -e "${BLUE}=== QUICK KEYS (5 features) ===${NC}"

test_endpoint \
    "40. Create quick key layout" \
    "POST" \
    "/quick-key-layouts" \
    "{\"name\":\"Main POS Layout\",\"layoutConfig\":{\"gridSize\":{\"rows\":5,\"cols\":5}},\"pageCount\":2,\"isDefault\":true}"

# Get layout ID
response=$(curl -s -X GET \
    -H "Authorization: Bearer $TOKEN" \
    "$API_URL/quick-key-layouts")
LAYOUT_ID=$(echo $response | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
echo "Layout ID: $LAYOUT_ID"

test_endpoint \
    "41. Get all layouts" \
    "GET" \
    "/quick-key-layouts"

test_endpoint \
    "42. Get default layout" \
    "GET" \
    "/quick-key-layouts/default"

test_endpoint \
    "43. Add button to layout" \
    "POST" \
    "/quick-key-layouts/$LAYOUT_ID/buttons" \
    "{\"positionX\":0,\"positionY\":0,\"label\":\"Coffee\",\"icon\":\"coffee\",\"actionType\":\"add_product\",\"productId\":\"$PRODUCT_ID\",\"backgroundColor\":\"#8B4513\"}"

test_endpoint \
    "44. Get buttons for layout" \
    "GET" \
    "/quick-key-layouts/$LAYOUT_ID/buttons"

test_endpoint \
    "45. Duplicate layout" \
    "POST" \
    "/quick-key-layouts/$LAYOUT_ID/duplicate" \
    "{\"newName\":\"POS Layout Copy\"}"

# Additional comprehensive tests
echo -e "${BLUE}=== ADDITIONAL TESTS ===${NC}"

test_endpoint \
    "46. Bulk generate gift cards" \
    "POST" \
    "/gift-cards/bulk-generate" \
    "{\"count\":5,\"initialBalance\":50.00,\"cardType\":\"gift_card\"}"

test_endpoint \
    "47. Get all gift cards" \
    "GET" \
    "/gift-cards"

test_endpoint \
    "48. Get price history" \
    "GET" \
    "/price-history/$PRODUCT_ID"

test_endpoint \
    "49. Get price overrides" \
    "GET" \
    "/price-overrides"

test_endpoint \
    "50. Health check" \
    "GET" \
    "/health" \
    "" \
    "$API_URL/.."

echo ""
echo "========================================="
echo "  TEST RESULTS"
echo "========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: 50"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL 50 FEATURES WORKING! 🎉${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Review the output above.${NC}"
    exit 1
fi
