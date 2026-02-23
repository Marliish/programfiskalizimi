// Category Service - Handle category operations
import { prisma } from '@fiscalnext/database';
import type { CreateCategoryInput, UpdateCategoryInput, ListCategoriesQuery } from '../schemas/category.schema';

export const categoryService = {
  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryInput & { tenantId: string }) {
    const { tenantId, ...categoryData } = data;

    // Check if parent exists (if provided)
    if (categoryData.parentId) {
      const parent = await prisma.category.findFirst({
        where: {
          id: categoryData.parentId,
          tenantId,
        },
      });

      if (!parent) {
        throw new Error('Parent category not found');
      }
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        ...categoryData,
        tenantId,
      },
      include: {
        parent: true,
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    return category;
  },

  /**
   * List categories with optional filtering
   */
  async listCategories(query: ListCategoriesQuery & { tenantId: string }) {
    const { tenantId, search, parentId, isActive } = query;

    const where: any = {
      tenantId,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      include: {
        parent: true,
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    return {
      categories,
      total: categories.length,
    };
  },

  /**
   * Get category by ID
   */
  async getCategory(id: string, tenantId: string) {
    const category = await prisma.category.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  },

  /**
   * Update category
   */
  async updateCategory(id: string, tenantId: string, data: UpdateCategoryInput) {
    // Verify category exists and belongs to tenant
    const existing = await prisma.category.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new Error('Category not found');
    }

    // Check if parent exists (if being updated)
    if (data.parentId !== undefined && data.parentId !== null) {
      if (data.parentId === id) {
        throw new Error('Category cannot be its own parent');
      }

      const parent = await prisma.category.findFirst({
        where: {
          id: data.parentId,
          tenantId,
        },
      });

      if (!parent) {
        throw new Error('Parent category not found');
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data,
      include: {
        parent: true,
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    return category;
  },

  /**
   * Delete category
   */
  async deleteCategory(id: string, tenantId: string) {
    // Verify category exists and belongs to tenant
    const existing = await prisma.category.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    if (!existing) {
      throw new Error('Category not found');
    }

    // Check if category has products or children
    if (existing._count.products > 0) {
      throw new Error('Cannot delete category with products. Remove products first.');
    }

    if (existing._count.children > 0) {
      throw new Error('Cannot delete category with subcategories. Remove subcategories first.');
    }

    // Delete category
    await prisma.category.delete({
      where: { id },
    });

    return {
      message: 'Category deleted successfully',
    };
  },
};
