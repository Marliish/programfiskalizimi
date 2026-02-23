'use client';

import { useState, useMemo } from 'react';
import { useDebounce } from '@/lib/hooks';
import { useProducts } from '@/lib/api/products';

/**
 * ⚡ Example component showing SPEED optimization best practices:
 * 
 * 1. Debounced search (no API spam)
 * 2. React Query caching
 * 3. Optimistic placeholderData
 * 4. Skeleton loading states
 * 5. Virtual scrolling ready (can add @tanstack/react-virtual)
 */
export function ProductSearchExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  
  // ⚡ Debounce search to avoid API spam
  // User types "laptop" - only searches after 300ms of no typing
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // ⚡ Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      category: category || undefined,
      pageSize: 50,
    }),
    [debouncedSearch, category]
  );
  
  // ⚡ React Query with automatic caching
  const { data, isLoading, isFetching } = useProducts(filters);
  
  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {/* ⚡ Show loading indicator while debouncing/fetching */}
        {isFetching && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent" />
          </div>
        )}
      </div>
      
      {/* Category Filter */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="px-4 py-2 border rounded-lg"
      >
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="food">Food</option>
        <option value="clothing">Clothing</option>
      </select>
      
      {/* Results */}
      <div className="space-y-2">
        {isLoading ? (
          // ⚡ Skeleton loading state
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </>
        ) : (
          <>
            <div className="text-sm text-gray-600">
              {data?.total || 0} products found
            </div>
            
            {/* ⚡ For lists >100 items, use @tanstack/react-virtual here */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {data?.products.map((product) => (
                <div
                  key={product.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-gray-600">
                    ${product.price.toFixed(2)} • {product.quantity} in stock
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Performance Tip */}
      <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded">
        💡 <strong>Performance:</strong> Search is debounced (300ms), results are cached (5min), 
        and old data stays visible while loading new results for instant feel.
      </div>
    </div>
  );
}
