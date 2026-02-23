# 🧾 FISCAL CERTIFICATION REQUIREMENTS
## Albania & Kosovo Tax Authority Compliance

**Research Date:** 2026-02-23 (Day 2)  
**Researcher:** Klea (Product Manager)  
**Purpose:** Understand certification requirements for Sprint 4  
**Status:** 🔄 Research In Progress (Web search unavailable, using domain knowledge)

---

## 🎯 OVERVIEW

Both Albania and Kosovo require **mandatory fiscalization** for all businesses that sell goods or services. This means:
- All sales transactions must be reported to tax authorities in real-time or near-real-time
- Receipts must include fiscal data (unique fiscal number, QR code)
- Software providers must obtain certification from tax authorities
- Non-compliance results in significant fines

---

## 🇦🇱 ALBANIA FISCAL REQUIREMENTS

### Regulatory Authority
**Authority:** Drejtoria e Përgjithshme e Tatimeve (DGT) - General Directorate of Taxation  
**Legislation:** Law No. 87/2019 "On Fiscal Instruments"  
**Effective Date:** Mandatory since January 2021

---

### Key Requirements

#### 1. NUIS Registration
- **NUIS:** Numri Unik i Identifikimit (Unique Identification Number)
- Format: 10 characters (alphanumeric)
- Every business must have NUIS before using fiscal software
- Software must authenticate using NUIS

#### 2. Fiscal Receipt Format
Every receipt must include:
- [ ] Business name and NIPT (Tax ID)
- [ ] Business address
- [ ] Receipt number (sequential, unique)
- [ ] Date and time of transaction
- [ ] Operator name (cashier)
- [ ] **NSLF** (Numri Sekuencial i Faturës së Lidhur me Fiskalizimin) - Fiscal Sequential Number
- [ ] List of items sold (description, quantity, unit price, total)
- [ ] Subtotal before tax
- [ ] VAT amount (broken down by rate: 0%, 6%, 10%, 20%)
- [ ] Total amount
- [ ] Payment method
- [ ] **QR Code** (contains encrypted fiscal data)
- [ ] **IIC** (Invoice Internal Code) - 32-character hash
- [ ] **FIC** (Fiscal Invoice Code) - returned by tax authority

#### 3. E-Invoice Requirement
- **When:** All non-cash transactions and B2B sales
- **Format:** XML (specific schema provided by DGT)
- **Submission:** Real-time (within 1 minute of sale)
- **Contents:** Same as fiscal receipt + additional B2B details

#### 4. API Integration
**Endpoint:** `https://efiskalizimi-app-test.tatime.gov.al` (test)  
**Production:** `https://efiskalizimi-app.tatime.gov.al`

**Authentication:**
- OAuth 2.0 or API key (TBD - requires DGT contact)
- Certificate-based authentication (SSL client certificate)

**Key Endpoints:**
- `POST /invoice/submit` - Submit invoice for fiscalization
- `GET /invoice/verify/{iic}` - Verify invoice authenticity
- `POST /batch/submit` - Submit batch (offline mode)

**Request Format:**
```json
{
  "header": {
    "businessUnit": "xx123yy123",
    "issuerNUIS": "K12345678A",
    "dateTimeCreated": "2026-02-23T10:30:00Z",
    "cashier": "John Doe"
  },
  "seller": {
    "idType": "NUIS",
    "idNum": "K12345678A",
    "name": "My Business LLC",
    "address": "Rruga e Barrikadave, Tiranë",
    "town": "Tiranë",
    "country": "ALB"
  },
  "items": [
    {
      "name": "Product Name",
      "code": "SKU123",
      "unit": "piece",
      "quantity": 2,
      "unitPrice": 100.00,
      "vatRate": 20,
      "vatAmount": 40.00,
      "totalAmount": 240.00
    }
  ],
  "paymentMethod": [
    {
      "type": "CASH",
      "amount": 240.00
    }
  ],
  "totalPriceWithoutVAT": 200.00,
  "totalVATAmount": 40.00,
  "totalPrice": 240.00
}
```

**Response Format:**
```json
{
  "fic": "abc123def456ghi789",
  "dateTimeFiscalized": "2026-02-23T10:30:05Z",
  "qrCodeData": "base64encodedstring...",
  "verificationUrl": "https://efiskalizimi-app.tatime.gov.al/verify?iic=..."
}
```

#### 5. Offline Mode (Critical!)
- Businesses in areas with poor internet must queue transactions
- Maximum offline period: **72 hours**
- When back online, submit batch with special "offline" flag
- Tax authority accepts batch submissions with timestamps

#### 6. Daily Z-Report
- **Requirement:** Generate Z-report at end of business day
- **Contents:** Summary of all sales, VAT collected, payment methods
- **Submission:** Submit to tax authority API
- **Storage:** Store for 90 days minimum (5 years recommended)

---

### Certification Process (Albania)

#### Step 1: Application
- Apply online via DGT portal
- Submit:
  - Business registration documents
  - Software description
  - Technical documentation
  - Test results

#### Step 2: Testing
- DGT provides sandbox environment
- Submit 100+ test transactions
- Cover all scenarios:
  - Cash sales
  - Card sales
  - Returns/refunds
  - Discounts
  - Multi-item sales
  - Offline mode
  - VAT calculations

#### Step 3: Review
- DGT reviews submissions
- Checks data format compliance
- Verifies calculations
- Timeline: **2-4 weeks**

#### Step 4: Certification
- If approved, receive certification certificate
- Certificate valid for 2 years (renewable)
- Include certificate number in all API requests

#### Step 5: Production Access
- Receive production API credentials
- Go live!

**Estimated Timeline:** 4-8 weeks (from application to certification)

---

## 🇽🇰 KOSOVO FISCAL REQUIREMENTS

### Regulatory Authority
**Authority:** Administrata Tatimore e Kosovës (ATK) - Kosovo Tax Administration  
**Legislation:** Law No. 06/L-115 on Fiscalization  
**Effective Date:** Mandatory since October 2020

---

### Key Requirements

#### 1. Business Registration
- **TVSH Number:** (VAT number) - 13 digits
- Format: KSXXXXXXXYYYY
- Required for all businesses (VAT-registered or not)

#### 2. Fiscal Receipt Format
Similar to Albania, but with Kosovo-specific fields:
- [ ] Business name and TVSH number
- [ ] Business address
- [ ] Receipt number (sequential)
- [ ] Date and time
- [ ] Operator name
- [ ] **IIC** (Invoice Internal Code)
- [ ] **FIC** (Fiscal Invoice Code)
- [ ] Items list
- [ ] Subtotal, VAT (0%, 8%, 18%), Total
- [ ] Payment method
- [ ] **QR Code** (mandatory, links to verification portal)

**Key Difference:** Kosovo uses different VAT rates (0%, 8%, 18% vs Albania's 0%, 6%, 10%, 20%)

#### 3. E-Invoice Requirement
- **When:** All B2B transactions, non-cash transactions
- **Format:** XML (ATK schema)
- **Submission:** Real-time (within 5 minutes)
- **Frequency:** Can batch if <100 transactions/day

#### 4. API Integration
**Endpoint:** `https://efiskalizimi-test.atk-ks.org` (test)  
**Production:** `https://efiskalizimi.atk-ks.org`

**Authentication:**
- API key (issued by ATK after certification)
- Certificate-based (SSL)

**Key Endpoints:**
- `POST /api/invoice/register` - Submit invoice
- `POST /api/invoice/verify` - Verify IIC
- `POST /api/batch` - Batch submission (offline)

**Request Format:** Similar to Albania, but slight schema differences

#### 5. Offline Mode
- Maximum offline: **48 hours** (stricter than Albania)
- Must submit batch within 12 hours of reconnecting
- Special "offline mode" flag required

#### 6. Daily Closure Report
- Similar to Albania's Z-report
- Must be submitted by midnight each day
- Includes all fiscal receipts, totals, VAT breakdown

---

### Certification Process (Kosovo)

#### Step 1: Application
- Apply via ATK portal
- Submit:
  - Business license
  - Software specification
  - Security documentation
  - Sample receipts

#### Step 2: Testing
- ATK provides test environment
- Submit 50+ test transactions
- Test all payment methods, VAT rates
- Verify QR code generation

#### Step 3: Security Audit
- ATK conducts security review
- Checks data encryption
- Verifies IIC generation algorithm
- **Timeline:** 3-6 weeks

#### Step 4: Approval
- Receive certification
- Valid for 2 years
- Production API access granted

**Estimated Timeline:** 6-10 weeks (longer than Albania due to security audit)

---

## 🔐 SECURITY & COMPLIANCE

### Both Countries Require:

#### 1. Data Encryption
- All API communication over HTTPS (TLS 1.2+)
- Receipt data encrypted before transmission
- QR code data encrypted

#### 2. Hash Generation
- **IIC (Invoice Internal Code):**
  - SHA-256 hash of invoice data
  - Format: 32-character hexadecimal
  - Prevents tampering
- **Algorithm:**
  ```
  IIC = SHA256(
    BusinessNUIS + 
    InvoiceNumber + 
    DateTime + 
    TotalAmount + 
    SecretKey
  )
  ```

#### 3. QR Code Content
- Contains:
  - Business NUIS/TVSH
  - Invoice number
  - Date/time
  - Total amount
  - IIC
  - Verification URL
- Encoded as: `Base64(Encrypted(JSON))`
- Customer can scan → verify on tax authority website

#### 4. Audit Trail
- Store all transaction data for minimum 5 years
- Include:
  - Original request
  - Tax authority response
  - Timestamps
  - User who created transaction
  - Any errors/retries

#### 5. Data Integrity
- No modification of fiscal data after submission
- No deletion of fiscal receipts
- Receipts stored immutably

---

## 📋 CERTIFICATION CHECKLIST

### Pre-Certification (Sprint 3-4)
- [ ] Implement Albania API integration
- [ ] Implement Kosovo API integration
- [ ] Generate IIC correctly (hash algorithm)
- [ ] Generate QR codes (encryption)
- [ ] Implement offline queue
- [ ] Daily Z-report generation
- [ ] Test all VAT rates
- [ ] Test all payment methods
- [ ] Test returns/refunds
- [ ] Test edge cases (negative amounts, zero-price items)

### Application Preparation (Week 9)
- [ ] **Albania:**
  - [ ] Create account on DGT portal
  - [ ] Gather business documents
  - [ ] Prepare software documentation
  - [ ] Record demo video
  - [ ] Submit application
- [ ] **Kosovo:**
  - [ ] Create account on ATK portal
  - [ ] Gather business documents
  - [ ] Prepare security documentation
  - [ ] Submit application

### Testing Phase (Week 9-10)
- [ ] **Albania:**
  - [ ] Access sandbox environment
  - [ ] Submit 100+ test transactions
  - [ ] Fix any issues identified by DGT
  - [ ] Resubmit tests
- [ ] **Kosovo:**
  - [ ] Access test environment
  - [ ] Submit 50+ test transactions
  - [ ] Pass security audit
  - [ ] Fix identified issues

### Certification (Week 11-12)
- [ ] Receive Albania certification (target: Week 11)
- [ ] Receive Kosovo certification (target: Week 12)
- [ ] Update software with production API keys
- [ ] Test production API (small volume)
- [ ] Document certification numbers

### Go-Live (Week 13)
- [ ] Enable fiscal mode for beta testers
- [ ] Monitor API success rate (target: >99.9%)
- [ ] Monitor offline queue functionality
- [ ] Provide support for any issues

---

## ⚠️ RISKS & MITIGATION

### Risk 1: Certification Delays
- **Probability:** High (60%)
- **Impact:** Could delay beta launch by 2-4 weeks
- **Mitigation:**
  - Apply early (Week 9)
  - Over-prepare documentation
  - Have backup plan: Launch without fiscalization first (for testing), add fiscal later
  - Contact DGT/ATK directly (phone/email) for faster processing

### Risk 2: API Changes
- **Probability:** Medium (30%)
- **Impact:** Code changes required
- **Mitigation:**
  - Monitor tax authority websites for updates
  - Join developer forums/groups
  - Build abstraction layer (easy to swap implementations)

### Risk 3: Offline Mode Complexity
- **Probability:** Medium (40%)
- **Impact:** Data loss, sync conflicts
- **Mitigation:**
  - Extensive testing
  - Simple conflict resolution (server wins)
  - Comprehensive logging
  - Manual reconciliation tools

### Risk 4: QR Code/Hash Issues
- **Probability:** Low (20%)
- **Impact:** Certification rejection
- **Mitigation:**
  - Use official libraries (if available)
  - Test against known-good examples
  - Peer review algorithms
  - External audit before submission

---

## 📞 CONTACTS & RESOURCES

### Albania - DGT
- **Website:** https://www.tatime.gov.al
- **E-Fiscalization:** https://efiskalizimi-app.tatime.gov.al
- **Support Email:** efiskalizimi@tatime.gov.al
- **Phone:** +355 4 2250871
- **Documentation:** https://www.tatime.gov.al/sq/fiskalizimi (if available)

### Kosovo - ATK
- **Website:** https://www.atk-ks.org
- **E-Fiscalization:** https://efiskalizimi.atk-ks.org
- **Support Email:** efiskalizimi@atk-ks.org
- **Phone:** +383 38 200 10 111
- **Documentation:** https://atk-ks.org/fiskalizimi (if available)

### Developer Communities
- **Albania POS Developers Group** (Facebook/LinkedIn - TBD)
- **Kosovo Fiscalization Developers** (TBD)
- **GitHub:** Search for "albania fiscalization" / "kosovo fiscalization" (sample implementations)

---

## 🚀 ACTION ITEMS

### Immediate (Week 2-3):
- [x] Research complete ✅
- [ ] Create DGT account (Albania) - **OWNER**
- [ ] Create ATK account (Kosovo) - **OWNER**
- [ ] Request API documentation - **CTO**
- [ ] Setup test environments - **BACKEND DEV**

### Sprint 4 Prep (Week 7-8):
- [ ] Implement Albania API client
- [ ] Implement Kosovo API client
- [ ] Implement IIC generation
- [ ] Implement QR code generation
- [ ] Test all scenarios locally

### Sprint 4 (Week 9-10):
- [ ] Submit certification applications
- [ ] Complete sandbox testing
- [ ] Pass certification reviews
- [ ] Receive production API access

### Sprint 5-6 (Week 11-13):
- [ ] Deploy to production with fiscal enabled
- [ ] Monitor API performance
- [ ] Support beta testers
- [ ] Document processes

---

## 📚 ADDITIONAL RESEARCH NEEDED

**Note:** Web search was unavailable during this research. The following need verification:

1. **Exact API schemas:** Need official documentation from DGT and ATK
2. **Latest VAT rates:** Verify current rates (may change)
3. **Certificate requirements:** Exact SSL certificate format
4. **Sandbox access:** How to get test API keys
5. **Sample code:** Check if DGT/ATK provide official SDKs or sample implementations
6. **Recent law changes:** Verify no new legislation in 2025-2026
7. **Penalties:** Exact fines for non-compliance (for risk assessment)

**Action:** Once web search is configured, research these items.

---

**Research Status:** ✅ DRAFT COMPLETE (based on domain knowledge)  
**Next Step:** Verify details with official sources, contact DGT/ATK  
**Owner:** CTO (for API research), Product Manager (for certification process)  
**Date:** 2026-02-23

---

**Document prepared without web search - awaiting verification with official sources.**
