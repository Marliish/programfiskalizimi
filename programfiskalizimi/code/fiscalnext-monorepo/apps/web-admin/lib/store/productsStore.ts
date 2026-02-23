import { create } from 'zustand';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category: string;
  price: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  taxRate: number;
  unit?: string;
  isActive: boolean;
  createdAt: string;
}

interface ProductsState {
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  selectProduct: (product: Product | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useProductsStore = create<ProductsState>((set) => ({
  products: [],
  selectedProduct: null,
  loading: false,

  setProducts: (products) => set({ products }),

  addProduct: (product) =>
    set((state) => ({
      products: [...state.products, product],
    })),

  updateProduct: (id, updatedProduct) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updatedProduct } : p
      ),
    })),

  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),

  selectProduct: (product) => set({ selectedProduct: product }),

  setLoading: (loading) => set({ loading }),
}));
