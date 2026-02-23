'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button, Card, Modal, Input } from '@/components/ui';
import { FiPlus, FiEdit2, FiTrash2, FiPackage } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { categoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  parent?: { id: string; name: string } | null;
  _count?: { products: number; children: number };
  createdAt: string;
}

interface CategoryFormData {
  name: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CategoryFormData>();

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categoriesApi.getAll();
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle add/edit category
  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        const response = await categoriesApi.update(editingCategory.id, data);
        if (response.data.success) {
          toast.success('Category updated successfully!');
          fetchCategories();
        }
      } else {
        const response = await categoriesApi.create(data);
        if (response.data.success) {
          toast.success('Category created successfully!');
          fetchCategories();
        }
      }
      closeModal();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    reset({
      name: '',
      parentId: null,
      sortOrder: 0,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setValue('name', category.name);
    setValue('parentId', category.parentId || null);
    setValue('sortOrder', category.sortOrder);
    setValue('isActive', category.isActive);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    reset();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await categoriesApi.delete(id);
      if (response.data.success) {
        toast.success('Category deleted successfully!');
        fetchCategories();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete category');
    }
  };

  // Group categories by parent
  const rootCategories = categories.filter((c) => !c.parentId);
  const getCategoryChildren = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId);

  return (
    <DashboardLayout title="Categories" subtitle="Organize your product catalog">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            {categories.length} total categories
          </div>
          <Button variant="primary" onClick={openAddModal}>
            <FiPlus className="w-5 h-5 mr-2" />
            Add Category
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No categories yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {rootCategories.map((category) => (
              <div key={category.id} className="border-l-4 border-primary-500 pl-4">
                {/* Parent Category */}
                <div className="flex items-center justify-between py-3 bg-gray-50 px-4 rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          category.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {category._count?.products || 0} products
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(category)}
                      className="text-primary-600 hover:text-primary-700 p-2"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Child Categories */}
                {getCategoryChildren(category.id).length > 0 && (
                  <div className="ml-6 mt-2 space-y-2">
                    {getCategoryChildren(category.id).map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between py-2 px-4 border border-gray-200 rounded-md bg-white"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">{child.name}</span>
                            <span className="text-xs text-gray-400">
                              {child._count?.products || 0} products
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(child)}
                            className="text-primary-600 hover:text-primary-700 p-1"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(child.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add/Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Category Name"
            {...register('name', { required: 'Category name is required' })}
            error={errors.name?.message}
            placeholder="e.g., Beverages"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Category (Optional)
            </label>
            <select
              {...register('parentId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">None (Root Category)</option>
              {rootCategories
                .filter((c) => c.id !== editingCategory?.id)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          <Input
            type="number"
            label="Sort Order"
            {...register('sortOrder', { valueAsNumber: true })}
            error={errors.sortOrder?.message}
            placeholder="0"
          />

          <div className="flex items-center">
            <input type="checkbox" {...register('isActive')} className="mr-2" />
            <label className="text-sm text-gray-700">Category is active</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
