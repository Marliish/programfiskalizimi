// Promotions & Discounts Service
// Created: 2026-02-23 - Day 6

import { PrismaClient } from '@fiscalnext/database';
import type {
  CreatePromotionInput,
  UpdatePromotionInput,
  CreateDiscountCodeInput,
  UpdateDiscountCodeInput,
  ValidateDiscountCodeInput,
  ApplyDiscountCodeInput,
} from '../schemas/promotion.schema';

const prisma = new PrismaClient();

export class PromotionService {
  // Create promotion
  async createPromotion(tenantId: string, data: CreatePromotionInput) {
    return await prisma.$queryRawUnsafe(`
      INSERT INTO promotions (
        tenant_id, name, description, promo_type,
        discount_percentage, discount_amount, buy_quantity, get_quantity,
        applies_to, category_id, product_id,
        min_purchase_amount, max_discount_amount,
        valid_from, valid_until, time_restrictions, priority
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `,
      tenantId, data.name, data.description || null, data.promoType,
      data.discountPercentage || null, data.discountAmount || null,
      data.buyQuantity || null, data.getQuantity || null,
      data.appliesTo, data.categoryId || null, data.productId || null,
      data.minPurchaseAmount || null, data.maxDiscountAmount || null,
      data.validFrom || null, data.validUntil || null,
      data.timeRestrictions ? JSON.stringify(data.timeRestrictions) : null,
      data.priority
    );
  }

  // Get all promotions
  async getPromotions(tenantId: string, activeOnly = true) {
    let whereClause = 'WHERE tenant_id = $1';
    
    if (activeOnly) {
      whereClause += ` AND is_active = true 
        AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP)
        AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)`;
    }

    return await prisma.$queryRawUnsafe(`
      SELECT * FROM promotions
      ${whereClause}
      ORDER BY priority DESC, created_at DESC
    `, tenantId);
  }

  // Get promotion by ID
  async getPromotionById(tenantId: string, promotionId: string) {
    const result = await prisma.$queryRawUnsafe(`
      SELECT * FROM promotions
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `, tenantId, promotionId);

    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  // Update promotion
  async updatePromotion(tenantId: string, promotionId: string, data: UpdatePromotionInput) {
    const fields = [];
    const values = [];
    let paramIndex = 3;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramIndex++}`);
        values.push(key === 'timeRestrictions' && value ? JSON.stringify(value) : value);
      }
    });

    if (fields.length === 0) {
      return await this.getPromotionById(tenantId, promotionId);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    return await prisma.$queryRawUnsafe(`
      UPDATE promotions
      SET ${fields.join(', ')}
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `, tenantId, promotionId, ...values);
  }

  // Delete promotion
  async deletePromotion(tenantId: string, promotionId: string) {
    return await prisma.$queryRawUnsafe(`
      UPDATE promotions
      SET is_active = false
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `, tenantId, promotionId);
  }

  // Get applicable promotions for cart
  async getApplicablePromotions(tenantId: string, cartItems: any[], totalAmount: number) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const timeStr = now.toTimeString().substring(0, 5);

    const promotions = await this.getPromotions(tenantId, true);
    
    const applicable = [];

    for (const promo of Array.isArray(promotions) ? promotions : []) {
      // Check time restrictions
      if (promo.time_restrictions) {
        const restrictions = typeof promo.time_restrictions === 'string' 
          ? JSON.parse(promo.time_restrictions) 
          : promo.time_restrictions;
        
        if (restrictions.days && !restrictions.days.includes(dayOfWeek)) {
          continue;
        }
        
        if (restrictions.hours) {
          if (timeStr < restrictions.hours.start || timeStr > restrictions.hours.end) {
            continue;
          }
        }
      }

      // Check minimum purchase
      if (promo.min_purchase_amount && totalAmount < Number(promo.min_purchase_amount)) {
        continue;
      }

      // Check applicability
      if (promo.applies_to === 'category') {
        const hasCategory = cartItems.some(item => item.categoryId === promo.category_id);
        if (!hasCategory) continue;
      } else if (promo.applies_to === 'product') {
        const hasProduct = cartItems.some(item => item.productId === promo.product_id);
        if (!hasProduct) continue;
      }

      applicable.push(promo);
    }

    return applicable;
  }

  // Create discount code
  async createDiscountCode(tenantId: string, data: CreateDiscountCodeInput) {
    return await prisma.$queryRawUnsafe(`
      INSERT INTO discount_codes (
        tenant_id, promotion_id, code, discount_type, discount_value,
        max_uses, max_uses_per_customer, min_purchase_amount,
        valid_from, valid_until
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
      tenantId, data.promotionId || null, data.code,
      data.discountType, data.discountValue,
      data.maxUses || null, data.maxUsesPerCustomer,
      data.minPurchaseAmount || null,
      data.validFrom || null, data.validUntil || null
    );
  }

  // Get all discount codes
  async getDiscountCodes(tenantId: string, activeOnly = true) {
    const whereClause = activeOnly ? 'AND is_active = true' : '';

    return await prisma.$queryRawUnsafe(`
      SELECT * FROM discount_codes
      WHERE tenant_id = $1 ${whereClause}
      ORDER BY created_at DESC
    `, tenantId);
  }

  // Get discount code by code
  async getDiscountCodeByCode(tenantId: string, code: string) {
    const result = await prisma.$queryRawUnsafe(`
      SELECT * FROM discount_codes
      WHERE tenant_id = $1 AND UPPER(code) = UPPER($2)
      LIMIT 1
    `, tenantId, code);

    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  // Validate discount code
  async validateDiscountCode(tenantId: string, data: ValidateDiscountCodeInput) {
    const discountCode = await this.getDiscountCodeByCode(tenantId, data.code);
    
    if (!discountCode) {
      return { valid: false, error: 'Discount code not found' };
    }

    if (!discountCode.is_active) {
      return { valid: false, error: 'Discount code is inactive' };
    }

    // Check validity dates
    const now = new Date();
    if (discountCode.valid_from && new Date(discountCode.valid_from) > now) {
      return { valid: false, error: 'Discount code not yet valid' };
    }
    if (discountCode.valid_until && new Date(discountCode.valid_until) < now) {
      return { valid: false, error: 'Discount code has expired' };
    }

    // Check max uses
    if (discountCode.max_uses && discountCode.current_uses >= discountCode.max_uses) {
      return { valid: false, error: 'Discount code has reached maximum uses' };
    }

    // Check minimum purchase
    if (discountCode.min_purchase_amount && data.purchaseAmount < Number(discountCode.min_purchase_amount)) {
      return { 
        valid: false, 
        error: `Minimum purchase amount is ${discountCode.min_purchase_amount}` 
      };
    }

    // Check customer usage
    if (data.customerId) {
      const uses = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM discount_code_uses
        WHERE discount_code_id = $1 AND customer_id = $2
      `, discountCode.id, data.customerId);

      const useCount = Array.isArray(uses) && uses[0] ? Number(uses[0].count) : 0;
      
      if (useCount >= discountCode.max_uses_per_customer) {
        return { valid: false, error: 'You have already used this discount code' };
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (discountCode.discount_type === 'percentage') {
      discountAmount = (data.purchaseAmount * Number(discountCode.discount_value)) / 100;
    } else {
      discountAmount = Number(discountCode.discount_value);
    }

    return {
      valid: true,
      discountCode,
      discountAmount,
    };
  }

  // Apply discount code
  async applyDiscountCode(tenantId: string, data: ApplyDiscountCodeInput) {
    const discountCode = await this.getDiscountCodeByCode(tenantId, data.code);
    
    if (!discountCode) {
      throw new Error('Discount code not found');
    }

    // Increment usage count
    await prisma.$queryRawUnsafe(`
      UPDATE discount_codes
      SET current_uses = current_uses + 1
      WHERE id = $1
    `, discountCode.id);

    // Record usage
    return await prisma.$queryRawUnsafe(`
      INSERT INTO discount_code_uses (
        discount_code_id, customer_id, transaction_id, discount_amount
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      discountCode.id,
      data.customerId || null,
      data.transactionId,
      data.discountAmount
    );
  }

  // Update discount code
  async updateDiscountCode(tenantId: string, codeId: string, data: UpdateDiscountCodeInput) {
    const fields = [];
    const values = [];
    let paramIndex = 3;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${snakeKey} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      const result = await prisma.$queryRawUnsafe(`
        SELECT * FROM discount_codes WHERE tenant_id = $1 AND id = $2 LIMIT 1
      `, tenantId, codeId);
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    return await prisma.$queryRawUnsafe(`
      UPDATE discount_codes
      SET ${fields.join(', ')}
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `, tenantId, codeId, ...values);
  }

  // Delete discount code
  async deleteDiscountCode(tenantId: string, codeId: string) {
    return await prisma.$queryRawUnsafe(`
      UPDATE discount_codes
      SET is_active = false
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `, tenantId, codeId);
  }
}

export const promotionService = new PromotionService();
