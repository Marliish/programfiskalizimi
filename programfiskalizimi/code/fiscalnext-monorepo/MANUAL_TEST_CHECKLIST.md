# 📋 Manual Testing Checklist - Day 1

**Test this in your browser to confirm 100% completion!**

---

## Pre-Test Setup

### 1. Ensure Both Servers Running
```bash
# Terminal 1 - Backend
cd /Users/admin/.openclaw/workspace/programfiskalizimi/code/fiscalnext-monorepo/apps/api
pnpm dev
# Should show: "🚀 FiscalNext API Server Started!"

# Terminal 2 - Frontend  
cd /Users/admin/.openclaw/workspace/programfiskalizimi/code/fiscalnext-monorepo/apps/web-admin
pnpm dev
# Should show: "✓ Ready on http://localhost:3000"
```

### 2. Quick Automated Check (Optional)
```bash
cd /Users/admin/.openclaw/workspace/programfiskalizimi/code/fiscalnext-monorepo
./verify-day1.sh
# Should show all ✅
```

---

## Test 1: Home Page Redirect ✅

**Steps:**
1. Open browser: `http://localhost:3000`
2. Should immediately redirect to `/login`

**Expected Result:**
- ✅ URL changes to `http://localhost:3000/login`
- ✅ Login page loads with "Welcome Back" title
- ✅ FiscalNext logo visible
- ✅ Email and password fields visible
- ✅ "Sign In" button visible
- ✅ "Don't have an account? Sign up" link visible

---

## Test 2: Registration Flow ✅

**Steps:**
1. Click "Sign up" link (or navigate to `/register`)
2. See progress steps: Business Info → User Info → Review
3. **Step 1 - Business Information:**
   - Business Name: `Test Store`
   - Business Type: `retail` (optional)
   - NIPT: (leave blank - optional)
   - Address: (leave blank - optional)
   - City: (leave blank - optional)
   - Country: Select `Albania`
   - Phone: (leave blank - optional)
   - Click "Next"

4. **Step 2 - User Information:**
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe@test.com` (use unique email)
   - Password: `Test1234`
   - Confirm Password: `Test1234`
   - ✓ Check "I agree to the terms..."
   - Click "Next"

5. **Step 3 - Review:**
   - Verify all info is correct
   - Click "Create Account"

**Expected Result:**
- ✅ Progress indicator moves through steps
- ✅ Form validation works (try invalid password first)
- ✅ No console errors in browser DevTools
- ✅ After submit: Green toast message "Account created successfully!"
- ✅ **Automatically redirects to `/dashboard`** (important!)
- ✅ Dashboard loads with sidebar and stats

**Check Browser Console:**
- ✅ No red errors
- ✅ Successful POST to `http://localhost:5000/v1/auth/register`
- ✅ Response includes `token`, `user`, `tenant`

**Check localStorage:**
- Open DevTools → Application → Local Storage → `http://localhost:3000`
- ✅ `token` is stored (long JWT string)
- ✅ `user` is stored (JSON with id, email, firstName, lastName)
- ✅ `tenant` is stored (JSON with id, name, slug, country)

---

## Test 3: Logout & Login Flow ✅

**Steps:**
1. From dashboard, open browser console
2. Type: `localStorage.clear()` and press Enter
3. Refresh the page (F5)
4. Should redirect to `/login`
5. Enter the credentials from Test 2:
   - Email: `john.doe@test.com`
   - Password: `Test1234`
6. Click "Sign In"

**Expected Result:**
- ✅ After clearing localStorage, redirects to login
- ✅ Login form accepts credentials
- ✅ Green toast message "Login successful!"
- ✅ **Redirects to `/dashboard`**
- ✅ Dashboard loads correctly
- ✅ Token is stored in localStorage again

**Check Browser Console:**
- ✅ No red errors
- ✅ Successful POST to `http://localhost:5000/v1/auth/login`
- ✅ Response includes `token`, `user`, `tenant`, `roles`, `permissions`

---

## Test 4: Dashboard Access ✅

**Steps:**
1. While logged in, check the dashboard page
2. Verify sidebar shows:
   - FiscalNext logo at top
   - Navigation links (Dashboard, POS, Products, etc.)
   - User info at bottom (initials + email)
3. Try clicking different sidebar links

**Expected Result:**
- ✅ Dashboard shows 4 stat cards:
  - Total Revenue
  - Sales Today
  - Customers
  - Growth
- ✅ Shows "Recent Sales" section
- ✅ Shows "Low Stock Alert" section
- ✅ Sidebar is visible on left
- ✅ Top header shows "Dashboard" title
- ✅ User initials (e.g., "JD") visible in sidebar bottom

---

## Test 5: Error Handling ✅

**Steps:**
1. Logout (clear localStorage + refresh)
2. Go to `/login`
3. Try to login with wrong password:
   - Email: `john.doe@test.com`
   - Password: `WrongPass123`
4. Click "Sign In"

**Expected Result:**
- ✅ Red toast message appears: "Invalid credentials"
- ✅ Does NOT redirect
- ✅ Stays on login page
- ✅ Form is still usable

**Try invalid email:**
1. Email: `notanemail`
2. Password: `Test1234`
3. Should show validation error before even submitting

---

## Test 6: Direct Dashboard Access (Security Check) ✅

**Steps:**
1. Logout (clear localStorage + refresh)
2. Directly navigate to: `http://localhost:3000/dashboard`

**Expected Result:**
- ✅ Dashboard loads (Note: Auth middleware not implemented yet - this is OK for Day 1)
- 📝 Future: Should redirect to `/login` (Day 2 task)

---

## Test 7: API Test Page (Bonus) 🧪

**Steps:**
1. Navigate to: `http://localhost:3000/test-api.html`
2. Click "Test Backend Health"
3. Click "Test Registration"
4. Click "Test Login"

**Expected Result:**
- ✅ All three tests show green "SUCCESS" messages
- ✅ JSON responses are visible
- ✅ No CORS errors

---

## Test 8: Multiple Users ✅

**Steps:**
1. Register a second user with different email
2. Login with first user
3. Logout, login with second user
4. Verify each user has their own tenant/business

**Expected Result:**
- ✅ Each user can register independently
- ✅ Each user has separate authentication
- ✅ Each user has their own tenant/business

---

## Browser Compatibility (Optional)

Test in:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari

---

## Common Issues & Solutions

### Issue: CORS Error
**Symptom:** Console shows "CORS policy" error  
**Solution:** Backend CORS is configured for `localhost:3000`. If frontend runs on different port, update `apps/api/src/server.ts` line with CORS config

### Issue: "Cannot connect to backend"
**Symptom:** All API calls fail  
**Solution:** Check backend is running on port 5000: `curl http://localhost:5000/health`

### Issue: Form validation not working
**Symptom:** Can submit empty fields  
**Solution:** Check browser console for errors, ensure react-hook-form is loaded

### Issue: Token not stored
**Symptom:** Page refresh loses authentication  
**Solution:** Check localStorage in DevTools, verify no browser privacy settings blocking storage

### Issue: Dashboard doesn't load after login
**Symptom:** Stays on login page  
**Solution:** Check browser console for navigation errors, verify Next.js router is working

---

## ✅ Final Checklist

After completing all tests, confirm:

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can register new user
- [ ] Registration auto-logs in user
- [ ] Registration redirects to dashboard
- [ ] Can logout (clear localStorage)
- [ ] Can login with credentials
- [ ] Login redirects to dashboard
- [ ] Dashboard displays correctly
- [ ] Sidebar and navigation work
- [ ] Token stored in localStorage
- [ ] User and tenant data stored
- [ ] Error messages display correctly
- [ ] Form validation works
- [ ] No console errors
- [ ] No CORS errors

---

## Report Issues

If any test fails:

1. **Check browser console** (F12) for errors
2. **Check backend logs** (terminal where `pnpm dev` is running)
3. **Check network tab** in DevTools for failed requests
4. **Verify** both servers are running
5. **Try** running `./verify-day1.sh` for automated checks

---

## Success Criteria

**All tests must pass to consider Day 1 complete!**

When all tests pass:
- ✅ Day 1 is 100% complete
- ✅ Frontend-backend integration working
- ✅ Authentication flow functional
- ✅ Ready for Day 2 development

---

**Last Updated:** 2026-02-23  
**Tester:** _____________  
**Date Tested:** _____________  
**Result:** ☐ PASS ☐ FAIL  
**Notes:** _______________________________
