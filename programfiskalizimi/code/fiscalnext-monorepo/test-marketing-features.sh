#!/bin/bash

# FiscalNext Marketing & Campaigns Test Script
# Tests all Day 13 marketing features
# Created: 2026-02-23

API_URL="http://localhost:5000/v1"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 FiscalNext Marketing & Campaigns Test Suite"
echo "=============================================="
echo ""

# Test counter
TOTAL=0
PASSED=0
FAILED=0

# Helper function to test endpoint
test_endpoint() {
    TOTAL=$((TOTAL + 1))
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "Testing: $description... "
    
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
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "📧 EMAIL CAMPAIGNS"
echo "──────────────────"
test_endpoint "GET" "/campaigns/email" "" "Get all email campaigns"
test_endpoint "POST" "/campaigns/email" '{
    "name": "Test Campaign",
    "subject": "Test Subject",
    "fromName": "FiscalNext",
    "fromEmail": "test@fiscalnext.com",
    "htmlContent": "<h1>Test</h1>",
    "segmentId": "seg_1"
}' "Create email campaign"
test_endpoint "GET" "/campaigns/email/camp_1/analytics" "" "Get campaign analytics"
test_endpoint "POST" "/campaigns/email/camp_1/test" '{
    "testEmail": "test@example.com"
}' "Send test email"
echo ""

echo "📱 SMS CAMPAIGNS"
echo "────────────────"
test_endpoint "GET" "/campaigns/sms" "" "Get all SMS campaigns"
test_endpoint "POST" "/campaigns/sms" '{
    "name": "Test SMS Campaign",
    "message": "Test message"
}' "Create SMS campaign"
echo ""

echo "👥 CUSTOMER SEGMENTS"
echo "────────────────────"
test_endpoint "GET" "/campaigns/segments" "" "Get all segments"
test_endpoint "POST" "/campaigns/segments" '{
    "name": "VIP Customers",
    "criteria": { "minSpent": 1000 }
}' "Create customer segment"
test_endpoint "POST" "/campaigns/segments/preview" '{
    "criteria": { "minSpent": 500 }
}' "Preview segment"
echo ""

echo "📋 SURVEYS"
echo "──────────"
test_endpoint "GET" "/surveys" "" "Get all surveys"
test_endpoint "POST" "/surveys" '{
    "title": "Customer Satisfaction",
    "questions": [
        {
            "question": "How satisfied are you?",
            "questionType": "rating",
            "required": true
        }
    ]
}' "Create survey"
test_endpoint "GET" "/surveys/survey_1" "" "Get survey details"
test_endpoint "GET" "/surveys/survey_1/results" "" "Get survey results"
test_endpoint "POST" "/surveys/survey_1/publish" "" "Publish survey"
echo ""

echo "🎁 REFERRALS"
echo "────────────"
test_endpoint "GET" "/referrals/programs" "" "Get referral programs"
test_endpoint "POST" "/referrals/programs" '{
    "name": "Spring Referral",
    "referrerRewardType": "discount",
    "referrerRewardAmount": 10,
    "refereeRewardType": "discount",
    "refereeRewardAmount": 10
}' "Create referral program"
test_endpoint "POST" "/referrals/generate" '{
    "programId": "prog_1",
    "customerId": "cust_123"
}' "Generate referral code"
test_endpoint "GET" "/referrals/customer/cust_123" "" "Get customer referrals"
test_endpoint "GET" "/referrals/analytics" "" "Get referral analytics"
echo ""

echo "📱 SOCIAL MEDIA"
echo "───────────────"
test_endpoint "GET" "/social-media/posts" "" "Get all posts"
test_endpoint "POST" "/social-media/posts" '{
    "platform": "facebook",
    "content": "Test post content"
}' "Create social post"
test_endpoint "GET" "/social-media/posts/post_1/analytics" "" "Get post analytics"
test_endpoint "GET" "/social-media/overview" "" "Get social overview"
echo ""

echo "⭐ REVIEWS"
echo "──────────"
test_endpoint "GET" "/social-media/reviews" "" "Get all reviews"
test_endpoint "POST" "/social-media/reviews/rev_3/respond" '{
    "responseText": "Thank you for your feedback!"
}' "Respond to review"
test_endpoint "GET" "/social-media/reviews/analytics" "" "Get review analytics"
echo ""

# Summary
echo "=============================================="
echo "📊 Test Summary"
echo "=============================================="
echo -e "Total Tests:  $TOTAL"
echo -e "${GREEN}Passed:       $PASSED${NC}"
echo -e "${RED}Failed:       $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed${NC}"
    exit 1
fi
