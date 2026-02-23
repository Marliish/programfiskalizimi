# ⚡ SPEED OPTIMIZATION - QUICK REFERENCE

**One-page cheat sheet for developers**

---

## 🚀 Commands

```bash
# Development
pnpm dev                    # Start dev server (port 3000)

# Build & Analysis
pnpm build                  # Production build
pnpm build:analyze          # Build + bundle analysis
pnpm speed-test             # Build + show stats

# Testing
pnpm lint                   # Lint code
pnpm type-check             # TypeScript check
```

---

## 🎯 Performance Rules

### ⚡ ALWAYS
1. Use `useDebounce` for search inputs (300ms)
2. Use React Query for ALL API calls
3. Implement optimistic updates for mutations
4. Lazy load heavy components (charts, modals)
5. Use `next/image` for images

### ❌ NEVER
1. Fetch data without caching
2. Create inline objects/arrays in render
3. Skip debouncing on search
4. Render 100+ items without virtual scrolling
5. Block UI for API calls

---

## 📝 Code Snippets

### Debounced Search
```tsx
import { useDebounce } from '@/lib/hooks';

const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);
```

### API Call with Caching
```tsx
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => apiClient.get('/products', { params: filters }),
});
```

### Optimistic Update
```tsx
import { useCreateProduct } from '@/lib/api/products';

const create = useCreateProduct();
create.mutate(newProduct); // Instant UI update!
```

### Lazy Loading
```tsx
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('./Chart'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### Memoization
```tsx
import { memo, useMemo, useCallback } from 'react';

// Expensive computation
const processed = useMemo(() => process(data), [data]);

// Event handler
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);

// Component
const Optimized = memo(({ data }) => <div>{data}</div>);
```

---

## 📊 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Page Load | <2s | ✅ |
| POS Interaction | <100ms | ✅ |
| Bundle Size | <200KB | 🟡 Check |
| API Caching | 5min | ✅ |
| Lighthouse | >90 | 🟡 Test |

---

## 🔍 Debugging Performance

### Check Bundle Size
```bash
ANALYZE=true pnpm build
# Opens visualizer in browser
```

### Profile React Components
```tsx
// In Chrome DevTools:
// 1. Open React DevTools
// 2. Click "Profiler" tab
// 3. Click record button
// 4. Interact with app
// 5. Stop recording
// 6. Analyze flame graph
```

### Measure Core Web Vitals
```bash
# Install Lighthouse
npm install -g lighthouse

# Run test
lighthouse http://localhost:3000 --view
```

---

## 🛠️ Common Fixes

### Slow Search
```tsx
// ❌ Bad: Instant search
<input onChange={(e) => fetchProducts(e.target.value)} />

// ✅ Good: Debounced search
const debouncedSearch = useDebounce(search, 300);
useEffect(() => fetchProducts(debouncedSearch), [debouncedSearch]);
```

### Unnecessary Re-renders
```tsx
// ❌ Bad: Inline object creation
<Component config={{ theme: 'dark' }} />

// ✅ Good: Memoized object
const config = useMemo(() => ({ theme: 'dark' }), []);
<Component config={config} />
```

### Large Lists
```tsx
// ❌ Bad: Render all 10,000 items
{products.map(p => <ProductRow product={p} />)}

// ✅ Good: Virtual scrolling
import { useVirtualizer } from '@tanstack/react-virtual';
// See SPEED_GUIDE.md for full example
```

### Slow API Calls
```tsx
// ❌ Bad: No caching
const [data, setData] = useState();
useEffect(() => fetch('/api/products').then(setData), []);

// ✅ Good: React Query caching
const { data } = useQuery({
  queryKey: ['products'],
  queryFn: () => apiClient.get('/products'),
  staleTime: 5 * 60 * 1000, // 5 min cache
});
```

---

## 📚 Documentation

- **Full Guide:** `SPEED_GUIDE.md`
- **Implementation:** `SPEED_IMPLEMENTATION_SUMMARY.md`
- **Master Plan:** `SPEED_OPTIMIZATION_PLAN.md`
- **Example:** `components/ProductSearchExample.tsx`

---

## 🆘 Quick Help

**Slow page load?**
→ Check bundle size: `ANALYZE=true pnpm build`

**Slow search?**
→ Add debouncing: `useDebounce(search, 300)`

**Too many API calls?**
→ Use React Query with `staleTime: 5 * 60 * 1000`

**Laggy list scrolling?**
→ Use `@tanstack/react-virtual`

**Need optimistic updates?**
→ See `lib/api/products.ts` for examples

---

**REMEMBER: SPEED IS #1 PRIORITY!** ⚡

If it's not instant, optimize it!

---

**Last Updated:** 2026-02-23
