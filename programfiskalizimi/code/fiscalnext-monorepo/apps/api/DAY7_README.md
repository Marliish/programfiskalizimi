# Day 7 Integrations - Quick Start Guide

## 🚀 Getting Started

### Start the API Server
```bash
npm run dev
```

### Run Integration Tests
```bash
./test-day7-integrations.sh
```

Or run the full test suite:
```bash
npm test tests/day7-integrations.test.ts
```

---

## 📦 1. Accounting Exports

Export financial data to popular accounting software.

### Export to QuickBooks
```bash
curl http://localhost:5000/v1/exports/quickbooks \
  -o export.iif
```

With date range:
```bash
curl "http://localhost:5000/v1/exports/quickbooks?startDate=2026-01-01&endDate=2026-02-28" \
  -o export.iif
```

### Export to Xero
```bash
curl http://localhost:5000/v1/exports/xero \
  -o xero-export.csv
```

### Export Customers
```bash
curl http://localhost:5000/v1/exports/customers \
  -o customers.csv
```

### Export Products
```bash
curl http://localhost:5000/v1/exports/products \
  -o products.csv
```

### List Available Formats
```bash
curl http://localhost:5000/v1/exports/formats
```

**Response:**
```json
{
  "formats": [
    {
      "id": "quickbooks",
      "name": "QuickBooks IIF",
      "description": "QuickBooks Import Format (.iif)",
      "endpoint": "/v1/exports/quickbooks",
      "fileExtension": ".iif"
    },
    ...
  ]
}
```

---

## 💳 2. Payment Gateways (Mock)

Process payments through Stripe, PayPal, or Square (test mode).

### Process Stripe Payment
```bash
curl -X POST http://localhost:5000/v1/payments/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "ALL",
    "description": "Coffee and croissant",
    "customerId": "customer_123",
    "metadata": {
      "orderId": "order_456"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "stripe_abc123",
    "gateway": "stripe",
    "status": "succeeded",
    "amount": 5000,
    "currency": "ALL",
    "transactionId": "pi_xyz789",
    "createdAt": "2026-02-23T18:30:00.000Z"
  }
}
```

### Process PayPal Payment
```bash
curl -X POST http://localhost:5000/v1/payments/paypal \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 3000,
    "currency": "ALL",
    "description": "Lunch order"
  }'
```

### Process Square Payment
```bash
curl -X POST http://localhost:5000/v1/payments/square \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2500,
    "currency": "ALL"
  }'
```

### Process Refund
```bash
curl -X POST http://localhost:5000/v1/payments/refund \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "stripe_abc123",
    "amount": 1000,
    "reason": "customer_request"
  }'
```

### Get Payment Statistics
```bash
curl http://localhost:5000/v1/payments/stats/overview
```

**Response:**
```json
{
  "stats": {
    "stripe": {
      "totalTransactions": 1523,
      "totalAmount": 45000000,
      "successRate": 95.5,
      "averageAmount": 29562
    },
    "paypal": { ... },
    "square": { ... },
    "total": {
      "transactions": 2871,
      "amount": 82000000,
      "refunds": 145,
      "refundAmount": 2500000
    }
  }
}
```

### List Payment Gateways
```bash
curl http://localhost:5000/v1/payments/gateways/list
```

---

## 📧 3. Email Marketing

Integrate with Mailchimp and SendGrid for marketing automation.

### Sync Customers to Mailchimp
```bash
curl -X POST http://localhost:5000/v1/email-marketing/mailchimp/sync \
  -H "Content-Type: application/json" \
  -d '{
    "listId": "your_mailchimp_list_id",
    "tags": ["pos-customers", "vip"]
  }'
```

### Send Transactional Email (SendGrid)
```bash
curl -X POST http://localhost:5000/v1/email-marketing/sendgrid/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "customer@example.com",
    "from": "noreply@fiscalnext.com",
    "subject": "Your Receipt",
    "html": "<h1>Thank you for your purchase!</h1><p>Your order #123 is confirmed.</p>"
  }'
```

### Send Welcome Email
```bash
curl -X POST http://localhost:5000/v1/email-marketing/customer/customer_123/welcome \
  -H "Content-Type: application/json"
```

### Send Receipt Email
```bash
curl -X POST http://localhost:5000/v1/email-marketing/receipt/receipt_456/email \
  -H "Content-Type: application/json"
```

### Create Automated Campaign
```bash
curl -X POST http://localhost:5000/v1/email-marketing/campaign/automated \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Series",
    "trigger": "welcome",
    "templateId": "tpl_welcome",
    "delayHours": 0
  }'
```

**Trigger Types:**
- `welcome` - New customer signup
- `abandoned_cart` - Cart abandonment
- `post_purchase` - After purchase
- `birthday` - Customer birthday

### Create Mailchimp Campaign
```bash
curl -X POST http://localhost:5000/v1/email-marketing/mailchimp/campaign \
  -H "Content-Type: application/json" \
  -d '{
    "listId": "your_list_id",
    "subject": "Special 20% Off Sale!",
    "fromName": "FiscalNext Store",
    "fromEmail": "marketing@fiscalnext.com",
    "htmlContent": "<h1>Special Offer</h1><p>Get 20% off this weekend!</p>"
  }'
```

### List Email Templates
```bash
curl http://localhost:5000/v1/email-marketing/templates
```

---

## 🔖 4. Barcode & Printer

Generate barcodes and print receipts/labels.

### Generate EAN-13 Barcode (Image)
```bash
curl -X POST http://localhost:5000/v1/barcode-printer/barcode/generate \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ean13",
    "data": "1234567890128",
    "includeText": true
  }' \
  -o barcode.png
```

### Generate Barcode as Data URL
```bash
curl -X POST http://localhost:5000/v1/barcode-printer/barcode/dataurl \
  -H "Content-Type: application/json" \
  -d '{
    "type": "qr",
    "data": "https://fiscalnext.com/receipt/12345"
  }'
```

**Response:**
```json
{
  "success": true,
  "dataUrl": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Barcode Types:**
- `ean13` - EAN-13 (retail products)
- `code128` - Code 128 (general purpose)
- `qr` - QR Code (URLs, receipts)

### Generate Price Label
```bash
curl -X POST http://localhost:5000/v1/barcode-printer/label/price \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product_123",
    "quantity": 50,
    "includePrice": true,
    "includeBarcode": true,
    "size": "medium"
  }'
```

### Batch Print Labels
```bash
curl -X POST http://localhost:5000/v1/barcode-printer/label/batch \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["product_1", "product_2", "product_3"],
    "includeBarcode": true,
    "includePrice": true
  }'
```

### Print Receipt
```bash
curl -X POST http://localhost:5000/v1/barcode-printer/receipt/print \
  -H "Content-Type: application/json" \
  -d '{
    "receiptId": "receipt_123",
    "printerName": "main-receipt",
    "copies": 2
  }'
```

### Print Kitchen Ticket
```bash
curl -X POST http://localhost:5000/v1/barcode-printer/kitchen/print \
  -H "Content-Type: application/json" \
  -d '{
    "receiptId": "receipt_123",
    "printerName": "kitchen-printer"
  }'
```

### Configure Printer
```bash
curl -X POST http://localhost:5000/v1/barcode-printer/printer/configure \
  -H "Content-Type: application/json" \
  -d '{
    "name": "main-receipt",
    "type": "receipt",
    "connection": "usb",
    "paperWidth": 80
  }'
```

**Printer Types:**
- `receipt` - Thermal receipt printer
- `label` - Label printer (price tags)
- `kitchen` - Kitchen order printer

**Connection Types:**
- `usb` - USB connection
- `network` - Network/IP printer
- `bluetooth` - Bluetooth printer

### List Printers
```bash
curl http://localhost:5000/v1/barcode-printer/printer/list
```

### Test Printer
```bash
curl -X POST http://localhost:5000/v1/barcode-printer/printer/main-receipt/test
```

---

## 💾 5. Backup & Restore

Create and manage database backups.

### Create Backup
```bash
curl -X POST http://localhost:5000/v1/backup/create \
  -H "Content-Type: application/json" \
  -d '{
    "includeUploads": true,
    "compress": true,
    "encryption": false
  }'
```

**Response:**
```json
{
  "success": true,
  "backup": {
    "id": "backup-2026-02-23T18-30-00-000Z",
    "filename": "backup-2026-02-23T18-30-00-000Z.tar.gz",
    "size": 15728640,
    "createdAt": "2026-02-23T18:30:00.000Z",
    "type": "manual",
    "includesUploads": true,
    "compressed": true
  },
  "message": "Backup created successfully"
}
```

### List Backups
```bash
curl http://localhost:5000/v1/backup/list
```

### Download Backup
```bash
curl http://localhost:5000/v1/backup/download/backup-2026-02-23T18-30-00-000Z \
  -o backup.tar.gz
```

### Verify Backup
```bash
curl -X POST http://localhost:5000/v1/backup/verify/backup-2026-02-23T18-30-00-000Z
```

### Restore from Backup
```bash
curl -X POST http://localhost:5000/v1/backup/restore \
  -H "Content-Type: application/json" \
  -d '{
    "backupId": "backup-2026-02-23T18-30-00-000Z",
    "verifyBeforeRestore": true
  }'
```

**⚠️ WARNING:** Restore will overwrite current database!

### Schedule Automatic Backups
```bash
curl -X POST http://localhost:5000/v1/backup/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": "daily"
  }'
```

**Schedule Options:**
- `daily` - Every day at 2:00 AM
- `weekly` - Every Sunday at 2:00 AM
- `monthly` - 1st day of month at 2:00 AM

### Clean Old Backups
```bash
curl -X POST http://localhost:5000/v1/backup/clean \
  -H "Content-Type: application/json" \
  -d '{
    "keepCount": 10
  }'
```

Keeps the 10 most recent backups and deletes older ones.

### Backup Statistics
```bash
curl http://localhost:5000/v1/backup/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalBackups": 15,
    "totalSize": "1.23 GB",
    "totalSizeBytes": 1320000000,
    "oldestBackup": {
      "id": "backup-2026-01-01...",
      "createdAt": "2026-01-01T02:00:00.000Z",
      "size": "85.50 MB"
    },
    "newestBackup": {
      "id": "backup-2026-02-23...",
      "createdAt": "2026-02-23T18:30:00.000Z",
      "size": "92.34 MB"
    },
    "averageSize": "88.00 MB"
  }
}
```

### Delete Backup
```bash
curl -X DELETE http://localhost:5000/v1/backup/backup-2026-02-23T18-30-00-000Z
```

---

## 📊 All Endpoints Summary

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Exports** | GET | `/v1/exports/quickbooks` | Export to QuickBooks IIF |
| | GET | `/v1/exports/xero` | Export to Xero CSV |
| | GET | `/v1/exports/generic` | Generic accounting CSV |
| | GET | `/v1/exports/customers` | Export customers |
| | GET | `/v1/exports/products` | Export products |
| | GET | `/v1/exports/invoices` | Export invoices |
| | GET | `/v1/exports/formats` | List export formats |
| **Payments** | POST | `/v1/payments/stripe` | Stripe payment |
| | POST | `/v1/payments/paypal` | PayPal payment |
| | POST | `/v1/payments/square` | Square payment |
| | POST | `/v1/payments/refund` | Process refund |
| | GET | `/v1/payments/stats/overview` | Payment statistics |
| | GET | `/v1/payments/gateways/list` | List gateways |
| **Email** | POST | `/v1/email-marketing/mailchimp/sync` | Sync to Mailchimp |
| | POST | `/v1/email-marketing/sendgrid/send` | Send email |
| | POST | `/v1/email-marketing/campaign/automated` | Automated campaign |
| | GET | `/v1/email-marketing/templates` | List templates |
| **Barcode** | POST | `/v1/barcode-printer/barcode/generate` | Generate barcode |
| | POST | `/v1/barcode-printer/label/price` | Price label |
| | POST | `/v1/barcode-printer/receipt/print` | Print receipt |
| | GET | `/v1/barcode-printer/printer/list` | List printers |
| **Backup** | POST | `/v1/backup/create` | Create backup |
| | GET | `/v1/backup/list` | List backups |
| | GET | `/v1/backup/download/:id` | Download backup |
| | POST | `/v1/backup/restore` | Restore backup |
| | POST | `/v1/backup/schedule` | Schedule backups |

---

## 🔐 Production Setup

### Environment Variables

Create a `.env` file with:

```env
# Payment Gateways (replace with live keys)
STRIPE_SECRET_KEY=sk_live_...
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
SQUARE_ACCESS_TOKEN=...

# Email Services
SENDGRID_API_KEY=SG...
MAILCHIMP_API_KEY=...
MAILCHIMP_LIST_ID=...

# Backup Storage
BACKUP_STORAGE_PATH=/path/to/backups
BACKUP_CLOUD_PROVIDER=aws
AWS_S3_BUCKET=fiscalnext-backups
AWS_ACCESS_KEY=...
AWS_SECRET_KEY=...
```

### Security Checklist

- [ ] Replace all mock payment gateways with real credentials
- [ ] Enable webhook signature verification
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Enable backup encryption
- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting
- [ ] Enable audit logging

---

## 🐛 Troubleshooting

### Exports are empty
- Check if data exists in the database
- Verify date range parameters
- Check database connection

### Payment always fails
- These are MOCK integrations - replace with real API keys
- Check API key environment variables
- Verify webhook endpoints are accessible

### Barcode generation fails
- Ensure data format is correct (EAN-13 needs 13 digits)
- Check if bwip-js package is installed
- Verify image output directory is writable

### Backup fails
- Check disk space
- Verify backup directory permissions
- Ensure database is accessible

---

## 📚 Additional Resources

- [QuickBooks IIF Format](https://developer.intuit.com/app/developer/qbdesktop/docs/file-formats/iif-format)
- [Xero CSV Import](https://central.xero.com/s/article/Import-and-export-invoices-using-CSV-files)
- [Stripe API Docs](https://stripe.com/docs/api)
- [SendGrid API Docs](https://docs.sendgrid.com/)
- [ESC/POS Commands](https://reference.epson-biz.com/modules/ref_escpos/index.php)

---

**Need help?** Check `DAY7_INTEGRATIONS_REPORT.md` for detailed implementation notes.
