import { prisma } from '@fiscalnext/database';
import type { Prisma } from '@prisma/client';

export const recipeService = {
  // Get all recipes
  async getAll(tenantId: string, filters?: {
    isActive?: boolean;
    search?: string;
  }) {
    const where: Prisma.RecipeWhereInput = {
      tenantId,
    };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    return prisma.recipe.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true, sellingPrice: true },
        },
        ingredients: {
          include: {
            ingredient: {
              select: { id: true, name: true, unit: true, costPrice: true },
            },
          },
        },
        _count: {
          select: { variations: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  },

  // Get recipe by ID
  async getById(id: string, tenantId: string) {
    return prisma.recipe.findFirst({
      where: { id, tenantId },
      include: {
        product: true,
        ingredients: {
          include: {
            ingredient: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        variations: true,
      },
    });
  },

  // Create recipe
  async create(tenantId: string, data: {
    productId: string;
    name: string;
    description?: string;
    yieldQuantity?: number;
    yieldUnit?: string;
    prepTime?: number;
    instructions?: string;
    ingredients: Array<{
      ingredientId: string;
      quantity: number;
      unit: string;
      isOptional?: boolean;
      notes?: string;
    }>;
  }) {
    // Calculate total cost
    let totalCost = 0;
    const ingredients = [];

    for (const ing of data.ingredients) {
      const product = await prisma.product.findUnique({
        where: { id: ing.ingredientId },
        select: { costPrice: true },
      });

      const costPerUnit = product?.costPrice?.toNumber() || 0;
      const ingTotalCost = costPerUnit * ing.quantity;
      totalCost += ingTotalCost;

      ingredients.push({
        ...ing,
        costPerUnit,
        totalCost: ingTotalCost,
      });
    }

    const costPerUnit = (data.yieldQuantity || 1) > 0 ? totalCost / (data.yieldQuantity || 1) : 0;

    return prisma.recipe.create({
      data: {
        tenantId,
        productId: data.productId,
        name: data.name,
        description: data.description,
        yieldQuantity: data.yieldQuantity || 1,
        yieldUnit: data.yieldUnit || 'pieces',
        prepTime: data.prepTime,
        instructions: data.instructions,
        totalCost,
        costPerUnit,
        ingredients: {
          create: ingredients.map((ing, index) => ({
            ...ing,
            sortOrder: index,
          })),
        },
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });
  },

  // Update recipe
  async update(id: string, tenantId: string, data: any) {
    return prisma.recipe.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  },

  // Recalculate recipe cost
  async recalculateCost(id: string, tenantId: string) {
    const recipe = await prisma.recipe.findFirst({
      where: { id, tenantId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    let totalCost = 0;

    for (const ing of recipe.ingredients) {
      const costPerUnit = ing.ingredient.costPrice?.toNumber() || 0;
      const ingTotalCost = costPerUnit * ing.quantity.toNumber();
      totalCost += ingTotalCost;

      // Update ingredient cost
      await prisma.recipeIngredient.update({
        where: { id: ing.id },
        data: {
          costPerUnit,
          totalCost: ingTotalCost,
        },
      });
    }

    const costPerUnit = recipe.yieldQuantity.toNumber() > 0 
      ? totalCost / recipe.yieldQuantity.toNumber() 
      : 0;

    return prisma.recipe.update({
      where: { id },
      data: {
        totalCost,
        costPerUnit,
        updatedAt: new Date(),
      },
    });
  },

  // Add ingredient to recipe
  async addIngredient(recipeId: string, data: {
    ingredientId: string;
    quantity: number;
    unit: string;
    isOptional?: boolean;
    notes?: string;
  }) {
    const product = await prisma.product.findUnique({
      where: { id: data.ingredientId },
      select: { costPrice: true },
    });

    const costPerUnit = product?.costPrice?.toNumber() || 0;
    const totalCost = costPerUnit * data.quantity;

    return prisma.recipeIngredient.create({
      data: {
        recipeId,
        ...data,
        costPerUnit,
        totalCost,
      },
    });
  },

  // Remove ingredient from recipe
  async removeIngredient(id: string) {
    return prisma.recipeIngredient.delete({
      where: { id },
    });
  },

  // Deplete ingredients on sale (when recipe product is sold)
  async depleteIngredients(
    tenantId: string,
    userId: string,
    productId: string,
    quantity: number,
    locationId?: string
  ) {
    const recipe = await prisma.recipe.findFirst({
      where: { tenantId, productId },
      include: {
        ingredients: true,
      },
    });

    if (!recipe) {
      return; // No recipe, no depletion needed
    }

    const movements = [];

    for (const ing of recipe.ingredients) {
      const qtyToDeplete = ing.quantity.toNumber() * quantity;

      // Find stock
      const stock = await prisma.stock.findFirst({
        where: {
          tenantId,
          productId: ing.ingredientId,
          locationId,
        },
      });

      if (stock) {
        // Update stock
        await prisma.stock.update({
          where: { id: stock.id },
          data: {
            quantity: {
              decrement: qtyToDeplete,
            },
          },
        });

        // Create stock movement
        await prisma.stockMovement.create({
          data: {
            tenantId,
            productId: ing.ingredientId,
            locationId,
            userId,
            type: 'out',
            quantity: qtyToDeplete,
            quantityBefore: stock.quantity,
            quantityAfter: stock.quantity.toNumber() - qtyToDeplete,
            referenceType: 'recipe_usage',
            referenceId: recipe.id,
            notes: `Used in recipe: ${recipe.name}`,
          },
        });

        movements.push({
          ingredientId: ing.ingredientId,
          quantity: qtyToDeplete,
        });
      }
    }

    return movements;
  },
};
