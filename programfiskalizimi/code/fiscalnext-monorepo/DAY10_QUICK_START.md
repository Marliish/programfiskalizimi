# DAY 10 QUICK START - Mobile App & API Optimization

## 🚀 Quick Setup (5 Minutes)

### 1. Start Redis (Required for caching)
```bash
# Mac (Homebrew)
brew install redis
redis-server

# Or Docker
docker run -d -p 6379:6379 redis:alpine

# Linux
sudo apt-get install redis-server
sudo systemctl start redis
```

### 2. Update API Environment
```bash
cd apps/api
echo "REDIS_ENABLED=true" >> .env
echo "REDIS_HOST=localhost" >> .env
echo "REDIS_PORT=6379" >> .env
```

### 3. Start Backend API
```bash
cd apps/api
npm run dev

# Should see:
# ✅ Redis connected
# 🚀 FiscalNext API Server Started!
```

### 4. Setup Mobile App
```bash
cd apps/mobile

# Install dependencies
npm install

# Start Expo dev server
npm start

# Then press:
# - 'i' for iOS simulator
# - 'a' for Android emulator
# - Scan QR code for physical device
```

---

## 📱 Mobile App - First Run

### Login Screen
```
Email: admin@fiscalnext.com
Password: admin123
```

### Test Offline Mode
1. **Create Sale Offline:**
   - Enable airplane mode on device
   - Go to POS screen
   - Scan or add products
   - Complete sale → Stored locally ✅

2. **Verify Sync:**
   - Disable airplane mode
   - Check sync status (should auto-sync)
   - Or tap "Sync Now" in Settings
   - Sale appears on server ✅

### Barcode Scanning
1. Go to POS screen
2. Tap "📷 Scan" button
3. Allow camera permissions
4. Point at barcode → Auto-adds to cart

---

## 🧪 API Testing

### Test Sync Upload
```bash
TOKEN="your_jwt_token"

curl -X POST http://localhost:5000/v1/sync/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sales": [{
      "customerId": null,
      "items": [
        {"productId": 1, "quantity": 2, "price": 10.50}
      ],
      "paymentMethod": "cash",
      "total": 21.00,
      "createdAt": "2026-02-23T19:00:00Z"
    }]
  }'
```

### Test Batch Operations
```bash
# Bulk create products
curl -X POST http://localhost:5000/v1/batch/products/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {"name": "Bulk Product 1", "price": 9.99, "categoryId": 1},
      {"name": "Bulk Product 2", "price": 14.99, "categoryId": 1},
      {"name": "Bulk Product 3", "price": 19.99, "categoryId": 1}
    ]
  }'

# Bulk stock adjustment
curl -X POST http://localhost:5000/v1/batch/products/adjust-stock \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adjustments": [
      {"productId": 1, "quantity": 50, "type": "add"},
      {"productId": 2, "quantity": 30, "type": "add"}
    ]
  }'
```

### Check API Health & Metrics
```bash
# API health check (no auth needed)
curl http://localhost:5000/v1/api/health

# Detailed metrics (requires auth)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/v1/api/metrics

# Performance report
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/v1/api/performance-report
```

### Test Notifications
```bash
# Register device for push notifications
curl -X POST http://localhost:5000/v1/mobile/notifications/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "platform": "ios",
    "deviceId": "simulator-12345"
  }'

# Send notification
curl -X POST http://localhost:5000/v1/mobile/notifications/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test message",
    "data": {"type": "sale_completed"}
  }'

# Get unread count
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/v1/mobile/notifications/unread-count
```

---

## 🎯 Performance Verification

### Check Redis Caching
```bash
# Install Redis CLI
redis-cli

# Check cached keys
KEYS products:*
KEYS dashboard:*

# Get cache value
GET "products:all"

# Check cache hit/miss
# First request (cold) → ~150ms
time curl http://localhost:5000/v1/products

# Second request (cached) → ~30ms
time curl http://localhost:5000/v1/products
```

### Monitor API Performance
```bash
# Watch metrics in real-time
watch -n 2 'curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/v1/api/metrics | jq .stats'

# Output example:
# {
#   "totalRequests": 45,
#   "avgResponseTime": 85.3,
#   "minResponseTime": 12,
#   "maxResponseTime": 234,
#   "errorRate": 0,
#   "requestsPerMinute": 9
# }
```

---

## 📊 Mobile App Structure

```
apps/mobile/
├── App.tsx                      # Main navigation
├── src/
│   ├── stores/                  # State management
│   │   ├── authStore.ts        # Login state
│   │   ├── cartStore.ts        # Cart items
│   │   └── syncStore.ts        # Sync status
│   ├── services/
│   │   ├── apiClient.ts        # HTTP client
│   │   ├── syncService.ts      # Sync logic
│   │   └── notificationService.ts
│   ├── database/
│   │   └── init.ts             # SQLite setup
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── DashboardScreen.tsx
│       ├── POSScreen.tsx       # Main POS interface
│       ├── ProductsScreen.tsx
│       ├── ScannerScreen.tsx   # Barcode scanner
│       └── ...
```

---

## 🔧 Common Issues & Solutions

### Redis Connection Error
```
❌ Redis error: connect ECONNREFUSED
```
**Solution:** Start Redis server
```bash
redis-server
```

### Mobile App Not Connecting to API
**Android Emulator:**
```typescript
// Use 10.0.2.2 instead of localhost
baseURL: 'http://10.0.2.2:5000'
```

**iOS Simulator:**
```typescript
// localhost works fine
baseURL: 'http://localhost:5000'
```

**Physical Device:**
```typescript
// Use your computer's IP address
baseURL: 'http://192.168.1.100:5000'
```

### Camera Permission Denied
- iOS: Check Settings → FiscalNext → Camera → Allow
- Android: Check Settings → Apps → FiscalNext → Permissions → Camera

### Sync Not Working
1. Check network connection (Settings shows "🟢 Online")
2. Check auth token (re-login if expired)
3. View sync logs in console
4. Try manual sync (Settings → "🔄 Sync Now")

---

## 🎮 Mobile App Controls

### Navigation
- **Bottom Tabs:**
  - Home → Dashboard
  - Sell → POS Screen
  - Products → Product List
  - Sales → History
  - Settings → App Config

- **Modal Screens:**
  - Scanner (from POS)
  - Customer Detail

### POS Screen
- **📷 Scan:** Open barcode scanner
- **Quantity Controls:** +/- buttons
- **✕ Remove:** Delete item from cart
- **Payment Method:** Toggle Cash/Card
- **Complete Sale:** Process transaction

### Dashboard
- **Pull to Refresh:** Update stats
- **Sync Status:** Top banner (Online/Offline)
- **Quick Actions:** Jump to features

### Settings
- **🔄 Sync Now:** Manual sync trigger
- **Logout:** Sign out

---

## 📈 Performance Targets

### API (with Redis)
- ✅ Products list: <50ms
- ✅ Single product: <30ms
- ✅ Dashboard stats: <80ms
- ✅ Sync upload: <1s per 10 sales

### Mobile Sync
- ✅ Initial sync: 2-3 seconds (100 products)
- ✅ Delta sync: <1 second
- ✅ Offline operation: Instant

---

## 🚀 Deploy to Production

### Mobile App (Expo EAS)
```bash
cd apps/mobile

# Install EAS CLI
npm install -g eas-cli

# Configure
eas init

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Backend API
```bash
# Update API base URL in mobile app
# apps/mobile/src/services/apiClient.ts
baseURL: 'https://api.fiscalnext.com'

# Deploy API with Redis
# Ensure Redis is available at production URL
REDIS_HOST=your-redis-host.com
```

---

## 📝 Quick Commands Cheat Sheet

```bash
# Start everything
redis-server &
cd apps/api && npm run dev &
cd apps/mobile && npm start

# Test API health
curl http://localhost:5000/v1/api/health

# View Redis cache
redis-cli KEYS '*'

# Mobile logs
npx react-native log-ios
npx react-native log-android

# Clear mobile cache
cd apps/mobile
rm -rf node_modules
npm install

# Clear SQLite database (reset mobile data)
# iOS: Device → Erase All Content and Settings
# Android: Settings → Apps → Clear Data
```

---

## 🎯 Testing Checklist

- [ ] Login with biometric
- [ ] Add product to cart
- [ ] Scan barcode
- [ ] Complete sale offline
- [ ] Verify sale syncs when online
- [ ] Check sync status indicator
- [ ] View sales history
- [ ] Receive push notification
- [ ] Test batch product creation (API)
- [ ] Check API metrics dashboard

---

## 💡 Pro Tips

1. **Enable Expo DevTools:** Press `m` in terminal → Opens in browser
2. **Hot Reload:** Shake device → "Reload" or `r` in terminal
3. **Debug Network:** Shake device → "Debug Remote JS"
4. **Monitor Sync:** Watch Settings screen for sync status
5. **Cache Testing:** Clear Redis between tests for consistent results
6. **Performance:** Use React DevTools Profiler for optimization

---

**Ready to Go!** 🚀

Start all services and begin testing. The mobile app is fully functional offline, and the API is optimized with Redis caching and comprehensive metrics.

For detailed documentation, see: **DAY10_MOBILE_REPORT.md**
