# Day 7 Integrations - Quick Reference Card

## 📦 Accounting Exports
```bash
# QuickBooks
GET  /v1/exports/quickbooks?startDate=2026-01-01&endDate=2026-02-28

# Xero
GET  /v1/exports/xero?startDate=2026-01-01&endDate=2026-02-28

# Generic CSV
GET  /v1/exports/generic?startDate=2026-01-01

# Export entities
GET  /v1/exports/customers
GET  /v1/exports/products
GET  /v1/exports/invoices?startDate=2026-01-01
GET  /v1/exports/formats
```

## 💳 Payment Gateways (Mock)
```bash
# Process payments
POST /v1/payments/stripe          {"amount":5000,"currency":"ALL"}
POST /v1/payments/paypal          {"amount":3000,"currency":"ALL"}
POST /v1/payments/square          {"amount":2500,"currency":"ALL"}

# Refunds
POST /v1/payments/refund          {"paymentId":"pay_123","amount":1000}

# Webhooks
POST /v1/payments/webhooks/stripe
POST /v1/payments/webhooks/paypal
POST /v1/payments/webhooks/square

# Info
GET  /v1/payments/:paymentId
GET  /v1/payments?gateway=stripe&status=succeeded
GET  /v1/payments/stats/overview
GET  /v1/payments/gateways/list
```

## 📧 Email Marketing
```bash
# Mailchimp
POST /v1/email-marketing/mailchimp/sync
     {"listId":"list_123","tags":["customers"]}
POST /v1/email-marketing/mailchimp/campaign
     {"listId":"list_123","subject":"Sale!","fromName":"Store",
      "fromEmail":"marketing@example.com","htmlContent":"<h1>Sale</h1>"}

# SendGrid
POST /v1/email-marketing/sendgrid/send
     {"to":"customer@example.com","from":"noreply@example.com",
      "subject":"Receipt","html":"<p>Thanks!</p>"}
POST /v1/email-marketing/sendgrid/bulk
     {"emails":[...]}

# Automated
POST /v1/email-marketing/campaign/automated
     {"name":"Welcome","trigger":"welcome","templateId":"tpl_welcome"}
POST /v1/email-marketing/customer/:customerId/welcome
POST /v1/email-marketing/receipt/:receiptId/email

# Segments
POST /v1/email-marketing/segment/export
     {"name":"VIP","criteria":{"minSpent":10000}}

# Info
GET  /v1/email-marketing/campaign/:campaignId/stats
GET  /v1/email-marketing/templates
```

## 🔖 Barcode & Printer
```bash
# Barcode generation
POST /v1/barcode-printer/barcode/generate
     {"type":"ean13","data":"1234567890128"}        → Returns PNG image
POST /v1/barcode-printer/barcode/dataurl
     {"type":"qr","data":"https://example.com"}     → Returns base64

# Labels
POST /v1/barcode-printer/label/price
     {"productId":"prod_123","includeBarcode":true}
POST /v1/barcode-printer/label/shelf/:productId
POST /v1/barcode-printer/label/batch
     {"productIds":["prod_1","prod_2","prod_3"]}

# Printing
POST /v1/barcode-printer/receipt/print
     {"receiptId":"rec_123","printerName":"main","copies":2}
POST /v1/barcode-printer/kitchen/print
     {"receiptId":"rec_123","printerName":"kitchen"}
GET  /v1/barcode-printer/receipt/:receiptId/commands

# Printer management
POST /v1/barcode-printer/printer/configure
     {"name":"main-receipt","type":"receipt","connection":"usb"}
GET  /v1/barcode-printer/printer/list
POST /v1/barcode-printer/printer/:name/test
```

## 💾 Backup & Restore
```bash
# Create & list
POST /v1/backup/create
     {"includeUploads":true,"compress":true}
GET  /v1/backup/list
GET  /v1/backup/stats

# Download & verify
GET  /v1/backup/download/:backupId                  → Returns .tar.gz
POST /v1/backup/verify/:backupId

# Restore (⚠️ WARNING: Overwrites database!)
POST /v1/backup/restore
     {"backupId":"backup-2026-02-23...","verifyBeforeRestore":true}

# Management
POST   /v1/backup/schedule
       {"schedule":"daily"}                         → daily|weekly|monthly
POST   /v1/backup/clean
       {"keepCount":10}                             → Keep N latest
DELETE /v1/backup/:backupId
```

## 🎯 Common Patterns

### Date Range Filter
```bash
?startDate=2026-01-01&endDate=2026-02-28
```

### Pagination
```bash
?page=1&limit=50
```

### Testing Mock Payments
```bash
curl -X POST http://localhost:5000/v1/payments/stripe \
  -H "Content-Type: application/json" \
  -d '{"amount":5000,"currency":"ALL","description":"Test"}'
```

### Generate QR Code for Receipt
```bash
curl -X POST http://localhost:5000/v1/barcode-printer/barcode/dataurl \
  -H "Content-Type: application/json" \
  -d '{"type":"qr","data":"https://fiscalnext.com/receipt/12345"}' \
  | jq -r '.dataUrl'
```

### Export Today's Transactions
```bash
TODAY=$(date +%Y-%m-%d)
curl "http://localhost:5000/v1/exports/generic?startDate=$TODAY&endDate=$TODAY" \
  -o today-transactions.csv
```

### Create Daily Backup
```bash
curl -X POST http://localhost:5000/v1/backup/create \
  -H "Content-Type: application/json" \
  -d '{"includeUploads":true,"compress":true}' \
  | jq '.backup.filename'
```

## 🔑 Key Files

- `src/services/export.service.ts` - Export logic
- `src/services/payment.service.ts` - Payment processing
- `src/services/email-marketing.service.ts` - Email campaigns
- `src/services/barcode-printer.service.ts` - Barcode/printer
- `src/services/backup.service.ts` - Backup/restore
- `DAY7_INTEGRATIONS_REPORT.md` - Full report
- `DAY7_README.md` - Detailed documentation
- `test-day7-integrations.sh` - Test script

## 🚀 Quick Test
```bash
# Start server
npm run dev

# In another terminal
./test-day7-integrations.sh
```

## 📊 Status Codes

- `200` - Success
- `400` - Bad request (check input)
- `404` - Not found (check if entity exists)
- `500` - Server error (check logs)

## 💡 Tips

1. **Exports are empty?** → Add test data first
2. **Payment always fails?** → It's mock - that's normal
3. **Barcode invalid?** → EAN-13 needs exactly 13 digits
4. **Backup large?** → Use `includeUploads: false`
5. **Need real payments?** → Configure .env with live keys

---

**Full docs:** `DAY7_README.md`  
**Report:** `DAY7_INTEGRATIONS_REPORT.md`  
**Tests:** `npm test tests/day7-integrations.test.ts`
