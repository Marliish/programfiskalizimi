import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, ProductVariant, CartItem, Cart } from '@/types';
import toast from 'react-hot-toast';

interface CartStore extends Cart {
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (discountAmount: number) => void;
  removeCoupon: () => void;
  couponCode: string | null;
  couponDiscount: number;
}

const calculateTotals = (items: CartItem[], couponDiscount: number = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = items.reduce((sum, item) => {
    const itemSubtotal = item.price * item.quantity;
    return sum + (itemSubtotal * (item.product.taxRate / 100));
  }, 0);
  const discount = Math.min(couponDiscount, subtotal);
  const total = subtotal + tax - discount;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { subtotal, tax, total, itemCount, discount };
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      itemCount: 0,
      couponCode: null,
      couponDiscount: 0,

      addItem: (product: Product, variant?: ProductVariant, quantity = 1) => {
        const state = get();
        const items = state.items;
        const existingItemIndex = items.findIndex(
          (item) =>
            item.productId === product.id &&
            item.variantId === variant?.id
        );

        let newItems: CartItem[];

        if (existingItemIndex > -1) {
          // Update quantity if item exists
          newItems = items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          toast.success(`Updated quantity in cart`);
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `${product.id}-${variant?.id || 'default'}-${Date.now()}`,
            productId: product.id,
            variantId: variant?.id,
            product,
            variant,
            quantity,
            price: variant?.price || product.sellingPrice,
          };
          newItems = [...items, newItem];
          toast.success(`${product.name} added to cart`);
        }

        const totals = calculateTotals(newItems, state.couponDiscount);
        set({ 
          items: newItems,
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
          itemCount: totals.itemCount,
        });
      },

      removeItem: (itemId: string) => {
        const state = get();
        const newItems = state.items.filter((item) => item.id !== itemId);
        const totals = calculateTotals(newItems, state.couponDiscount);
        set({ 
          items: newItems,
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
          itemCount: totals.itemCount,
        });
        toast.success('Item removed from cart');
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        const state = get();
        const newItems = state.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );
        const totals = calculateTotals(newItems, state.couponDiscount);
        set({ 
          items: newItems,
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
          itemCount: totals.itemCount,
        });
      },

      clearCart: () => {
        set({
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
          itemCount: 0,
          couponCode: null,
          couponDiscount: 0,
        });
        toast.success('Cart cleared');
      },

      applyCoupon: (discountAmount: number) => {
        const state = get();
        const items = state.items;
        const totals = calculateTotals(items, discountAmount);
        set({ 
          couponDiscount: discountAmount,
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
          itemCount: totals.itemCount,
        });
      },

      removeCoupon: () => {
        const state = get();
        const items = state.items;
        const totals = calculateTotals(items, 0);
        set({ 
          couponCode: null,
          couponDiscount: 0,
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
          itemCount: totals.itemCount,
        });
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
