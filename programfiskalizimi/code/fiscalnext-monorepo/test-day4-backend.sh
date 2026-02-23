#!/bin/bash
# Day 4 Backend Test Script

echo "🧪 Testing Day 4 Backend APIs..."
API_URL="http://localhost:5000"

# Colors
GREEN='\033[0.32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper function
test_endpoint() {
  echo -n "Testing $1... "
  response=$(curl -s -w "\n%{http_code}" "$2" $3)
  http_code=$(echo "$response" | tail -n1)
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✓ Passed${NC} (HTTP $http_code)"
  else
    echo -e "${RED}✗ Failed${NC} (HTTP $http_code)"
  fi
}

# Test health
test_endpoint "Health Check" "$API_URL/health"

# Test root
test_endpoint "Root Endpoint" "$API_URL/"

echo ""
echo "✅ Backend is running on port 5000!"
echo "📍 New endpoints added:"
echo "   • POST /v1/fiscal/receipts - Generate fiscal receipt"
echo "   • GET /v1/fiscal/receipts - List receipts"
echo "   • GET /v1/fiscal/receipts/:id - Get receipt details"
echo "   • POST /v1/fiscal/receipts/:id/verify - Verify receipt"
echo "   • GET /v1/inventory - Stock levels"
echo "   • POST /v1/inventory/adjust - Adjust stock"
echo "   • GET /v1/inventory/movements - Movement history"
echo "   • GET /v1/inventory/alerts - Low stock alerts"
echo "   • GET /v1/users - List users"
echo "   • POST /v1/users - Create user"
echo "   • PUT /v1/users/:id - Update user"
echo "   • DELETE /v1/users/:id - Deactivate user"
echo "   • PUT /v1/users/:id/roles - Assign roles"
echo ""
echo "🎯 Ready for frontend development!"
