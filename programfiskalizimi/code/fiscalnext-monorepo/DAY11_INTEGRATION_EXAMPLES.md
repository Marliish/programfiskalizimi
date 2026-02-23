# Integration Examples - Real-World Workflows

## 🎯 Complete Workflow Examples

### Example 1: E-Commerce Order Fulfillment Automation

**Scenario:** Customer places order on Shopify → Automatically create fiscal receipt, send confirmation, calculate shipping, and notify team.

#### Step 1: Set up Shopify Integration

```bash
curl -X POST http://localhost:5000/v1/integrations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Store",
    "provider": "shopify",
    "type": "ecommerce",
    "enabled": true,
    "config": {
      "shopUrl": "mystore.myshopify.com",
      "apiKey": "your-api-key",
      "apiPassword": "your-api-password"
    },
    "syncInterval": 15
  }'
```

#### Step 2: Register Shopify Webhook

```bash
# Shopify automatically sends webhooks to:
# POST /v1/integrations/{id}/webhook-incoming

# Configure in Shopify admin or via API
```

#### Step 3: Create Automation Rule - Order Processing

```bash
curl -X POST http://localhost:5000/v1/automations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Process Shopify Order",
    "type": "sales",
    "trigger": {
      "event": "order.created",
      "source": "integration"
    },
    "conditions": [
      {
        "field": "financial_status",
        "operator": "eq",
        "value": "paid"
      }
    ],
    "actions": [
      {
        "type": "notify",
        "config": {
          "userId": "admin",
          "title": "New Order",
          "message": "Order #{{order.id}} received - €{{order.total}}"
        }
      },
      {
        "type": "email",
        "config": {
          "to": "{{order.customer.email}}",
          "subject": "Order Confirmation #{{order.id}}",
          "template": "Thank you for your order! We will process it shortly."
        }
      },
      {
        "type": "webhook",
        "config": {
          "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
          "method": "POST",
          "body": {
            "text": "💰 New order: €{{order.total}} from {{order.customer.name}}"
          }
        }
      }
    ],
    "enabled": true,
    "priority": 10
  }'
```

#### Step 4: Create Automation Rule - Shipping Label

```bash
curl -X POST http://localhost:5000/v1/automations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Create Shipping Label",
    "type": "sales",
    "trigger": {
      "event": "order.ready_to_ship",
      "source": "system"
    },
    "conditions": [],
    "actions": [
      {
        "type": "webhook",
        "config": {
          "url": "http://localhost:5000/v1/integrations/{shipping-id}/shipping/label",
          "method": "POST",
          "body": {
            "from": {
              "name": "My Store",
              "street1": "123 Main St",
              "city": "Tirana",
              "postalCode": "1001",
              "country": "AL"
            },
            "to": "{{order.shipping_address}}",
            "packages": "{{order.packages}}",
            "service": "express"
          }
        }
      },
      {
        "type": "send_sms",
        "config": {
          "to": "{{order.customer.phone}}",
          "message": "Your order #{{order.id}} has been shipped! Track: {{tracking_url}}"
        }
      }
    ],
    "enabled": true
  }'
```

---

### Example 2: Inventory Management Automation

**Scenario:** Monitor stock levels, auto-reorder from suppliers, send alerts, update e-commerce platforms.

#### Step 1: Low Stock Alert Rule

```bash
curl -X POST http://localhost:5000/v1/automations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Low Stock Alert & Reorder",
    "type": "inventory",
    "trigger": {
      "event": "stock_updated",
      "source": "system"
    },
    "conditions": [
      {
        "field": "quantity",
        "operator": "lt",
        "value": 10
      },
      {
        "field": "autoReorder",
        "operator": "eq",
        "value": true,
        "logic": "and"
      }
    ],
    "actions": [
      {
        "type": "notify",
        "config": {
          "userId": "procurement",
          "title": "Low Stock Alert",
          "message": "{{product.name}} (SKU: {{product.sku}}) - Only {{quantity}} left!"
        }
      },
      {
        "type": "webhook",
        "config": {
          "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
          "method": "POST",
          "body": {
            "text": "⚠️ Low Stock: {{product.name}} - {{quantity}} units remaining",
            "attachments": [{
              "color": "warning",
              "fields": [
                {"title": "Product", "value": "{{product.name}}", "short": true},
                {"title": "SKU", "value": "{{product.sku}}", "short": true},
                {"title": "Current Stock", "value": "{{quantity}}", "short": true},
                {"title": "Reorder Point", "value": "{{product.reorderPoint}}", "short": true}
              ]
            }]
          }
        }
      },
      {
        "type": "create_order",
        "config": {
          "supplierId": "{{product.supplierId}}",
          "products": [{
            "productId": "{{product.id}}",
            "quantity": "{{product.reorderQuantity}}"
          }]
        }
      },
      {
        "type": "email",
        "config": {
          "to": "{{product.supplier.email}}",
          "subject": "Purchase Order - {{product.name}}",
          "template": "We would like to order {{product.reorderQuantity}} units of {{product.name}} (SKU: {{product.sku}})."
        }
      }
    ],
    "enabled": true,
    "priority": 9
  }'
```

#### Step 2: Update E-Commerce Inventory

```bash
curl -X POST http://localhost:5000/v1/automations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sync Inventory to Shopify",
    "type": "inventory",
    "trigger": {
      "event": "stock_updated",
      "source": "system"
    },
    "conditions": [],
    "actions": [
      {
        "type": "webhook",
        "config": {
          "url": "http://localhost:5000/v1/integrations/{shopify-id}/shopify/update-inventory",
          "method": "POST",
          "body": {
            "updates": [{
              "sku": "{{product.sku}}",
              "quantity": "{{quantity}}"
            }]
          }
        }
      }
    ],
    "enabled": true,
    "priority": 7
  }'
```

---

### Example 3: Customer Engagement Workflow

**Scenario:** Welcome new customers, send birthday discounts, re-engage inactive customers.

#### Rule 1: Welcome New Customer

```bash
curl -X POST http://localhost:5000/v1/automations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome New Customer",
    "type": "customer",
    "trigger": {
      "event": "customer_created",
      "source": "system"
    },
    "conditions": [],
    "actions": [
      {
        "type": "email",
        "config": {
          "to": "{{customer.email}}",
          "subject": "Welcome to FiscalNext! 🎉",
          "template": "Hi {{customer.firstName}},\n\nWelcome to our store! As a thank you, here is 10% off your first purchase.\n\nUse code: WELCOME10\n\nHappy shopping!"
        }
      },
      {
        "type": "send_sms",
        "config": {
          "to": "{{customer.phone}}",
          "message": "Welcome to FiscalNext! Use code WELCOME10 for 10% off your first order."
        }
      },
      {
        "type": "apply_discount",
        "config": {
          "customerId": "{{customer.id}}",
          "discountPercent": 10,
          "expiresIn": 14
        }
      },
      {
        "type": "webhook",
        "config": {
          "url": "http://localhost:5000/v1/integrations/{crm-id}/crm/sync-contacts",
          "method": "POST",
          "body": {
            "contacts": [{
              "email": "{{customer.email}}",
              "firstName": "{{customer.firstName}}",
              "lastName": "{{customer.lastName}}",
              "phone": "{{customer.phone}}"
            }]
          }
        }
      }
    ],
    "enabled": true
  }'
```

#### Rule 2: Birthday Discount

```bash
curl -X POST http://localhost:5000/v1/automations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Birthday Discount",
    "type": "customer",
    "trigger": {
      "event": "customer_birthday",
      "schedule": "0 9 * * *"
    },
    "conditions": [],
    "actions": [
      {
        "type": "email",
        "config": {
          "to": "{{customer.email}}",
          "subject": "Happy Birthday {{customer.firstName}}! 🎂",
          "template": "Happy Birthday! Enjoy 20% off today with code: BDAY20"
        }
      },
      {
        "type": "send_whatsapp",
        "config": {
          "to": "{{customer.phone}}",
          "message": "🎉 Happy Birthday {{customer.firstName}}! Get 20% off today with code BDAY20"
        }
      },
      {
        "type": "apply_discount",
        "config": {
          "customerId": "{{customer.id}}",
          "discountPercent": 20,
          "expiresIn": 1
        }
      }
    ],
    "enabled": true
  }'
```

#### Rule 3: Re-engage Inactive Customers

```bash
curl -X POST http://localhost:5000/v1/automations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Re-engage Inactive Customers",
    "type": "customer",
    "trigger": {
      "event": "customer_inactive",
      "schedule": "0 10 * * MON"
    },
    "conditions": [
      {
        "field": "lastPurchaseDays",
        "operator": "gt",
        "value": 90
      }
    ],
    "actions": [
      {
        "type": "email",
        "config": {
          "to": "{{customer.email}}",
          "subject": "We Miss You! Come Back for 15% Off",
          "template": "Hi {{customer.firstName}},\n\nIt has been a while! We miss you.\n\nHere is 15% off your next order: COMEBACK15\n\nHope to see you soon!"
        }
      },
      {
        "type": "apply_discount",
        "config": {
          "customerId": "{{customer.id}}",
          "discountPercent": 15,
          "expiresIn": 30
        }
      }
    ],
    "enabled": true
  }'
```

---

### Example 4: Multi-Channel Sales Reporting

**Scenario:** Daily sales report sent to Slack, exported to Google Sheets, and CRM deals created.

#### Daily Sales Report Automation

```bash
curl -X POST http://localhost:5000/v1/automations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Sales Report",
    "type": "notification",
    "trigger": {
      "event": "daily_summary",
      "schedule": "0 18 * * *"
    },
    "conditions": [],
    "actions": [
      {
        "type": "webhook",
        "config": {
          "url": "http://localhost:5000/v1/integrations/{slack-id}/slack/daily-summary",
          "method": "POST",
          "body": {
            "channel": "#sales",
            "summary": {
              "sales": "{{summary.totalSales}}",
              "revenue": "{{summary.totalRevenue}}",
              "transactions": "{{summary.transactions}}",
              "topProducts": "{{summary.topProducts}}"
            }
          }
        }
      },
      {
        "type": "webhook",
        "config": {
          "url": "http://localhost:5000/v1/integrations/{google-id}/google/sheets/export",
          "method": "POST",
          "body": {
            "spreadsheetId": "YOUR_SPREADSHEET_ID",
            "data": {
              "range": "Sales!A:F",
              "values": [
                ["{{summary.date}}", "{{summary.totalSales}}", "{{summary.totalRevenue}}", "{{summary.transactions}}", "{{summary.avgOrder}}", "{{summary.topProduct}}"]
              ]
            }
          }
        }
      },
      {
        "type": "email",
        "config": {
          "to": "management@example.com",
          "subject": "Daily Sales Report - {{summary.date}}",
          "template": "Sales Summary:\n\n- Total Revenue: €{{summary.totalRevenue}}\n- Orders: {{summary.transactions}}\n- Avg Order: €{{summary.avgOrder}}\n- Top Product: {{summary.topProduct}}"
        }
      }
    ],
    "enabled": true,
    "priority": 5
  }'
```

---

### Example 5: Complete Order-to-Delivery Workflow

**Scenario:** Order placed → Payment verified → Inventory updated → Fiscal receipt → Shipping label → Customer notification → CRM updated.

```javascript
// This is handled by a combination of automation rules

// 1. Order Received
{
  "name": "Process New Order",
  "trigger": {"event": "order_created"},
  "actions": [
    {"type": "notify", "config": {"message": "New order received"}},
    {"type": "webhook", "config": {"url": "/v1/integrations/{slack-id}/slack/sales-notification"}}
  ]
}

// 2. Payment Verified
{
  "name": "Payment Confirmed",
  "trigger": {"event": "payment_confirmed"},
  "actions": [
    {"type": "update_inventory", "config": {"operation": "decrease"}},
    {"type": "email", "config": {"subject": "Payment Confirmed"}}
  ]
}

// 3. Generate Fiscal Receipt
{
  "name": "Create Fiscal Receipt",
  "trigger": {"event": "payment_confirmed"},
  "actions": [
    {"type": "webhook", "config": {"url": "/v1/fiscal/receipts", "method": "POST"}}
  ]
}

// 4. Create Shipping Label
{
  "name": "Generate Shipping Label",
  "trigger": {"event": "order_ready_to_ship"},
  "actions": [
    {"type": "webhook", "config": {"url": "/v1/integrations/{dhl-id}/shipping/label"}},
    {"type": "send_sms", "config": {"message": "Your order has been shipped!"}}
  ]
}

// 5. Update CRM
{
  "name": "Sync to CRM",
  "trigger": {"event": "order_completed"},
  "actions": [
    {"type": "webhook", "config": {"url": "/v1/integrations/{crm-id}/crm/deal", "method": "POST"}}
  ]
}
```

---

## 🎓 Best Practices

### 1. Test Before Enabling
Always test integrations in a staging environment:
```bash
# Test connection
POST /v1/integrations/{id}/test

# Test with small batch first
POST /v1/integrations/{id}/shopify/sync-products?limit=10
```

### 2. Monitor Logs
Regularly check integration logs:
```bash
GET /v1/integrations/{id}/logs?limit=100
GET /v1/automations/{id}/logs?limit=100
```

### 3. Use Priorities
Set higher priority for critical automations:
- Priority 10: Order processing
- Priority 9: Inventory management
- Priority 5: Notifications
- Priority 1: Non-critical tasks

### 4. Rate Limiting
Be aware of API rate limits:
- Shopify: 2 requests/second
- Twilio: Varies by plan
- Google: 100 requests/100 seconds per user

### 5. Error Handling
Always include fallback actions:
```json
{
  "actions": [
    {
      "type": "email",
      "config": {...}
    },
    {
      "type": "notify",
      "config": {
        "message": "Fallback: Email failed, check logs"
      }
    }
  ]
}
```

---

## 📊 Performance Tips

1. **Batch Operations:** Use bulk endpoints when available
2. **Async Processing:** Long operations should be queued
3. **Cache Results:** Cache frequently accessed data
4. **Webhook vs Polling:** Prefer webhooks over polling
5. **Conditional Sync:** Only sync changed data

---

## 🚀 Advanced Patterns

### Pattern 1: Conditional Multi-Action

```json
{
  "conditions": [
    {"field": "total", "operator": "gt", "value": 100}
  ],
  "actions": [
    {"type": "apply_discount", "config": {"percent": 5}},
    {"type": "notify", "config": {"message": "VIP discount applied"}}
  ]
}
```

### Pattern 2: Chained Automation

Trigger one automation from another:
```json
{
  "actions": [
    {"type": "webhook", "config": {
      "url": "/v1/automations/{next-rule-id}/execute"
    }}
  ]
}
```

### Pattern 3: Template Variables

Use nested data:
```json
{
  "message": "Order {{order.id}} for {{order.customer.name}} - Total: €{{order.total}}"
}
```

---

## 🎉 You're Ready!

These examples cover the most common integration scenarios. Mix and match to create your perfect workflow!

**Pro Tip:** Start simple, test thoroughly, then add complexity gradually. 🚀
