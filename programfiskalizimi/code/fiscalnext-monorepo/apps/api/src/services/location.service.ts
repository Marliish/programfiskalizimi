// Location Service - Multi-location management
import { prisma } from '@fiscalnext/database';

export class LocationService {
  /**
   * Get all locations for a tenant
   */
  async getLocations(tenantId: string) {
    const locations = await prisma.location.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            stock: true,
            transactions: true,
          },
        },
      },
    });

    return locations;
  }

  /**
   * Get location by ID
   */
  async getLocationById(tenantId: string, locationId: string) {
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        tenantId,
      },
      include: {
        stock: {
          include: {
            product: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!location) {
      throw new Error('Location not found');
    }

    return location;
  }

  /**
   * Create new location
   */
  async createLocation(tenantId: string, data: {
    name: string;
    type: string;
    address?: string;
    city?: string;
    phone?: string;
  }) {
    const location = await prisma.location.create({
      data: {
        ...data,
        tenantId,
      },
    });

    return location;
  }

  /**
   * Update location
   */
  async updateLocation(tenantId: string, locationId: string, data: {
    name?: string;
    type?: string;
    address?: string;
    city?: string;
    phone?: string;
    isActive?: boolean;
  }) {
    const location = await prisma.location.updateMany({
      where: {
        id: locationId,
        tenantId,
      },
      data,
    });

    if (location.count === 0) {
      throw new Error('Location not found');
    }

    return this.getLocationById(tenantId, locationId);
  }

  /**
   * Delete location
   */
  async deleteLocation(tenantId: string, locationId: string) {
    // Check if location has stock or transactions
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        tenantId,
      },
      include: {
        _count: {
          select: {
            stock: true,
            transactions: true,
          },
        },
      },
    });

    if (!location) {
      throw new Error('Location not found');
    }

    if (location._count.stock > 0 || location._count.transactions > 0) {
      throw new Error('Cannot delete location with existing stock or transactions. Deactivate it instead.');
    }

    await prisma.location.delete({
      where: { id: locationId },
    });

    return { message: 'Location deleted successfully' };
  }

  /**
   * Get location stock summary
   */
  async getLocationStock(tenantId: string, locationId: string) {
    const stock = await prisma.stock.findMany({
      where: {
        tenantId,
        locationId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            unit: true,
            sellingPrice: true,
          },
        },
      },
      orderBy: {
        product: {
          name: 'asc',
        },
      },
    });

    return stock;
  }
}

export const locationService = new LocationService();
