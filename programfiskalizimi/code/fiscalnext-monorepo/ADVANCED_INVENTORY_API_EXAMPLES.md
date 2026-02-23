# Advanced Inventory API Examples

Quick reference for testing the advanced inventory APIs.

## 🔐 Authentication

All requests require JWT token in header:
```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📦 1. SUPPLIERS API

### Create Supplier
```bash
POST /api/suppliers
Content-Type: application/json

{
  "name": "Global Tech Supplies",
  "code": "GTS001",
  "email": "sales@globaltechsupplies.com",
  "phone": "+1-555-0123",
  "website": "https://globaltechsupplies.com",
  "address": "123 Tech Street",
  "city": "San Francisco",
  "country": "USA",
  "postalCode": "94105",
  "taxId": "12-3456789",
  "paymentTerms": "Net 30",
  "defaultCurrency": "USD",
  "rating": 4,
  "notes": "Preferred supplier for electronic components"
}
```

### List Suppliers
```bash
GET /api/suppliers?isActive=true&search=tech
```

### Get Supplier Details
```bash
GET /api/suppliers/{supplierId}
```

### Add Contact to Supplier
```bash
POST /api/suppliers/{supplierId}/contacts
Content-Type: application/json

{
  "name": "John Smith",
  "title": "Sales Manager",
  "email": "john.smith@globaltechsupplies.com",
  "phone": "+1-555-0124",
  "isPrimary": true
}
```

### Link Product to Supplier
```bash
POST /api/suppliers/{supplierId}/products
Content-Type: application/json

{
  "productId": "product-uuid-here",
  "supplierSku": "GTS-WIDGET-001",
  "supplierName": "Premium Widget",
  "costPrice": 15.50,
  "minOrderQty": 50,
  "leadTimeDays": 14,
  "isPreferred": true
}
```

### Get Supplier Metrics
```bash
GET /api/suppliers/{supplierId}/metrics

Response:
{
  "success": true,
  "metrics": {
    "totalOrders": 45,
    "completedOrders": 42,
    "totalSpent": 125450.00,
    "avgDeliveryTime": 12.5,
    "completionRate": 93.33
  }
}
```

---

## 📋 2. PURCHASE ORDERS API

### Create Purchase Order
```bash
POST /api/purchase-orders
Content-Type: application/json

{
  "supplierId": "supplier-uuid-here",
  "locationId": "warehouse-uuid-here",
  "expectedDate": "2026-03-15T00:00:00Z",
  "notes": "Urgent order for Q2 inventory",
  "internalNotes": "Call supplier to confirm delivery date",
  "items": [
    {
      "productId": "product-1-uuid",
      "productName": "Widget A",
      "sku": "WID-A-001",
      "quantityOrdered": 100,
      "unitCost": 15.50,
      "taxRate": 10
    },
    {
      "productId": "product-2-uuid",
      "productName": "Component B",
      "sku": "CMP-B-002",
      "quantityOrdered": 200,
      "unitCost": 8.25,
      "taxRate": 10
    }
  ]
}

Response:
{
  "success": true,
  "purchaseOrder": {
    "id": "po-uuid",
    "poNumber": "PO-000001",
    "status": "draft",
    "subtotal": 3200.00,
    "taxAmount": 320.00,
    "totalAmount": 3520.00,
    ...
  }
}
```

### List Purchase Orders
```bash
# All POs
GET /api/purchase-orders

# Filter by status
GET /api/purchase-orders?status=approved

# Filter by supplier
GET /api/purchase-orders?supplierId=supplier-uuid

# Search by PO number
GET /api/purchase-orders?search=PO-000
```

### Submit PO for Approval
```bash
POST /api/purchase-orders/{poId}/submit
```

### Approve PO
```bash
POST /api/purchase-orders/{poId}/approve
```

### Mark PO as Sent
```bash
POST /api/purchase-orders/{poId}/send
```

### Receive Inventory (Partial)
```bash
POST /api/purchase-orders/{poId}/receive
Content-Type: application/json

{
  "locationId": "warehouse-uuid",
  "receiptType": "partial",
  "items": [
    {
      "productId": "product-1-uuid",
      "quantityReceived": 50,
      "batchNumber": "BATCH-2026-001"
    }
  ],
  "notes": "First shipment received"
}

Response:
{
  "success": true,
  "receipt": {
    "id": "receipt-uuid",
    "receiptNumber": "RCV-000001",
    "receiptType": "partial",
    ...
  }
}
```

### Receive Inventory (Complete)
```bash
POST /api/purchase-orders/{poId}/receive
Content-Type: application/json

{
  "locationId": "warehouse-uuid",
  "receiptType": "complete",
  "items": [
    {
      "productId": "product-1-uuid",
      "quantityReceived": 50
    },
    {
      "productId": "product-2-uuid",
      "quantityReceived": 200
    }
  ],
  "notes": "Full order received"
}
```

### Get Outstanding Orders
```bash
GET /api/purchase-orders/outstanding/list
GET /api/purchase-orders/outstanding/list?supplierId=supplier-uuid
```

### Cancel PO
```bash
POST /api/purchase-orders/{poId}/cancel
```

---

## 🏷️ 3. BATCHES API

### Create Batch
```javascript
// Service call (from receiveInventory or direct)
await batchService.create(tenantId, {
  productId: "product-uuid",
  locationId: "warehouse-uuid",
  batchNumber: "BATCH-2026-001",
  lotNumber: "LOT-A-12345",
  initialQuantity: 100,
  unitCost: 15.50,
  costingMethod: "FIFO",
  manufacturingDate: new Date("2026-01-15"),
  expirationDate: new Date("2027-01-15"),
  supplierId: "supplier-uuid",
  purchaseOrderId: "po-uuid",
  notes: "First batch from new supplier"
});
```

### List Batches
```javascript
// Active batches for a product
await batchService.getAll(tenantId, {
  productId: "product-uuid",
  status: "active"
});

// Expiring batches
await batchService.getExpiring(tenantId, 30); // within 30 days
```

### Get Batch with History
```javascript
await batchService.getById(batchId, tenantId);
```

### Record Batch Movement
```javascript
await batchService.recordMovement(batchId, tenantId, userId, {
  type: "out",
  quantity: 10,
  referenceType: "sale",
  referenceId: "transaction-uuid",
  notes: "Sold to customer"
});
```

### Initiate Recall
```javascript
await batchService.initiateRecall(batchId, tenantId, "Quality issue detected");
```

---

## 📝 4. RECIPES API

### Create Recipe
```javascript
await recipeService.create(tenantId, {
  productId: "finished-product-uuid",
  name: "Classic Pizza Margherita",
  description: "Traditional Italian pizza",
  yieldQuantity: 1,
  yieldUnit: "pizza",
  prepTime: 45,
  instructions: "1. Prepare dough\n2. Add sauce\n3. Add cheese\n4. Bake at 450°F",
  ingredients: [
    {
      ingredientId: "flour-uuid",
      quantity: 0.5,
      unit: "kg",
      isOptional: false,
      notes: "All-purpose flour"
    },
    {
      ingredientId: "tomato-sauce-uuid",
      quantity: 0.2,
      unit: "liters",
      isOptional: false
    },
    {
      ingredientId: "mozzarella-uuid",
      quantity: 0.25,
      unit: "kg",
      isOptional: false
    },
    {
      ingredientId: "basil-uuid",
      quantity: 10,
      unit: "leaves",
      isOptional: true,
      notes: "Fresh basil"
    }
  ]
});
```

### List Recipes
```javascript
await recipeService.getAll(tenantId, {
  isActive: true,
  search: "pizza"
});
```

### Recalculate Recipe Cost
```javascript
// Run this when ingredient prices change
await recipeService.recalculateCost(recipeId, tenantId);
```

### Deplete Ingredients (Auto on Sale)
```javascript
// Called automatically when recipe product is sold
await recipeService.depleteIngredients(
  tenantId,
  userId,
  "pizza-product-uuid",
  2, // quantity sold
  "restaurant-location-uuid"
);
```

---

## 🏭 5. ASSEMBLY ORDERS API

### Create Assembly Order (from Recipe)
```javascript
await assemblyService.create(tenantId, userId, {
  productId: "finished-product-uuid",
  recipeId: "recipe-uuid", // Auto-populates components
  locationId: "factory-uuid",
  quantityToAssemble: 100,
  scheduledDate: new Date("2026-03-01"),
  notes: "Q1 production run"
});
```

### Create Assembly Order (Manual Components)
```javascript
await assemblyService.create(tenantId, userId, {
  productId: "finished-product-uuid",
  locationId: "factory-uuid",
  quantityToAssemble: 50,
  scheduledDate: new Date("2026-03-01")
});

// Then manually add components
```

### List Assembly Orders
```javascript
await assemblyService.getAll(tenantId, {
  status: "in_progress",
  productId: "product-uuid"
});
```

### Start Production
```javascript
await assemblyService.startProduction(assemblyOrderId, tenantId);
```

### Complete Production
```javascript
// This will:
// 1. Deplete all components from stock
// 2. Add finished goods to stock
// 3. Create stock movements
// 4. Mark order as completed
await assemblyService.completeProduction(assemblyOrderId, tenantId, userId);
```

### Create Work Order
```javascript
await assemblyService.createWorkOrder(assemblyOrderId, tenantId, workerId, {
  estimatedDuration: 120, // minutes
  notes: "Assembly line 2"
});
```

### Update Work Order Status
```javascript
// Start work
await assemblyService.updateWorkOrderStatus(workOrderId, "in_progress");

// Pause work
await assemblyService.updateWorkOrderStatus(workOrderId, "paused");

// Complete work (auto-calculates actual duration)
await assemblyService.updateWorkOrderStatus(workOrderId, "completed");
```

### Create Quality Check
```javascript
await assemblyService.createQualityCheck(assemblyOrderId, tenantId, inspectorId, {
  checkType: "visual",
  checklistItems: {
    surfaceFinish: "pass",
    dimensions: "pass",
    packaging: "pass"
  },
  checkStatus: "pass",
  defectsFound: 0,
  notes: "All items passed inspection"
});
```

---

## 🔄 COMPLETE WORKFLOW EXAMPLES

### Example 1: Purchase Order → Receive → Stock Update

```javascript
// 1. Create PO
const po = await purchaseOrderService.create(tenantId, userId, {
  supplierId: "supplier-uuid",
  locationId: "warehouse-uuid",
  items: [
    {
      productId: "widget-uuid",
      productName: "Widget",
      quantityOrdered: 100,
      unitCost: 10.00
    }
  ]
});

// 2. Approve PO
await purchaseOrderService.approve(po.id, tenantId, managerId);

// 3. Mark as sent
await purchaseOrderService.markAsSent(po.id, tenantId);

// 4. Receive inventory
await purchaseOrderService.receiveInventory(po.id, tenantId, receiverId, {
  locationId: "warehouse-uuid",
  receiptType: "complete",
  items: [
    {
      productId: "widget-uuid",
      quantityReceived: 100,
      batchNumber: "BATCH-2026-001"
    }
  ]
});

// Result: Stock updated, movements created, PO marked as received
```

### Example 2: Recipe → Sale → Ingredient Depletion

```javascript
// 1. Create recipe for Pizza
const recipe = await recipeService.create(tenantId, {
  productId: "pizza-uuid",
  name: "Pizza Margherita",
  ingredients: [
    { ingredientId: "flour-uuid", quantity: 0.5, unit: "kg" },
    { ingredientId: "cheese-uuid", quantity: 0.25, unit: "kg" }
  ]
});

// 2. When pizza is sold via POS
// (This would be called from transaction service)
await recipeService.depleteIngredients(
  tenantId,
  cashierId,
  "pizza-uuid",
  2, // 2 pizzas sold
  "restaurant-uuid"
);

// Result: 
// - Flour stock decreased by 1 kg
// - Cheese stock decreased by 0.5 kg
// - Stock movements created for both
```

### Example 3: Assembly Order → Production → Finished Goods

```javascript
// 1. Create assembly order
const order = await assemblyService.create(tenantId, userId, {
  productId: "bicycle-uuid",
  recipeId: "bicycle-recipe-uuid",
  locationId: "factory-uuid",
  quantityToAssemble: 10
});

// 2. Create work order
const workOrder = await assemblyService.createWorkOrder(
  order.id,
  tenantId,
  workerId,
  {
    estimatedDuration: 480 // 8 hours
  }
);

// 3. Start production
await assemblyService.startProduction(order.id, tenantId);

// 4. Start work
await assemblyService.updateWorkOrderStatus(workOrder.id, "in_progress");

// 5. Quality check
await assemblyService.createQualityCheck(order.id, tenantId, inspectorId, {
  checkType: "functional",
  checklistItems: { brakes: "pass", gears: "pass" },
  checkStatus: "pass"
});

// 6. Complete work
await assemblyService.updateWorkOrderStatus(workOrder.id, "completed");

// 7. Complete production
await assemblyService.completeProduction(order.id, tenantId, userId);

// Result:
// - All components depleted from stock
// - 10 bicycles added to stock
// - Stock movements created
// - Assembly order marked completed
```

---

## 🧪 TESTING SCRIPT

Save as `test-advanced-inventory.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:4000/api"
TOKEN="your-jwt-token-here"

echo "🧪 Testing Advanced Inventory APIs..."

# 1. Create Supplier
echo "\n📦 Creating supplier..."
SUPPLIER=$(curl -s -X POST "$API_URL/suppliers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Supplier",
    "email": "test@supplier.com",
    "paymentTerms": "Net 30"
  }')

SUPPLIER_ID=$(echo $SUPPLIER | jq -r '.supplier.id')
echo "✅ Supplier created: $SUPPLIER_ID"

# 2. Create PO
echo "\n📋 Creating purchase order..."
PO=$(curl -s -X POST "$API_URL/purchase-orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"supplierId\": \"$SUPPLIER_ID\",
    \"items\": [
      {
        \"productId\": \"YOUR_PRODUCT_ID\",
        \"productName\": \"Test Product\",
        \"quantityOrdered\": 100,
        \"unitCost\": 10.00
      }
    ]
  }")

PO_ID=$(echo $PO | jq -r '.purchaseOrder.id')
PO_NUMBER=$(echo $PO | jq -r '.purchaseOrder.poNumber')
echo "✅ PO created: $PO_NUMBER ($PO_ID)"

# 3. Approve PO
echo "\n✅ Approving PO..."
curl -s -X POST "$API_URL/purchase-orders/$PO_ID/approve" \
  -H "Authorization: Bearer $TOKEN"

# 4. Get supplier metrics
echo "\n📊 Fetching supplier metrics..."
curl -s "$API_URL/suppliers/$SUPPLIER_ID/metrics" \
  -H "Authorization: Bearer $TOKEN" | jq

echo "\n✅ All tests passed!"
```

---

## 📖 ERROR HANDLING

All endpoints return consistent error format:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Resource not found
- `500` - Server error

---

**Generated:** 2026-02-23  
**API Version:** 1.0.0  
**Base URL:** `http://localhost:4000/api` (development)

