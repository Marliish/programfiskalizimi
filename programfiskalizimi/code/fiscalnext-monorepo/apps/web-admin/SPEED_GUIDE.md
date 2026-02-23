# ⚡ Speed Optimization Guide

This guide shows how to use the performance optimizations built into FiscalNext.

---

## 🎯 Quick Start

### 1. Use Debounced Search

```tsx
import { useState } from 'react';
import { useDebounce } from '@/lib/hooks';

function SearchComponent() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300); // Wait 300ms after typing stops
  
  // Use debouncedSearch in your API call
  const { data } = useProducts({ search: debouncedSearch });
}
```

### 2. Use Throttled Events

```tsx
import { useEffect } from 'react';
import { useThrottle } from '@/lib/hooks';

function ScrollComponent() {
  const handleScroll = useThrottle(() => {
    console.log('Scroll event - max once per 200ms');
  }, 200);
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
}
```

### 3. Use Optimistic Updates

```tsx
import { useCreateProduct } from '@/lib/api/products';

function CreateProductForm() {
  const createProduct = useCreateProduct();
  
  const handleSubmit = (data) => {
    // ⚡ Instantly shows in UI, then syncs with server
    createProduct.mutate(data);
  };
}
```

### 4. Lazy Load Heavy Components

```tsx
import dynamic from 'next/dynamic';

// ⚡ Only load chart library when needed
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false, // Don't render on server
});

function Dashboard() {
  return <HeavyChart data={data} />;
}
```

### 5. Virtual Scrolling for Long Lists

```bash
# Install virtual scrolling library
pnpm add @tanstack/react-virtual
```

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

function VirtualProductList({ products }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height
    overscan: 5, // Render 5 extra items above/below viewport
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ProductRow product={products[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 Performance Monitoring

### Bundle Analysis

```bash
# Install bundle analyzer
pnpm add -D @next/bundle-analyzer

# Analyze bundle
ANALYZE=true pnpm build

# Check what's taking up space
```

Add to `next.config.js`:

```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

### Lighthouse Testing

```bash
# Run Lighthouse in Chrome DevTools
# Or use CLI:
npm install -g lighthouse
lighthouse http://localhost:3000 --view
```

### Core Web Vitals

Monitor these metrics:
- **LCP (Largest Contentful Paint)**: < 2.5s ✅
- **FID (First Input Delay)**: < 100ms ✅
- **CLS (Cumulative Layout Shift)**: < 0.1 ✅

---

## 🔧 Best Practices Checklist

### Images
- [ ] Use `next/image` for all images
- [ ] Set proper `width` and `height`
- [ ] Use `priority` for above-the-fold images
- [ ] Use `loading="lazy"` for below-the-fold

```tsx
import Image from 'next/image';

<Image
  src="/product.jpg"
  alt="Product"
  width={300}
  height={200}
  priority={isAboveFold}
  placeholder="blur"
/>
```

### Fonts
- [ ] Use `next/font` (already configured)
- [ ] Preload critical fonts
- [ ] Use `font-display: swap`

```tsx
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // ⚡ Show fallback font immediately
  preload: true,
});
```

### Components
- [ ] Use `React.memo` for expensive pure components
- [ ] Use `useMemo` for expensive computations
- [ ] Use `useCallback` for event handlers passed to children
- [ ] Avoid inline object/array creation in props

```tsx
import { memo, useMemo, useCallback } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveOperation(data);
  }, [data]);
  
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);
  
  return <div onClick={handleClick}>{processedData}</div>;
});
```

### State Management (Zustand)
- [ ] Use selectors to prevent unnecessary re-renders
- [ ] Split stores by concern
- [ ] Use `shallow` for object comparisons

```tsx
import { create } from 'zustand';

const useStore = create((set) => ({
  products: [],
  addProduct: (product) => set((state) => ({ 
    products: [...state.products, product] 
  })),
}));

// ⚡ Only re-render when products change
function ProductCount() {
  const count = useStore((state) => state.products.length);
  return <div>{count} products</div>;
}
```

---

## 🚀 Production Checklist

Before deploying:

- [ ] Run `pnpm build` and check for warnings
- [ ] Test Lighthouse score (target: >90)
- [ ] Check bundle size with analyzer
- [ ] Test on slow 3G connection
- [ ] Verify caching headers in Network tab
- [ ] Test Core Web Vitals
- [ ] Enable compression on server
- [ ] Use CDN for static assets
- [ ] Enable HTTP/2 or HTTP/3

---

## 📚 Further Reading

- [Next.js Performance Docs](https://nextjs.org/docs/going-to-production#performance)
- [React Query Performance](https://tanstack.com/query/latest/docs/react/guides/performance)
- [Web Vitals](https://web.dev/vitals/)
- [Virtual Scrolling](https://tanstack.com/virtual/latest)

---

**Last Updated:** 2026-02-23
**Lighthouse Target:** >90
**Bundle Target:** <200KB gzipped
