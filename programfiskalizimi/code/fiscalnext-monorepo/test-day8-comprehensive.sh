#!/bin/bash
# DAY 8 - Comprehensive Integration Testing Script
# Tests all API endpoints with authentication, validation, and error handling

set -e

BASE_URL="http://localhost:5000/v1"
ADMIN_EMAIL="admin@fiscalnext.test"
ADMIN_PASSWORD="SecurePass123!"
TOKEN=""
TENANT_ID=""
USER_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test result
print_test() {
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if [ "$1" == "PASS" ]; then
    echo -e "${GREEN}✓${NC} $2"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗${NC} $2"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
}

# Function to make API call
api_call() {
  local method=$1
  local endpoint=$2
  local data=$3
  local auth=$4
  
  if [ "$auth" == "true" ]; then
    curl -s -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$data"
  else
    curl -s -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data"
  fi
}

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  DAY 8 - COMPREHENSIVE API TESTING${NC}"
echo -e "${BLUE}======================================${NC}\n"

# Check if API is running
echo -e "${YELLOW}Checking API health...${NC}"
HEALTH=$(curl -s "$BASE_URL/../health" || echo "")
if echo "$HEALTH" | grep -q "ok"; then
  print_test "PASS" "API is healthy"
else
  print_test "FAIL" "API is not responding"
  exit 1
fi

echo -e "\n${YELLOW}=== 1. AUTHENTICATION TESTS ===${NC}"

# Test registration
echo "Testing user registration..."
REG_RESPONSE=$(api_call "POST" "/auth/register" '{
  "email": "'"$ADMIN_EMAIL"'",
  "password": "'"$ADMIN_PASSWORD"'",
  "businessName": "Test Business",
  "firstName": "Admin",
  "lastName": "User",
  "country": "AL"
}' "false" || echo '{"success":false}')

if echo "$REG_RESPONSE" | grep -q '"success":true'; then
  print_test "PASS" "User registration"
  TOKEN=$(echo "$REG_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  TENANT_ID=$(echo "$REG_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
else
  # User might already exist, try login
  echo "Registration failed, trying login..."
fi

# Test login
if [ -z "$TOKEN" ]; then
  echo "Testing user login..."
  LOGIN_RESPONSE=$(api_call "POST" "/auth/login" '{
    "email": "'"$ADMIN_EMAIL"'",
    "password": "'"$ADMIN_PASSWORD"'"
  }' "false")
  
  if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    print_test "PASS" "User login"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    TENANT_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  else
    print_test "FAIL" "User login"
    echo "Cannot proceed without authentication"
    exit 1
  fi
fi

# Test /me endpoint
echo "Testing authenticated user endpoint..."
ME_RESPONSE=$(api_call "GET" "/auth/me" "" "true")
if echo "$ME_RESPONSE" | grep -q "$ADMIN_EMAIL"; then
  print_test "PASS" "Get current user (/auth/me)"
else
  print_test "FAIL" "Get current user"
fi

echo -e "\n${YELLOW}=== 2. CATEGORY TESTS ===${NC}"

# Create category
echo "Testing category creation..."
CAT_RESPONSE=$(api_call "POST" "/categories" '{
  "name": "Electronics",
  "description": "Electronic devices",
  "icon": "📱",
  "color": "#3B82F6"
}' "true")

if echo "$CAT_RESPONSE" | grep -q '"name":"Electronics"'; then
  print_test "PASS" "Create category"
  CATEGORY_ID=$(echo "$CAT_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
else
  print_test "FAIL" "Create category"
fi

# List categories
echo "Testing category listing..."
CATS_RESPONSE=$(api_call "GET" "/categories" "" "true")
if echo "$CATS_RESPONSE" | grep -q "Electronics"; then
  print_test "PASS" "List categories"
else
  print_test "FAIL" "List categories"
fi

echo -e "\n${YELLOW}=== 3. PRODUCT TESTS ===${NC}"

# Create product
echo "Testing product creation..."
PROD_RESPONSE=$(api_call "POST" "/products" '{
  "name": "iPhone 15 Pro",
  "sku": "IPHONE-15-PRO",
  "barcode": "123456789",
  "description": "Latest iPhone",
  "sellingPrice": 1200.00,
  "costPrice": 800.00,
  "taxRate": 20.00,
  "unit": "pieces",
  "categoryId": "'"$CATEGORY_ID"'",
  "trackInventory": true
}' "true")

if echo "$PROD_RESPONSE" | grep -q '"name":"iPhone 15 Pro"'; then
  print_test "PASS" "Create product"
  PRODUCT_ID=$(echo "$PROD_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
else
  print_test "FAIL" "Create product"
fi

# List products
echo "Testing product listing..."
PRODS_RESPONSE=$(api_call "GET" "/products?page=1&limit=10" "" "true")
if echo "$PRODS_RESPONSE" | grep -q "iPhone 15 Pro"; then
  print_test "PASS" "List products with pagination"
else
  print_test "FAIL" "List products"
fi

# Search products
echo "Testing product search..."
SEARCH_RESPONSE=$(api_call "GET" "/products?search=iPhone" "" "true")
if echo "$SEARCH_RESPONSE" | grep -q "iPhone"; then
  print_test "PASS" "Search products"
else
  print_test "FAIL" "Search products"
fi

# Get product by ID
if [ -n "$PRODUCT_ID" ]; then
  echo "Testing get product by ID..."
  PROD_DETAIL=$(api_call "GET" "/products/$PRODUCT_ID" "" "true")
  if echo "$PROD_DETAIL" | grep -q "$PRODUCT_ID"; then
    print_test "PASS" "Get product by ID"
  else
    print_test "FAIL" "Get product by ID"
  fi
fi

# Update product
if [ -n "$PRODUCT_ID" ]; then
  echo "Testing product update..."
  UPDATE_RESPONSE=$(api_call "PUT" "/products/$PRODUCT_ID" '{
    "sellingPrice": 1150.00
  }' "true")
  if echo "$UPDATE_RESPONSE" | grep -q "1150"; then
    print_test "PASS" "Update product"
  else
    print_test "FAIL" "Update product"
  fi
fi

echo -e "\n${YELLOW}=== 4. CUSTOMER TESTS ===${NC}"

# Create customer
echo "Testing customer creation..."
CUST_RESPONSE=$(api_call "POST" "/customers" '{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+355123456789",
  "address": "123 Main St",
  "city": "Tirana"
}' "true")

if echo "$CUST_RESPONSE" | grep -q '"name":"John Doe"'; then
  print_test "PASS" "Create customer"
  CUSTOMER_ID=$(echo "$CUST_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
else
  print_test "FAIL" "Create customer"
fi

# List customers
echo "Testing customer listing..."
CUSTS_RESPONSE=$(api_call "GET" "/customers" "" "true")
if echo "$CUSTS_RESPONSE" | grep -q "John Doe"; then
  print_test "PASS" "List customers"
else
  print_test "FAIL" "List customers"
fi

echo -e "\n${YELLOW}=== 5. POS/TRANSACTION TESTS ===${NC}"

# Create transaction
if [ -n "$PRODUCT_ID" ]; then
  echo "Testing POS transaction..."
  TXN_RESPONSE=$(api_call "POST" "/pos/transactions" '{
    "items": [{
      "productId": "'"$PRODUCT_ID"'",
      "quantity": 2,
      "unitPrice": 1150.00
    }],
    "paymentMethod": "cash",
    "customerId": "'"$CUSTOMER_ID"'"
  }' "true")
  
  if echo "$TXN_RESPONSE" | grep -q '"status":"completed"'; then
    print_test "PASS" "Create POS transaction"
    TRANSACTION_ID=$(echo "$TXN_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  else
    print_test "FAIL" "Create POS transaction"
  fi
fi

# List transactions
echo "Testing transaction listing..."
TXNS_RESPONSE=$(api_call "GET" "/pos/transactions" "" "true")
if echo "$TXNS_RESPONSE" | grep -q "completed"; then
  print_test "PASS" "List transactions"
else
  print_test "FAIL" "List transactions"
fi

echo -e "\n${YELLOW}=== 6. FISCAL RECEIPT TESTS ===${NC}"

# Generate fiscal receipt
if [ -n "$TRANSACTION_ID" ]; then
  echo "Testing fiscal receipt generation..."
  FISCAL_RESPONSE=$(api_call "POST" "/fiscal/receipts" '{
    "transactionId": "'"$TRANSACTION_ID"'"
  }' "true")
  
  if echo "$FISCAL_RESPONSE" | grep -q '"iic"'; then
    print_test "PASS" "Generate fiscal receipt"
    RECEIPT_ID=$(echo "$FISCAL_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  else
    print_test "FAIL" "Generate fiscal receipt"
  fi
fi

# List fiscal receipts
echo "Testing fiscal receipt listing..."
RECEIPTS_RESPONSE=$(api_call "GET" "/fiscal/receipts" "" "true")
if echo "$RECEIPTS_RESPONSE" | grep -q "iic"; then
  print_test "PASS" "List fiscal receipts"
else
  print_test "FAIL" "List fiscal receipts"
fi

# Verify receipt
if [ -n "$RECEIPT_ID" ]; then
  echo "Testing fiscal receipt verification..."
  VERIFY_RESPONSE=$(api_call "POST" "/fiscal/receipts/$RECEIPT_ID/verify" '{}' "true")
  if echo "$VERIFY_RESPONSE" | grep -q "verificationStatus"; then
    print_test "PASS" "Verify fiscal receipt"
  else
    print_test "FAIL" "Verify fiscal receipt"
  fi
fi

echo -e "\n${YELLOW}=== 7. INVENTORY TESTS ===${NC}"

# Get inventory
echo "Testing inventory listing..."
INV_RESPONSE=$(api_call "GET" "/inventory" "" "true")
if echo "$INV_RESPONSE" | grep -q "stock"; then
  print_test "PASS" "Get inventory"
else
  print_test "FAIL" "Get inventory"
fi

# Stock adjustment
if [ -n "$PRODUCT_ID" ]; then
  echo "Testing stock adjustment..."
  ADJ_RESPONSE=$(api_call "POST" "/inventory/adjust" '{
    "productId": "'"$PRODUCT_ID"'",
    "type": "in",
    "quantity": 50,
    "notes": "Restock"
  }' "true")
  
  if echo "$ADJ_RESPONSE" | grep -q "quantity"; then
    print_test "PASS" "Stock adjustment"
  else
    print_test "FAIL" "Stock adjustment"
  fi
fi

# Stock movements
echo "Testing stock movements..."
MOVES_RESPONSE=$(api_call "GET" "/inventory/movements" "" "true")
if echo "$MOVES_RESPONSE" | grep -q "quantity"; then
  print_test "PASS" "Get stock movements"
else
  print_test "FAIL" "Get stock movements"
fi

# Low stock alerts
echo "Testing low stock alerts..."
ALERTS_RESPONSE=$(api_call "GET" "/inventory/alerts" "" "true")
if [ -n "$ALERTS_RESPONSE" ]; then
  print_test "PASS" "Get low stock alerts"
else
  print_test "FAIL" "Get low stock alerts"
fi

echo -e "\n${YELLOW}=== 8. USER MANAGEMENT TESTS ===${NC}"

# List users
echo "Testing user listing..."
USERS_RESPONSE=$(api_call "GET" "/users" "" "true")
if echo "$USERS_RESPONSE" | grep -q "$ADMIN_EMAIL"; then
  print_test "PASS" "List users"
else
  print_test "FAIL" "List users"
fi

# Permission matrix
echo "Testing permission matrix..."
PERMS_RESPONSE=$(api_call "GET" "/users/permissions/matrix" "" "true")
if echo "$PERMS_RESPONSE" | grep -q "owner"; then
  print_test "PASS" "Get permission matrix"
else
  print_test "FAIL" "Get permission matrix"
fi

echo -e "\n${YELLOW}=== 9. REPORTS TESTS ===${NC}"

# Sales summary
echo "Testing sales reports..."
SALES_RESPONSE=$(api_call "GET" "/reports/sales-summary" "" "true")
if [ -n "$SALES_RESPONSE" ]; then
  print_test "PASS" "Get sales summary"
else
  print_test "FAIL" "Get sales summary"
fi

echo -e "\n${YELLOW}=== 10. SETTINGS TESTS ===${NC}"

# Get settings
echo "Testing tenant settings..."
SETTINGS_RESPONSE=$(api_call "GET" "/settings" "" "true")
if echo "$SETTINGS_RESPONSE" | grep -q "businessName"; then
  print_test "PASS" "Get tenant settings"
else
  print_test "FAIL" "Get tenant settings"
fi

echo -e "\n${BLUE}======================================${NC}"
echo -e "${BLUE}        TEST SUMMARY${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"

if [ "$FAILED_TESTS" -eq 0 ]; then
  echo -e "\n${GREEN}✓ ALL TESTS PASSED!${NC}\n"
  exit 0
else
  echo -e "\n${RED}✗ SOME TESTS FAILED${NC}\n"
  exit 1
fi
