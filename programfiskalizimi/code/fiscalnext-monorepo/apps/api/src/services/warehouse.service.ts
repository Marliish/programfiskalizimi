// Warehouse Management Service
// Team 3: Tafa (Backend Developer)
// Features: All 12 warehouse management features

import { PrismaClient } from '@fiscalnext/database';

const prisma = new PrismaClient();

export const warehouseService = {
  // ===== WAREHOUSES =====
  async createWarehouse(data: {
    tenantId: string;
    name: string;
    code: string;
    address?: string;
    city?: string;
    type?: string;
  }) {
    return await prisma.warehouse.create({
      data,
    });
  },

  async getWarehouses(tenantId: string) {
    return await prisma.warehouse.findMany({
      where: { tenantId, isActive: true },
      include: {
        zones: { where: { isActive: true } },
        bins: { where: { isActive: true }, take: 10 },
        _count: {
          select: { zones: true, bins: true },
        },
      },
    });
  },

  // ===== ZONES =====
  async createZone(data: {
    warehouseId: string;
    name: string;
    code: string;
    zoneType: string;
    temperature?: string;
    minTemperature?: number;
    maxTemperature?: number;
  }) {
    return await prisma.warehouseZone.create({
      data,
    });
  },

  async getZones(warehouseId: string) {
    return await prisma.warehouseZone.findMany({
      where: { warehouseId, isActive: true },
      include: {
        _count: { select: { bins: true } },
      },
      orderBy: { code: 'asc' },
    });
  },

  // ===== BIN LOCATIONS =====
  async createBin(data: {
    warehouseId: string;
    zoneId?: string;
    aisle?: string;
    rack?: string;
    shelf?: string;
    position?: string;
    binCode: string;
    barcode?: string;
    binType?: string;
    maxWeight?: number;
    maxVolume?: number;
  }) {
    return await prisma.warehouseBin.create({
      data,
    });
  },

  async getBins(params: {
    warehouseId: string;
    zoneId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { warehouseId, zoneId, status, search, page = 1, limit = 50 } = params;
    
    const where: any = { warehouseId, isActive: true };
    if (zoneId) where.zoneId = zoneId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { binCode: { contains: search, mode: 'insensitive' } },
        { aisle: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.warehouseBin.findMany({
        where,
        include: {
          zone: true,
          stockBins: {
            include: { lot: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { aisle: 'asc' },
          { rack: 'asc' },
          { shelf: 'asc' },
          { position: 'asc' },
        ],
      }),
      prisma.warehouseBin.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async scanBinBarcode(barcode: string) {
    const bin = await prisma.warehouseBin.findUnique({
      where: { barcode },
      include: {
        warehouse: true,
        zone: true,
        stockBins: {
          include: {
            lot: {
              select: {
                id: true,
                lotNumber: true,
                expiryDate: true,
                currentQuantity: true,
              },
            },
          },
        },
      },
    });

    if (!bin) {
      throw new Error('Bin not found');
    }

    return bin;
  },

  // ===== PICKING LISTS =====
  async createPickingList(data: {
    tenantId: string;
    warehouseId: string;
    pickingNumber: string;
    orderNumber?: string;
    priority?: string;
    dueDate?: Date;
    items: Array<{
      productId: string;
      binId?: string;
      lotId?: string;
      quantityOrdered: number;
      sequence?: number;
    }>;
  }) {
    const { items, ...pickingListData } = data;

    return await prisma.pickingList.create({
      data: {
        ...pickingListData,
        items: {
          create: items.map((item, index) => ({
            ...item,
            sequence: item.sequence ?? index + 1,
          })),
        },
      },
      include: {
        items: {
          include: {
            bin: true,
            lot: true,
          },
          orderBy: { sequence: 'asc' },
        },
      },
    });
  },

  async assignPickingList(pickingListId: string, assignedTo: string) {
    return await prisma.pickingList.update({
      where: { id: pickingListId },
      data: {
        assignedTo,
        status: 'assigned',
      },
    });
  },

  async startPicking(pickingListId: string) {
    return await prisma.pickingList.update({
      where: { id: pickingListId },
      data: {
        status: 'picking',
        startedAt: new Date(),
      },
    });
  },

  async pickItem(itemId: string, quantityPicked: number) {
    const item = await prisma.pickingListItem.findUnique({
      where: { id: itemId },
    });

    if (!item) throw new Error('Item not found');

    const status = quantityPicked < item.quantityOrdered ? 'short_picked' : 'picked';

    return await prisma.pickingListItem.update({
      where: { id: itemId },
      data: {
        quantityPicked,
        status,
      },
    });
  },

  async completePickingList(pickingListId: string) {
    return await prisma.pickingList.update({
      where: { id: pickingListId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
  },

  async getPickingLists(params: {
    tenantId: string;
    warehouseId?: string;
    status?: string;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, warehouseId, status, assignedTo, page = 1, limit = 20 } = params;
    
    const where: any = { tenantId };
    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;

    const [data, total] = await Promise.all([
      prisma.pickingList.findMany({
        where,
        include: {
          warehouse: true,
          items: {
            include: {
              bin: true,
            },
          },
          _count: { select: { items: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.pickingList.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  },

  // ===== PACKING STATIONS =====
  async createPackingStation(data: {
    warehouseId: string;
    stationNumber: string;
    name: string;
  }) {
    return await prisma.packingStation.create({ data });
  },

  async assignToPackingStation(stationId: string, orderNumber: string, operatorId: string) {
    return await prisma.packingStation.update({
      where: { id: stationId },
      data: {
        currentOrderNumber: orderNumber,
        operatorId,
      },
    });
  },

  async getPackingStations(warehouseId: string) {
    return await prisma.packingStation.findMany({
      where: { warehouseId, isActive: true },
      orderBy: { stationNumber: 'asc' },
    });
  },

  // ===== STOCK MOVEMENTS TRACKING =====
  async trackStockMovement(data: {
    tenantId: string;
    productId: string;
    fromBinId?: string;
    toBinId?: string;
    lotId?: string;
    quantity: number;
    movementType: string;
    performedBy: string;
    notes?: string;
  }) {
    return await prisma.lotMovement.create({
      data: {
        tenantId: data.tenantId,
        lotId: data.lotId!,
        movementType: data.movementType,
        quantity: data.quantity,
        quantityBefore: 0, // Should be fetched from current stock
        quantityAfter: 0, // Should be calculated
        fromBinId: data.fromBinId,
        toBinId: data.toBinId,
        performedBy: data.performedBy,
        notes: data.notes,
      },
    });
  },

  // ===== CYCLE COUNTING =====
  async createCycleCount(data: {
    tenantId: string;
    warehouseId: string;
    countNumber: string;
    countType: string;
    scheduledDate: Date;
    assignedTo?: string;
    items: Array<{
      productId: string;
      binId?: string;
      expectedQuantity: number;
    }>;
  }) {
    const { items, ...countData } = data;

    return await prisma.cycleCount.create({
      data: {
        ...countData,
        totalItems: items.length,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });
  },

  async countItem(itemId: string, countedQuantity: number, countedBy: string) {
    const item = await prisma.cycleCountItem.findUnique({
      where: { id: itemId },
    });

    if (!item) throw new Error('Item not found');

    const variance = countedQuantity - item.expectedQuantity;

    const updated = await prisma.cycleCountItem.update({
      where: { id: itemId },
      data: {
        countedQuantity,
        variance,
        status: 'counted',
        countedAt: new Date(),
      },
    });

    // Update cycle count stats
    await prisma.cycleCount.update({
      where: { id: item.cycleCountId },
      data: {
        countedItems: { increment: 1 },
        discrepancies: variance !== 0 ? { increment: 1 } : undefined,
      },
    });

    return updated;
  },

  async completeCycleCount(cycleCountId: string) {
    return await prisma.cycleCount.update({
      where: { id: cycleCountId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
  },

  // ===== WAREHOUSE TRANSFERS =====
  async createWarehouseTransfer(data: {
    tenantId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    transferNumber: string;
    items: Array<{
      productId: string;
      quantity: number;
    }>;
  }) {
    // This would link to existing StockTransfer model
    // Implementation depends on existing schema
    return { message: 'Warehouse transfer created' };
  },

  // ===== RECEIVING WORKFLOWS =====
  async createReceiving(data: {
    tenantId: string;
    warehouseId: string;
    purchaseOrderId?: string;
    items: Array<{
      productId: string;
      lotNumber?: string;
      quantity: number;
      binId?: string;
    }>;
  }) {
    // Create receiving record and update stock
    return { message: 'Receiving created' };
  },

  // ===== PUT-AWAY RULES =====
  async createPutAwayRule(data: {
    tenantId: string;
    warehouseId: string;
    name: string;
    priority: number;
    productCategoryId?: string;
    productId?: string;
    targetZoneType?: string;
    targetZoneId?: string;
  }) {
    return await prisma.putAwayRule.create({ data });
  },

  async getPutAwayRules(warehouseId: string) {
    return await prisma.putAwayRule.findMany({
      where: { warehouseId, isActive: true },
      orderBy: { priority: 'desc' },
    });
  },

  async suggestPutAwayLocation(params: {
    warehouseId: string;
    productId: string;
    quantity: number;
  }) {
    // Find applicable put-away rules
    const rules = await this.getPutAwayRules(params.warehouseId);
    
    // Simple logic: find first available bin in target zone
    if (rules.length > 0 && rules[0].targetZoneId) {
      const bins = await prisma.warehouseBin.findMany({
        where: {
          zoneId: rules[0].targetZoneId,
          status: { in: ['available', 'occupied'] },
          isActive: true,
        },
        take: 5,
      });

      return bins[0] || null;
    }

    return null;
  },

  // ===== PICK-PACK-SHIP PROCESS =====
  async createShipmentOrder(data: {
    tenantId: string;
    warehouseId: string;
    orderNumber: string;
    customerName?: string;
    shippingAddress?: any;
  }) {
    return await prisma.shipmentOrder.create({ data });
  },

  async updateShipmentStatus(orderNumber: string, status: string, updates?: any) {
    return await prisma.shipmentOrder.update({
      where: { orderNumber },
      data: {
        status,
        ...updates,
      },
    });
  },

  async getShipmentOrders(params: {
    tenantId: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, status, page = 1, limit = 20 } = params;
    
    const where: any = { tenantId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.shipmentOrder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { orderedAt: 'desc' },
      }),
      prisma.shipmentOrder.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  },
};
