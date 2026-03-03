# Remaining Issues - 2026-02-26

## Issues Still To Fix

### 1. ✅ Employee Creation - ID and Updated_At (FIXED)
**Problem:** SQL failing with NOT NULL constraint on `id` and `updated_at` fields
**Fix:** Updated `employee.service.ts` to generate UUID for `id` and set `updated_at` timestamp

### 2. ⏳ Users Page - React Rendering Error
**Error:** "Objects are not valid as a React child (found: object with keys {id, name})"
**Location:** `/app/users/page.tsx`
**Likely Cause:** Trying to render role/permission objects directly instead of their string values
**Fix Needed:** Check how roles are being displayed, probably need `.map()` or `.name` access

### 3. ⏳ Loyalty Program - Failed to Load Rewards
**Error:** "Failed to load rewards"
**Location:** `/app/loyalty/page.tsx`
**Likely Cause:** API response structure mismatch (same pattern as products/transactions)
**Fix Needed:** Check if API returns `response.data.rewards` or `response.data.data`

### 4. ⏳ Audit Logs - Failed to Load
**Error:** "Failed to load audit logs" (shown twice)
**Location:** `/app/audit-logs/page.tsx`
**Likely Cause:** API endpoint doesn't exist or response structure mismatch
**Fix Needed:** Check if `/v1/audit-logs` endpoint is implemented

### 5. ⏳ Settings Integration - Tax Rate & Currency
**Requirement:** Changes to default tax rate and currency in System Settings should update all pages
**Current State:** Settings page saves but doesn't propagate to other pages
**Fix Needed:**
- Create settings context/store
- Load settings on app init
- Use settings values in POS, Products, etc.
- Default tax rate should apply to new products/transactions

### 6. ⏳ User Permissions
**Requirement:** Users created should have permissions for everything
**Current State:** Unknown - need to check user creation logic
**Fix Needed:**
- Check `/v1/users` create endpoint
- Ensure all permissions are assigned by default or based on role
- Verify permission checking logic in frontend/backend

---

## Pattern We've Been Fixing All Day

**Common Issue:** Frontend expects different response structure than backend provides

**Backend Returns:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

**Frontend Often Expects:**
```json
{
  "success": true,
  "products": [...],  // or "transactions", "customers", etc.
  "total": 100
}
```

**Fix Pattern:**
Change `response.data.products` → `response.data.data`
Change `response.data.total` → `response.data.pagination.total`

---

## Quick Fixes Needed

### Users Page
```tsx
// Instead of rendering {user.roles}
// Do this:
{user.roles.map((r: any) => r.name).join(', ')}
// Or:
{Array.isArray(user.roles) ? user.roles.map((r: any) => r.name).join(', ') : user.roles}
```

### Loyalty/Audit Logs
Check API response and fix data access:
```tsx
// If API returns {success: true, data: [...]}
setRewards(response.data.data || []);
// Instead of:
setRewards(response.data.rewards || []);
```

---

## Settings Context Pattern

Create `/app/contexts/SettingsContext.tsx`:
```tsx
export const SettingsContext = createContext({
  defaultTaxRate: 20,
  currency: 'EUR',
  // ... other settings
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  
  useEffect(() => {
    // Load settings from API on mount
    fetchSettings();
  }, []);
  
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
```

Then use in POS/Products:
```tsx
const { defaultTaxRate, currency } = useSettings();
```
