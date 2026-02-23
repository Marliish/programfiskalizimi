# DAY 11 - DEPLOYMENT CHECKLIST

## ✅ Pre-Deployment Verification

### Code Files Created
- [x] `apps/api/src/services/integration.service.ts`
- [x] `apps/api/src/services/webhook.service.ts`
- [x] `apps/api/src/services/automation.service.ts`
- [x] `apps/api/src/services/shopify.service.ts`
- [x] `apps/api/src/services/woocommerce.service.ts`
- [x] `apps/api/src/services/shipping.service.ts`
- [x] `apps/api/src/services/crm.service.ts`
- [x] `apps/api/src/services/slack.service.ts`
- [x] `apps/api/src/services/sms.service.ts`
- [x] `apps/api/src/services/google-workspace.service.ts`
- [x] `apps/api/src/schemas/integration.schema.ts`
- [x] `apps/api/src/routes/integrations.ts`
- [x] `apps/api/migrations/0011_create_integrations_tables.sql`
- [x] `apps/web-admin/src/components/IntegrationManager.tsx`

### Documentation Created
- [x] `DAY11_INTEGRATIONS_REPORT.md` (15KB)
- [x] `DAY11_QUICK_START.md` (11KB)
- [x] `DAY11_INTEGRATION_EXAMPLES.md` (15KB)
- [x] `DAY11_FINAL_SUMMARY.md` (12KB)
- [x] `DAY11_DEPLOYMENT_CHECKLIST.md` (this file)

---

## 🔧 Deployment Steps

### Step 1: Database Setup

```bash
# Option A: Using psql directly
cd /Users/admin/.openclaw/workspace/programfiskalizimi/code/fiscalnext-monorepo
psql -U your_username -d fiscalnext < apps/api/migrations/0011_create_integrations_tables.sql

# Option B: Using Drizzle (if configured)
npx drizzle-kit push:pg

# Verify tables were created
psql -U your_username -d fiscalnext -c "\dt integration*"
psql -U your_username -d fiscalnext -c "\dt webhook*"
psql -U your_username -d fiscalnext -c "\dt automation*"
```

**Expected Output:**
```
 integrations
 integration_logs
 webhooks
 webhook_events
 automation_rules
 automation_logs
 sync_jobs
```

### Step 2: Register Routes

Edit `apps/api/src/server.ts`:

```typescript
// Add import at the top (around line 20-40)
import { integrationRoutes } from './routes/integrations';

// Register routes (around line 120-150, after other routes)
await server.register(integrationRoutes, { prefix: '/v1' });
```

Update the root endpoint documentation:
```typescript
// In server.get('/', ...) around line 110
endpoints: {
  // ... existing endpoints
  integrations: '/v1/integrations',
  automations: '/v1/automations',
}
```

### Step 3: Environment Variables

Add to `.env`:

```env
# ==================
# DAY 11 INTEGRATIONS
# ==================

# Shopify
SHOPIFY_API_KEY=
SHOPIFY_API_PASSWORD=
SHOPIFY_API_VERSION=2024-01

# WooCommerce
WOOCOMMERCE_CONSUMER_KEY=
WOOCOMMERCE_CONSUMER_SECRET=

# Twilio (SMS/WhatsApp)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WHATSAPP_NUMBER=

# Slack
SLACK_BOT_TOKEN=
SLACK_WEBHOOK_URL=

# Google Workspace
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_ACCESS_TOKEN=

# HubSpot
HUBSPOT_API_KEY=

# Salesforce
SALESFORCE_CLIENT_ID=
SALESFORCE_CLIENT_SECRET=
SALESFORCE_ACCESS_TOKEN=
SALESFORCE_INSTANCE_URL=

# DHL (if using real API)
DHL_API_KEY=
DHL_API_SECRET=

# FedEx (if using real API)
FEDEX_API_KEY=
FEDEX_API_SECRET=

# UPS (if using real API)
UPS_API_KEY=
UPS_API_SECRET=
```

### Step 4: Install Dependencies (if needed)

```bash
cd /Users/admin/.openclaw/workspace/programfiskalizimi/code/fiscalnext-monorepo

# Check if axios is installed
npm list axios

# If not installed:
npm install axios

# Or using pnpm (recommended for monorepo)
pnpm add axios
```

### Step 5: Restart Server

```bash
# Stop current server (if running)
# Ctrl+C or:
pkill -f "node.*fiscalnext"

# Start server
cd apps/api
npm run dev

# Or from root with turbo:
pnpm dev
```

### Step 6: Verify Installation

```bash
# Test 1: Check health
curl http://localhost:5000/health

# Test 2: Check integrations endpoint
curl http://localhost:5000/v1/integrations

# Test 3: Check automations endpoint
curl http://localhost:5000/v1/automations

# Test 4: Check root endpoint shows new routes
curl http://localhost:5000/
# Should include "integrations" and "automations" in endpoints
```

**Expected Response from root:**
```json
{
  "name": "FiscalNext API",
  "version": "0.4.0",
  "endpoints": {
    "...": "...",
    "integrations": "/v1/integrations",
    "automations": "/v1/automations"
  }
}
```

---

## 🧪 Testing

### Test 1: Create Test Integration

```bash
curl -X POST http://localhost:5000/v1/integrations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Integration",
    "provider": "custom",
    "type": "custom",
    "enabled": true,
    "config": {
      "apiUrl": "https://jsonplaceholder.typicode.com/posts",
      "apiKey": "test-key",
      "authType": "bearer"
    }
  }'
```

**Expected:** Integration created with ID

### Test 2: List Integrations

```bash
curl http://localhost:5000/v1/integrations
```

**Expected:** Array with your test integration

### Test 3: Test Connection

```bash
curl -X POST http://localhost:5000/v1/integrations/{id}/test
```

**Expected:** `{"success": true, "message": "Connection successful"}`

### Test 4: Create Automation Rule

```bash
curl -X POST http://localhost:5000/v1/automations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Rule",
    "type": "notification",
    "trigger": {
      "event": "test",
      "source": "manual"
    },
    "conditions": [],
    "actions": [
      {
        "type": "notify",
        "config": {
          "userId": "admin",
          "title": "Test",
          "message": "This is a test"
        }
      }
    ],
    "enabled": true
  }'
```

**Expected:** Rule created with ID

### Test 5: View Logs

```bash
# Integration logs
curl http://localhost:5000/v1/integrations/{id}/logs

# Automation logs
curl http://localhost:5000/v1/automations/{id}/logs
```

**Expected:** Array of log entries

---

## 🎨 Frontend Setup (Optional)

### Add Integration Manager to Admin Panel

1. **Copy Component:**
   ```bash
   # Component already created at:
   # apps/web-admin/src/components/IntegrationManager.tsx
   ```

2. **Add Route:**
   Edit `apps/web-admin/src/App.tsx` or your router file:
   ```typescript
   import IntegrationManager from './components/IntegrationManager';

   // Add route
   <Route path="/integrations" element={<IntegrationManager />} />
   ```

3. **Add Navigation:**
   Edit your sidebar/navigation:
   ```tsx
   <MenuItem icon={<ApiOutlined />} path="/integrations">
     Integrations
   </MenuItem>
   ```

4. **Install Ant Design (if not already):**
   ```bash
   cd apps/web-admin
   npm install antd @ant-design/icons
   ```

---

## 📊 Monitoring Setup

### Check Database

```sql
-- View integrations
SELECT id, name, provider, type, enabled FROM integrations;

-- View recent logs
SELECT * FROM integration_logs ORDER BY created_at DESC LIMIT 10;

-- View automation rules
SELECT id, name, type, enabled, run_count FROM automation_rules;

-- View webhook events
SELECT id, event, status, attempts FROM webhook_events ORDER BY created_at DESC LIMIT 10;
```

### Log Files

Monitor API logs for integration activity:
```bash
# If using PM2
pm2 logs fiscalnext-api

# Or check server console output
tail -f logs/api.log
```

---

## 🚨 Troubleshooting

### Problem: Routes Not Found (404)

**Solution:**
1. Verify routes are registered in `server.ts`
2. Check import statement is correct
3. Restart server
4. Check for typos in route paths

### Problem: Database Connection Error

**Solution:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check connection string in `.env`
3. Verify database exists: `psql -l | grep fiscalnext`
4. Re-run migration if tables missing

### Problem: Integration Test Fails

**Solution:**
1. Check API credentials are correct
2. Verify network connectivity
3. Check integration logs: `GET /v1/integrations/{id}/logs`
4. Test with curl directly to third-party API

### Problem: Webhook Not Working

**Solution:**
1. Verify webhook URL is publicly accessible
2. Check webhook secret matches
3. Test with webhook testing tool (webhook.site)
4. Review webhook event logs

### Problem: Automation Not Executing

**Solution:**
1. Check rule is enabled
2. Verify conditions are met
3. Review automation logs
4. Test manual execution: `POST /v1/automations/{id}/execute`

---

## ✅ Post-Deployment Checklist

- [ ] Database migration successful
- [ ] Routes registered and accessible
- [ ] Environment variables configured
- [ ] Server restarted successfully
- [ ] Health check passing
- [ ] Test integration created
- [ ] Test automation rule created
- [ ] Logs are visible
- [ ] Frontend component added (optional)
- [ ] Documentation reviewed

---

## 📞 Quick Reference

### API Base URL
```
http://localhost:5000/v1
```

### Key Endpoints
```
GET  /integrations              # List all
POST /integrations              # Create
POST /integrations/:id/test     # Test connection
GET  /integrations/:id/logs     # View logs

GET  /automations               # List all
POST /automations               # Create
POST /automations/:id/execute   # Execute
```

### Documentation Links
- [Complete Report](./DAY11_INTEGRATIONS_REPORT.md)
- [Quick Start](./DAY11_QUICK_START.md)
- [Examples](./DAY11_INTEGRATION_EXAMPLES.md)
- [Summary](./DAY11_FINAL_SUMMARY.md)

---

## 🎯 Success Criteria

✅ All 7 database tables created  
✅ All 10 service files working  
✅ All 51 API endpoints accessible  
✅ Integration creation works  
✅ Automation creation works  
✅ Logs are being recorded  
✅ No errors in server console  
✅ Documentation is clear  

**If all checks pass: DEPLOYMENT SUCCESSFUL! 🎉**

---

## 📝 Notes

- Mock implementations (DHL, FedEx, UPS) return sample data - replace with real API calls when credentials are available
- Amazon SP-API requires OAuth - framework is ready, add credentials to enable
- Google Workspace requires OAuth - use access token for now, implement OAuth flow for production
- Twilio requires account - mock responses available for testing without credentials

---

## 🚀 Next Steps After Deployment

1. **Configure Real Integrations**
   - Add API credentials for Shopify/WooCommerce
   - Set up Twilio account for SMS
   - Configure Slack workspace
   - Connect Google Workspace

2. **Create Automation Rules**
   - Low stock alerts
   - Order processing workflows
   - Customer engagement campaigns
   - Daily reports

3. **Set Up Webhooks**
   - Register webhooks with Shopify
   - Configure webhook URLs
   - Test webhook delivery

4. **Monitor & Optimize**
   - Review logs regularly
   - Optimize slow queries
   - Add indexes if needed
   - Scale webhook processing

5. **User Training**
   - Document internal workflows
   - Train staff on integration UI
   - Create automation templates
   - Set up monitoring dashboards

---

**Ready to deploy? Follow the steps above and you'll be live in minutes!** 🚀
