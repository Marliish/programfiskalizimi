// Advanced Inventory Routes - ALL 50 FEATURES
// Team 3: Klea (PM), Tafa (Backend), Mela (Frontend)

import { FastifyInstance } from 'fastify';
import { warehouseService } from '../services/warehouse.service';
import { barcodeService } from '../services/barcode.service';
import { stockForecastService } from '../services/stock-forecast.service';
import { autoReorderService } from '../services/auto-reorder.service';
import { lotTrackingService } from '../services/lot-tracking.service';
import { inventoryAuditService } from '../services/inventory-audit.service';

export async function advancedInventoryRoutes(fastify: FastifyInstance) {
  // ============================================
  // WAREHOUSE MANAGEMENT (12 features)
  // ============================================

  // Warehouses
  fastify.post('/warehouses', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    try {
      const warehouse = await warehouseService.createWarehouse({
        tenantId: user.tenantId,
        ...data,
      });
      return { success: true, warehouse };
    } catch (error) {
      return reply.status(400).send({ success: false, error: (error as Error).message });
    }
  });

  fastify.get('/warehouses', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    
    const warehouses = await warehouseService.getWarehouses(user.tenantId);
    return { success: true, data: warehouses };
  });

  // Zones
  fastify.post('/warehouses/:warehouseId/zones', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { warehouseId } = request.params as any;
    const data = request.body as any;
    
    const zone = await warehouseService.createZone({ warehouseId, ...data });
    return { success: true, zone };
  });

  fastify.get('/warehouses/:warehouseId/zones', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { warehouseId } = request.params as any;
    
    const zones = await warehouseService.getZones(warehouseId);
    return { success: true, data: zones };
  });

  // Bin Locations
  fastify.post('/warehouses/:warehouseId/bins', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { warehouseId } = request.params as any;
    const data = request.body as any;
    
    const bin = await warehouseService.createBin({ warehouseId, ...data });
    return { success: true, bin };
  });

  fastify.get('/bins', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const query = request.query as any;
    
    const result = await warehouseService.getBins(query);
    return { success: true, ...result };
  });

  fastify.get('/bins/scan/:barcode', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { barcode } = request.params as any;
    
    const bin = await warehouseService.scanBinBarcode(barcode);
    return { success: true, bin };
  });

  // Picking Lists
  fastify.post('/picking-lists', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const pickingList = await warehouseService.createPickingList({
      tenantId: user.tenantId,
      ...data,
    });
    return { success: true, pickingList };
  });

  fastify.get('/picking-lists', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const query = request.query as any;
    
    const result = await warehouseService.getPickingLists({
      tenantId: user.tenantId,
      ...query,
    });
    return { success: true, ...result };
  });

  fastify.post('/picking-lists/:id/start', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    
    const result = await warehouseService.startPicking(id);
    return { success: true, pickingList: result };
  });

  fastify.post('/picking-lists/:id/complete', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    
    const result = await warehouseService.completePickingList(id);
    return { success: true, pickingList: result };
  });

  // Packing Stations
  fastify.post('/packing-stations', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const data = request.body as any;
    
    const station = await warehouseService.createPackingStation(data);
    return { success: true, station };
  });

  fastify.get('/warehouses/:warehouseId/packing-stations', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { warehouseId } = request.params as any;
    
    const stations = await warehouseService.getPackingStations(warehouseId);
    return { success: true, data: stations };
  });

  // Cycle Counts
  fastify.post('/cycle-counts', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const cycleCount = await warehouseService.createCycleCount({
      tenantId: user.tenantId,
      ...data,
    });
    return { success: true, cycleCount };
  });

  fastify.post('/cycle-counts/items/:itemId/count', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { itemId } = request.params as any;
    const { countedQuantity, countedBy } = request.body as any;
    
    const result = await warehouseService.countItem(itemId, countedQuantity, countedBy);
    return { success: true, item: result };
  });

  // Shipment Orders
  fastify.post('/shipment-orders', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const order = await warehouseService.createShipmentOrder({
      tenantId: user.tenantId,
      ...data,
    });
    return { success: true, order };
  });

  fastify.get('/shipment-orders', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const query = request.query as any;
    
    const result = await warehouseService.getShipmentOrders({
      tenantId: user.tenantId,
      ...query,
    });
    return { success: true, ...result };
  });

  // ============================================
  // BARCODE SYSTEM (8 features)
  // ============================================

  fastify.post('/barcodes/generate', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const barcode = await barcodeService.generateBarcode({
      tenantId: user.tenantId,
      generatedBy: user.userId,
      ...data,
    });
    return { success: true, barcode };
  });

  fastify.post('/barcodes/bulk-generate', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const results = await barcodeService.bulkGenerateBarcodes({
      tenantId: user.tenantId,
      generatedBy: user.userId,
      ...data,
    });
    return { success: true, results };
  });

  fastify.post('/barcode-templates', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const template = await barcodeService.createBarcodeTemplate({
      tenantId: user.tenantId,
      ...data,
    });
    return { success: true, template };
  });

  fastify.get('/barcode-templates', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    
    const templates = await barcodeService.getBarcodeTemplates(user.tenantId);
    return { success: true, data: templates };
  });

  fastify.post('/barcode-print-jobs', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const job = await barcodeService.createPrintJob({
      tenantId: user.tenantId,
      createdBy: user.userId,
      ...data,
    });
    return { success: true, job };
  });

  fastify.post('/barcode-scans', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const scan = await barcodeService.recordScan({
      tenantId: user.tenantId,
      scannedBy: user.userId,
      ...data,
    });
    return { success: true, scan };
  });

  fastify.get('/barcode-scans', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const query = request.query as any;
    
    const result = await barcodeService.getScanHistory({
      tenantId: user.tenantId,
      ...query,
    });
    return { success: true, ...result };
  });

  fastify.get('/barcodes/duplicates', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    
    const duplicates = await barcodeService.findDuplicateBarcodes(user.tenantId);
    return { success: true, data: duplicates };
  });

  // ============================================
  // STOCK FORECASTING (10 features)
  // ============================================

  fastify.post('/forecasts/demand', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const forecast = await stockForecastService.generateDemandForecast({
      tenantId: user.tenantId,
      ...data,
    });
    return { success: true, forecast };
  });

  fastify.post('/forecasts/seasonal-patterns', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const pattern = await stockForecastService.createSeasonalPattern({
      tenantId: user.tenantId,
      ...data,
    });
    return { success: true, pattern };
  });

  fastify.get('/forecasts/trend/:productId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const { productId } = request.params as any;
    
    const trend = await stockForecastService.analyzeTrend(user.tenantId, productId);
    return { success: true, trend };
  });

  fastify.get('/forecasts/lead-time/:productId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const { productId } = request.params as any;
    
    const leadTime = await stockForecastService.calculateLeadTime(user.tenantId, productId);
    return { success: true, leadTime };
  });

  fastify.get('/forecasts/safety-stock/:productId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const { productId } = request.params as any;
    const { serviceLevel } = request.query as any;
    
    const safetyStock = await stockForecastService.calculateSafetyStock({
      tenantId: user.tenantId,
      productId,
      serviceLevel: serviceLevel ? Number(serviceLevel) : undefined,
    });
    return { success: true, safetyStock };
  });

  fastify.get('/forecasts/reorder-point/:productId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const { productId } = request.params as any;
    
    const rop = await stockForecastService.calculateReorderPoint({
      tenantId: user.tenantId,
      productId,
    });
    return { success: true, reorderPoint: rop };
  });

  fastify.get('/forecasts/eoq/:productId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const { productId } = request.params as any;
    
    const eoq = await stockForecastService.calculateEOQ({
      tenantId: user.tenantId,
      productId,
    });
    return { success: true, eoq };
  });

  fastify.get('/forecasts/stock-aging', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const { productId } = request.query as any;
    
    const aging = await stockForecastService.analyzeStockAging(user.tenantId, productId);
    return { success: true, aging };
  });

  fastify.get('/forecasts/turnover/:productId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const { productId } = request.params as any;
    const { periodStart, periodEnd } = request.query as any;
    
    const turnover = await stockForecastService.calculateTurnoverRate({
      tenantId: user.tenantId,
      productId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
    });
    return { success: true, turnover };
  });

  fastify.get('/forecasts/dead-stock', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const { daysThreshold } = request.query as any;
    
    const deadStock = await stockForecastService.identifyDeadStock({
      tenantId: user.tenantId,
      daysThreshold: daysThreshold ? Number(daysThreshold) : undefined,
    });
    return { success: true, deadStock };
  });

  // ============================================
  // AUTOMATED REORDERING (8 features)
  // ============================================

  fastify.post('/reorder-rules', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const rule = await autoReorderService.createReorderRule({
      tenantId: user.tenantId,
      ...data,
    });
    return { success: true, rule };
  });

  fastify.get('/reorder-rules', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    
    const rules = await autoReorderService.getReorderRules(user.tenantId);
    return { success: true, data: rules };
  });

  fastify.post('/reorder-rules/:id/toggle', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { isActive } = request.body as any;
    
    const rule = await autoReorderService.toggleReorderRule(id, isActive);
    return { success: true, rule };
  });

  fastify.post('/purchase-orders/auto-generate', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const po = await autoReorderService.generateAutoPurchaseOrder({
      tenantId: user.tenantId,
      createdBy: user.userId,
      ...data,
    });
    return { success: true, purchaseOrder: po };
  });

  fastify.post('/purchase-orders/execute-reorders', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    
    const result = await autoReorderService.executeReorderRules(user.tenantId);
    return { success: true, ...result };
  });

  fastify.post('/purchase-orders/:id/approve', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    const user = request.user as any;
    
    const po = await autoReorderService.approvePurchaseOrder(id, user.userId);
    return { success: true, purchaseOrder: po };
  });

  fastify.get('/purchase-orders/pending-approvals', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    
    const orders = await autoReorderService.getPendingApprovals(user.tenantId);
    return { success: true, data: orders };
  });

  fastify.get('/supplier-performance/:supplierId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const { supplierId } = request.params as any;
    
    const performance = await autoReorderService.getSupplierPerformance(user.tenantId, supplierId);
    return { success: true, data: performance };
  });

  // ============================================
  // LOT TRACKING & RECALLS (7 features)
  // ============================================

  fastify.post('/lots', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const lot = await lotTrackingService.createLot({
      tenantId: user.tenantId,
      ...data,
    });
    return { success: true, lot };
  });

  fastify.get('/lots', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const query = request.query as any;
    
    const result = await lotTrackingService.getLots({
      tenantId: user.tenantId,
      ...query,
    });
    return { success: true, ...result };
  });

  fastify.get('/lots/expiring', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const { daysThreshold } = request.query as any;
    
    const lots = await lotTrackingService.getExpiringLots({
      tenantId: user.tenantId,
      daysThreshold: daysThreshold ? Number(daysThreshold) : undefined,
    });
    return { success: true, data: lots };
  });

  fastify.get('/lots/:lotId/trace', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { lotId } = request.params as any;
    
    const trace = await lotTrackingService.traceLot(lotId);
    return { success: true, trace };
  });

  fastify.post('/recalls', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const recall = await lotTrackingService.createRecall({
      tenantId: user.tenantId,
      createdBy: user.userId,
      ...data,
    });
    return { success: true, recall };
  });

  fastify.get('/recalls', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const { status } = request.query as any;
    
    const recalls = await lotTrackingService.getRecalls(user.tenantId, status);
    return { success: true, data: recalls };
  });

  fastify.post('/lot-policies', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const policy = await lotTrackingService.createLotPolicy({
      tenantId: user.tenantId,
      ...data,
    });
    return { success: true, policy };
  });

  // ============================================
  // INVENTORY AUDITS (5 features)
  // ============================================

  fastify.post('/audits', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const audit = await inventoryAuditService.createInventoryAudit({
      tenantId: user.tenantId,
      createdBy: user.userId,
      ...data,
    });
    return { success: true, audit };
  });

  fastify.get('/audits', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const query = request.query as any;
    
    const result = await inventoryAuditService.getInventoryAudits({
      tenantId: user.tenantId,
      ...query,
    });
    return { success: true, ...result };
  });

  fastify.get('/audits/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    
    const audit = await inventoryAuditService.getAuditDetails(id);
    return { success: true, audit };
  });

  fastify.post('/audits/:id/start', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    const user = request.user as any;
    
    const audit = await inventoryAuditService.startAudit(id, user.userId);
    return { success: true, audit };
  });

  fastify.post('/audits/:id/complete', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    
    const audit = await inventoryAuditService.completeAudit(id);
    return { success: true, audit };
  });

  fastify.post('/audits/items/:itemId/audit', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { itemId } = request.params as any;
    const user = request.user as any;
    const data = request.body as any;
    
    const item = await inventoryAuditService.auditItem({
      itemId,
      auditedBy: user.userId,
      ...data,
    });
    return { success: true, item };
  });

  fastify.get('/audits/:id/variance-report', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    
    const report = await inventoryAuditService.getVarianceReport(id);
    return { success: true, report };
  });

  fastify.post('/audit-schedules', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const schedule = await inventoryAuditService.createAuditSchedule({
      tenantId: user.tenantId,
      ...data,
    });
    return { success: true, schedule };
  });

  fastify.get('/audit-schedules', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    
    const schedules = await inventoryAuditService.getAuditSchedules(user.tenantId);
    return { success: true, data: schedules };
  });

  fastify.post('/adjustments', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const data = request.body as any;
    
    const adjustment = await inventoryAuditService.createAdjustment({
      tenantId: user.tenantId,
      createdBy: user.userId,
      ...data,
    });
    return { success: true, adjustment };
  });

  fastify.get('/adjustments', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    const query = request.query as any;
    
    const result = await inventoryAuditService.getAdjustments({
      tenantId: user.tenantId,
      ...query,
    });
    return { success: true, ...result };
  });

  fastify.post('/adjustments/:id/approve', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as any;
    const user = request.user as any;
    
    const adjustment = await inventoryAuditService.approveAdjustment(id, user.userId);
    return { success: true, adjustment };
  });

  // Dashboard & Statistics
  fastify.get('/advanced-inventory/dashboard', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user as any;
    
    // Aggregate stats from all services
    const [
      warehouses,
      expiringLots,
      deadStock,
      pendingApprovals,
      activeRecalls,
    ] = await Promise.all([
      warehouseService.getWarehouses(user.tenantId),
      lotTrackingService.getExpiringLots({ tenantId: user.tenantId, daysThreshold: 30 }),
      stockForecastService.identifyDeadStock({ tenantId: user.tenantId }),
      autoReorderService.getPendingApprovals(user.tenantId),
      lotTrackingService.getRecalls(user.tenantId, 'active'),
    ]);

    return {
      success: true,
      dashboard: {
        warehouses: { total: warehouses.length, data: warehouses },
        expiringLots: { count: expiringLots.length, items: expiringLots.slice(0, 10) },
        deadStock: { count: deadStock.totalItems, value: deadStock.totalValue },
        pendingApprovals: { count: pendingApprovals.length, items: pendingApprovals.slice(0, 10) },
        activeRecalls: { count: activeRecalls.length, items: activeRecalls },
      },
    };
  });
}
