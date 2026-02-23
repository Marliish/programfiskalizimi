import { PrismaClient } from '@fiscalnext/database';

const prisma = new PrismaClient();

export async function setSeoMetadata(tenantId: string, data: any) {
  return await prisma.seoMetadata.upsert({
    where: {
      tenantId_entityType_entityId: {
        tenantId,
        entityType: data.entityType,
        entityId: data.entityId,
      },
    },
    create: {
      tenantId,
      ...data,
    },
    update: data,
  });
}

export async function getSeoMetadata(tenantId: string, entityType: string, entityId: string) {
  return await prisma.seoMetadata.findUnique({
    where: {
      tenantId_entityType_entityId: {
        tenantId,
        entityType,
        entityId,
      },
    },
  });
}

export async function createRedirect(tenantId: string, data: any) {
  return await prisma.seoRedirect.create({
    data: {
      tenantId,
      ...data,
    },
  });
}

export async function getRedirects(tenantId: string, filters: any) {
  const { isActive, page, limit } = filters;

  const where: any = { tenantId };
  if (isActive !== undefined) where.isActive = isActive;

  const [redirects, total] = await Promise.all([
    prisma.seoRedirect.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.seoRedirect.count({ where }),
  ]);

  return {
    data: redirects,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function updateRedirect(tenantId: string, id: string, data: any) {
  return await prisma.seoRedirect.update({
    where: { id },
    data,
  });
}

export async function deleteRedirect(tenantId: string, id: string) {
  await prisma.seoRedirect.delete({
    where: { id },
  });
}

export async function optimizeImage(tenantId: string, data: any) {
  // In production, use image processing service (Sharp, ImageMagick, or cloud service)
  // For now, simulate optimization

  const originalSize = 1024000; // 1MB (mock)
  const optimizedSize = Math.floor(originalSize * 0.6); // 60% of original
  const compressionRatio = parseFloat(((1 - optimizedSize / originalSize) * 100).toFixed(2));

  const optimizedUrl = data.originalUrl.replace(/\.(jpg|png)$/i, '.webp');

  return await prisma.seoImageOptimization.create({
    data: {
      tenantId,
      originalUrl: data.originalUrl,
      optimizedUrl,
      altText: data.altText,
      title: data.title,
      originalSize,
      optimizedSize,
      compressionRatio,
      width: data.maxWidth,
      format: data.format || 'webp',
    },
  });
}

export async function getOptimizedImages(tenantId: string, filters: any) {
  const { page, limit } = filters;

  const [images, total] = await Promise.all([
    prisma.seoImageOptimization.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.seoImageOptimization.count({ where: { tenantId } }),
  ]);

  return {
    data: images,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function generateSitemap(tenantId: string) {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: { tenantId, isActive: true },
      select: { id: true },
    }),
  ]);

  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Home page
  sitemap += '  <url>\n';
  sitemap += '    <loc>https://example.com/</loc>\n';
  sitemap += '    <changefreq>daily</changefreq>\n';
  sitemap += '    <priority>1.0</priority>\n';
  sitemap += '  </url>\n';

  // Products
  for (const product of products) {
    sitemap += '  <url>\n';
    sitemap += `    <loc>https://example.com/products/${product.id}</loc>\n`;
    sitemap += `    <lastmod>${product.updatedAt.toISOString()}</lastmod>\n`;
    sitemap += '    <changefreq>weekly</changefreq>\n';
    sitemap += '    <priority>0.8</priority>\n';
    sitemap += '  </url>\n';
  }

  // Categories
  for (const category of categories) {
    sitemap += '  <url>\n';
    sitemap += `    <loc>https://example.com/categories/${category.id}</loc>\n`;
    sitemap += '    <changefreq>weekly</changefreq>\n';
    sitemap += '    <priority>0.7</priority>\n';
    sitemap += '  </url>\n';
  }

  sitemap += '</urlset>';

  return sitemap;
}

export async function generateSchemaMarkup(tenantId: string, entityType: string, entityId: string) {
  if (entityType === 'product') {
    const product = await prisma.product.findUnique({
      where: { id: entityId },
      include: {
        reviews: {
          where: { status: 'approved' },
        },
      },
    });

    if (!product) return null;

    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': product.name,
      'description': product.description,
      'image': product.imageUrl,
      'sku': product.sku,
      'offers': {
        '@type': 'Offer',
        'price': product.sellingPrice.toString(),
        'priceCurrency': 'EUR',
        'availability': product.isActive ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
      'aggregateRating': product.reviews.length > 0 ? {
        '@type': 'AggregateRating',
        'ratingValue': avgRating.toFixed(1),
        'reviewCount': product.reviews.length,
      } : undefined,
    };
  }

  return null;
}

export async function analyzePage(url: string) {
  // In production, fetch page and analyze
  // For now, return mock analysis
  return {
    url,
    metaTitle: {
      present: true,
      length: 60,
      recommendation: 'Title length is optimal (50-60 characters)',
    },
    metaDescription: {
      present: true,
      length: 155,
      recommendation: 'Description length is optimal (150-160 characters)',
    },
    headings: {
      h1: 1,
      h2: 3,
      h3: 5,
      recommendation: 'Heading structure looks good',
    },
    images: {
      total: 10,
      withAlt: 8,
      withoutAlt: 2,
      recommendation: '2 images missing alt text',
    },
    performance: {
      score: 85,
      recommendation: 'Good performance, consider optimizing images',
    },
  };
}

export async function bulkUpdateMetadata(tenantId: string, data: any) {
  const { entityType, updates } = data;

  const results = [];
  for (const update of updates) {
    try {
      const metadata = await setSeoMetadata(tenantId, {
        entityType,
        entityId: update.entityId,
        metaTitle: update.metaTitle,
        metaDescription: update.metaDescription,
      });
      results.push({ success: true, entityId: update.entityId, metadata });
    } catch (error: any) {
      results.push({ success: false, entityId: update.entityId, error: error.message });
    }
  }

  return {
    total: updates.length,
    succeeded: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  };
}
