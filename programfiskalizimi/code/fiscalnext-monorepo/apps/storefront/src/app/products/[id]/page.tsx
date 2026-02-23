'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCartStore } from '@/store/cartStore';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Heart, Share2, Star, Minus, Plus, Truck, Shield, RotateCcw } from 'lucide-react';
import type { Product } from '@/types';

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    // This would fetch from API
    // For now, using mock data
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (product) {
      addItem(product, undefined, quantity);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-12 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div>
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-xl overflow-hidden mb-4 shadow-sm">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-9xl">
                  📦
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === idx ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={img.imageUrl}
                      alt={`${product.name} ${idx + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Category */}
            {product.category && (
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">
                {product.category.name}
              </p>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">(4.0) • 124 reviews</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(product.sellingPrice)}
                </span>
                {product.costPrice && product.costPrice < product.sellingPrice && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.costPrice)}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-semibold rounded">
                      SAVE {Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">Tax included. Shipping calculated at checkout.</p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="block font-semibold text-gray-900 mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex gap-3 mb-6">
              <Button
                size="lg"
                fullWidth
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button variant="outline" size="lg">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Truck className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Free Shipping</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Shield className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Secure Payment</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <RotateCcw className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Easy Returns</p>
              </div>
            </div>

            {/* SKU & Info */}
            <div className="text-sm text-gray-600 space-y-1 border-t pt-4">
              {product.sku && <p><span className="font-medium">SKU:</span> {product.sku}</p>}
              {product.barcode && <p><span className="font-medium">Barcode:</span> {product.barcode}</p>}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          <Card className="p-6">
            <p className="text-gray-600 text-center py-8">No reviews yet. Be the first to review this product!</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
