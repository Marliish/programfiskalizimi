#!/bin/bash

echo "🔍 DAY 1 VERIFICATION CHECK"
echo "============================"
echo ""

# Check backend
echo "1️⃣ Checking Backend (port 5000)..."
BACKEND_STATUS=$(curl -s http://localhost:5000/health | grep -o '"status":"ok"' || echo "")
if [ -n "$BACKEND_STATUS" ]; then
  echo "   ✅ Backend is running and healthy"
else
  echo "   ❌ Backend is NOT running!"
  echo "   Run: cd apps/api && pnpm dev"
  exit 1
fi

# Check frontend
echo ""
echo "2️⃣ Checking Frontend (port 3000)..."
FRONTEND_STATUS=$(curl -s http://localhost:3000 | grep -o "FiscalNext" | head -1)
if [ -n "$FRONTEND_STATUS" ]; then
  echo "   ✅ Frontend is running"
else
  echo "   ❌ Frontend is NOT running!"
  echo "   Run: cd apps/web-admin && pnpm dev"
  exit 1
fi

# Check login page
echo ""
echo "3️⃣ Checking Login Page..."
LOGIN_PAGE=$(curl -s http://localhost:3000/login | grep -o "Welcome Back" || echo "")
if [ -n "$LOGIN_PAGE" ]; then
  echo "   ✅ Login page loads correctly"
else
  echo "   ❌ Login page not loading"
  exit 1
fi

# Check register page
echo ""
echo "4️⃣ Checking Register Page..."
REGISTER_PAGE=$(curl -s http://localhost:3000/register | grep -o "Create your account" || echo "")
if [ -n "$REGISTER_PAGE" ]; then
  echo "   ✅ Register page loads correctly"
else
  echo "   ❌ Register page not loading"
  exit 1
fi

# Test API endpoints
echo ""
echo "5️⃣ Testing API Registration..."
TEST_EMAIL="verify$(date +%s)@test.com"
REG_RESULT=$(curl -s -X POST http://localhost:5000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"Test1234\",\"businessName\":\"Test\",\"firstName\":\"Test\",\"lastName\":\"User\",\"country\":\"AL\"}" \
  | grep -o '"success":true' || echo "")

if [ -n "$REG_RESULT" ]; then
  echo "   ✅ Registration API working"
else
  echo "   ❌ Registration API failed"
  exit 1
fi

echo ""
echo "6️⃣ Testing API Login..."
LOGIN_RESULT=$(curl -s -X POST http://localhost:5000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"Test1234\"}" \
  | grep -o '"success":true' || echo "")

if [ -n "$LOGIN_RESULT" ]; then
  echo "   ✅ Login API working"
else
  echo "   ❌ Login API failed"
  exit 1
fi

echo ""
echo "============================"
echo "🎉 ALL CHECKS PASSED!"
echo "============================"
echo ""
echo "✅ Backend: Running (http://localhost:5000)"
echo "✅ Frontend: Running (http://localhost:3000)"
echo "✅ Login Page: Working"
echo "✅ Register Page: Working"
echo "✅ Registration API: Working"
echo "✅ Login API: Working"
echo ""
echo "🚀 DAY 1 IS 100% COMPLETE!"
echo ""
echo "📝 Next Steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Click 'Sign up' and create a test account"
echo "   3. Login with your credentials"
echo "   4. Verify dashboard loads"
echo ""
echo "📄 Full report: DAY1_COMPLETION_REPORT.md"
echo ""
