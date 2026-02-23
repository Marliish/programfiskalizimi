# ⚡ SPEED OPTIMIZATION PLAN - FiscalNext
**Priority: CRITICAL** | **Target: <2s page loads, instant POS feel**

## Status: ✅ PHASE 1 COMPLETE | 🟡 PHASE 2 IN QUEUE

---

## 🎯 Performance Targets

- [ ] Initial page load: <2s
- [ ] POS interactions: <100ms perceived latency
- [ ] Bundle size: <200KB gzipped (first load)
- [ ] Time to Interactive (TTI): <3s
- [ ] Lighthouse Performance Score: >90

---

## 📋 Optimization Checklist

### 1. ⚡ Bundle Optimization (HIGH PRIORITY)
- [ ] Enable production build optimizations
- [ ] Implement code splitting by route
- [ ] Lazy load all non-critical components
- [ ] Tree-shake unused dependencies
- [ ] Analyze and reduce bundle size
- [ ] Use dynamic imports for heavy components (charts, modals)
- [ ] Split vendor bundles

**Implementation:**
```typescript
// Dynamic imports for heavy components
const Charts = dynamic(() => import('@/components/Charts'), { loading: () => <Skeleton /> });
const ProductTable = dynamic(() => import('@/components/ProductTable'));
```

### 2. 🗄️ API Response Caching (HIGH PRIORITY)
- [ ] Implement React Query cache configuration
- [ ] Add stale-while-revalidate strategy
- [ ] Cache product lists, categories
- [ ] Use optimistic updates for mutations
- [ ] Implement request deduplication

**Implementation:**
```typescript
// React Query config with aggressive caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### 3. ⏱️ Debounce/Throttle Inputs (HIGH PRIORITY)
- [ ] Debounce search inputs (300ms)
- [ ] Debounce product filters
- [ ] Throttle scroll events
- [ ] Throttle resize handlers
- [ ] Use useTransition for non-urgent updates

**Implementation:**
```typescript
// Custom debounced search hook
const useDebouncedSearch = (value: string, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};
```

### 4. 📜 Virtual Scrolling (MEDIUM PRIORITY)
- [ ] Install react-window or @tanstack/react-virtual
- [ ] Implement virtual list for products (>100 items)
- [ ] Implement virtual grid for product gallery
- [ ] Virtual table for transactions
- [ ] Measure performance improvement

**Implementation:**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// Virtual list for 10,000+ products
const VirtualProductList = ({ items }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <ProductRow key={virtualRow.index} product={items[virtualRow.index]} />
        ))}
      </div>
    </div>
  );
};
```

### 5. 🎨 Optimistic UI Updates (HIGH PRIORITY)
- [ ] Optimistic product creation
- [ ] Optimistic quantity updates in POS
- [ ] Optimistic cart operations
- [ ] Roll back on error with toast notification
- [ ] Show loading states only for >200ms operations

**Implementation:**
```typescript
// Optimistic add to cart
const addToCartMutation = useMutation({
  mutationFn: addToCart,
  onMutate: async (newItem) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['cart'] });
    
    // Snapshot previous value
    const previousCart = queryClient.getQueryData(['cart']);
    
    // Optimistically update
    queryClient.setQueryData(['cart'], (old) => [...old, newItem]);
    
    return { previousCart };
  },
  onError: (err, newItem, context) => {
    // Roll back on error
    queryClient.setQueryData(['cart'], context.previousCart);
  },
});
```

### 6. 🖼️ Image Optimization (MEDIUM PRIORITY)
- [ ] Use Next.js Image component everywhere
- [ ] Set proper sizes and priority
- [ ] Lazy load below-the-fold images
- [ ] Use WebP format with fallbacks
- [ ] Implement blur placeholders

### 7. 🔤 Font Optimization (LOW PRIORITY)
- [ ] Use next/font for optimal font loading
- [ ] Preload critical fonts
- [ ] Subset fonts to only needed characters
- [ ] Use font-display: swap

### 8. 📦 State Management Optimization (MEDIUM PRIORITY)
- [ ] Review Zustand stores for unnecessary renders
- [ ] Use selectors to prevent over-rendering
- [ ] Memoize expensive computations
- [ ] Use React.memo for pure components
- [ ] Implement useCallback/useMemo where needed

### 9. 🚀 Next.js Config Enhancements (HIGH PRIORITY)
- [ ] Enable compression
- [ ] Configure proper caching headers
- [ ] Add bundle analyzer
- [ ] Optimize images config
- [ ] Enable experimental features (Turbopack)

### 10. 🧪 Performance Monitoring (MEDIUM PRIORITY)
- [ ] Add performance metrics tracking
- [ ] Implement Core Web Vitals monitoring
- [ ] Add bundle size CI checks
- [ ] Create performance budget
- [ ] Set up alerts for regressions

---

## 📊 Implementation Priority

### ✅ Phase 1: Quick Wins (COMPLETE)
1. ✅ React Query cache optimization
2. ✅ Debounce search/filters
3. ✅ Next.js config optimization
4. ✅ Dynamic imports for heavy components
5. ✅ API client with request deduplication
6. ✅ Optimistic UI update patterns
7. ✅ Performance hooks (useDebounce, useThrottle)
8. ✅ Bundle analyzer setup
9. ✅ Font optimization
10. ✅ Documentation & examples

### Phase 2: Core Optimizations (THIS WEEK)
5. Virtual scrolling for lists
6. Optimistic UI updates
7. Bundle analysis and tree-shaking
8. Image optimization

### Phase 3: Polish (NEXT WEEK)
9. State management audit
10. Performance monitoring setup
11. Advanced caching strategies
12. Font optimization

---

## 🔍 Bundle Analysis Commands

```bash
# Install bundle analyzer
pnpm add -D @next/bundle-analyzer

# Analyze bundle
ANALYZE=true pnpm build

# Check bundle size
pnpm run build && ls -lh .next/static/chunks
```

---

## 📈 Performance Metrics to Track

1. **Lighthouse Scores**
   - Performance: >90
   - Accessibility: >90
   - Best Practices: >90

2. **Core Web Vitals**
   - LCP (Largest Contentful Paint): <2.5s
   - FID (First Input Delay): <100ms
   - CLS (Cumulative Layout Shift): <0.1

3. **Custom Metrics**
   - POS transaction time: <100ms
   - Search response time: <200ms
   - Product list render time: <500ms

---

## 🛠️ Tools to Use

- **@tanstack/react-query**: Smart caching
- **@tanstack/react-virtual**: Virtual scrolling
- **next/dynamic**: Code splitting
- **@next/bundle-analyzer**: Bundle analysis
- **React DevTools Profiler**: Render performance
- **Lighthouse CI**: Automated testing

---

**Last Updated:** 2026-02-23 16:15 GMT+1
**Status:** Implementing Phase 1
