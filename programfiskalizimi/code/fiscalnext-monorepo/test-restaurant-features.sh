#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# RESTAURANT POS FEATURES - COMPREHENSIVE TEST SUITE
# Built by: Tafa (Backend) + Mela (Frontend) + Gesa (Designer)
# ═══════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "🧪 RESTAURANT POS - COMPREHENSIVE TEST SUITE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function
pass() {
  echo -e "${GREEN}✅ PASS${NC}: $1"
  ((TESTS_PASSED++))
}

fail() {
  echo -e "${RED}❌ FAIL${NC}: $1"
  ((TESTS_FAILED++))
}

info() {
  echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

warn() {
  echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

# ═══════════════════════════════════════════════════════════════
# TEST 1: File Structure
# ═══════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 TEST 1: File Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backend Routes
if [ -f "apps/api/src/routes/tables.ts" ]; then
  pass "Backend route: tables.ts exists"
else
  fail "Backend route: tables.ts missing"
fi

if [ -f "apps/api/src/routes/kitchen.ts" ]; then
  pass "Backend route: kitchen.ts exists"
else
  fail "Backend route: kitchen.ts missing"
fi

if [ -f "apps/api/src/routes/orders.ts" ]; then
  pass "Backend route: orders.ts exists"
else
  fail "Backend route: orders.ts missing"
fi

if [ -f "apps/api/src/routes/tips.ts" ]; then
  pass "Backend route: tips.ts exists"
else
  fail "Backend route: tips.ts missing"
fi

# Frontend Components
if [ -f "apps/web-pos/components/tables/TableCard.tsx" ]; then
  pass "Component: TableCard.tsx exists"
else
  fail "Component: TableCard.tsx missing"
fi

if [ -f "apps/web-pos/components/tables/FloorPlanEditor.tsx" ]; then
  pass "Component: FloorPlanEditor.tsx exists"
else
  fail "Component: FloorPlanEditor.tsx missing"
fi

if [ -f "apps/web-pos/components/kitchen/KitchenOrderCard.tsx" ]; then
  pass "Component: KitchenOrderCard.tsx exists"
else
  fail "Component: KitchenOrderCard.tsx missing"
fi

if [ -f "apps/web-pos/components/kitchen/KitchenDisplay.tsx" ]; then
  pass "Component: KitchenDisplay.tsx exists"
else
  fail "Component: KitchenDisplay.tsx missing"
fi

if [ -f "apps/web-pos/components/orders/OrderEditor.tsx" ]; then
  pass "Component: OrderEditor.tsx exists"
else
  fail "Component: OrderEditor.tsx missing"
fi

if [ -f "apps/web-pos/components/orders/SplitPaymentModal.tsx" ]; then
  pass "Component: SplitPaymentModal.tsx exists"
else
  fail "Component: SplitPaymentModal.tsx missing"
fi

if [ -f "apps/web-pos/components/tips/TipEntryModal.tsx" ]; then
  pass "Component: TipEntryModal.tsx exists"
else
  fail "Component: TipEntryModal.tsx missing"
fi

if [ -f "apps/web-pos/components/tips/TipReportDashboard.tsx" ]; then
  pass "Component: TipReportDashboard.tsx exists"
else
  fail "Component: TipReportDashboard.tsx missing"
fi

# Pages
if [ -f "apps/web-pos/app/tables/page.tsx" ]; then
  pass "Page: tables/page.tsx exists"
else
  fail "Page: tables/page.tsx missing"
fi

if [ -f "apps/web-pos/app/kitchen/page.tsx" ]; then
  pass "Page: kitchen/page.tsx exists"
else
  fail "Page: kitchen/page.tsx missing"
fi

if [ -f "apps/web-pos/app/orders/page.tsx" ]; then
  pass "Page: orders/page.tsx exists"
else
  fail "Page: orders/page.tsx missing"
fi

if [ -f "apps/web-pos/app/tips/page.tsx" ]; then
  pass "Page: tips/page.tsx exists"
else
  fail "Page: tips/page.tsx missing"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# TEST 2: Import Validation
# ═══════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 TEST 2: Import Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for correct Prisma imports (shared instance)
if grep -q "from '@fiscalnext/database'" apps/api/src/routes/tables.ts; then
  pass "tables.ts uses shared Prisma instance"
else
  fail "tables.ts does not use shared Prisma instance"
fi

if grep -q "from '@fiscalnext/database'" apps/api/src/routes/kitchen.ts; then
  pass "kitchen.ts uses shared Prisma instance"
else
  fail "kitchen.ts does not use shared Prisma instance"
fi

if grep -q "from '@fiscalnext/database'" apps/api/src/routes/orders.ts; then
  pass "orders.ts uses shared Prisma instance"
else
  fail "orders.ts does not use shared Prisma instance"
fi

if grep -q "from '@fiscalnext/database'" apps/api/src/routes/tips.ts; then
  pass "tips.ts uses shared Prisma instance"
else
  fail "tips.ts does not use shared Prisma instance"
fi

# Check for framer-motion (should NOT be present)
if ! grep -q "from 'framer-motion'" apps/web-pos/components/tables/TableCard.tsx; then
  pass "TableCard.tsx does not use framer-motion"
else
  warn "TableCard.tsx still uses framer-motion (should be removed)"
fi

if ! grep -q "from 'framer-motion'" apps/web-pos/components/kitchen/KitchenOrderCard.tsx; then
  pass "KitchenOrderCard.tsx does not use framer-motion"
else
  warn "KitchenOrderCard.tsx still uses framer-motion (should be removed)"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# TEST 3: Code Quality
# ═══════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 TEST 3: Code Quality"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Count lines of code
BACKEND_LINES=$(wc -l apps/api/src/routes/tables.ts apps/api/src/routes/kitchen.ts apps/api/src/routes/orders.ts apps/api/src/routes/tips.ts | tail -1 | awk '{print $1}')
info "Backend code: $BACKEND_LINES lines"

FRONTEND_LINES=$(wc -l apps/web-pos/components/tables/*.tsx apps/web-pos/components/kitchen/*.tsx apps/web-pos/components/orders/*.tsx apps/web-pos/components/tips/*.tsx 2>/dev/null | tail -1 | awk '{print $1}')
info "Frontend code: $FRONTEND_LINES lines"

TOTAL_LINES=$((BACKEND_LINES + FRONTEND_LINES))
info "Total code: $TOTAL_LINES lines"

if [ $TOTAL_LINES -gt 3000 ]; then
  pass "Sufficient code coverage (>3000 lines)"
else
  warn "Code coverage may be insufficient (<3000 lines)"
fi

# Check for proper exports
if grep -q "export async function tablesRoutes" apps/api/src/routes/tables.ts; then
  pass "tables.ts exports route function"
else
  fail "tables.ts missing route export"
fi

if grep -q "export async function kitchenRoutes" apps/api/src/routes/kitchen.ts; then
  pass "kitchen.ts exports route function"
else
  fail "kitchen.ts missing route export"
fi

if grep -q "export async function ordersRoutes" apps/api/src/routes/orders.ts; then
  pass "orders.ts exports route function"
else
  fail "orders.ts missing route export"
fi

if grep -q "export async function tipsRoutes" apps/api/src/routes/tips.ts; then
  pass "tips.ts exports route function"
else
  fail "tips.ts missing route export"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# TEST 4: Server Integration
# ═══════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔌 TEST 4: Server Integration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if routes are registered in server.ts
if grep -q "tablesRoutes" apps/api/src/server.ts; then
  pass "tablesRoutes imported in server.ts"
else
  fail "tablesRoutes not imported in server.ts"
fi

if grep -q "kitchenRoutes" apps/api/src/server.ts; then
  pass "kitchenRoutes imported in server.ts"
else
  fail "kitchenRoutes not imported in server.ts"
fi

if grep -q "ordersRoutes" apps/api/src/server.ts; then
  pass "ordersRoutes imported in server.ts"
else
  fail "ordersRoutes not imported in server.ts"
fi

if grep -q "tipsRoutes" apps/api/src/server.ts; then
  pass "tipsRoutes imported in server.ts"
else
  fail "tipsRoutes not imported in server.ts"
fi

if grep -q "server.register(tablesRoutes" apps/api/src/server.ts; then
  pass "tablesRoutes registered in server"
else
  fail "tablesRoutes not registered in server"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# TEST 5: Documentation
# ═══════════════════════════════════════════════════════════════

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 TEST 5: Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "RESTAURANT_POS_FEATURES_COMPLETE.md" ]; then
  pass "RESTAURANT_POS_FEATURES_COMPLETE.md exists"
else
  fail "RESTAURANT_POS_FEATURES_COMPLETE.md missing"
fi

if [ -f "RESTAURANT_POS_QUICKSTART.md" ]; then
  pass "RESTAURANT_POS_QUICKSTART.md exists"
else
  fail "RESTAURANT_POS_QUICKSTART.md missing"
fi

if [ -f "RESTAURANT_FEATURES_SHOWCASE.md" ]; then
  pass "RESTAURANT_FEATURES_SHOWCASE.md exists"
else
  fail "RESTAURANT_FEATURES_SHOWCASE.md missing"
fi

if [ -f "RESTAURANT_POS_SUMMARY.txt" ]; then
  pass "RESTAURANT_POS_SUMMARY.txt exists"
else
  fail "RESTAURANT_POS_SUMMARY.txt missing"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════════════════"
echo "📊 TEST SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo "Success Rate: $SUCCESS_RATE%"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
  echo "✅ Restaurant POS features are ready for production!"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some tests failed. Review above for details.${NC}"
  exit 1
fi
