'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Table, Modal, Input } from '@/components/ui';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '@/lib/validations';
import { productsApi, categoriesApi } from '@/lib/api';
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

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
      // Backend returns { success: true, products: [], total, page, pages }
      if (response.data.success) {
        setProducts(response.data.products || []);
        setTotalProducts(response.data.total || 0);
        setTotalPages(response.data.pages || 1);
        setCurrentPage(response.data.page || 1);
      }
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  // Handle add/edit product
  const onSubmit = async (data: ProductFormData) => {
    try {
      if (editingProduct) {
        const response = await productsApi.update(editingProduct.id, data);
        if (response.data.success) {
          toast.success('Product updated successfully!');
          fetchProducts();
        }
      } else {
        const response = await productsApi.create(data);
        if (response.data.success) {
          toast.success('Product created successfully!');
          fetchProducts();
        }
      }
      closeModal();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    reset({
      name: '',
      sku: '',
      barcode: '',
      description: '',
      categoryId: '',
      sellingPrice: 0,
      costPrice: 0,
      taxRate: 20,
      unit: 'pieces',
      isActive: true,
      imageUrl: '',
    });
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

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchProducts(1);
  };

  const columns = [
    {
      header: 'Product',
      accessor: (row: Product) => (
        <div className="flex items-center gap-3">
          {row.imageUrl && (
            <img
              src={row.imageUrl}
              alt={row.name}
              className="w-10 h-10 rounded object-cover"
            />
          )}
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-xs text-gray-500">{row.sku}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: (row: Product) => row.category?.name || 'Uncategorized',
    },
    {
      header: 'Price',
      accessor: (row: Product) => `€${row.sellingPrice?.toFixed(2) || '0.00'}`,
    },
    {
      header: 'Stock',
      accessor: (row: Product) => {
        const stockQty = row.stock?.[0]?.quantity || 0;
        return (
          <span className={stockQty <= 10 ? 'text-red-600 font-semibold' : ''}>
            {stockQty} {row.unit}
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: (row: Product) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: Product) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
            className="text-primary-600 hover:text-primary-700"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="text-red-600 hover:text-red-700"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Products" subtitle="Manage your product catalog">
      <Card>
        {/* Header with search and add button */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-96">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 w-full"
            />
          </div>
          <Button variant="primary" onClick={openAddModal}>
            <FiPlus className="w-5 h-5 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Products table */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <>
            <Table
              data={products}
              columns={columns}
              emptyMessage="No products found. Add your first product to get started!"
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {products.length} of {totalProducts} products
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded ${
                          page === currentPage
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Product Name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="e.g., Coffee Beans"
            />

            <Input
              label="SKU"
              {...register('sku')}
              error={errors.sku?.message}
              placeholder="e.g., COF-001"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Barcode (Optional)"
              {...register('barcode')}
              error={errors.barcode?.message}
              placeholder="e.g., 1234567890"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                {...register('categoryId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Image URL (Optional)"
            {...register('imageUrl')}
            error={errors.imageUrl?.message}
            placeholder="https://example.com/image.jpg"
          />

          <Input
            label="Description (Optional)"
            {...register('description')}
            error={errors.description?.message}
            placeholder="Product description"
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              type="number"
              step="0.01"
              label="Selling Price (€)"
              {...register('sellingPrice', { valueAsNumber: true })}
              error={errors.sellingPrice?.message}
              placeholder="0.00"
            />

            <Input
              type="number"
              step="0.01"
              label="Cost Price (€)"
              {...register('costPrice', { valueAsNumber: true })}
              error={errors.costPrice?.message}
              placeholder="0.00"
            />

            <Input
              type="number"
              label="Tax Rate (%)"
              {...register('taxRate', { valueAsNumber: true })}
              error={errors.taxRate?.message}
              placeholder="20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <select
              {...register('unit')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="pieces">Pieces</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="liters">Liters</option>
              <option value="meters">Meters</option>
              <option value="boxes">Boxes</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('isActive')}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">Product is active</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
