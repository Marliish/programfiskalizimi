// Referral Program Service
// Customer referral tracking and rewards
// Created: 2026-02-23 - Day 13 Marketing Features

interface ReferralProgramCreate {
  name: string;
  description?: string;
  referrerRewardType: 'points' | 'discount' | 'cash';
  referrerRewardAmount: number;
  refereeRewardType: 'points' | 'discount' | 'cash';
  refereeRewardAmount: number;
  minPurchaseAmount?: number;
}

export class ReferralService {
  /**
   * Create referral program
   */
  async createProgram(tenantId: string, data: ReferralProgramCreate): Promise<any> {
    const program = {
      id: this.generateId(),
      tenantId,
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return program;
  }

  /**
   * Get all referral programs
   */
  async getPrograms(tenantId: string): Promise<any> {
    const programs = [
      {
        id: 'prog_1',
        tenantId,
        name: 'Spring Referral Program',
        description: 'Refer a friend and both get rewards!',
        referrerRewardType: 'discount',
        referrerRewardAmount: 10.00,
        refereeRewardType: 'discount',
        refereeRewardAmount: 10.00,
        minPurchaseAmount: 50.00,
        isActive: true,
        stats: {
          totalReferrals: 145,
          completedReferrals: 89,
          pendingReferrals: 56,
          totalRewardsGiven: 1780.00,
        },
        createdAt: new Date('2026-02-01'),
      },
    ];

    return {
      programs,
      total: programs.length,
    };
  }

  /**
   * Generate referral code for customer
   */
  async generateReferralCode(tenantId: string, programId: string, customerId: string): Promise<any> {
    const code = this.generateReferralCode();

    const referral = {
      id: this.generateId(),
      tenantId,
      programId,
      referrerId: customerId,
      referralCode: code,
      status: 'pending',
      clickCount: 0,
      referrerRewarded: false,
      refereeRewarded: false,
      createdAt: new Date(),
    };

    return {
      ...referral,
      shareUrl: `https://shop.example.com?ref=${code}`,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?data=https://shop.example.com?ref=${code}`,
    };
  }

  /**
   * Get customer referrals
   */
  async getCustomerReferrals(tenantId: string, customerId: string): Promise<any> {
    const referrals = [
      {
        id: 'ref_1',
        programId: 'prog_1',
        programName: 'Spring Referral Program',
        referralCode: 'JOHN2026',
        status: 'completed',
        refereeId: 'cust_456',
        refereeName: 'Jane Smith',
        clickCount: 12,
        referrerRewarded: true,
        refereeRewarded: true,
        rewardedAt: new Date('2026-02-15'),
        completedAt: new Date('2026-02-15'),
        createdAt: new Date('2026-02-10'),
      },
      {
        id: 'ref_2',
        programId: 'prog_1',
        programName: 'Spring Referral Program',
        referralCode: 'JOHN2026',
        status: 'pending',
        clickCount: 5,
        referrerRewarded: false,
        refereeRewarded: false,
        createdAt: new Date('2026-02-18'),
      },
    ];

    const summary = {
      totalReferrals: referrals.length,
      completedReferrals: referrals.filter(r => r.status === 'completed').length,
      pendingReferrals: referrals.filter(r => r.status === 'pending').length,
      totalEarned: 20.00,
      referralCode: 'JOHN2026',
      shareUrl: 'https://shop.example.com?ref=JOHN2026',
    };

    return {
      referrals,
      summary,
    };
  }

  /**
   * Track referral click
   */
  async trackClick(referralCode: string): Promise<any> {
    await this.simulateNetworkDelay();

    console.log(`[MOCK] Tracking click for referral code: ${referralCode}`);

    return {
      success: true,
      referralCode,
      clickCount: Math.floor(Math.random() * 20) + 1,
    };
  }

  /**
   * Complete referral (when referee makes purchase)
   */
  async completeReferral(
    tenantId: string,
    referralCode: string,
    refereeCustomerId: string,
    purchaseAmount: number
  ): Promise<any> {
    await this.simulateNetworkDelay();

    console.log(`[MOCK] Completing referral for code: ${referralCode}, amount: ${purchaseAmount}`);

    return {
      success: true,
      referralCode,
      status: 'completed',
      rewards: {
        referrer: {
          type: 'discount',
          amount: 10.00,
          applied: true,
        },
        referee: {
          type: 'discount',
          amount: 10.00,
          applied: true,
        },
      },
      completedAt: new Date(),
    };
  }

  /**
   * Get referral analytics
   */
  async getReferralAnalytics(tenantId: string, programId?: string): Promise<any> {
    return {
      overview: {
        totalReferrals: 145,
        completedReferrals: 89,
        pendingReferrals: 56,
        conversionRate: 61.4,
        totalRevenueGenerated: 8920.50,
        totalRewardsGiven: 1780.00,
        roi: 401.1, // ROI percentage
      },
      topReferrers: [
        {
          customerId: 'cust_123',
          customerName: 'John Doe',
          referralCount: 12,
          completedReferrals: 8,
          revenueGenerated: 1250.00,
        },
        {
          customerId: 'cust_456',
          customerName: 'Jane Smith',
          referralCount: 9,
          completedReferrals: 7,
          revenueGenerated: 980.00,
        },
        {
          customerId: 'cust_789',
          customerName: 'Bob Johnson',
          referralCount: 8,
          completedReferrals: 5,
          revenueGenerated: 720.00,
        },
      ],
      timeline: [
        { date: '2026-02-01', referrals: 12, completed: 5 },
        { date: '2026-02-05', referrals: 18, completed: 9 },
        { date: '2026-02-10', referrals: 23, completed: 14 },
        { date: '2026-02-15', referrals: 31, completed: 21 },
        { date: '2026-02-20', referrals: 28, completed: 19 },
      ],
      referralSources: {
        direct: 45,
        email: 32,
        social: 28,
        sms: 15,
        other: 25,
      },
    };
  }

  /**
   * Update program
   */
  async updateProgram(tenantId: string, programId: string, updates: Partial<ReferralProgramCreate>): Promise<any> {
    return {
      success: true,
      programId,
      ...updates,
      updatedAt: new Date(),
    };
  }

  /**
   * Deactivate program
   */
  async deactivateProgram(tenantId: string, programId: string): Promise<any> {
    return {
      success: true,
      programId,
      isActive: false,
      message: 'Referral program deactivated',
    };
  }

  // Helper methods

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private async simulateNetworkDelay(): Promise<void> {
    const delay = 100 + Math.random() * 200;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

export const referralService = new ReferralService();
