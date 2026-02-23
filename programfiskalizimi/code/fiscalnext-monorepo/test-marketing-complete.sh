#!/bin/bash

# MARKETING & CAMPAIGNS - COMPREHENSIVE TEST
# Created: 2026-02-23 by Boli & Mela
# Tests all 5 marketing features

set -e

API_URL="${API_URL:-http://localhost:3001}"
TENANT_ID="tenant_1"

echo "🎯 MARKETING & CAMPAIGNS - COMPREHENSIVE TEST"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  
  echo -e "${BLUE}Testing:${NC} $name"
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✅ PASSED${NC} (HTTP $http_code)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    echo -e "${RED}❌ FAILED${NC} (HTTP $http_code)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "$body"
  fi
  
  echo ""
}

echo "================================================"
echo "1️⃣  EMAIL CAMPAIGNS"
echo "================================================"
echo ""

# Create customer segment
test_endpoint "Create Customer Segment" POST "/api/campaigns/segments" '{
  "name": "VIP Customers",
  "description": "High-value customers",
  "criteria": {
    "minSpent": 1000
  }
}'

# List segments
test_endpoint "List Customer Segments" GET "/api/campaigns/segments"

# Preview segment
test_endpoint "Preview Segment" POST "/api/campaigns/segments/preview" '{
  "criteria": {
    "minSpent": 500
  }
}'

# Create email campaign
test_endpoint "Create Email Campaign" POST "/api/campaigns/email" '{
  "name": "Summer Sale 2026",
  "subject": "🌞 Big Summer Sale - 50% OFF Everything!",
  "fromName": "FiscalNext Team",
  "fromEmail": "sales@fiscalnext.com",
  "replyTo": "support@fiscalnext.com",
  "htmlContent": "<h1>Summer Sale!</h1><p>Get 50% off all products</p>",
  "textContent": "Summer Sale! Get 50% off all products"
}'

# List email campaigns
test_endpoint "List Email Campaigns" GET "/api/campaigns/email"

# List campaigns by status
test_endpoint "List Draft Campaigns" GET "/api/campaigns/email?status=draft"

echo "================================================"
echo "2️⃣  SMS CAMPAIGNS"
echo "================================================"
echo ""

# Create SMS campaign
test_endpoint "Create SMS Campaign" POST "/api/campaigns/sms" '{
  "name": "Flash Sale Alert",
  "message": "⚡ FLASH SALE! 40% OFF for the next 2 hours. Shop now!"
}'

# List SMS campaigns
test_endpoint "List SMS Campaigns" GET "/api/campaigns/sms"

echo "================================================"
echo "3️⃣  CUSTOMER SURVEYS"
echo "================================================"
echo ""

# Create survey
test_endpoint "Create Survey" POST "/api/surveys" '{
  "title": "Customer Satisfaction Survey",
  "description": "Help us improve our service",
  "distributionMethod": "email",
  "questions": [
    {
      "question": "How satisfied are you with our service?",
      "questionType": "rating",
      "required": true
    },
    {
      "question": "What can we improve?",
      "questionType": "text",
      "required": false
    },
    {
      "question": "Would you recommend us to a friend?",
      "questionType": "yes_no",
      "required": true
    }
  ]
}'

# List surveys
test_endpoint "List Surveys" GET "/api/surveys"

echo "================================================"
echo "4️⃣  REFERRAL PROGRAM"
echo "================================================"
echo ""

# Create referral program
test_endpoint "Create Referral Program" POST "/api/referrals/programs" '{
  "name": "Friend Referral Program",
  "description": "Refer a friend and get rewards!",
  "referrerRewardType": "cash",
  "referrerRewardAmount": 10,
  "refereeRewardType": "discount",
  "refereeRewardAmount": 10,
  "minPurchaseAmount": 50
}'

# List referral programs
test_endpoint "List Referral Programs" GET "/api/referrals/programs"

# Get referral analytics
test_endpoint "Referral Analytics" GET "/api/referrals/analytics"

echo "================================================"
echo "5️⃣  SOCIAL MEDIA"
echo "================================================"
echo ""

# Create social post
test_endpoint "Create Social Post" POST "/api/social/posts" '{
  "platform": "facebook",
  "content": "🎉 Big announcement coming soon! Stay tuned... #FiscalNext #ComingSoon",
  "mediaUrls": []
}'

# List social posts
test_endpoint "List Social Posts" GET "/api/social/posts"

# List social reviews
test_endpoint "List Social Reviews" GET "/api/social/reviews"

# Social media overview
test_endpoint "Social Media Overview" GET "/api/social/overview"

echo ""
echo "================================================"
echo "📊 TEST SUMMARY"
echo "================================================"
echo ""
echo -e "${GREEN}✅ Passed:${NC} $TESTS_PASSED"
echo -e "${RED}❌ Failed:${NC} $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
  exit 1
fi
