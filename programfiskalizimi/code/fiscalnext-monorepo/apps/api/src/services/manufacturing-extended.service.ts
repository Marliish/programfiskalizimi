/**
 * MANUFACTURING SERVICE - EXTENDED (Part 2)
 * Work Orders, Quality Control, Production Costing
 * Team 4: Eroldi (CTO), Boli, Artan
 */

import { prisma, Prisma } from '@fiscalnext/database';

export class ManufacturingExtendedService {
  // ============================================
  // 3. WORK ORDERS - 8 Features
  // ============================================

  /**
   * Feature 21: Work Order Creation
   */
  async createWorkOrder(data: {
    tenantId: string;
    name: string;
    description?: string;
    productId: string;
    bomId?: string;
    plannedQuantity: number;
    plannedStartDate: Date;
    plannedEndDate: Date;
    priority?: string;
    scheduleId?: string;
    shiftId?: string;
    machineId?: string;
    notes?: string;
    createdBy: string;
  }) {
    // Generate work order number
    const count = await prisma.workOrder.count({
      where: { tenantId: data.tenantId },
    });
    const workOrderNumber = `WO-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    // Get BOM if not provided
    let bomId = data.bomId;
    if (!bomId) {
      const bom = await prisma.bOM.findFirst({
        where: {
          productId: data.productId,
          tenantId: data.tenantId,
          isActive: true,
          status: 'approved',
        },
      });
      bomId = bom?.id;
    }

    // Estimate cost
    let estimatedCost = new Prisma.Decimal(0);
    if (bomId) {
      const bom = await prisma.bOM.findFirst({
        where: { id: bomId },
      });
      if (bom) {
        estimatedCost = bom.totalCost.mul(new Prisma.Decimal(data.plannedQuantity));
      }
    }

    return await prisma.workOrder.create({
      data: {
        ...data,
        workOrderNumber,
        bomId,
        plannedQuantity: new Prisma.Decimal(data.plannedQuantity),
        priority: data.priority || 'medium',
        estimatedCost,
      },
      include: {
        product: true,
        bom: true,
        machine: true,
        shift: true,
      },
    });
  }

  /**
   * Feature 22: Operation Routing
   */
  async addWorkOrderOperation(data: {
    tenantId: string;
    workOrderId: string;
    operationNumber: number;
    name: string;
    description?: string;
    sequence?: number;
    previousOpId?: string;
    machineId?: string;
    requiredSkill?: string;
    setupTimeMinutes?: number;
    runTimeMinutes?: number;
    notes?: string;
  }) {
    return await prisma.workOrderOperation.create({
      data: {
        ...data,
        sequence: data.sequence || 0,
        setupTimeMinutes: new Prisma.Decimal(data.setupTimeMinutes || 0),
        runTimeMinutes: new Prisma.Decimal(data.runTimeMinutes || 0),
      },
      include: {
        workOrder: true,
      },
    });
  }

  /**
   * Feature 23: Labor Tracking
   */
  async startLaborTracking(data: {
    tenantId: string;
    workOrderId: string;
    employeeId: string;
    startTime: Date;
    operationId?: string;
    hourlyRate?: number;
    notes?: string;
  }) {
    return await prisma.laborTracking.create({
      data: {
        ...data,
        hourlyRate: new Prisma.Decimal(data.hourlyRate || 0),
      },
    });
  }

  async endLaborTracking(id: string, tenantId: string, endTime: Date) {
    const tracking = await prisma.laborTracking.findFirst({
      where: { id, tenantId },
    });

    if (!tracking) throw new Error('Labor tracking not found');

    const hours =
      (endTime.getTime() - tracking.startTime.getTime()) / (1000 * 60 * 60);
    const totalCost = hours * Number(tracking.hourlyRate);

    return await prisma.laborTracking.update({
      where: { id },
      data: {
        endTime,
        totalHours: new Prisma.Decimal(hours),
        totalCost: new Prisma.Decimal(totalCost),
      },
    });
  }

  /**
   * Feature 24: Machine Time Tracking
   */
  async startMachineTracking(data: {
    tenantId: string;
    workOrderId: string;
    machineId: string;
    startTime: Date;
    hourlyRate?: number;
    notes?: string;
  }) {
    return await prisma.machineTimeTracking.create({
      data: {
        ...data,
        hourlyRate: new Prisma.Decimal(data.hourlyRate || 0),
      },
    });
  }

  async endMachineTracking(
    id: string,
    tenantId: string,
    endTime: Date,
    downtimeHours?: number,
    downtimeReason?: string
  ) {
    const tracking = await prisma.machineTimeTracking.findFirst({
      where: { id, tenantId },
    });

    if (!tracking) throw new Error('Machine tracking not found');

    const hours =
      (endTime.getTime() - tracking.startTime.getTime()) / (1000 * 60 * 60);
    const totalCost = hours * Number(tracking.hourlyRate);

    return await prisma.machineTimeTracking.update({
      where: { id },
      data: {
        endTime,
        totalHours: new Prisma.Decimal(hours),
        downtimeHours: new Prisma.Decimal(downtimeHours || 0),
        downtimeReason,
        totalCost: new Prisma.Decimal(totalCost),
      },
    });
  }

  /**
   * Feature 25: Work Order Costing
   */
  async calculateWorkOrderCost(
    workOrderId: string,
    tenantId: string,
    options: {
      includeMaterials?: boolean;
      includeLabor?: boolean;
      includeMachine?: boolean;
      includeOverhead?: boolean;
    } = {}
  ) {
    const {
      includeMaterials = true,
      includeLabor = true,
      includeMachine = true,
      includeOverhead = true,
    } = options;

    let totalCost = new Prisma.Decimal(0);
    const breakdown: any = {
      materials: 0,
      labor: 0,
      machine: 0,
      overhead: 0,
    };

    // Material costs (from BOM)
    if (includeMaterials) {
      const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, tenantId },
        include: {
          bom: {
            include: { items: true },
          },
        },
      });

      if (workOrder?.bom) {
        const materialCost = workOrder.bom.totalCost.mul(
          workOrder.plannedQuantity
        );
        breakdown.materials = Number(materialCost);
        totalCost = totalCost.add(materialCost);
      }
    }

    // Labor costs
    if (includeLabor) {
      const laborTracking = await prisma.laborTracking.findMany({
        where: { workOrderId, tenantId },
      });
      const laborCost = laborTracking.reduce(
        (sum, track) => sum + Number(track.totalCost),
        0
      );
      breakdown.labor = laborCost;
      totalCost = totalCost.add(new Prisma.Decimal(laborCost));
    }

    // Machine costs
    if (includeMachine) {
      const machineTracking = await prisma.machineTimeTracking.findMany({
        where: { workOrderId, tenantId },
      });
      const machineCost = machineTracking.reduce(
        (sum, track) => sum + Number(track.totalCost),
        0
      );
      breakdown.machine = machineCost;
      totalCost = totalCost.add(new Prisma.Decimal(machineCost));
    }

    // Overhead (30% of direct costs by default)
    if (includeOverhead) {
      const directCost = breakdown.materials + breakdown.labor + breakdown.machine;
      const overheadCost = directCost * 0.3;
      breakdown.overhead = overheadCost;
      totalCost = totalCost.add(new Prisma.Decimal(overheadCost));
    }

    // Update work order
    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: { actualCost: totalCost },
    });

    return {
      workOrderId,
      totalCost: Number(totalCost),
      breakdown,
    };
  }

  /**
   * Feature 26: Progress Tracking
   */
  async updateWorkOrderProgress(
    workOrderId: string,
    tenantId: string,
    data: {
      completedQuantity: number;
      progressPercentage?: number;
      notes?: string;
    }
  ) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id: workOrderId, tenantId },
    });

    if (!workOrder) throw new Error('Work order not found');

    const progressPercentage =
      data.progressPercentage ||
      (data.completedQuantity / Number(workOrder.plannedQuantity)) * 100;

    const status =
      progressPercentage >= 100
        ? 'completed'
        : progressPercentage > 0
        ? 'in_progress'
        : workOrder.status;

    return await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        completedQuantity: new Prisma.Decimal(data.completedQuantity),
        progressPercentage: new Prisma.Decimal(progressPercentage),
        status,
        ...(status === 'completed' && !workOrder.actualEndDate
          ? { actualEndDate: new Date() }
          : {}),
        ...(status === 'in_progress' && !workOrder.actualStartDate
          ? { actualStartDate: new Date() }
          : {}),
      },
    });
  }

  /**
   * Feature 27: Work Order Completion
   */
  async completeWorkOrder(workOrderId: string, tenantId: string, notes?: string) {
    return await prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.findFirst({
        where: { id: workOrderId, tenantId },
      });

      if (!workOrder) throw new Error('Work order not found');
      if (workOrder.status === 'completed') {
        throw new Error('Work order already completed');
      }

      // Update work order
      const completed = await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: 'completed',
          actualEndDate: new Date(),
          progressPercentage: new Prisma.Decimal(100),
          notes: notes || workOrder.notes,
        },
      });

      // Update inventory (add produced quantity to stock)
      await tx.stock.upsert({
        where: {
          productId_locationId: {
            productId: workOrder.productId,
            locationId: '', // Default location
          },
        },
        create: {
          tenantId,
          productId: workOrder.productId,
          locationId: '',
          quantity: workOrder.completedQuantity,
        },
        update: {
          quantity: {
            increment: workOrder.completedQuantity,
          },
        },
      });

      return completed;
    });
  }

  /**
   * Feature 28: Scrap Tracking
   */
  async recordScrap(data: {
    tenantId: string;
    workOrderId: string;
    quantity: number;
    reason: string;
    category?: string;
    costPerUnit?: number;
    notes?: string;
    reportedBy: string;
  }) {
    const totalCost = data.quantity * (data.costPerUnit || 0);

    const scrap = await prisma.scrapRecord.create({
      data: {
        ...data,
        quantity: new Prisma.Decimal(data.quantity),
        category: data.category || 'production',
        costPerUnit: new Prisma.Decimal(data.costPerUnit || 0),
        totalCost: new Prisma.Decimal(totalCost),
      },
    });

    // Update work order scrap quantity
    await prisma.workOrder.update({
      where: { id: data.workOrderId },
      data: {
        scrapQuantity: {
          increment: new Prisma.Decimal(data.quantity),
        },
      },
    });

    return scrap;
  }

  // ============================================
  // 4. QUALITY CONTROL - 7 Features
  // ============================================

  /**
   * Feature 29: QC Checkpoints
   */
  async createQCCheckpoint(data: {
    tenantId: string;
    workOrderId?: string;
    productId?: string;
    checkpointName: string;
    checkpointType: string;
    inspectionPlanId?: string;
    notes?: string;
  }) {
    return await prisma.qCCheckpoint.create({
      data,
      include: {
        workOrder: true,
        product: true,
        inspectionPlan: true,
      },
    });
  }

  /**
   * Feature 30: Inspection Plans
   */
  async createInspectionPlan(data: {
    tenantId: string;
    name: string;
    description?: string;
    productId?: string;
    inspectionType: string;
    frequency?: string;
    sampleSize?: number;
    criteria: any[];
    isActive?: boolean;
    createdBy: string;
  }) {
    return await prisma.inspectionPlan.create({
      data: {
        ...data,
        frequency: data.frequency || 'every_unit',
        criteria: data.criteria || [],
        isActive: data.isActive ?? true,
      },
      include: {
        product: true,
      },
    });
  }

  /**
   * Feature 31: Pass/Fail Criteria (part of Inspection Plan)
   */
  async updateInspectionCriteria(
    planId: string,
    tenantId: string,
    criteria: any[]
  ) {
    return await prisma.inspectionPlan.update({
      where: { id: planId },
      data: { criteria },
    });
  }

  /**
   * Feature 32: QC Reports
   */
  async createQCReport(data: {
    tenantId: string;
    checkpointId: string;
    measurements: any[];
    overallResult: string;
    defectsFound?: any[];
    notes?: string;
    attachments?: string[];
    inspectedBy: string;
  }) {
    // Generate report number
    const count = await prisma.qCReport.count({
      where: { tenantId: data.tenantId },
    });
    const reportNumber = `QC-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    // Count passed/failed measurements
    const passedCount = data.measurements.filter(
      (m) => m.status === 'passed'
    ).length;
    const failedCount = data.measurements.filter(
      (m) => m.status === 'failed'
    ).length;

    const report = await prisma.qCReport.create({
      data: {
        ...data,
        reportNumber,
        measurements: data.measurements || [],
        defectsFound: data.defectsFound || [],
        passedCount,
        failedCount,
        attachments: data.attachments || [],
      },
      include: {
        checkpoint: true,
      },
    });

    // Update checkpoint status
    await prisma.qCCheckpoint.update({
      where: { id: data.checkpointId },
      data: {
        status: 'completed',
        result: data.overallResult,
        inspectedBy: data.inspectedBy,
        inspectedAt: new Date(),
      },
    });

    return report;
  }

  /**
   * Feature 33: Defect Tracking
   */
  async createDefectTracking(data: {
    tenantId: string;
    qcReportId?: string;
    defectCode: string;
    defectName: string;
    defectType: string;
    severity?: string;
    quantity: number;
    sourceType: string;
    sourceId: string;
    rootCause?: string;
    assignedTo?: string;
    notes?: string;
  }) {
    return await prisma.defectTracking.create({
      data: {
        ...data,
        quantity: new Prisma.Decimal(data.quantity),
        severity: data.severity || 'minor',
      },
      include: {
        qcReport: true,
      },
    });
  }

  /**
   * Feature 34: Corrective Actions
   */
  async createCorrectiveAction(data: {
    tenantId: string;
    defectId?: string;
    qcReportId?: string;
    title: string;
    description: string;
    actionType: string;
    priority?: string;
    assignedTo: string;
    dueDate: Date;
    notes?: string;
    createdBy: string;
  }) {
    // Generate action number
    const count = await prisma.correctiveAction.count({
      where: { tenantId: data.tenantId },
    });
    const actionNumber = `CA-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    return await prisma.correctiveAction.create({
      data: {
        ...data,
        actionNumber,
        priority: data.priority || 'medium',
      },
      include: {
        defect: true,
        qcReport: true,
      },
    });
  }

  /**
   * Feature 35: QC Analytics
   */
  async getQCAnalytics(params: {
    tenantId: string;
    startDate: Date;
    endDate: Date;
    productId?: string;
    inspectionType?: string;
  }) {
    const reports = await prisma.qCReport.findMany({
      where: {
        tenantId: params.tenantId,
        inspectedAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
        ...(params.productId && {
          checkpoint: {
            productId: params.productId,
          },
        }),
      },
      include: {
        checkpoint: {
          include: {
            product: true,
            inspectionPlan: true,
          },
        },
        defects: true,
      },
    });

    const totalReports = reports.length;
    const passedReports = reports.filter((r) => r.overallResult === 'passed').length;
    const failedReports = reports.filter((r) => r.overallResult === 'failed').length;
    const passRate = totalReports > 0 ? (passedReports / totalReports) * 100 : 0;

    const defects = await prisma.defectTracking.findMany({
      where: {
        tenantId: params.tenantId,
        detectedAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      },
    });

    const defectsByType = defects.reduce((acc: any, defect) => {
      acc[defect.defectType] = (acc[defect.defectType] || 0) + 1;
      return acc;
    }, {});

    const defectsBySeverity = defects.reduce((acc: any, defect) => {
      acc[defect.severity] = (acc[defect.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      period: { start: params.startDate, end: params.endDate },
      summary: {
        totalReports,
        passedReports,
        failedReports,
        passRate: passRate.toFixed(2),
        totalDefects: defects.length,
      },
      defectsByType,
      defectsBySeverity,
      reports: reports.map((r) => ({
        id: r.id,
        reportNumber: r.reportNumber,
        result: r.overallResult,
        productName: r.checkpoint.product?.name,
        inspectedAt: r.inspectedAt,
        defectsFound: r.defects.length,
      })),
    };
  }

  // ============================================
  // 5. PRODUCTION COSTING - 5 Features
  // ============================================

  /**
   * Feature 36: Direct Costs (Materials + Labor)
   */
  async recordDirectCost(data: {
    tenantId: string;
    workOrderId: string;
    costType: 'direct_material' | 'direct_labor';
    itemId: string;
    itemName: string;
    quantity: number;
    unitCost: number;
    notes?: string;
    recordedBy: string;
  }) {
    const totalCost = data.quantity * data.unitCost;

    return await prisma.productionCostRecord.create({
      data: {
        tenantId: data.tenantId,
        workOrderId: data.workOrderId,
        costType: data.costType,
        costCategory: data.costType === 'direct_material' ? 'Materials' : 'Labor',
        unitCost: new Prisma.Decimal(data.unitCost),
        quantity: new Prisma.Decimal(data.quantity),
        totalCost: new Prisma.Decimal(totalCost),
        referenceType: data.costType === 'direct_material' ? 'product' : 'employee',
        referenceId: data.itemId,
        referenceName: data.itemName,
        notes: data.notes,
        recordedBy: data.recordedBy,
      },
    });
  }

  /**
   * Feature 37: Indirect Costs
   */
  async recordIndirectCost(data: {
    tenantId: string;
    workOrderId: string;
    costCategory: string;
    description: string;
    totalCost: number;
    allocationMethod: string;
    allocationBase: number;
    notes?: string;
    recordedBy: string;
  }) {
    return await prisma.productionCostRecord.create({
      data: {
        tenantId: data.tenantId,
        workOrderId: data.workOrderId,
        costType: 'other',
        costCategory: data.costCategory,
        unitCost: new Prisma.Decimal(0),
        quantity: new Prisma.Decimal(1),
        totalCost: new Prisma.Decimal(data.totalCost),
        allocationMethod: data.allocationMethod,
        allocationBase: new Prisma.Decimal(data.allocationBase),
        notes: data.notes,
        recordedBy: data.recordedBy,
      },
    });
  }

  /**
   * Feature 38: Overhead Allocation
   */
  async allocateOverhead(data: {
    tenantId: string;
    workOrderId: string;
    overheadRate: number;
    allocationMethod: string;
    allocationBase: number;
    notes?: string;
    recordedBy: string;
  }) {
    const totalCost = data.overheadRate * data.allocationBase;

    return await prisma.productionCostRecord.create({
      data: {
        tenantId: data.tenantId,
        workOrderId: data.workOrderId,
        costType: 'overhead',
        costCategory: 'Overhead',
        unitCost: new Prisma.Decimal(data.overheadRate),
        quantity: new Prisma.Decimal(data.allocationBase),
        totalCost: new Prisma.Decimal(totalCost),
        allocationMethod: data.allocationMethod,
        allocationBase: new Prisma.Decimal(data.allocationBase),
        notes: data.notes,
        recordedBy: data.recordedBy,
      },
    });
  }

  /**
   * Feature 39: Variance Analysis
   */
  async runVarianceAnalysis(params: {
    tenantId: string;
    startDate: Date;
    endDate: Date;
    workOrderId?: string;
    productId?: string;
    costType?: string;
  }) {
    const where: any = {
      tenantId: params.tenantId,
      recordedAt: {
        gte: params.startDate,
        lte: params.endDate,
      },
      ...(params.workOrderId && { workOrderId: params.workOrderId }),
      ...(params.costType && params.costType !== 'all' && { costType: params.costType }),
    };

    const costs = await prisma.productionCostRecord.findMany({
      where,
      include: {
        workOrder: {
          include: { product: true },
        },
      },
    });

    const actualCostByType = costs.reduce((acc: any, cost) => {
      acc[cost.costType] = (acc[cost.costType] || 0) + Number(cost.totalCost);
      return acc;
    }, {});

    // Get standard costs from BOMs
    const workOrders = await prisma.workOrder.findMany({
      where: {
        tenantId: params.tenantId,
        actualStartDate: {
          gte: params.startDate,
          lte: params.endDate,
        },
        ...(params.workOrderId && { id: params.workOrderId }),
        ...(params.productId && { productId: params.productId }),
      },
      include: {
        bom: true,
      },
    });

    const totalStandardCost = workOrders.reduce(
      (sum, wo) => sum + (wo.estimatedCost ? Number(wo.estimatedCost) : 0),
      0
    );

    const totalActualCost = Object.values(actualCostByType).reduce(
      (sum: number, cost: any) => sum + cost,
      0
    );

    const variance = totalActualCost - totalStandardCost;
    const variancePercentage =
      totalStandardCost > 0 ? (variance / totalStandardCost) * 100 : 0;

    return {
      period: { start: params.startDate, end: params.endDate },
      summary: {
        totalStandardCost,
        totalActualCost,
        variance,
        variancePercentage: variancePercentage.toFixed(2),
        isFavorable: variance < 0,
      },
      costByType: actualCostByType,
      workOrdersAnalyzed: workOrders.length,
    };
  }

  /**
   * Feature 40: Cost Per Unit
   */
  async calculateCostPerUnit(params: {
    tenantId: string;
    workOrderId?: string;
    productId?: string;
    startDate?: Date;
    endDate?: Date;
    includeOverhead?: boolean;
  }) {
    const where: any = {
      tenantId: params.tenantId,
      status: 'completed',
      ...(params.workOrderId && { id: params.workOrderId }),
      ...(params.productId && { productId: params.productId }),
      ...(params.startDate &&
        params.endDate && {
          actualEndDate: {
            gte: params.startDate,
            lte: params.endDate,
          },
        }),
    };

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        product: true,
      },
    });

    const results = await Promise.all(
      workOrders.map(async (wo) => {
        const costs = await prisma.productionCostRecord.findMany({
          where: {
            workOrderId: wo.id,
            tenantId: params.tenantId,
          },
        });

        let totalCost = 0;
        const breakdown: any = {
          material: 0,
          labor: 0,
          machine: 0,
          overhead: 0,
        };

        costs.forEach((cost) => {
          const amount = Number(cost.totalCost);
          totalCost += amount;

          if (cost.costType === 'direct_material') breakdown.material += amount;
          else if (cost.costType === 'direct_labor') breakdown.labor += amount;
          else if (cost.costType === 'machine') breakdown.machine += amount;
          else if (cost.costType === 'overhead') breakdown.overhead += amount;
        });

        if (!params.includeOverhead) {
          totalCost -= breakdown.overhead;
        }

        const unitsProduced = Number(wo.completedQuantity);
        const costPerUnit = unitsProduced > 0 ? totalCost / unitsProduced : 0;

        return {
          workOrderId: wo.id,
          workOrderNumber: wo.workOrderNumber,
          productId: wo.productId,
          productName: wo.product.name,
          unitsProduced,
          totalCost,
          costPerUnit,
          breakdown,
        };
      })
    );

    const totalUnits = results.reduce((sum, r) => sum + r.unitsProduced, 0);
    const totalCost = results.reduce((sum, r) => sum + r.totalCost, 0);
    const avgCostPerUnit = totalUnits > 0 ? totalCost / totalUnits : 0;

    return {
      period: params.startDate && params.endDate 
        ? { start: params.startDate, end: params.endDate }
        : null,
      summary: {
        totalWorkOrders: workOrders.length,
        totalUnitsProduced: totalUnits,
        totalCost,
        averageCostPerUnit: avgCostPerUnit,
      },
      details: results,
    };
  }

  /**
   * Generate Production Cost Analysis Report
   */
  async generateCostAnalysis(data: {
    tenantId: string;
    analysisName: string;
    startDate: Date;
    endDate: Date;
    productId?: string;
    standardCost?: number;
    generatedBy: string;
  }) {
    const workOrders = await prisma.workOrder.findMany({
      where: {
        tenantId: data.tenantId,
        actualStartDate: { gte: data.startDate },
        actualEndDate: { lte: data.endDate },
        status: 'completed',
        ...(data.productId && { productId: data.productId }),
      },
    });

    const costs = await prisma.productionCostRecord.findMany({
      where: {
        tenantId: data.tenantId,
        recordedAt: {
          gte: data.startDate,
          lte: data.endDate,
        },
        workOrder: {
          ...(data.productId && { productId: data.productId }),
        },
      },
    });

    const breakdown = {
      direct_material: 0,
      direct_labor: 0,
      machine: 0,
      overhead: 0,
    };

    costs.forEach((cost) => {
      const amount = Number(cost.totalCost);
      if (cost.costType === 'direct_material') breakdown.direct_material += amount;
      else if (cost.costType === 'direct_labor') breakdown.direct_labor += amount;
      else if (cost.costType === 'machine') breakdown.machine += amount;
      else if (cost.costType === 'overhead') breakdown.overhead += amount;
    });

    const totalCost =
      breakdown.direct_material +
      breakdown.direct_labor +
      breakdown.machine +
      breakdown.overhead;

    const totalUnits = workOrders.reduce(
      (sum, wo) => sum + Number(wo.completedQuantity),
      0
    );

    const costPerUnit = totalUnits > 0 ? totalCost / totalUnits : 0;

    let variance = null;
    let variancePercentage = null;

    if (data.standardCost) {
      const actualCostPerUnit = costPerUnit;
      variance = actualCostPerUnit - data.standardCost;
      variancePercentage = (variance / data.standardCost) * 100;
    }

    return await prisma.productionCostAnalysis.create({
      data: {
        tenantId: data.tenantId,
        analysisName: data.analysisName,
        startDate: data.startDate,
        endDate: data.endDate,
        productId: data.productId,
        totalDirectMaterial: new Prisma.Decimal(breakdown.direct_material),
        totalDirectLabor: new Prisma.Decimal(breakdown.direct_labor),
        totalMachineCost: new Prisma.Decimal(breakdown.machine),
        totalOverhead: new Prisma.Decimal(breakdown.overhead),
        totalCost: new Prisma.Decimal(totalCost),
        totalUnitsProduced: new Prisma.Decimal(totalUnits),
        costPerUnit: new Prisma.Decimal(costPerUnit),
        standardCost: data.standardCost
          ? new Prisma.Decimal(data.standardCost)
          : null,
        costVariance: variance ? new Prisma.Decimal(variance) : null,
        variancePercentage: variancePercentage
          ? new Prisma.Decimal(variancePercentage)
          : null,
        costBreakdown: breakdown,
        generatedBy: data.generatedBy,
      },
    });
  }
}

export const manufacturingExtendedService = new ManufacturingExtendedService();
