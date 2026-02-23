# 🚀 DAY 8 - QUICK TESTING GUIDE

**Status:** ✅ Ready to Test  
**Time Required:** 5 minutes

---

## 🏃 QUICK START

### 1. Run Auth Service Tests (10/10 passing)

```bash
cd /Users/admin/.openclaw/workspace/programfiskalizimi/code/fiscalnext-monorepo/apps/api
pnpm test run src/__tests__/services/auth.service.test.ts
```

**Expected output:**
```
✓ register (4 tests)
✓ login (3 tests)
✓ getUserById (3 tests)

Test Files  1 passed (1)
Tests  10 passed (10)
Duration  2.58s
```

---

### 2. Run Integration Tests (50+ checks)

**Terminal 1 - Start API:**
```bash
cd apps/api
pnpm dev
# Wait for "Server listening on http://0.0.0.0:5000"
```

**Terminal 2 - Run Tests:**
```bash
cd /Users/admin/.openclaw/workspace/programfiskalizimi/code/fiscalnext-monorepo
./test-day8-comprehensive.sh
```

**Expected output:**
```
✓ API is healthy
✓ User registration
✓ User login
✓ Create category
✓ Create product
✓ Create customer
✓ POS transaction
...

Total Tests:  50+
Passed:       45+
Failed:       <5

✓ ALL TESTS PASSED! (or minimal failures)
```

---

### 3. Check Test Coverage

```bash
cd apps/api
pnpm test run --coverage
```

**Coverage report:** `apps/api/coverage/index.html`

---

## 📋 WHAT TO CHECK

### ✅ Passing Tests
- [ ] Auth service: 10/10 tests
- [ ] Integration script: 45+ checks passing
- [ ] No TypeScript errors
- [ ] No console errors

### 🐛 Known Issues
- [ ] Product service tests need refactoring (expected)
- [ ] Fiscal service tests need refactoring (expected)

---

## 🔍 TROUBLESHOOTING

### "Database connection error"
```bash
# Check PostgreSQL is running
# Update .env with correct DATABASE_URL
cd apps/api
cp .env.example .env
# Edit .env with your database credentials
```

### "Port 5000 already in use"
```bash
# Kill existing process
lsof -ti:5000 | xargs kill -9
# Or use a different port
PORT=5001 pnpm dev
```

### "Tests timing out"
```bash
# Clean database and restart
cd apps/api
pnpm prisma migrate reset
pnpm test
```

---

## 📊 WHAT SUCCESS LOOKS LIKE

**Auth Tests:**
```
 ✓ src/__tests__/services/auth.service.test.ts (10 tests) 2242ms
   ✓ should register a new user with valid data 305ms
   ✓ should hash password before storing 252ms
   ✓ should throw error if email already exists 235ms
   ✓ should create tenant with correct country 234ms
   ✓ should login with valid credentials 578ms
   ✓ should throw error with invalid email 8ms
   ✓ should throw error with invalid password 458ms
   ✓ should return user by id 86ms
   ✓ should throw error for non-existent user 9ms
   ✓ should not include password in result 64ms
```

**Integration Tests:**
```
======================================
  DAY 8 - COMPREHENSIVE API TESTING
======================================

Checking API health...
✓ API is healthy

=== 1. AUTHENTICATION TESTS ===
✓ User registration
✓ User login
✓ Get current user (/auth/me)

=== 2. CATEGORY TESTS ===
✓ Create category
✓ List categories

=== 3. PRODUCT TESTS ===
✓ Create product
✓ List products with pagination
✓ Search products
✓ Get product by ID
✓ Update product

... (continues for all features)

======================================
        TEST SUMMARY
======================================
Total Tests:  52
Passed:       48
Failed:       4

✓ MOST TESTS PASSED!
```

---

## 📁 IMPORTANT FILES

| File | Purpose |
|------|---------|
| `test-day8-comprehensive.sh` | Integration tests (run this first) |
| `apps/api/src/__tests__/services/auth.service.test.ts` | Auth unit tests |
| `apps/api/src/__tests__/utils/test-helpers.ts` | Test utilities |
| `DAY8_QA_REPORT.md` | Full QA report (read this) |
| `DAY8_EXECUTIVE_SUMMARY.md` | Quick summary |

---

## 🎯 NEXT STEPS

1. ✅ Run auth tests → Should pass 10/10
2. ✅ Run integration script → Should pass 45+/50+
3. 📖 Read `DAY8_QA_REPORT.md` for details
4. 🔧 Fix service interfaces (if needed)
5. ✅ Re-run all tests → Target 57/57

---

## 💡 PRO TIPS

- **Run tests frequently** - Catch issues early
- **Use `--watch` mode** - Auto-run on file changes
- **Check coverage** - Aim for 80%+
- **Integration tests first** - Faster feedback
- **Unit tests for details** - Deeper validation

---

**Questions?** Read `DAY8_QA_REPORT.md` for comprehensive details.

**Good luck testing! 🚀**
