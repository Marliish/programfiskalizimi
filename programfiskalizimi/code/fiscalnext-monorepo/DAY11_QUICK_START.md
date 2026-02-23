# DAY 11 - INTEGRATIONS QUICK START GUIDE

## 🚀 Getting Started with Integrations

### 1. Database Setup

Run the migration to create integration tables:

```bash
# Using psql
psql -U your_user -d fiscalnext < apps/api/migrations/0011_create_integrations_tables.sql

# Or using Drizzle
npx drizzle-kit push:pg
```

### 2. Register Routes

Add to `apps/api/src/server.ts`:

```typescript
import { integrationRoutes } from './routes/integrations';

// After other route registrations
await server.register(integrationRoutes, { prefix: '/v1' });
```

Update root endpoint documentation:
```typescript
endpoints: {
  // ... existing endpoints
  integrations: '/v1/integrations',
  automations: '/v1/automations',
}
```

### 3. Environment Variables

Add to `.env`:

```env
# Shopify
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_PASSWORD=your-api-password

# Twilio (SMS/WhatsApp)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Slack
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Google Workspace
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_ACCESS_TOKEN=your-access-token

# HubSpot
HUBSPOT_API_KEY=your-api-key

# Salesforce
SALESFORCE_CLIENT_ID=your-client-id
SALESFORCE_CLIENT_SECRET=your-client-secret
SALESFORCE_ACCESS_TOKEN=your-access-token
SALESFORCE_INSTANCE_URL=https://your-instance.salesforce.com
```

---

## 📝 Usage Examples

### Example 1: Connect Shopify Store

```bash
curl -X POST http://localhost:5000/v1/integrations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Shopify Store",
    "provider": "shopify",
    "type": "ecommerce",
    "enabled": true,
    "config": {
      "shopUrl": "mystore.myshopify.com",
      "apiKey": "your-api-key",
      "apiPassword": "your-api-password",
      "apiVersion": "2024-01"
    },
    "syncInterval": 30
  }'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Shopify Store",
  "provider": "shopify",
  "type": "ecommerce",
  "enabled": true,
  "config": { ... },
  "syncInterval": 30
}
```

### Example 2: Test Connection

```bash
curl -X POST http://localhost:5000/v1/integrations/{id}/test
```

**Response:**
```json
{
  "success": true,
  "message": "Connection successful",
  "details": {
    "shop": {
      "name": "My Store",
      "email": "store@example.com"
    }
  }
}
```

### Example 3: Sync Products

```bash
curl -X POST http://localhost:5000/v1/integrations/{id}/shopify/sync-products
```

**Response:**
```json
{
  "imported": 150,
  "updated": 0,
  "errors": []
}
```

### Example 4: Get Shipping Rates

```bash
curl -X POST http://localhost:5000/v1/integrations/{id}/shipping/rates \
  -H "Content-Type: application/json" \
  -d '{
    "from": {
      "name": "Sender",
      "street1": "123 Main St",
      "city": "Tirana",
      "postalCode": "1001",
      "country": "AL"
    },
    "to": {
      "name": "Recipient",
      "street1": "456 Oak Ave",
      "city": "Pristina",
      "postalCode": "10000",
      "country": "XK"
    },
    "packages": [{
      "weight": 2.5,
      "weightUnit": "kg",
      "length": 30,
      "width": 20,
      "height": 10,
      "dimensionUnit": "cm"
    }]
  }'
```

**Response:**
```json
[
  {
    "carrier": "DHL",
    "service": "DHL Express Worldwide",
    "rate": 45.99,
    "currency": "EUR",
    "estimatedDays": 3
  },
  {
    "carrier": "DHL",
    "service": "DHL Economy Select",
    "rate": 32.99,
    "currency": "EUR",
    "estimatedDays": 5
  }
]
```

### Example 5: Send Slack Notification

```bash
curl -X POST http://localhost:5000/v1/integrations/{id}/slack/notification \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "#sales",
    "message": "New order received!",
    "options": {
      "title": "Order Notification",
      "color": "good",
      "fields": [
        {
          "title": "Order ID",
          "value": "#12345",
          "short": true
        },
        {
          "title": "Total",
          "value": "€125.50",
          "short": true
        }
      ]
    }
  }'
```

### Example 6: Send SMS

```bash
curl -X POST http://localhost:5000/v1/integrations/{id}/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+355691234567",
    "body": "Your order #12345 has been shipped! Track: https://track.example.com/12345"
  }'
```

### Example 7: Create Automation Rule

```bash
curl -X POST http://localhost:5000/v1/automations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Low Stock Alert",
    "description": "Alert when product stock is below 10",
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
      }
    ],
    "actions": [
      {
        "type": "notify",
        "config": {
          "userId": "admin",
          "title": "Low Stock Alert",
          "message": "{{product.name}} is low on stock ({{quantity}} remaining)"
        }
      },
      {
        "type": "email",
        "config": {
          "to": "manager@example.com",
          "subject": "Low Stock: {{product.name}}",
          "template": "Product {{product.name}} (SKU: {{product.sku}}) has only {{quantity}} units left."
        }
      }
    ],
    "enabled": true,
    "priority": 8
  }'
```

---

## 🎯 Common Integration Scenarios

### Scenario 1: E-Commerce Store Sync

**Goal:** Sync Shopify orders to FiscalNext, create fiscal receipts, update inventory.

**Steps:**
1. Create Shopify integration
2. Sync products: `POST /integrations/{id}/shopify/sync-products`
3. Sync orders: `POST /integrations/{id}/shopify/sync-orders`
4. Set up webhook for real-time order sync
5. Create automation rule to generate fiscal receipts for new orders

### Scenario 2: Low Stock Reordering

**Goal:** Automatically create purchase order when stock is low.

**Steps:**
1. Create automation rule with trigger: `stock_updated`
2. Add condition: `quantity < reorderPoint`
3. Add action: `create_order` with supplier details
4. Add action: `notify` to alert procurement team
5. Optional: Send email to supplier

### Scenario 3: Customer Engagement

**Goal:** Send welcome message and discount to new customers.

**Steps:**
1. Create automation rule with trigger: `customer_created`
2. Add action: `email` with welcome template
3. Add action: `apply_discount` with 10% off, expires in 7 days
4. Optional: Add action: `send_sms` with WhatsApp welcome message

### Scenario 4: Daily Sales Report

**Goal:** Send daily sales summary to Slack at 6 PM.

**Steps:**
1. Create automation rule with trigger: `daily_summary`
2. Set schedule: `0 18 * * *` (6 PM daily)
3. Add action: `webhook` calling Slack API with sales data
4. Include revenue, orders, top products

### Scenario 5: Shipping Integration

**Goal:** Calculate shipping rates and create labels for orders.

**Steps:**
1. Create DHL/FedEx/UPS integration
2. When order is ready to ship:
   - Call `POST /integrations/{id}/shipping/rates` to get rates
   - User selects shipping method
   - Call `POST /integrations/{id}/shipping/label` to create label
3. Update order with tracking number
4. Send tracking notification to customer via SMS/email

---

## 🔧 Troubleshooting

### Integration Connection Fails

**Problem:** Test connection returns error.

**Solutions:**
- Verify API keys/credentials are correct
- Check API URL format (include https://)
- Ensure firewall allows outbound connections
- Check integration-specific rate limits

### Webhook Not Receiving Events

**Problem:** Webhook events not triggering.

**Solutions:**
- Verify webhook URL is publicly accessible
- Check webhook secret matches
- Ensure integration webhook is registered with provider
- Check webhook event logs: `GET /integrations/{id}/webhook-events`

### Automation Rule Not Executing

**Problem:** Automation rule created but not running.

**Solutions:**
- Verify rule is enabled
- Check conditions are correctly configured
- Review automation logs: `GET /automations/{id}/logs`
- Manually test: `POST /automations/{id}/execute`

### Sync Failing

**Problem:** Product/order sync returns errors.

**Solutions:**
- Check integration logs: `GET /integrations/{id}/logs`
- Verify API rate limits not exceeded
- Check data format compatibility
- Test with smaller batch first

---

## 📚 API Reference Quick Links

### Integration Management
- **List:** `GET /v1/integrations`
- **Create:** `POST /v1/integrations`
- **Update:** `PUT /v1/integrations/{id}`
- **Delete:** `DELETE /v1/integrations/{id}`
- **Test:** `POST /v1/integrations/{id}/test`
- **Logs:** `GET /v1/integrations/{id}/logs`

### E-Commerce
- **Shopify Sync Products:** `POST /v1/integrations/{id}/shopify/sync-products`
- **Shopify Sync Orders:** `POST /v1/integrations/{id}/shopify/sync-orders`
- **Shopify Update Inventory:** `POST /v1/integrations/{id}/shopify/update-inventory`
- **WooCommerce Sync Products:** `POST /v1/integrations/{id}/woocommerce/sync-products`
- **WooCommerce Sync Orders:** `POST /v1/integrations/{id}/woocommerce/sync-orders`

### Shipping
- **Get Rates:** `POST /v1/integrations/{id}/shipping/rates`
- **Create Label:** `POST /v1/integrations/{id}/shipping/label`
- **Track Shipment:** `GET /v1/integrations/{id}/shipping/track/{trackingNumber}`
- **Bulk Labels:** `POST /v1/integrations/{id}/shipping/bulk-labels`

### CRM
- **Sync Contacts:** `POST /v1/integrations/{id}/crm/sync-contacts`
- **Create Deal:** `POST /v1/integrations/{id}/crm/deal`
- **Log Activity:** `POST /v1/integrations/{id}/crm/activity`
- **Get Contacts:** `GET /v1/integrations/{id}/crm/contacts`

### Communication
- **Slack Notification:** `POST /v1/integrations/{id}/slack/notification`
- **Send SMS:** `POST /v1/integrations/{id}/sms/send`
- **Send WhatsApp:** `POST /v1/integrations/{id}/whatsapp/send`
- **SMS Campaign:** `POST /v1/integrations/{id}/sms/campaign`

### Automation
- **List Rules:** `GET /v1/automations`
- **Create Rule:** `POST /v1/automations`
- **Update Rule:** `PUT /v1/automations/{id}`
- **Delete Rule:** `DELETE /v1/automations/{id}`
- **Execute Rule:** `POST /v1/automations/{id}/execute`
- **View Logs:** `GET /v1/automations/{id}/logs`

---

## 🎨 Frontend Components

Import the integration manager in your admin panel:

```typescript
import IntegrationManager from './components/IntegrationManager';

// In your routes
<Route path="/integrations" element={<IntegrationManager />} />
```

---

## 📞 Support

For issues or questions:
- Check logs: `GET /v1/integrations/{id}/logs`
- View webhook events: `GET /v1/integrations/{id}/webhook-events`
- Review automation logs: `GET /v1/automations/{id}/logs`
- Check API health: `GET /health`

---

## 🚀 Next Steps

1. **Register routes** in `server.ts`
2. **Run database migration**
3. **Add frontend components** to admin panel
4. **Configure integrations** via API or UI
5. **Create automation rules** for your workflows
6. **Set up webhooks** for real-time sync
7. **Test and monitor** integration logs

**Happy integrating! 🎉**
