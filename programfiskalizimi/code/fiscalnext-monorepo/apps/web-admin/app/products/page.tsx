'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Table, Modal, Input } from '@/components/ui';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '@/lib/validations';
import { productsApi, categoriesApi, settingsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  sellingPrice: number;
  costPrice?: number;
  stock?: { quantity: number }[];
  taxRate: number;
  currency?: string;
  unit?: string;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // System settings
  const [systemSettings, setSystemSettings] = useState({
    taxRate: 20,
    currency: 'EUR',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  // Fetch system settings
  const fetchSettings = async () => {
    try {
      const response = await settingsApi.getAll();
      if (response.data.success) {
        const { system } = response.data.settings;
        setSystemSettings({
          taxRate: system.taxRate || 20,
          currency: system.currency || 'EUR',
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll({ isActive: true });
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Fetch products
  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const response = await productsApi.getAll({
        page,
        limit: 10,
        search: searchQuery || undefined,
      });
      if (response.data.success) {
        setProducts(response.data.data || []);
        setTotalProducts(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setCurrentPage(response.data.pagination?.page || 1);
      }
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  // Handle add/edit product
  const onSubmit = async (data: ProductFormData) => {
    try {
      const cleanData: any = {
        name: data.name,
        sku: data.sku,
        sellingPrice: data.sellingPrice,
        taxRate: data.taxRate,
        currency: data.currency || 'EUR', // ← FIXED: Always include currency!
        unit: data.unit,
        isActive: data.isActive,
      };

      if (data.categoryId && data.categoryId.trim() !== '') {
        cleanData.categoryId = data.categoryId;
      }
      if (data.imageUrl && data.imageUrl.trim() !== '') {
        cleanData.imageUrl = data.imageUrl;
      }
      if (data.barcode && data.barcode.trim() !== '') {
        cleanData.barcode = data.barcode;
      }
      if (data.description && data.description.trim() !== '') {
        cleanData.description = data.description;
      }
      if (data.costPrice && data.costPrice > 0) {
        cleanData.costPrice = data.costPrice;
      }
      
      console.log('💾 Sending to API:', cleanData); // Debug log

      if (editingProduct) {
        const response = await productsApi.update(editingProduct.id, cleanData);
        if (response.data.success) {
          toast.success('Product updated successfully!');
          fetchProducts();
        }
      } else {
        const response = await productsApi.create(cleanData);
        if (response.data.success) {
          toast.success('Product created successfully!');
          fetchProducts();
        }
      }
      closeModal();
    } catch (error: any) {
      console.error('Product operation error:', error);
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const openAddModal = async () => {
    setEditingProduct(null);
    
    // Fetch latest settings before opening modal
    try {
      const response = await settingsApi.getAll();
      if (response.data.success) {
        const { system } = response.data.settings;
        const latestTaxRate = system.taxRate || 20;
        const latestCurrency = system.currency || 'EUR';
        
        // Update system settings state
        setSystemSettings({
          taxRate: latestTaxRate,
          currency: latestCurrency,
        });
        
        // Reset form with latest settings
        reset({
          name: '',
          sku: '',
          barcode: '',
          description: '',
          categoryId: '',
          sellingPrice: 0,
          costPrice: 0,
          taxRate: latestTaxRate,
          currency: latestCurrency,
          unit: 'pieces',
          isActive: true,
          imageUrl: '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch latest settings:', error);
      // Fallback to current state
      reset({
        name: '',
        sku: '',
        barcode: '',
        description: '',
        categoryId: '',
        sellingPrice: 0,
        costPrice: 0,
        taxRate: systemSettings.taxRate,
        currency: systemSettings.currency,
        unit: 'pieces',
        isActive: true,
        imageUrl: '',
      });
    }
    
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    Object.keys(product).forEach((key) => {
      setValue(key as keyof ProductFormData, product[key as keyof Product]);
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    reset();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await productsApi.delete(id);
      if (response.data.success) {
        toast.success('Product deleted successfully!');
        fetchProducts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete product');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProducts(1);
  };

  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || systemSettings.currency,
    }).format(amount);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <DashboardLayout title="Products" subtitle="Manage your inventory">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Button onClick={openAddModal} className="flex items-center gap-2">
            <FiPlus /> Add Product
          </Button>
        </div>

        {/* Search */}
        <Card>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, SKU, or barcode..."
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
                onKeyPress={(e: any) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </Card>

        {/* Products Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Product</th>
                  <th className="text-left p-4 font-semibold">SKU</th>
                  <th className="text-left p-4 font-semibold">Category</th>
                  <th className="text-right p-4 font-semibold">Price</th>
                  <th className="text-right p-4 font-semibold">Stock</th>
                  <th className="text-center p-4 font-semibold">Status</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-gray-500">
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-gray-500">
                      No products found. Add your first product to get started!
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded" />
                            ) : (
                              <span className="text-gray-400 text-xs">No image</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {product.description && (
                              <p className="text-sm text-gray-500">{product.description.substring(0, 50)}...</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm">{product.sku}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{product.category?.name || 'Uncategorized'}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(product.sellingPrice, product.currency || 'EUR')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-medium ${
                          (product.stock?.[0]?.quantity || 0) > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product.stock?.[0]?.quantity || 0}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openEditModal(product)}
                          >
                            <FiEdit2 />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(product.id)}
                          >
                            <FiTrash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t p-4">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalProducts)} of {totalProducts} products
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  )
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center gap-2">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="text-gray-400">...</span>
                      )}
                      <Button
                        size="sm"
                        variant={currentPage === page ? 'primary' : 'secondary'}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    </div>
                  ))}
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Add/Edit Product Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingProduct ? 'Edit Product' : 'Add Product'}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Product Name"
                {...register('name')}
                error={errors.name?.message}
                required
              />
              <Input
                label="SKU"
                {...register('sku')}
                error={errors.sku?.message}
                required
              />
            </div>

            <Input
              label="Barcode"
              {...register('barcode')}
              error={errors.barcode?.message}
            />

            <Input
              label="Description"
              {...register('description')}
              error={errors.description?.message}
            />

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                {...register('categoryId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Input
                  type="number"
                  step="0.01"
                  label="Selling Price"
                  {...register('sellingPrice', { valueAsNumber: true })}
                  error={errors.sellingPrice?.message}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select
                  {...register('currency')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ALL">ALL (Lek)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (Dollar)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                step="0.01"
                label="Cost Price"
                {...register('costPrice', { valueAsNumber: true })}
                error={errors.costPrice?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                step="0.01"
                label="Tax Rate (%)"
                {...register('taxRate', { valueAsNumber: true })}
                error={errors.taxRate?.message}
                required
              />
              <Input
                label="Unit"
                {...register('unit')}
                error={errors.unit?.message}
              />
            </div>

            <Input
              label="Image URL"
              {...register('imageUrl')}
              error={errors.imageUrl?.message}
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isActive')}
                className="rounded border-gray-300"
              />
              <label className="text-sm font-medium">Product is active</label>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
