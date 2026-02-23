'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '../products/ProductCard';

interface Product {
  id: string;
  name: string;
  imageUrl?: string;
  sellingPrice: number;
}

interface ProductRecommendationsProps {
  productId?: string;
  customerId?: string;
  type: 'ai-based' | 'also-bought' | 'frequently-together' | 'trending' | 'cross-sell' | 'upsell';
  title: string;
  limit?: number;
}

export function ProductRecommendations({
  productId,
  customerId,
  type,
  title,
  limit = 4,
}: ProductRecommendationsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [productId, customerId, type]);

  const fetchRecommendations = async () => {
    try {
      let url = '';

      switch (type) {
        case 'also-bought':
          url = `/api/products/${productId}/also-bought?limit=${limit}`;
          break;
        case 'frequently-together':
          url = `/api/products/${productId}/frequently-together?limit=${limit}`;
          break;
        case 'trending':
          url = `/api/recommendations/trending?limit=${limit}`;
          break;
        case 'cross-sell':
          url = `/api/products/${productId}/cross-sell?limit=${limit}`;
          break;
        case 'upsell':
          url = `/api/products/${productId}/upsell?limit=${limit}`;
          break;
        case 'ai-based':
          url = `/api/recommendations/ai?customerId=${customerId}&limit=${limit}`;
          break;
      }

      const response = await fetch(url);
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

// Recently Viewed Component
interface RecentlyViewedProps {
  customerId: string;
}

export function RecentlyViewed({ customerId }: RecentlyViewedProps) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch(`/api/customers/${customerId}/recently-viewed?limit=8`)
      .then((res) => res.json())
      .then(setProducts)
      .catch(console.error);
  }, [customerId]);

  if (products.length === 0) return null;

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-6">Recently Viewed</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {products.map((product) => (
          <div key={product.id} className="text-center">
            <img
              src={product.imageUrl || '/placeholder.png'}
              alt={product.name}
              className="w-full h-24 object-cover rounded-lg mb-2"
            />
            <p className="text-sm truncate">{product.name}</p>
            <p className="text-sm font-semibold">€{product.sellingPrice}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
