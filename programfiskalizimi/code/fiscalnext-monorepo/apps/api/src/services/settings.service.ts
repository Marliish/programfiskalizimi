// Settings Service - Manage tenant and user settings
import { prisma } from '@fiscalnext/database';
import { UpdateBusinessInput, UpdateUserInput, UpdateSystemInput } from '../schemas/settings.schema';

export class SettingsService {
  /**
   * Get all settings (tenant + user + system)
   */
  async getSettings(userId: string, tenantId: string) {
    const [tenant, user] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          nipt: true,
          address: true,
          city: true,
          country: true,
          phone: true,
          email: true,
          logoUrl: true,
          settings: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      }),
    ]);

    if (!tenant || !user) {
      throw new Error('Settings not found');
    }

    // Parse system settings from tenant.settings JSON
    const systemSettings = (tenant.settings as any) || {};

    return {
      business: {
        name: tenant.name,
        slug: tenant.slug,
        nipt: tenant.nipt,
        address: tenant.address,
        city: tenant.city,
        country: tenant.country,
        phone: tenant.phone,
        email: tenant.email,
        logoUrl: tenant.logoUrl,
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        roles: user.userRoles.map((ur) => ur.role.name),
      },
      system: {
        taxRate: systemSettings.taxRate || 20,
        receiptFooter: systemSettings.receiptFooter || 'Thank you for your business!',
        currency: systemSettings.currency || 'EUR',
        timeZone: systemSettings.timeZone || 'Europe/Tirane',
      },
    };
  }

  /**
   * Update business profile (tenant)
   */
  async updateBusiness(tenantId: string, data: UpdateBusinessInput) {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.nipt !== undefined && { nipt: data.nipt }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.country && { country: data.country }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        nipt: true,
        address: true,
        city: true,
        country: true,
        phone: true,
        email: true,
        logoUrl: true,
      },
    });

    return tenant;
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, data: UpdateUserInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email && { email: data.email }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    return user;
  }

  /**
   * Update system settings (stored in tenant.settings JSON)
   */
  async updateSystem(tenantId: string, data: UpdateSystemInput) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const currentSettings = (tenant.settings as any) || {};
    const updatedSettings = {
      ...currentSettings,
      ...data,
    };

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: updatedSettings },
      select: { settings: true },
    });

    return updated.settings;
  }
}

export const settingsService = new SettingsService();
