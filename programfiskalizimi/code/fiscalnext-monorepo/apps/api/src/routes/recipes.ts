import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const recipesRoute: FastifyPluginAsync = async (fastify) => {
  // GET /recipes - List all recipes
  fastify.get('/', async (request, reply) => {
    const { tenantId } = request.user;
    const { isActive } = request.query as any;

    const where: any = { tenantId };
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, imageUrl: true } },
        _count: { select: { ingredients: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: recipes };
  });

  // POST /recipes - Create new recipe
  fastify.post('/', async (request, reply) => {
    const { tenantId } = request.user;
    const { productId, name, description, yieldQuantity, yieldUnit, prepTime, instructions, ingredients } = request.body as any;

    let totalCost = 0;

    const ingredientsData = await Promise.all(
      ingredients.map(async (ing: any) => {
        const product = await prisma.product.findUnique({ where: { id: ing.ingredientId } });
        const cost = product?.costPrice ? parseFloat(product.costPrice.toString()) * parseFloat(ing.quantity) : 0;
        totalCost += cost;

        return {
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit,
          costPerUnit: product?.costPrice,
          totalCost: cost,
          isOptional: ing.isOptional || false,
          notes: ing.notes,
          sortOrder: ing.sortOrder || 0,
        };
      })
    );

    const costPerUnit = totalCost / parseFloat(yieldQuantity);

    const recipe = await prisma.recipe.create({
      data: {
        tenantId,
        productId,
        name,
        description,
        yieldQuantity,
        yieldUnit,
        prepTime,
        instructions,
        totalCost,
        costPerUnit,
        ingredients: {
          create: ingredientsData,
        },
      },
      include: {
        product: true,
        ingredients: {
          include: { ingredient: true },
        },
      },
    });

    return reply.code(201).send(recipe);
  });

  // GET /recipes/:id - Get recipe details
  fastify.get('/:id', async (request, reply) => {
    const { tenantId } = request.user;
    const { id } = request.params as any;

    const recipe = await prisma.recipe.findFirst({
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

    if (!recipe) {
      return reply.code(404).send({ error: 'Recipe not found' });
    }

    return recipe;
  });

  // PUT /recipes/:id - Update recipe
  fastify.put('/:id', async (request, reply) => {
    const { tenantId } = request.user;
    const { id } = request.params as any;
    const data = request.body as any;

    const recipe = await prisma.recipe.updateMany({
      where: { id, tenantId },
      data: {
        name: data.name,
        description: data.description,
        yieldQuantity: data.yieldQuantity,
        yieldUnit: data.yieldUnit,
        prepTime: data.prepTime,
        instructions: data.instructions,
        isActive: data.isActive,
      },
    });

    if (recipe.count === 0) {
      return reply.code(404).send({ error: 'Recipe not found' });
    }

    const updated = await prisma.recipe.findUnique({
      where: { id },
      include: {
        product: true,
        ingredients: { include: { ingredient: true } },
      },
    });

    return updated;
  });

  // POST /recipes/:id/calculate-cost - Recalculate recipe cost
  fastify.post('/:id/calculate-cost', async (request, reply) => {
    const { tenantId } = request.user;
    const { id } = request.params as any;

    const recipe = await prisma.recipe.findFirst({
      where: { id, tenantId },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
      },
    });

    if (!recipe) {
      return reply.code(404).send({ error: 'Recipe not found' });
    }

    let totalCost = 0;

    for (const ing of recipe.ingredients) {
      const cost = ing.ingredient.costPrice
        ? parseFloat(ing.ingredient.costPrice.toString()) * parseFloat(ing.quantity.toString())
        : 0;
      totalCost += cost;

      await prisma.recipeIngredient.update({
        where: { id: ing.id },
        data: {
          costPerUnit: ing.ingredient.costPrice,
          totalCost: cost,
        },
      });
    }

    const costPerUnit = totalCost / parseFloat(recipe.yieldQuantity.toString());

    await prisma.recipe.update({
      where: { id },
      data: { totalCost, costPerUnit },
    });

    return { totalCost, costPerUnit };
  });
};

export default recipesRoute;
