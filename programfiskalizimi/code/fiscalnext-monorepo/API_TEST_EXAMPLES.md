# Financial & HR API - Testing Examples
**Quick reference for testing all 70 endpoints**

## Prerequisites
```bash
# 1. Start the API server
cd apps/api
pnpm dev

# 2. Get an authentication token (replace with your login endpoint)
TOKEN="your_jwt_token_here"
```

---

## 1. PAYROLL SYSTEM

### Create Employee
```bash
curl -X POST http://localhost:5000/v1/payroll/employees \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+355691234567",
    "hireDate": "2026-01-01",
    "position": "Software Engineer",
    "department": "Engineering",
    "salary": 75000,
    "currency": "ALL",
    "employmentType": "full_time",
    "bankName": "Raiffeisen Bank",
    "bankAccountNumber": "AL35202111090000000001234567"
  }'
```

### Create Payroll Run
```bash
curl -X POST http://localhost:5000/v1/payroll/payroll-runs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "periodStart": "2026-02-01",
    "periodEnd": "2026-02-28",
    "payDate": "2026-03-01",
    "notes": "February 2026 payroll"
  }'
```

### Add Employee to Payroll Run
```bash
curl -X POST http://localhost:5000/v1/payroll/payroll-runs/{runId}/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "employee-uuid-here",
    "baseSalary": 75000,
    "overtimePay": 5000,
    "bonuses": 10000,
    "incomeTax": 13500,
    "socialSecurity": 5625,
    "healthInsurance": 2250,
    "notes": "Regular payroll + performance bonus"
  }'
```

### Approve Payroll Run
```bash
curl -X POST http://localhost:5000/v1/payroll/payroll-runs/{runId}/approve \
  -H "Authorization: Bearer $TOKEN"
```

---

## 2. EXPENSE TRACKING

### Create Expense Category
```bash
curl -X POST http://localhost:5000/v1/expense-categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Office Supplies",
    "description": "General office supplies and stationery"
  }'
```

### Submit Expense
```bash
curl -X POST http://localhost:5000/v1/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "category-uuid-here",
    "employeeId": "employee-uuid-here",
    "description": "Laptop for new developer",
    "amount": 150000,
    "currency": "ALL",
    "expenseDate": "2026-02-20",
    "receiptUrl": "https://example.com/receipts/laptop-invoice.pdf",
    "receiptNumber": "INV-2026-001"
  }'
```

### Approve Expense
```bash
curl -X POST http://localhost:5000/v1/expenses/{expenseId}/approve \
  -H "Authorization: Bearer $TOKEN"
```

### Mark Expense as Paid
```bash
curl -X POST http://localhost:5000/v1/expenses/{expenseId}/pay \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentReference": "BANK-TXN-123456"
  }'
```

### Get Expense Statistics
```bash
curl http://localhost:5000/v1/expenses/stats/summary?startDate=2026-02-01&endDate=2026-02-28 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 3. BILL PAYMENTS

### Create Vendor
```bash
curl -X POST http://localhost:5000/v1/vendors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TechSupplies Ltd",
    "contactPerson": "Jane Smith",
    "email": "jane@techsupplies.com",
    "phone": "+355692345678",
    "address": "Rruga e Kavajes 123",
    "city": "Tirana",
    "country": "AL",
    "taxId": "K12345678X",
    "bankName": "Credins Bank",
    "bankAccountNumber": "AL47212110090000000235698741",
    "paymentTerms": "Net 30"
  }'
```

### Create Bill
```bash
curl -X POST http://localhost:5000/v1/bills \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "vendor-uuid-here",
    "vendorInvoiceNumber": "TechSup-2026-045",
    "billDate": "2026-02-15",
    "dueDate": "2026-03-15",
    "subtotal": 100000,
    "taxAmount": 20000,
    "totalAmount": 120000,
    "currency": "ALL",
    "description": "Monthly IT equipment purchase"
  }'
```

### Record Payment (Partial)
```bash
curl -X POST http://localhost:5000/v1/bills/{billId}/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentDate": "2026-02-20",
    "amount": 60000,
    "paymentMethod": "bank_transfer",
    "referenceNumber": "TRX-2026-12345",
    "notes": "First installment"
  }'
```

### Get Overdue Bills
```bash
curl http://localhost:5000/v1/bills/overdue/list \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4. BANK RECONCILIATION

### Create Bank Account
```bash
curl -X POST http://localhost:5000/v1/bank-accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "AL35202111090000000001234567",
    "accountName": "Business Checking Account",
    "bankName": "Raiffeisen Bank Albania",
    "currency": "ALL",
    "currentBalance": 5000000
  }'
```

### Import Bank Transactions (Bulk)
```bash
curl -X POST http://localhost:5000/v1/bank-accounts/{accountId}/transactions/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      {
        "transactionDate": "2026-02-15",
        "description": "Payment from Customer ABC",
        "amount": 150000,
        "type": "credit",
        "balance": 5150000,
        "referenceNumber": "CRD-001"
      },
      {
        "transactionDate": "2026-02-16",
        "description": "Office Rent Payment",
        "amount": -50000,
        "type": "debit",
        "balance": 5100000,
        "referenceNumber": "DBT-002"
      }
    ]
  }'
```

### Match Transaction to Expense
```bash
curl -X POST http://localhost:5000/v1/bank-transactions/{transactionId}/match \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matchedType": "expense",
    "matchedId": "expense-uuid-here"
  }'
```

### Create Reconciliation
```bash
curl -X POST http://localhost:5000/v1/bank-accounts/{accountId}/reconciliations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "periodStart": "2026-02-01",
    "periodEnd": "2026-02-28",
    "openingBalance": 5000000,
    "closingBalance": 5100000,
    "statementBalance": 5100000,
    "notes": "February 2026 reconciliation"
  }'
```

### Complete Reconciliation
```bash
curl -X POST http://localhost:5000/v1/reconciliations/{reconId}/complete \
  -H "Authorization: Bearer $TOKEN"
```

### Get Account Statistics
```bash
curl "http://localhost:5000/v1/bank-accounts/{accountId}/stats?startDate=2026-02-01&endDate=2026-02-28" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5. HR MANAGEMENT

### Create Onboarding Task
```bash
curl -X POST http://localhost:5000/v1/hr/onboarding \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "employee-uuid-here",
    "taskName": "Complete HR paperwork",
    "description": "Fill out and sign all employment forms",
    "dueDate": "2026-02-25",
    "sortOrder": 1
  }'
```

### Complete Onboarding Task
```bash
curl -X POST http://localhost:5000/v1/hr/onboarding/{taskId}/complete \
  -H "Authorization: Bearer $TOKEN"
```

### Create Training Module
```bash
curl -X POST http://localhost:5000/v1/hr/training/modules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Cybersecurity Fundamentals",
    "description": "Essential cybersecurity practices for all employees",
    "duration": 120,
    "materials": {
      "videos": ["https://training.example.com/cyber101.mp4"],
      "documents": ["https://training.example.com/cyber-guide.pdf"]
    },
    "requiresCertification": true,
    "passingScore": 80
  }'
```

### Enroll Employee in Training
```bash
curl -X POST http://localhost:5000/v1/hr/training/enrollments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trainingModuleId": "module-uuid-here",
    "employeeId": "employee-uuid-here"
  }'
```

### Update Training Progress (Complete with Score)
```bash
curl -X PUT http://localhost:5000/v1/hr/training/enrollments/{enrollmentId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "score": 95,
    "notes": "Excellent performance on all assessments"
  }'
```

### Create Performance Review
```bash
curl -X POST http://localhost:5000/v1/hr/performance-reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "employee-uuid-here",
    "reviewPeriodStart": "2025-08-01",
    "reviewPeriodEnd": "2026-01-31",
    "reviewerName": "Sarah Johnson",
    "reviewerTitle": "Engineering Manager",
    "performanceRating": 5,
    "qualityRating": 4,
    "communicationRating": 5,
    "teamworkRating": 5,
    "strengths": "Excellent technical skills, great team player, proactive problem solver",
    "areasForImprovement": "Could benefit from more leadership opportunities",
    "goals": "Lead a major project in Q2 2026",
    "comments": "Top performer, recommend for promotion"
  }'
```

### Submit Performance Review
```bash
curl -X POST http://localhost:5000/v1/hr/performance-reviews/{reviewId}/submit \
  -H "Authorization: Bearer $TOKEN"
```

### Employee Acknowledges Review
```bash
curl -X POST http://localhost:5000/v1/hr/performance-reviews/{reviewId}/acknowledge \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeComments": "Thank you for the positive feedback. I look forward to the leadership opportunities."
  }'
```

### Create Time-Off Request
```bash
curl -X POST http://localhost:5000/v1/hr/time-off-requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "employee-uuid-here",
    "type": "vacation",
    "startDate": "2026-03-10",
    "endDate": "2026-03-14",
    "totalDays": 5,
    "reason": "Family vacation"
  }'
```

### Approve Time-Off Request
```bash
curl -X POST http://localhost:5000/v1/hr/time-off-requests/{requestId}/approve \
  -H "Authorization: Bearer $TOKEN"
```

### Upload Employee Document
```bash
curl -X POST http://localhost:5000/v1/hr/employee-documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "employee-uuid-here",
    "documentType": "contract",
    "documentName": "Employment Contract 2026",
    "fileUrl": "https://documents.example.com/contracts/emp-123-contract.pdf",
    "fileSize": 245678,
    "mimeType": "application/pdf",
    "expiresAt": "2027-01-01",
    "notes": "Signed on 2026-01-15"
  }'
```

### Get Expiring Documents
```bash
curl "http://localhost:5000/v1/hr/employee-documents/expiring/list?daysAhead=30" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Quick Test All Endpoints

### List All Data
```bash
# Payroll
curl http://localhost:5000/v1/payroll/employees -H "Authorization: Bearer $TOKEN"
curl http://localhost:5000/v1/payroll/payroll-runs -H "Authorization: Bearer $TOKEN"

# Expenses
curl http://localhost:5000/v1/expense-categories -H "Authorization: Bearer $TOKEN"
curl http://localhost:5000/v1/expenses -H "Authorization: Bearer $TOKEN"

# Bills
curl http://localhost:5000/v1/vendors -H "Authorization: Bearer $TOKEN"
curl http://localhost:5000/v1/bills -H "Authorization: Bearer $TOKEN"

# Bank Reconciliation
curl http://localhost:5000/v1/bank-accounts -H "Authorization: Bearer $TOKEN"

# HR
curl http://localhost:5000/v1/hr/training/modules -H "Authorization: Bearer $TOKEN"
curl http://localhost:5000/v1/hr/performance-reviews -H "Authorization: Bearer $TOKEN"
curl http://localhost:5000/v1/hr/time-off-requests -H "Authorization: Bearer $TOKEN"
```

---

## Tips

1. **Authentication**: Replace `$TOKEN` with your actual JWT token from the login endpoint
2. **UUIDs**: Replace placeholder UUIDs (e.g., `employee-uuid-here`) with actual IDs from your database
3. **Dates**: Use ISO 8601 format (YYYY-MM-DD)
4. **Amounts**: Use numbers without currency symbols (e.g., 100000 for 1000.00 ALL)
5. **Testing Tool**: Consider using Postman or Insomnia for a better testing experience

---

**Built by Edison & Eroldi | FiscalNext Financial & HR Module**
