# DAY 9 QUICK REFERENCE
# Advanced Dashboards & Real-time Features

🚀 **Quick start guide for Day 9 features**

---

## 📊 DASHBOARDS API

### List All Dashboards
```bash
GET /v1/dashboards?includeTemplates=true
Authorization: Bearer <token>
```

### Create Dashboard
```bash
POST /v1/dashboards
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Sales Overview",
  "description": "Daily sales monitoring",
  "widgets": [
    {
      "widgetType": "revenue_today",
      "title": "Today's Revenue",
      "x": 0,
      "y": 0,
      "width": 4,
      "height": 2,
      "config": {
        "dateRange": "today"
      }
    }
  ]
}
```

### Widget Types Available
- `revenue_today` - Today's total revenue
- `revenue_chart` - Revenue over time (line/bar)
- `sales_count` - Number of transactions
- `top_products` - Best selling products
- `low_stock` - Products below threshold
- `inventory_value` - Total inventory value
- `customer_count` - Total customers
- `recent_transactions` - Latest sales
- `live_sales_feed` - Real-time sales stream
- `online_users` - Currently online users
- `sales_by_category` - Category breakdown
- `sales_by_location` - Location comparison
- `payment_methods` - Payment distribution
- `hourly_sales` - Sales by hour
- `daily_comparison` - Today vs yesterday
- `profit_margin` - Gross profit %
- `tax_summary` - Tax collected
- `forecast_revenue` - Predicted revenue
- `customer_segments` - RFM segments
- `product_performance` - ABC classification

### Get Widget Data (Real-time)
```bash
GET /v1/dashboards/widgets/:widgetId/data
Authorization: Bearer <token>
```

---

## 📈 ADVANCED REPORTS API

### Execute Report
```bash
POST /v1/advanced-reports/:reportId/execute
Content-Type: application/json
Authorization: Bearer <token>

{
  "dateRange": {
    "start": "2026-02-01",
    "end": "2026-02-23"
  },
  "locationId": "location-uuid",
  "format": "json"
}
```

### Export to Excel
```bash
POST /v1/advanced-reports/:reportId/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "format": "excel",
  "includeCharts": true
}
```
Response: Binary XLSX file

### Schedule Daily Report
```bash
POST /v1/advanced-reports/:reportId/schedule
Content-Type: application/json
Authorization: Bearer <token>

{
  "scheduleEnabled": true,
  "scheduleCron": "0 9 * * *",
  "scheduleFormat": "pdf",
  "scheduleEmails": ["manager@example.com"]
}
```

### Report Templates Available
1. **Sales Summary** - Daily/weekly/monthly overview
2. **Profit & Loss** - Financial performance
3. **Inventory Valuation** - Stock value report
4. **Tax Summary** - Tax collected by rate
5. **Customer Analysis** - RFM segmentation
6. **Product Performance** - ABC classification

---

## 🤖 AUTOMATION API

### Create Automation
```bash
POST /v1/automations
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Low Stock Alert",
  "description": "Email when inventory is low",
  "triggerType": "low_stock",
  "triggerConfig": {
    "threshold": 10,
    "categoryId": "optional-category-uuid"
  },
  "actions": [
    {
      "type": "email",
      "config": {
        "to": ["manager@example.com"],
        "subject": "Low Stock: {{productName}}",
        "body": "Product {{productName}} has {{quantity}} units left (threshold: {{threshold}})"
      }
    }
  ]
}
```

### Trigger Types
- `low_stock` - When inventory falls below threshold
- `high_sales` - When sales exceed amount in period
- `new_customer` - When customer is created
- `time_based` - Scheduled (cron expression)

### Action Types
- `email` - Send email notification
- `webhook` - Call external API
- `notification` - In-app notification
- `price_adjustment` - Adjust product price

### Test Automation
```bash
POST /v1/automations/:automationId/test
Content-Type: application/json
Authorization: Bearer <token>

{
  "testData": {
    "productName": "Test Product",
    "quantity": 5,
    "threshold": 10
  }
}
```

### View Logs
```bash
GET /v1/automations/:automationId/logs?limit=50
Authorization: Bearer <token>
```

---

## 🔮 FORECASTING & BI API

### Generate Sales Forecast
```bash
POST /v1/forecasts
Content-Type: application/json
Authorization: Bearer <token>

{
  "forecastType": "sales",
  "period": "daily",
  "daysAhead": 30,
  "algorithm": "linear_regression",
  "includeConfidenceInterval": true
}
```

**Algorithms:**
- `linear_regression` - Trend-based prediction
- `moving_average` - Smoothed average
- `exponential_smoothing` - Weighted recent data

### Customer Segmentation (RFM)
```bash
POST /v1/forecasts/customer-segmentation
Content-Type: application/json
Authorization: Bearer <token>

{
  "method": "rfm",
  "segmentCount": 4
}
```

**Segments:**
- Champions (R≥4, F≥4, M≥4)
- Loyal (R≥3, F≥3, M≥3)
- New (R≥4, F≤2)
- At Risk (R≤2, F≥4, M≥4)
- Lost (R≤2, F≤2)

### ABC Analysis
```bash
POST /v1/forecasts/abc-analysis
Content-Type: application/json
Authorization: Bearer <token>

{
  "analysisType": "revenue",
  "dateRange": {
    "start": "2026-01-01",
    "end": "2026-02-23"
  }
}
```

**Classification:**
- A: Top 80% of revenue (high priority)
- B: Next 15% (medium priority)
- C: Last 5% (low priority)

### Trend Analysis
```bash
POST /v1/forecasts/trend-analysis
Content-Type: application/json
Authorization: Bearer <token>

{
  "metric": "sales",
  "period": "daily",
  "dateRange": {
    "start": "2026-02-01",
    "end": "2026-02-23"
  },
  "compareWith": "previous_period"
}
```

### Inventory Optimization
```bash
POST /v1/forecasts/inventory-optimization
Content-Type: application/json
Authorization: Bearer <token>

{
  "locationId": "optional-location-uuid",
  "includeSuggestions": true
}
```

**Provides:**
- Sales velocity (units per day)
- Days of stock remaining
- Turnover rate
- Reorder suggestions
- Overstocking alerts

---

## 🔌 WEBSOCKET REAL-TIME

### Connect
```javascript
import io from 'socket.io-client';

const socket = io('ws://localhost:5000', {
  transports: ['websocket', 'polling']
});
```

### Authenticate
```javascript
socket.on('connect', () => {
  socket.emit('authenticate', {
    token: 'jwt-token', // or pass userId/tenantId directly
    userId: 'user-uuid',
    tenantId: 'tenant-uuid'
  });
});

socket.on('authenticated', (data) => {
  console.log('Authenticated!', data);
  // data: { userId, tenantId, onlineUsers }
});
```

### Subscribe to Channels
```javascript
// Subscribe to sales channel
socket.emit('subscribe', { channel: 'sales' });

// Subscribe to inventory channel
socket.emit('subscribe', { channel: 'inventory' });

// Subscribe to dashboard channel
socket.emit('subscribe', { channel: 'dashboard' });
```

### Listen to Events
```javascript
// New transaction
socket.on('transaction:new', (data) => {
  console.log('New sale:', data);
  // data: { id, transactionNumber, total, itemCount, location, createdAt }
});

// Inventory changed
socket.on('inventory:changed', (data) => {
  console.log('Inventory update:', data);
  // data: { productId, productName, oldQuantity, newQuantity, type, timestamp }
});

// Low stock alert
socket.on('inventory:low_stock', (data) => {
  console.log('Low stock!', data);
  // data: { productId, productName, quantity, threshold, location }
});

// Widget update
socket.on('widget:update', (data) => {
  console.log('Widget refreshed:', data);
  // data: { widgetId, data, timestamp }
});

// User presence
socket.on('user:online', (data) => {
  console.log('User came online:', data.userId);
});

socket.on('user:offline', (data) => {
  console.log('User went offline:', data.userId);
});
```

### React Hook Example
```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function useWebSocket(userId, tenantId) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  
  useEffect(() => {
    const newSocket = io('ws://localhost:5000');
    
    newSocket.on('connect', () => {
      newSocket.emit('authenticate', { userId, tenantId });
    });
    
    newSocket.on('authenticated', (data) => {
      setConnected(true);
      setOnlineUsers(data.onlineUsers);
    });
    
    newSocket.on('user:online', () => {
      setOnlineUsers(prev => prev + 1);
    });
    
    newSocket.on('user:offline', () => {
      setOnlineUsers(prev => prev - 1);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [userId, tenantId]);
  
  const subscribe = (channel) => {
    socket?.emit('subscribe', { channel });
  };
  
  const on = (event, callback) => {
    socket?.on(event, callback);
  };
  
  return { socket, connected, onlineUsers, subscribe, on };
}

// Usage
function Dashboard() {
  const { socket, connected, onlineUsers, subscribe, on } = useWebSocket(userId, tenantId);
  
  useEffect(() => {
    if (connected) {
      subscribe('sales');
      subscribe('dashboard');
      
      on('transaction:new', (transaction) => {
        // Handle new transaction
      });
    }
  }, [connected]);
  
  return (
    <div>
      <p>Online users: {onlineUsers}</p>
      {/* Dashboard UI */}
    </div>
  );
}
```

---

## 🧪 TEST EXAMPLES

### Test Dashboard Flow
```bash
# 1. Create dashboard
curl -X POST http://localhost:5000/v1/dashboards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Dashboard",
    "widgets": [
      {
        "widgetType": "revenue_today",
        "title": "Revenue",
        "x": 0, "y": 0, "width": 4, "height": 2
      }
    ]
  }'

# 2. Get dashboard (note the ID from step 1)
curl http://localhost:5000/v1/dashboards/{dashboard-id} \
  -H "Authorization: Bearer $TOKEN"

# 3. Get widget data (note widget ID from step 2)
curl http://localhost:5000/v1/dashboards/widgets/{widget-id}/data \
  -H "Authorization: Bearer $TOKEN"
```

### Test Automation Flow
```bash
# 1. Create automation
curl -X POST http://localhost:5000/v1/automations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Automation",
    "triggerType": "low_stock",
    "triggerConfig": {"threshold": 10},
    "actions": [
      {
        "type": "notification",
        "config": {
          "title": "Test",
          "message": "Product {{productName}} is low"
        }
      }
    ]
  }'

# 2. Test automation
curl -X POST http://localhost:5000/v1/automations/{automation-id}/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "testData": {
      "productName": "Test Product",
      "quantity": 5
    }
  }'

# 3. View logs
curl http://localhost:5000/v1/automations/{automation-id}/logs \
  -H "Authorization: Bearer $TOKEN"
```

### Test Forecasting
```bash
# 1. Generate forecast
curl -X POST http://localhost:5000/v1/forecasts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "forecastType": "sales",
    "period": "daily",
    "daysAhead": 7,
    "algorithm": "linear_regression"
  }'

# 2. Customer segmentation
curl -X POST http://localhost:5000/v1/forecasts/customer-segmentation \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "rfm"
  }'

# 3. ABC analysis
curl -X POST http://localhost:5000/v1/forecasts/abc-analysis \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "analysisType": "revenue"
  }'
```

---

## 🐛 TROUBLESHOOTING

### WebSocket Not Connecting
```javascript
// Check CORS settings
// Ensure server is running
// Verify firewall allows WebSocket connections

// Enable debug mode
const socket = io('ws://localhost:5000', {
  transports: ['websocket'],
  debug: true
});
```

### Dashboard Widget Not Loading
```bash
# Check widget type is valid
# Verify tenant has data for the period
# Check console for errors

# Test widget data directly
curl http://localhost:5000/v1/dashboards/widgets/{widget-id}/data \
  -H "Authorization: Bearer $TOKEN"
```

### Automation Not Triggering
```bash
# 1. Check if enabled
curl http://localhost:5000/v1/automations/{id} \
  -H "Authorization: Bearer $TOKEN"

# 2. Test manually
curl -X POST http://localhost:5000/v1/automations/{id}/test \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'

# 3. Check logs for errors
curl http://localhost:5000/v1/automations/{id}/logs \
  -H "Authorization: Bearer $TOKEN"
```

### Report Generation Slow
- Reduce date range
- Add more specific filters
- Use cached reports (check if report exists)
- Consider using scheduled reports instead of on-demand

### Forecast Inaccurate
- Ensure at least 30 days of historical data
- Try different algorithms
- Check for outliers in data
- Consider seasonal adjustments

---

## 📚 USEFUL LINKS

- **Full API Docs:** `/docs` (Swagger UI)
- **WebSocket Events:** See `DAY9_COMPLETION_REPORT.md`
- **Widget Types:** See `services/dashboard.service.ts`
- **Automation Templates:** `GET /v1/automations/templates/list`
- **Report Templates:** `GET /v1/advanced-reports/templates/list`

---

## 💡 PRO TIPS

1. **Dashboard Performance**
   - Use `refreshInterval` wisely (default: 30s)
   - Cache widget data on frontend
   - Subscribe to WebSocket for real-time updates
   - Use smaller date ranges for better performance

2. **Report Scheduling**
   - Use cron expressions (e.g., `0 9 * * *` = 9 AM daily)
   - Test report before scheduling
   - Keep recipient list updated
   - Monitor email deliverability

3. **Automation Best Practices**
   - Start with test mode
   - Use specific triggers (not overly broad)
   - Keep action lists short (1-3 actions)
   - Monitor execution logs
   - Set rate limits for webhook actions

4. **Forecasting Tips**
   - Need 30+ days for accurate forecasts
   - Use linear regression for stable trends
   - Use moving average for volatile data
   - Check forecast accuracy regularly
   - Regenerate monthly

5. **WebSocket Optimization**
   - Subscribe only to needed channels
   - Unsubscribe when component unmounts
   - Batch updates (debounce rapid events)
   - Handle reconnection gracefully
   - Show connection status to users

---

**Last Updated:** 2026-02-23  
**Version:** 0.3.0 (Day 9 Features)  
**Support:** See `DAY9_COMPLETION_REPORT.md` for detailed documentation
