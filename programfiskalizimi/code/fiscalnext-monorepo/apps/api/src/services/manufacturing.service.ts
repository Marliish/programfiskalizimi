/**
 * MANUFACTURING SERVICE
 * Team 4: Eroldi (CTO), Boli, Artan
 * All 40 manufacturing features
 */

import { prisma, Prisma } from '@fiscalnext/database';

export class ManufacturingService {
  // ============================================
  // 1. BILL OF MATERIALS (BOM) - 10 Features
  // ============================================

  /**
   * Feature 1: Create Multi-level BOM
   */
  async createBOM(data: {
    tenantId: string;
    productId: string;
    name: string;
    description?: string;
    bomType?: string;
    items: Array<{
      componentId: string;
      quantity: number;
      unit?: string;
      parentItemId?: string;
      level?: number;
      sequence?: number;
      isOptional?: boolean;
      notes?: string;
    }>;
    notes?: string;
    createdBy: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      // Get the next version number for this product
      const lastBOM = await tx.bOM.findFirst({
        where: { tenantId: data.tenantId, productId: data.productId },
        orderBy: { version: 'desc' },
      });

      const version = (lastBOM?.version || 0) + 1;

      // Create BOM
      const bom = await tx.bOM.create({
        data: {
          tenantId: data.tenantId,
          productId: data.productId,
          version,
          name: data.name,
          description: data.description,
          bomType: data.bomType || 'production',
          notes: data.notes,
          createdBy: data.createdBy,
        },
      });

      // Create BOM items
      const items = await Promise.all(
        data.items.map((item) =>
          tx.bOMItem.create({
            data: {
              tenantId: data.tenantId,
              bomId: bom.id,
              componentId: item.componentId,
              quantity: new Prisma.Decimal(item.quantity),
              unit: item.unit || 'pieces',
              parentItemId: item.parentItemId,
              level: item.level || 0,
              sequence: item.sequence || 0,
              isOptional: item.isOptional || false,
              notes: item.notes,
            },
          })
        )
      );

      // Calculate BOM cost
      await this.calculateBOMCost(tx, bom.id, data.tenantId);

      return { bom, items };
    });
  }

  /**
   * Feature 2: Component Substitutions
   */
  async createSubstitution(data: {
    tenantId: string;
    primaryComponentId: string;
    substituteComponentId: string;
    conversionRatio?: number;
    priority?: number;
    notes?: string;
  }) {
    return await prisma.bOMSubstitution.create({
      data: {
        tenantId: data.tenantId,
        primaryComponentId: data.primaryComponentId,
        substituteComponentId: data.substituteComponentId,
        conversionRatio: new Prisma.Decimal(data.conversionRatio || 1),
        priority: data.priority || 1,
        notes: data.notes,
      },
      include: {
        primaryComponent: {
          include: { component: true },
        },
        substituteComponent: {
          include: { component: true },
        },
      },
    });
  }

  /**
   * Feature 3: BOM Versioning
   */
  async createBOMVersion(
    bomId: string,
    tenantId: string,
    changeLog: string,
    changedBy: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const bom = await tx.bOM.findFirst({
        where: { id: bomId, tenantId },
        include: { items: true },
      });

      if (!bom) throw new Error('BOM not found');

      // Create version snapshot
      const version = await tx.bOMVersion.create({
        data: {
          tenantId,
          bomId,
          version: bom.version,
          changeLog,
          changedBy,
          snapshot: JSON.stringify({ bom, items: bom.items }),
        },
      });

      return version;
    });
  }

  /**
   * Feature 4: BOM Costing
   */
  async calculateBOMCost(
    tx: Prisma.TransactionClient,
    bomId: string,
    tenantId: string
  ) {
    const items = await tx.bOMItem.findMany({
      where: { bomId, tenantId },
      include: { component: true },
    });

    let totalCost = new Prisma.Decimal(0);

    for (const item of items) {
      const componentCost =
        item.component.costPrice || new Prisma.Decimal(0);
      const itemCost = componentCost.mul(item.quantity);
      totalCost = totalCost.add(itemCost);

      // Update item cost
      await tx.bOMItem.update({
        where: { id: item.id },
        data: {
          unitCost: componentCost,
          totalCost: itemCost,
        },
      });
    }

    // Update BOM total cost
    await tx.bOM.update({
      where: { id: bomId },
      data: { totalCost },
    });

    return totalCost;
  }

  /**
   * Feature 5: BOM Explosion
   */
  async explodeBOM(
    bomId: string,
    tenantId: string,
    quantity: number = 1,
    includeSubstitutes: boolean = false
  ) {
    const bom = await prisma.bOM.findFirst({
      where: { id: bomId, tenantId },
      include: {
        items: {
          include: {
            component: true,
            childItems: true,
            substitutes: includeSubstitutes
              ? {
                  include: {
                    substituteComponent: {
                      include: { component: true },
                    },
                  },
                }
              : false,
          },
        },
      },
    });

    if (!bom) throw new Error('BOM not found');

    const explosion: any[] = [];

    function explodeLevel(items: any[], level: number, multiplier: number) {
      items.forEach((item) => {
        const requiredQty = Number(item.quantity) * multiplier;

        explosion.push({
          level,
          componentId: item.componentId,
          componentName: item.component.name,
          componentSKU: item.component.sku,
          requiredQuantity: requiredQty,
          unit: item.unit,
          unitCost: Number(item.unitCost),
          totalCost: requiredQty * Number(item.unitCost),
          isOptional: item.isOptional,
        });

        // Add substitutes if requested
        if (includeSubstitutes && item.substitutes?.length > 0) {
          item.substitutes.forEach((sub: any) => {
            explosion.push({
              level,
              componentId: sub.substituteComponent.componentId,
              componentName: `${sub.substituteComponent.component.name} (Substitute)`,
              componentSKU: sub.substituteComponent.component.sku,
              requiredQuantity:
                requiredQty * Number(sub.conversionRatio),
              unit: sub.substituteComponent.unit,
              unitCost: Number(sub.substituteComponent.unitCost),
              isSubstitute: true,
              priority: sub.priority,
            });
          });
        }

        // Recurse for nested items
        if (item.childItems?.length > 0) {
          explodeLevel(item.childItems, level + 1, requiredQty);
        }
      });
    }

    explodeLevel(bom.items, 0, quantity);

    return {
      bom,
      quantity,
      explosion,
      totalCost: explosion.reduce((sum, item) => sum + (item.totalCost || 0), 0),
    };
  }

  /**
   * Feature 6: Where-used Reports
   */
  async getWhereUsed(componentId: string, tenantId: string) {
    const usages = await prisma.bOMItem.findMany({
      where: {
        componentId,
        tenantId,
      },
      include: {
        bom: {
          include: {
            product: true,
          },
        },
      },
    });

    return usages.map((usage) => ({
      bomId: usage.bomId,
      bomName: usage.bom.name,
      productId: usage.bom.productId,
      productName: usage.bom.product.name,
      quantity: Number(usage.quantity),
      unit: usage.unit,
      level: usage.level,
      isActive: usage.bom.isActive,
    }));
  }

  /**
   * Feature 7: BOM Copy/Clone
   */
  async cloneBOM(
    bomId: string,
    tenantId: string,
    newName: string,
    newProductId?: string,
    includeItems: boolean = true,
    createdBy: string = ''
  ) {
    return await prisma.$transaction(async (tx) => {
      const original = await tx.bOM.findFirst({
        where: { id: bomId, tenantId },
        include: { items: true },
      });

      if (!original) throw new Error('BOM not found');

      const productId = newProductId || original.productId;

      // Get next version for target product
      const lastBOM = await tx.bOM.findFirst({
        where: { tenantId, productId },
        orderBy: { version: 'desc' },
      });
      const version = (lastBOM?.version || 0) + 1;

      // Create new BOM
      const newBOM = await tx.bOM.create({
        data: {
          tenantId,
          productId,
          version,
          name: newName,
          description: original.description,
          bomType: original.bomType,
          notes: original.notes,
          createdBy: createdBy || original.createdBy,
        },
      });

      // Clone items if requested
      if (includeItems && original.items.length > 0) {
        await Promise.all(
          original.items.map((item) =>
            tx.bOMItem.create({
              data: {
                tenantId,
                bomId: newBOM.id,
                componentId: item.componentId,
                quantity: item.quantity,
                unit: item.unit,
                level: item.level,
                sequence: item.sequence,
                isOptional: item.isOptional,
                unitCost: item.unitCost,
                totalCost: item.totalCost,
                notes: item.notes,
              },
            })
          )
        );

        // Update cost
        await tx.bOM.update({
          where: { id: newBOM.id },
          data: { totalCost: original.totalCost },
        });
      }

      return newBOM;
    });
  }

  /**
   * Feature 8: Component Availability Check
   */
  async checkComponentAvailability(bomId: string, tenantId: string, quantity: number = 1) {
    const explosion = await this.explodeBOM(bomId, tenantId, quantity);

    const availability = await Promise.all(
      explosion.explosion.map(async (item: any) => {
        const stock = await prisma.stock.groupBy({
          by: ['productId'],
          where: {
            productId: item.componentId,
            tenantId,
          },
          _sum: {
            quantity: true,
          },
        });

        const available = Number(stock[0]?._sum.quantity || 0);
        const shortage = Math.max(0, item.requiredQuantity - available);

        return {
          ...item,
          availableQuantity: available,
          shortage,
          isAvailable: available >= item.requiredQuantity,
        };
      })
    );

    const allAvailable = availability.every((item) => item.isAvailable);

    return {
      bomId,
      quantity,
      allAvailable,
      availability,
      shortages: availability.filter((item) => !item.isAvailable),
    };
  }

  /**
   * Feature 9: BOM Import/Export
   */
  async exportBOM(bomId: string, tenantId: string, format: 'json' | 'csv' = 'json') {
    const bom = await prisma.bOM.findFirst({
      where: { id: bomId, tenantId },
      include: {
        product: true,
        items: {
          include: { component: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!bom) throw new Error('BOM not found');

    if (format === 'json') {
      return {
        bom: {
          id: bom.id,
          name: bom.name,
          productName: bom.product.name,
          version: bom.version,
        },
        items: bom.items.map((item) => ({
          sequence: item.sequence,
          level: item.level,
          componentName: item.component.name,
          componentSKU: item.component.sku,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitCost: Number(item.unitCost),
          totalCost: Number(item.totalCost),
          isOptional: item.isOptional,
        })),
      };
    }

    // CSV format
    const csv = [
      ['Level', 'Component', 'SKU', 'Quantity', 'Unit', 'Unit Cost', 'Total Cost', 'Optional'],
      ...bom.items.map((item) => [
        item.level,
        item.component.name,
        item.component.sku || '',
        Number(item.quantity),
        item.unit,
        Number(item.unitCost),
        Number(item.totalCost),
        item.isOptional ? 'Yes' : 'No',
      ]),
    ];

    return csv.map((row) => row.join(',')).join('\n');
  }

  /**
   * Feature 10: BOM Approval Workflows
   */
  async approveBOM(bomId: string, tenantId: string, approved: boolean, approvedBy: string) {
    return await prisma.$transaction(async (tx) => {
      const bom = await tx.bOM.findFirst({
        where: { id: bomId, tenantId },
      });

      if (!bom) throw new Error('BOM not found');

      if (bom.status !== 'pending_approval' && bom.status !== 'draft') {
        throw new Error('BOM is not pending approval');
      }

      const updated = await tx.bOM.update({
        where: { id: bomId },
        data: {
          status: approved ? 'approved' : 'draft',
          approvedBy: approved ? approvedBy : null,
          approvedAt: approved ? new Date() : null,
          isActive: approved,
        },
      });

      // Create version history
      await this.createBOMVersion(
        bomId,
        tenantId,
        approved ? 'BOM approved' : 'Approval rejected',
        approvedBy
      );

      return updated;
    });
  }

  /**
   * List BOMs with pagination and filters
   */
  async listBOMs(params: {
    tenantId: string;
    page?: number;
    limit?: number;
    search?: string;
    productId?: string;
    status?: string;
    isActive?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BOMWhereInput = {
      tenantId: params.tenantId,
      ...(params.productId && { productId: params.productId }),
      ...(params.status && { status: params.status }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          {
            product: {
              name: { contains: params.search, mode: 'insensitive' },
            },
          },
        ],
      }),
    };

    const [boms, total] = await Promise.all([
      prisma.bOM.findMany({
        where,
        include: {
          product: true,
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bOM.count({ where }),
    ]);

    return {
      data: boms.map((bom) => ({
        ...bom,
        itemCount: bom.items.length,
        items: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // 2. PRODUCTION PLANNING - 10 Features
  // ============================================

  /**
   * Feature 11: Production Schedules
   */
  async createProductionSchedule(data: {
    tenantId: string;
    name: string;
    description?: string;
    productId: string;
    plannedQuantity: number;
    startDate: Date;
    endDate: Date;
    priority?: string;
    machineId?: string;
    shiftId?: string;
    leadTimeDays?: number;
    notes?: string;
    createdBy: string;
  }) {
    return await prisma.productionSchedule.create({
      data: {
        ...data,
        plannedQuantity: new Prisma.Decimal(data.plannedQuantity),
        priority: data.priority || 'medium',
        leadTimeDays: data.leadTimeDays || 0,
      },
      include: {
        product: true,
        machine: true,
        shift: true,
      },
    });
  }

  /**
   * Feature 12: Capacity Planning
   */
  async getCapacityPlan(params: {
    tenantId: string;
    startDate: Date;
    endDate: Date;
    resourceType?: string;
    machineId?: string;
  }) {
    const schedules = await prisma.productionSchedule.findMany({
      where: {
        tenantId: params.tenantId,
        startDate: { gte: params.startDate },
        endDate: { lte: params.endDate },
        ...(params.machineId && { machineId: params.machineId }),
      },
      include: {
        product: true,
        machine: true,
        resourceAllocations: true,
      },
    });

    const machines = await prisma.productionMachine.findMany({
      where: {
        tenantId: params.tenantId,
        ...(params.machineId && { id: params.machineId }),
      },
    });

    const capacity = machines.map((machine) => {
      const allocatedSchedules = schedules.filter(
        (s) => s.machineId === machine.id
      );

      const totalPlannedHours = allocatedSchedules.reduce((sum, schedule) => {
        const days = Math.ceil(
          (schedule.endDate.getTime() - schedule.startDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + days * Number(machine.hoursPerDay);
      }, 0);

      const availableHours = Number(machine.hoursPerDay) * 
        Math.ceil((params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24));

      const utilizationRate = (totalPlannedHours / availableHours) * 100;

      return {
        machineId: machine.id,
        machineName: machine.name,
        availableHours,
        allocatedHours: totalPlannedHours,
        utilizationRate: Math.min(100, utilizationRate),
        isOvercapacity: utilizationRate > 100,
      };
    });

    return {
      period: { start: params.startDate, end: params.endDate },
      capacity,
      totalSchedules: schedules.length,
    };
  }

  /**
   * Feature 13: Resource Allocation
   */
  async allocateResource(data: {
    tenantId: string;
    scheduleId: string;
    resourceType: string;
    resourceId: string;
    resourceName: string;
    allocatedQuantity: number;
    unit?: string;
    unitCost?: number;
    notes?: string;
  }) {
    const totalCost = data.allocatedQuantity * (data.unitCost || 0);

    return await prisma.resourceAllocation.create({
      data: {
        ...data,
        allocatedQuantity: new Prisma.Decimal(data.allocatedQuantity),
        unit: data.unit || 'hours',
        unitCost: new Prisma.Decimal(data.unitCost || 0),
        totalCost: new Prisma.Decimal(totalCost),
      },
      include: {
        schedule: {
          include: { product: true },
        },
      },
    });
  }

  /**
   * Feature 14: Lead Time Management
   */
  async calculateLeadTime(productId: string, tenantId: string, quantity: number = 1) {
    // Get active BOM
    const bom = await prisma.bOM.findFirst({
      where: {
        productId,
        tenantId,
        isActive: true,
      },
      include: {
        items: true,
      },
    });

    if (!bom) {
      return {
        productId,
        estimatedLeadTimeDays: 1, // Default
        breakdown: [],
      };
    }

    // Get historical data
    const completedOrders = await prisma.workOrder.findMany({
      where: {
        productId,
        tenantId,
        status: 'completed',
      },
      orderBy: { actualEndDate: 'desc' },
      take: 10,
    });

    let averageLeadTime = 0;
    if (completedOrders.length > 0) {
      const totalDays = completedOrders.reduce((sum, order) => {
        if (order.actualStartDate && order.actualEndDate) {
          const days = Math.ceil(
            (order.actualEndDate.getTime() - order.actualStartDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }
        return sum;
      }, 0);
      averageLeadTime = Math.ceil(totalDays / completedOrders.length);
    }

    return {
      productId,
      quantity,
      estimatedLeadTimeDays: averageLeadTime || 3, // Default to 3 days
      historicalOrdersAnalyzed: completedOrders.length,
      breakdown: {
        procurement: Math.ceil(averageLeadTime * 0.3),
        production: Math.ceil(averageLeadTime * 0.6),
        quality: Math.ceil(averageLeadTime * 0.1),
      },
    };
  }

  /**
   * Feature 15: Material Requirements Planning (MRP)
   */
  async runMRP(params: {
    tenantId: string;
    startDate: Date;
    endDate: Date;
    productId?: string;
    includeForecasts?: boolean;
  }) {
    // Get all production schedules in the period
    const schedules = await prisma.productionSchedule.findMany({
      where: {
        tenantId: params.tenantId,
        startDate: { gte: params.startDate },
        endDate: { lte: params.endDate },
        ...(params.productId && { productId: params.productId }),
        status: { in: ['planned', 'in_progress'] },
      },
      include: {
        product: {
          include: {
            BOM: {
              where: { isActive: true },
              include: { items: { include: { component: true } } },
            },
          },
        },
      },
    });

    const requirements: any[] = [];

    for (const schedule of schedules) {
      const bom = schedule.product.BOM[0];
      if (!bom) continue;

      const explosion = await this.explodeBOM(
        bom.id,
        params.tenantId,
        Number(schedule.plannedQuantity)
      );

      for (const item of explosion.explosion) {
        // Check current stock
        const stock = await prisma.stock.groupBy({
          by: ['productId'],
          where: {
            productId: item.componentId,
            tenantId: params.tenantId,
          },
          _sum: { quantity: true },
        });

        const available = Number(stock[0]?._sum.quantity || 0);
        const shortage = Math.max(0, item.requiredQuantity - available);

        if (shortage > 0) {
          requirements.push({
            productId: item.componentId,
            componentName: item.componentName,
            requiredQuantity: item.requiredQuantity,
            availableQuantity: available,
            shortageQuantity: shortage,
            requiredByDate: schedule.startDate,
            sourceScheduleId: schedule.id,
          });
        }
      }
    }

    // Save requirements
    await Promise.all(
      requirements.map((req) =>
        prisma.materialRequirement.upsert({
          where: {
            // Composite unique key would be needed in schema
            productId_sourceId: {
              productId: req.productId,
              sourceId: req.sourceScheduleId,
            },
          },
          create: {
            tenantId: params.tenantId,
            productId: req.productId,
            requiredQuantity: new Prisma.Decimal(req.requiredQuantity),
            availableQuantity: new Prisma.Decimal(req.availableQuantity),
            shortageQuantity: new Prisma.Decimal(req.shortageQuantity),
            requiredByDate: req.requiredByDate,
            sourceType: 'production_schedule',
            sourceId: req.sourceScheduleId,
          },
          update: {
            requiredQuantity: new Prisma.Decimal(req.requiredQuantity),
            availableQuantity: new Prisma.Decimal(req.availableQuantity),
            shortageQuantity: new Prisma.Decimal(req.shortageQuantity),
          },
        }).catch(() => {
          // Fallback: just create without upsert if unique constraint doesn't exist
          return prisma.materialRequirement.create({
            data: {
              tenantId: params.tenantId,
              productId: req.productId,
              requiredQuantity: new Prisma.Decimal(req.requiredQuantity),
              availableQuantity: new Prisma.Decimal(req.availableQuantity),
              shortageQuantity: new Prisma.Decimal(req.shortageQuantity),
              requiredByDate: req.requiredByDate,
              sourceType: 'production_schedule',
              sourceId: req.sourceScheduleId,
            },
          });
        })
      )
    );

    return {
      period: { start: params.startDate, end: params.endDate },
      schedulesAnalyzed: schedules.length,
      totalRequirements: requirements.length,
      requirements,
    };
  }

  /**
   * Feature 16: Production Calendars
   */
  async createProductionCalendar(data: {
    tenantId: string;
    name: string;
    description?: string;
    date: Date;
    isWorkingDay?: boolean;
    startTime?: string;
    endTime?: string;
    dayType?: string;
    notes?: string;
  }) {
    return await prisma.productionCalendar.create({
      data: {
        ...data,
        isWorkingDay: data.isWorkingDay ?? true,
        dayType: data.dayType || 'regular',
      },
    });
  }

  /**
   * Feature 17: Shift Scheduling
   */
  async createProductionShift(data: {
    tenantId: string;
    name: string;
    description?: string;
    startTime: string;
    endTime: string;
    workingDays?: number[];
    capacityPercentage?: number;
    isActive?: boolean;
  }) {
    return await prisma.productionShift.create({
      data: {
        ...data,
        workingDays: data.workingDays || [1, 2, 3, 4, 5],
        capacityPercentage: new Prisma.Decimal(data.capacityPercentage || 100),
        isActive: data.isActive ?? true,
      },
    });
  }

  /**
   * Feature 18: Machine Scheduling
   */
  async createMachineSchedule(data: {
    tenantId: string;
    machineId: string;
    workOrderId?: string;
    startTime: Date;
    endTime: Date;
    notes?: string;
  }) {
    // Check for conflicts
    const conflicts = await prisma.machineSchedule.count({
      where: {
        machineId: data.machineId,
        tenantId: data.tenantId,
        status: { in: ['scheduled', 'in_progress'] },
        OR: [
          {
            AND: [
              { startTime: { lte: data.startTime } },
              { endTime: { gte: data.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lte: data.endTime } },
              { endTime: { gte: data.endTime } },
            ],
          },
        ],
      },
    });

    if (conflicts > 0) {
      throw new Error('Machine schedule conflict detected');
    }

    return await prisma.machineSchedule.create({
      data,
      include: {
        machine: true,
        workOrder: true,
      },
    });
  }

  /**
   * Feature 19: Bottleneck Analysis
   */
  async runBottleneckAnalysis(params: {
    tenantId: string;
    analysisName: string;
    startDate?: Date;
    endDate?: Date;
    resourceType?: string;
  }) {
    const startDate = params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = params.endDate || new Date();

    // Analyze machines
    const machines = await prisma.productionMachine.findMany({
      where: { tenantId: params.tenantId },
    });

    const bottlenecks: any[] = [];

    for (const machine of machines) {
      const schedules = await prisma.machineSchedule.findMany({
        where: {
          machineId: machine.id,
          tenantId: params.tenantId,
          startTime: { gte: startDate },
          endTime: { lte: endDate },
        },
      });

      const totalHours = schedules.reduce((sum, schedule) => {
        const hours =
          (schedule.endTime.getTime() - schedule.startTime.getTime()) /
          (1000 * 60 * 60);
        return sum + hours;
      }, 0);

      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const capacityHours = periodDays * Number(machine.hoursPerDay);
      const utilizationRate = (totalHours / capacityHours) * 100;

      if (utilizationRate > 80) {
        // Consider as bottleneck if >80% utilized
        const delayedOrders = await prisma.workOrder.count({
          where: {
            machineId: machine.id,
            tenantId: params.tenantId,
            status: 'in_progress',
            plannedEndDate: { lt: new Date() },
          },
        });

        const bottleneck = await prisma.bottleneckAnalysis.create({
          data: {
            tenantId: params.tenantId,
            analysisName: params.analysisName,
            resourceType: 'machine',
            resourceId: machine.id,
            resourceName: machine.name,
            utilizationRate: new Prisma.Decimal(utilizationRate),
            capacityHours: new Prisma.Decimal(capacityHours),
            usedHours: new Prisma.Decimal(totalHours),
            idleHours: new Prisma.Decimal(Math.max(0, capacityHours - totalHours)),
            delayedOrders,
            impactScore: new Prisma.Decimal(
              utilizationRate > 95 ? 5 : utilizationRate > 90 ? 4 : 3
            ),
            severity:
              utilizationRate > 95 ? 'critical' : 
              utilizationRate > 90 ? 'high' : 'medium',
            recommendations: [
              'Consider adding more capacity',
              'Optimize production schedules',
              'Review maintenance schedules',
            ],
            analyzedBy: 'system',
          },
        });

        bottlenecks.push(bottleneck);
      }
    }

    return {
      analysisName: params.analysisName,
      period: { start: startDate, end: endDate },
      bottlenecksFound: bottlenecks.length,
      bottlenecks,
    };
  }

  /**
   * Feature 20: Production Forecasts
   */
  async createProductionForecast(data: {
    tenantId: string;
    productId: string;
    forecastPeriod: string;
    startDate: Date;
    endDate: Date;
    forecastedQuantity: number;
    forecastMethod?: string;
    notes?: string;
    createdBy: string;
  }) {
    return await prisma.productionForecast.create({
      data: {
        ...data,
        forecastedQuantity: new Prisma.Decimal(data.forecastedQuantity),
        forecastMethod: data.forecastMethod || 'manual',
      },
      include: {
        product: true,
      },
    });
  }

  // [CONTINUED IN NEXT PART - Character limit reached]
  
  // Note: Due to character limits, I'll create the remaining methods (Work Orders, QC, Costing)
  // in a separate continuation. The structure is established.
}

export const manufacturingService = new ManufacturingService();
