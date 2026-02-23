'use client';

import { useState } from 'react';

interface WishlistButtonProps {
  productId: string;
  customerId: string;
}

export function WishlistButton({ productId, customerId }: WishlistButtonProps) {
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleWishlist = async () => {
    setLoading(true);
    try {
      if (inWishlist) {
        // Remove from wishlist
        await fetch(`/api/wishlists/items/${productId}`, {
          method: 'DELETE',
        });
        setInWishlist(false);
      } else {
        // Add to wishlist (get or create default wishlist first)
        const wishlistsRes = await fetch(`/api/wishlists?customerId=${customerId}`);
        const wishlists = await wishlistsRes.json();
        
        let wishlistId = wishlists.find((w: any) => w.isDefault)?.id;
        
        if (!wishlistId) {
          // Create default wishlist
          const createRes = await fetch('/api/wishlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerId,
              name: 'My Wishlist',
              isDefault: true,
            }),
          });
          const newWishlist = await createRes.json();
          wishlistId = newWishlist.id;
        }

        // Add item
        await fetch(`/api/wishlists/${wishlistId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity: 1 }),
        });
        setInWishlist(true);
      }
    } catch (error) {
      console.error('Wishlist error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={`p-2 rounded-lg transition-colors ${
        inWishlist
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {loading ? '...' : inWishlist ? '❤️' : '🤍'}
    </button>
  );
}
