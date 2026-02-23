// Loyalty Program Service
// Created: 2026-02-23 - Day 6

import { PrismaClient } from '@fiscalnext/database';
import type {
  EarnPointsInput,
  RedeemPointsInput,
  CreateRewardInput,
  UpdateRewardInput,
  RedeemRewardInput,
} from '../schemas/loyalty.schema';

const prisma = new PrismaClient();

export class LoyaltyService {
  // Earn loyalty points
  async earnPoints(tenantId: string, data: EarnPointsInput) {
    // Get current customer points
    const customer = await prisma.$queryRawUnsafe(`
      SELECT loyalty_points FROM customers
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `, tenantId, data.customerId);

    if (!Array.isArray(customer) || customer.length === 0) {
      throw new Error('Customer not found');
    }

    const currentPoints = Number(customer[0].loyalty_points) || 0;
    const newPoints = currentPoints + data.points;

    // Update customer points
    await prisma.$queryRawUnsafe(`
      UPDATE customers
      SET loyalty_points = $1
      WHERE tenant_id = $2 AND id = $3
    `, newPoints, tenantId, data.customerId);

    // Create loyalty transaction
    return await prisma.$queryRawUnsafe(`
      INSERT INTO loyalty_transactions (
        tenant_id, customer_id, transaction_id, type, 
        points, points_before, points_after, description
      )
      VALUES ($1, $2, $3, 'earn', $4, $5, $6, $7)
      RETURNING *
    `, 
      tenantId, 
      data.customerId, 
      data.transactionId || null,
      data.points,
      currentPoints,
      newPoints,
      data.description || 'Points earned'
    );
  }

  // Redeem loyalty points
  async redeemPoints(tenantId: string, data: RedeemPointsInput) {
    // Get current customer points
    const customer = await prisma.$queryRawUnsafe(`
      SELECT loyalty_points FROM customers
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `, tenantId, data.customerId);

    if (!Array.isArray(customer) || customer.length === 0) {
      throw new Error('Customer not found');
    }

    const currentPoints = Number(customer[0].loyalty_points) || 0;
    
    if (currentPoints < data.points) {
      throw new Error('Insufficient loyalty points');
    }

    const newPoints = currentPoints - data.points;

    // Update customer points
    await prisma.$queryRawUnsafe(`
      UPDATE customers
      SET loyalty_points = $1
      WHERE tenant_id = $2 AND id = $3
    `, newPoints, tenantId, data.customerId);

    // Create loyalty transaction
    return await prisma.$queryRawUnsafe(`
      INSERT INTO loyalty_transactions (
        tenant_id, customer_id, type, 
        points, points_before, points_after, description
      )
      VALUES ($1, $2, 'redeem', $3, $4, $5, $6)
      RETURNING *
    `, 
      tenantId, 
      data.customerId,
      data.points,
      currentPoints,
      newPoints,
      data.description || 'Points redeemed'
    );
  }

  // Get customer loyalty balance
  async getCustomerBalance(tenantId: string, customerId: string) {
    const result = await prisma.$queryRawUnsafe(`
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.loyalty_points,
        c.loyalty_tier,
        c.tier_updated_at,
        c.total_spent,
        COUNT(lt.id) as total_transactions
      FROM customers c
      LEFT JOIN loyalty_transactions lt ON lt.customer_id = c.id
      WHERE c.tenant_id = $1 AND c.id = $2
      GROUP BY c.id
      LIMIT 1
    `, tenantId, customerId);

    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  // Get loyalty transactions
  async getLoyaltyTransactions(tenantId: string, customerId: string, limit = 50) {
    return await prisma.$queryRawUnsafe(`
      SELECT * FROM loyalty_transactions
      WHERE tenant_id = $1 AND customer_id = $2
      ORDER BY created_at DESC
      LIMIT $3
    `, tenantId, customerId, limit);
  }

  // Create reward
  async createReward(tenantId: string, data: CreateRewardInput) {
    return await prisma.$queryRawUnsafe(`
      INSERT INTO rewards (
        tenant_id, name, description, points_cost,
        reward_type, reward_value, product_id,
        valid_from, valid_until
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      tenantId,
      data.name,
      data.description || null,
      data.pointsCost,
      data.rewardType,
      data.rewardValue || null,
      data.productId || null,
      data.validFrom || null,
      data.validUntil || null
    );
  }

  // Get all rewards
  async getRewards(tenantId: string, activeOnly = true) {
    const whereClause = activeOnly ? 'AND is_active = true' : '';
    
    return await prisma.$queryRawUnsafe(`
      SELECT r.*, p.name as product_name
      FROM rewards r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.tenant_id = $1 ${whereClause}
      ORDER BY r.points_cost ASC
    `, tenantId);
  }

  // Get reward by ID
  async getRewardById(tenantId: string, rewardId: string) {
    const result = await prisma.$queryRawUnsafe(`
      SELECT r.*, p.name as product_name
      FROM rewards r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.tenant_id = $1 AND r.id = $2
      LIMIT 1
    `, tenantId, rewardId);

    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  // Update reward
  async updateReward(tenantId: string, rewardId: string, data: UpdateRewardInput) {
    const fields = [];
    const values = [];
    let paramIndex = 3;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.pointsCost !== undefined) {
      fields.push(`points_cost = $${paramIndex++}`);
      values.push(data.pointsCost);
    }
    if (data.rewardType !== undefined) {
      fields.push(`reward_type = $${paramIndex++}`);
      values.push(data.rewardType);
    }
    if (data.rewardValue !== undefined) {
      fields.push(`reward_value = $${paramIndex++}`);
      values.push(data.rewardValue);
    }
    if (data.productId !== undefined) {
      fields.push(`product_id = $${paramIndex++}`);
      values.push(data.productId);
    }
    if (data.validFrom !== undefined) {
      fields.push(`valid_from = $${paramIndex++}`);
      values.push(data.validFrom);
    }
    if (data.validUntil !== undefined) {
      fields.push(`valid_until = $${paramIndex++}`);
      values.push(data.validUntil);
    }

    if (fields.length === 0) {
      return await this.getRewardById(tenantId, rewardId);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    return await prisma.$queryRawUnsafe(`
      UPDATE rewards
      SET ${fields.join(', ')}
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `, tenantId, rewardId, ...values);
  }

  // Delete reward
  async deleteReward(tenantId: string, rewardId: string) {
    return await prisma.$queryRawUnsafe(`
      UPDATE rewards
      SET is_active = false
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `, tenantId, rewardId);
  }

  // Redeem reward
  async redeemReward(tenantId: string, data: RedeemRewardInput) {
    // Get reward details
    const reward = await this.getRewardById(tenantId, data.rewardId);
    if (!reward) {
      throw new Error('Reward not found');
    }

    // Check if reward is active
    if (!reward.is_active) {
      throw new Error('Reward is not active');
    }

    // Check validity period
    const now = new Date();
    if (reward.valid_from && new Date(reward.valid_from) > now) {
      throw new Error('Reward is not yet valid');
    }
    if (reward.valid_until && new Date(reward.valid_until) < now) {
      throw new Error('Reward has expired');
    }

    // Get customer points
    const customer = await prisma.$queryRawUnsafe(`
      SELECT loyalty_points FROM customers
      WHERE tenant_id = $1 AND id = $2
      LIMIT 1
    `, tenantId, data.customerId);

    if (!Array.isArray(customer) || customer.length === 0) {
      throw new Error('Customer not found');
    }

    const currentPoints = Number(customer[0].loyalty_points) || 0;
    
    if (currentPoints < reward.points_cost) {
      throw new Error('Insufficient loyalty points');
    }

    // Deduct points
    const pointsDeduction = await this.redeemPoints(tenantId, {
      customerId: data.customerId,
      points: reward.points_cost,
      description: `Redeemed: ${reward.name}`,
    });

    // Create redemption record
    const redemption = await prisma.$queryRawUnsafe(`
      INSERT INTO reward_redemptions (
        tenant_id, customer_id, reward_id, transaction_id, 
        loyalty_transaction_id, points_spent
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      tenantId,
      data.customerId,
      data.rewardId,
      data.transactionId || null,
      Array.isArray(pointsDeduction) && pointsDeduction[0] ? pointsDeduction[0].id : null,
      reward.points_cost
    );

    return {
      redemption: Array.isArray(redemption) && redemption[0] ? redemption[0] : redemption,
      reward,
      pointsRemaining: currentPoints - reward.points_cost,
    };
  }

  // Get customer redemptions
  async getCustomerRedemptions(tenantId: string, customerId: string, limit = 50) {
    return await prisma.$queryRawUnsafe(`
      SELECT 
        rr.*,
        r.name as reward_name,
        r.reward_type,
        r.reward_value
      FROM reward_redemptions rr
      JOIN rewards r ON rr.reward_id = r.id
      WHERE rr.tenant_id = $1 AND rr.customer_id = $2
      ORDER BY rr.redeemed_at DESC
      LIMIT $3
    `, tenantId, customerId, limit);
  }
}

export const loyaltyService = new LoyaltyService();
