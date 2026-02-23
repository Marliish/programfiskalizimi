import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { toast } from 'react-hot-toast';

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  barcode?: string;
  image?: string;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

interface ProductFilters {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

/**
 * ⚡ Fetch products with caching
 * Uses React Query for automatic caching and background updates
 */
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => apiClient.get<ProductsResponse>('/products', { params: filters }),
    // Additional optimizations
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep showing old data while loading
  });
}

/**
 * ⚡ Fetch single product
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => apiClient.get<Product>(`/products/${id}`),
    enabled: !!id, // Only fetch if ID is provided
  });
}

/**
 * ⚡ Create product with optimistic update
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Product, 'id'>) => 
      apiClient.post<Product>('/products', data),
    
    // ⚡ Optimistic update
    onMutate: async (newProduct) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['products'] });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData<ProductsResponse>(['products', {}]);

      // Optimistically update to the new value
      if (previousProducts) {
        queryClient.setQueryData<ProductsResponse>(['products', {}], {
          ...previousProducts,
          products: [
            { ...newProduct, id: 'temp-' + Date.now() } as Product,
            ...previousProducts.products,
          ],
          total: previousProducts.total + 1,
        });
      }

      // Show optimistic toast
      toast.loading('Creating product...', { id: 'create-product' });

      return { previousProducts };
    },

    // ⚡ On success
    onSuccess: (data) => {
      toast.success('Product created successfully!', { id: 'create-product' });
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },

    // ⚡ On error - rollback
    onError: (err, newProduct, context) => {
      toast.error('Failed to create product', { id: 'create-product' });
      
      // Roll back to previous state
      if (context?.previousProducts) {
        queryClient.setQueryData(['products', {}], context.previousProducts);
      }
    },
  });
}

/**
 * ⚡ Update product with optimistic update
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      apiClient.patch<Product>(`/products/${id}`, data),

    // ⚡ Optimistic update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      await queryClient.cancelQueries({ queryKey: ['product', id] });

      // Update in list
      const previousProducts = queryClient.getQueryData<ProductsResponse>(['products', {}]);
      if (previousProducts) {
        queryClient.setQueryData<ProductsResponse>(['products', {}], {
          ...previousProducts,
          products: previousProducts.products.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        });
      }

      // Update single product
      const previousProduct = queryClient.getQueryData<Product>(['product', id]);
      if (previousProduct) {
        queryClient.setQueryData<Product>(['product', id], {
          ...previousProduct,
          ...data,
        });
      }

      toast.loading('Updating product...', { id: 'update-product' });

      return { previousProducts, previousProduct };
    },

    onSuccess: () => {
      toast.success('Product updated!', { id: 'update-product' });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },

    onError: (err, { id }, context) => {
      toast.error('Failed to update product', { id: 'update-product' });
      
      if (context?.previousProducts) {
        queryClient.setQueryData(['products', {}], context.previousProducts);
      }
      if (context?.previousProduct) {
        queryClient.setQueryData(['product', id], context.previousProduct);
      }
    },
  });
}

/**
 * ⚡ Delete product with optimistic update
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/products/${id}`),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });

      const previousProducts = queryClient.getQueryData<ProductsResponse>(['products', {}]);
      
      if (previousProducts) {
        queryClient.setQueryData<ProductsResponse>(['products', {}], {
          ...previousProducts,
          products: previousProducts.products.filter((p) => p.id !== id),
          total: previousProducts.total - 1,
        });
      }

      toast.loading('Deleting product...', { id: 'delete-product' });

      return { previousProducts };
    },

    onSuccess: () => {
      toast.success('Product deleted!', { id: 'delete-product' });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },

    onError: (err, id, context) => {
      toast.error('Failed to delete product', { id: 'delete-product' });
      
      if (context?.previousProducts) {
        queryClient.setQueryData(['products', {}], context.previousProducts);
      }
    },
  });
}
