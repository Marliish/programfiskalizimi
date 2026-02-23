# 📋 SPRINT 2 USER STORIES
## Products & Inventory Management

**Sprint Duration:** Weeks 5-6 (2 weeks)  
**Focus:** Product catalog, categories, basic inventory tracking  
**Team Velocity Target:** 55 story points  
**Created by:** Klea (Product Manager)  
**Date:** 2026-02-23

---

## 🎯 SPRINT GOALS

1. ✅ Complete product catalog management (CRUD operations)
2. ✅ Implement category management
3. ✅ Build inventory tracking system
4. ✅ Enable barcode support
5. ✅ Create low stock alert system
6. ✅ Basic inventory reports

---

## 📊 STORY BREAKDOWN

### EPIC 1: Product Catalog Management

#### Story 1.1: Database Schema for Products
**As a** developer  
**I want** a well-designed product schema  
**So that** product data is stored efficiently

**Acceptance Criteria:**
- [ ] Create database tables:
  - **products** table:
    - id (UUID, primary key)
    - business_id (FK to businesses)
    - location_id (FK to locations)
    - category_id (FK to categories, nullable)
    - name (string, required, 3-200 chars)
    - description (text, optional)
    - sku (string, unique per business, optional)
    - barcode (string, optional, can have multiple)
    - cost_price (decimal, required, ≥0)
    - selling_price (decimal, required, ≥0)
    - tax_rate (decimal, required, 0-100)
    - stock_quantity (integer, default 0)
    - low_stock_threshold (integer, default 10)
    - unit_of_measure (enum: pieces, kg, liters, etc.)
    - image_url (string, optional)
    - status (enum: active, inactive, discontinued)
    - created_at, updated_at, deleted_at (timestamps)
  
  - **product_barcodes** table (one-to-many):
    - id, product_id, barcode, created_at
  
  - **categories** table:
    - id, business_id, name, description, parent_id (for subcategories), icon, color, created_at

  - **stock_movements** table (audit trail):
    - id, product_id, user_id, type (sale, adjustment, return), quantity_change, reason, timestamp

- [ ] Define relationships and foreign keys
- [ ] Add indexes (business_id, sku, barcode, category_id)
- [ ] Add constraints (unique SKU per business)
- [ ] Create Prisma migration
- [ ] Seed sample data (5 categories, 20 products)

**Technical Notes:**
- Use soft deletes (deleted_at) for products
- Stock quantity can be negative (backorders)
- Support multiple barcodes per product

**Priority:** P0 (Critical)  
**Story Points:** 5  
**Assigned to:** Backend  
**Dependencies:** None

---

#### Story 1.2: Add Product
**As a** business owner or manager  
**I want to** add new products to my catalog  
**So that** I can sell them in my POS

**Acceptance Criteria:**
- [ ] "Add Product" button on products page
- [ ] Add product form with fields:
  - Product name (required, autocomplete suggestions)
  - Category (dropdown, can create new)
  - SKU (optional, auto-generate option)
  - Barcode (optional, can scan or type)
  - Cost price (required, currency format)
  - Selling price (required, currency format, must be ≥ cost price)
  - Tax rate (dropdown: 0%, 6%, 10%, 18%, 20%, custom)
  - Initial stock quantity (default: 0)
  - Low stock threshold (default: 10)
  - Unit of measure (dropdown: pieces, kg, liters, etc.)
  - Description (optional, rich text)
  - Product image (upload, max 2MB, jpg/png)
- [ ] Form validation:
  - Name required (3-200 chars)
  - Selling price ≥ cost price (warning if lower)
  - Barcode unique check (across all products)
  - SKU unique check (per business)
  - Image validation (size, format)
- [ ] Auto-generate SKU option (e.g., "PROD-001")
- [ ] Image upload:
  - Preview before upload
  - Crop/resize tool
  - Auto-compress to max 500KB
  - Generate thumbnail
- [ ] Click "Add Barcode" to add multiple barcodes
- [ ] Click "Save" → product created
- [ ] Success message: "Product added successfully!"
- [ ] Redirect to product list or stay on form (optional)
- [ ] Quick add mode (minimal fields, expand for full form)

**API Endpoint:**
- `POST /api/products`

**Priority:** P0 (Critical)  
**Story Points:** 8  
**Assigned to:** Backend + Frontend  
**Dependencies:** Story 1.1

---

#### Story 1.3: View Product List
**As a** user  
**I want to** see all products in my catalog  
**So that** I can browse and manage them

**Acceptance Criteria:**
- [ ] Products list page shows all products
- [ ] Table view columns:
  - Product image (thumbnail)
  - Name
  - SKU
  - Category
  - Stock quantity (color-coded: green if > threshold, yellow if low, red if 0)
  - Selling price
  - Status (active/inactive badge)
  - Actions (edit, delete)
- [ ] Search products by:
  - Name
  - SKU
  - Barcode
- [ ] Filter products by:
  - Category (dropdown)
  - Status (active/inactive)
  - Stock level (in stock, low stock, out of stock)
- [ ] Sort by:
  - Name (A-Z, Z-A)
  - Price (low to high, high to low)
  - Stock (low to high, high to low)
  - Date added (newest first, oldest first)
- [ ] Pagination (50 products per page)
- [ ] Grid view toggle (switch between table and grid)
- [ ] Empty state: "No products yet. Add your first product!"
- [ ] Bulk actions:
  - Select multiple products
  - Bulk delete (with confirmation)
  - Bulk status change (activate/deactivate)
  - Bulk category change

**API Endpoint:**
- `GET /api/products?search=&category=&status=&page=1&limit=50`

**Priority:** P0 (Critical)  
**Story Points:** 5  
**Assigned to:** Frontend + Backend  
**Dependencies:** Story 1.2

---

#### Story 1.4: Edit Product
**As a** user  
**I want to** update product details  
**So that** I can correct errors or change pricing

**Acceptance Criteria:**
- [ ] Click "Edit" on product → edit form
- [ ] Pre-fill form with current product data
- [ ] Allow editing all fields (same as add form)
- [ ] Show current image with "Change" button
- [ ] Show stock movement history (read-only)
- [ ] Validation (same as add product)
- [ ] Click "Save" → product updated
- [ ] Success message: "Product updated successfully!"
- [ ] If selling price changed, show confirmation:
  - "Warning: Price changed from €X to €Y. This will apply to new sales only."
- [ ] Track price history (for audit):
  - Create `product_price_history` table
  - Log: old_price, new_price, changed_by, changed_at
- [ ] Cannot change SKU if product has transactions (security)

**API Endpoint:**
- `PUT /api/products/:id`

**Priority:** P0 (Critical)  
**Story Points:** 5  
**Assigned to:** Backend + Frontend  
**Dependencies:** Story 1.3

---

#### Story 1.5: Delete Product
**As a** user  
**I want to** remove products I no longer sell  
**So that** my catalog stays clean

**Acceptance Criteria:**
- [ ] Click "Delete" on product → confirmation dialog
- [ ] Dialog message: "Are you sure you want to delete '[Product Name]'?"
- [ ] If product has sales history:
  - Warning: "This product has [X] sales. Deleting will archive it (data preserved)."
  - Two options:
    - "Archive" (soft delete, keep data)
    - "Delete permanently" (hard delete, only if no sales)
- [ ] If product never sold:
  - Only "Delete permanently" option
- [ ] Click "Delete" → product deleted (or archived)
- [ ] Success message: "Product deleted" or "Product archived"
- [ ] Undo option (restore within 30 seconds)
- [ ] Archived products shown in separate "Archived" tab
- [ ] Can restore archived products

**API Endpoints:**
- `DELETE /api/products/:id` (soft delete)
- `DELETE /api/products/:id?hard=true` (hard delete, admin only)

**Priority:** P1 (High)  
**Story Points:** 3  
**Assigned to:** Backend + Frontend  
**Dependencies:** Story 1.3

---

#### Story 1.6: View Product Details
**As a** user  
**I want to** view complete product information  
**So that** I can see everything about a product

**Acceptance Criteria:**
- [ ] Click product name → product detail page
- [ ] Display sections:
  - **Product Info:**
    - Large image
    - Name, SKU, barcode(s)
    - Category
    - Description
    - Status badge
  - **Pricing:**
    - Cost price
    - Selling price
    - Tax rate
    - Profit margin (selling - cost)
  - **Inventory:**
    - Current stock quantity
    - Low stock threshold
    - Stock status (in stock, low, out of stock)
    - Unit of measure
  - **History:**
    - Stock movements (last 30 days)
    - Price changes
    - Created date, last updated
  - **Sales Stats:**
    - Total sold (all time)
    - Total revenue
    - Last sold date
- [ ] "Edit" button (top right)
- [ ] "Delete" button
- [ ] "Print Barcode" button (generate barcode label PDF)
- [ ] Breadcrumb navigation: Products > [Category] > [Product Name]

**API Endpoint:**
- `GET /api/products/:id`

**Priority:** P1 (High)  
**Story Points:** 5  
**Assigned to:** Frontend + Backend  
**Dependencies:** Story 1.3

---

### EPIC 2: Category Management

#### Story 2.1: Create Categories
**As a** user  
**I want to** organize products into categories  
**So that** I can find products easily

**Acceptance Criteria:**
- [ ] Categories page (under Products menu)
- [ ] "Add Category" button
- [ ] Add category form:
  - Category name (required, 3-50 chars)
  - Description (optional)
  - Parent category (dropdown, for subcategories)
  - Icon (choose from icon library or upload)
  - Color (color picker, for badges)
- [ ] Category list view:
  - Name, icon, color, product count
  - Hierarchical view (parent → children)
  - Expand/collapse subcategories
- [ ] Drag-and-drop to reorder categories
- [ ] Edit category (inline or modal)
- [ ] Delete category:
  - If has products → warning: "Move [X] products to another category first"
  - If no products → delete immediately

**API Endpoints:**
- `POST /api/categories`
- `GET /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

**Priority:** P0 (Critical)  
**Story Points:** 5  
**Assigned to:** Backend + Frontend  
**Dependencies:** Story 1.1

---

#### Story 2.2: Assign Products to Categories
**As a** user  
**I want to** assign products to categories  
**So that** products are organized

**Acceptance Criteria:**
- [ ] Category field in add/edit product form (dropdown)
- [ ] Can create new category inline (from dropdown)
- [ ] Can change product category from product list (bulk action)
- [ ] Filter products by category (product list)
- [ ] Category badge on product cards
- [ ] Uncategorized products shown in "Uncategorized" section

**Priority:** P0 (Critical)  
**Story Points:** 3  
**Assigned to:** Frontend  
**Dependencies:** Story 2.1, Story 1.2

---

### EPIC 3: Barcode Support

#### Story 3.1: Generate Barcodes
**As a** user  
**I want to** generate barcodes for products  
**So that** I can print labels and scan them

**Acceptance Criteria:**
- [ ] Auto-generate barcode option (when adding product):
  - Use EAN-13 format (13 digits)
  - Or Code 128 (alphanumeric)
  - Check uniqueness before assigning
- [ ] Manual barcode entry (user types barcode)
- [ ] Multiple barcodes per product:
  - Add barcode button (add additional barcode)
  - Different barcodes for different sizes/packs
- [ ] "Print Barcode" button:
  - Generate PDF with barcode labels
  - Label format: 40mm x 30mm (standard thermal label)
  - Includes: barcode image, product name, price
  - Print multiple copies (quantity selector)
- [ ] Barcode validation:
  - Check format (valid EAN-13, Code 128)
  - Check uniqueness (across all products in business)

**API Endpoints:**
- `POST /api/products/:id/barcodes`
- `GET /api/products/:id/barcode-label` (PDF generation)

**Priority:** P1 (High)  
**Story Points:** 5  
**Assigned to:** Backend + Frontend  
**Dependencies:** Story 1.2

---

#### Story 3.2: Barcode Scanning (Web)
**As a** user  
**I want to** search products by scanning barcodes  
**So that** I can quickly find products

**Acceptance Criteria:**
- [ ] Barcode scan field on product list page (top right)
- [ ] Focus on field (keyboard shortcut: Ctrl+B)
- [ ] Scan barcode (USB scanner) → search automatically
- [ ] If product found → highlight in list or open detail view
- [ ] If not found → message: "Product with barcode [XXX] not found. Add product?"
- [ ] Quick add flow (from barcode scan):
  - Pre-fill barcode in add form
  - Auto-fetch product info from external API (optional, e.g., EAN database)

**Priority:** P1 (High)  
**Story Points:** 3  
**Assigned to:** Frontend  
**Dependencies:** Story 3.1

---

### EPIC 4: Inventory Tracking

#### Story 4.1: Real-Time Stock Tracking
**As a** system  
**I want to** track stock levels in real-time  
**So that** inventory is always accurate

**Acceptance Criteria:**
- [ ] Stock quantity field in products table
- [ ] Automatic stock reduction on sale:
  - When transaction completed → reduce stock by quantity sold
  - Update `stock_movements` table (type: "sale", quantity: -X)
- [ ] Automatic stock increase on return:
  - When return processed → increase stock by quantity returned
  - Update `stock_movements` table (type: "return", quantity: +X)
- [ ] Stock displayed in product list (real-time)
- [ ] Stock status indicator:
  - Green: Stock > low_stock_threshold
  - Yellow: Stock ≤ low_stock_threshold AND Stock > 0
  - Red: Stock = 0 (out of stock)
- [ ] Cannot sell if stock = 0 (configurable):
  - Option 1: Block sale (default)
  - Option 2: Allow backorders (negative stock)

**Technical Notes:**
- Use database transactions to prevent race conditions
- Lock row when updating stock

**Priority:** P0 (Critical)  
**Story Points:** 5  
**Assigned to:** Backend  
**Dependencies:** Story 1.1

---

#### Story 4.2: Manual Stock Adjustments
**As a** user  
**I want to** manually adjust stock levels  
**So that** I can correct inventory errors

**Acceptance Criteria:**
- [ ] "Adjust Stock" button on product detail page
- [ ] Stock adjustment modal:
  - Current stock quantity (read-only)
  - Adjustment type (dropdown):
    - Add stock (increase)
    - Remove stock (decrease)
    - Set to specific amount
  - Quantity (number input)
  - Reason (dropdown):
    - Received shipment
    - Damaged
    - Theft/loss
    - Recount/inventory audit
    - Other (with text field)
  - Notes (optional, text area)
- [ ] Preview new stock level: "New stock will be: [X]"
- [ ] Click "Save" → stock updated
- [ ] Log adjustment in `stock_movements` table:
  - type: "adjustment"
  - quantity_change: +X or -X
  - reason: selected reason
  - notes: user notes
  - user_id: who made adjustment
  - timestamp
- [ ] Success message: "Stock adjusted successfully. New stock: [X]"
- [ ] Show adjustment in stock history

**API Endpoint:**
- `POST /api/products/:id/stock-adjustment`

**Priority:** P0 (Critical)  
**Story Points:** 5  
**Assigned to:** Backend + Frontend  
**Dependencies:** Story 4.1

---

#### Story 4.3: Low Stock Alerts
**As a** user  
**I want to** receive alerts when stock is low  
**So that** I can reorder before running out

**Acceptance Criteria:**
- [ ] Low stock threshold field (per product, default: 10)
- [ ] Visual alerts:
  - Product list: Yellow/red stock badge
  - Dashboard widget: "Low Stock Alerts" (count + list)
  - Product detail: Warning message at top
- [ ] Low stock report:
  - List all products below threshold
  - Columns: Product, current stock, threshold, suggested reorder quantity
  - Export to Excel/PDF
  - Print option
- [ ] Notifications (optional for Sprint 2):
  - Email notification when product goes low (once per day)
  - Push notification on mobile app
  - Configurable: Enable/disable, recipients

**API Endpoint:**
- `GET /api/products/low-stock`

**Priority:** P1 (High)  
**Story Points:** 5  
**Assigned to:** Frontend + Backend  
**Dependencies:** Story 4.1

---

#### Story 4.4: Stock Movement History
**As a** user  
**I want to** see all stock changes for a product  
**So that** I can audit inventory

**Acceptance Criteria:**
- [ ] Stock history section on product detail page
- [ ] Table with columns:
  - Date/time
  - Type (sale, return, adjustment)
  - Quantity change (+X or -X)
  - New stock level
  - Reason (for adjustments)
  - User (who made the change)
- [ ] Filter by:
  - Date range
  - Type (all, sales, returns, adjustments)
- [ ] Export stock history to Excel
- [ ] Pagination (50 entries per page)
- [ ] Show summary:
  - Total sales (quantity)
  - Total returns
  - Total adjustments (+/-)
  - Net change

**API Endpoint:**
- `GET /api/products/:id/stock-movements?from=&to=&type=`

**Priority:** P1 (High)  
**Story Points:** 5  
**Assigned to:** Frontend + Backend  
**Dependencies:** Story 4.1

---

### EPIC 5: Inventory Reports

#### Story 5.1: Current Stock Levels Report
**As a** user  
**I want to** view current stock for all products  
**So that** I know what's in my inventory

**Acceptance Criteria:**
- [ ] "Inventory Report" page (under Reports menu)
- [ ] Current stock report showing all products:
  - Product name, SKU, category
  - Stock quantity
  - Stock value (quantity × cost_price)
  - Status (in stock, low, out of stock)
- [ ] Summary cards at top:
  - Total products
  - Total stock value
  - In stock products (count)
  - Low stock products (count)
  - Out of stock products (count)
- [ ] Filter by category
- [ ] Sort by stock (low to high, high to low)
- [ ] Export to Excel (.xlsx)
- [ ] Export to PDF (printable)
- [ ] Print option

**API Endpoint:**
- `GET /api/reports/inventory/current-stock`

**Priority:** P1 (High)  
**Story Points:** 5  
**Assigned to:** Backend + Frontend  
**Dependencies:** Story 4.1

---

#### Story 5.2: Inventory Valuation Report
**As a** user  
**I want to** know the total value of my inventory  
**So that** I can understand my asset worth

**Acceptance Criteria:**
- [ ] Inventory valuation report page
- [ ] Calculate total inventory value:
  - Method: Current stock × cost_price (per product)
  - Total: Sum of all products
- [ ] Breakdown by category:
  - Category name
  - Products count
  - Total value
  - Percentage of total inventory value
- [ ] Breakdown by product (top 20 by value):
  - Product name
  - Stock quantity
  - Cost price
  - Total value
- [ ] Display as:
  - Table
  - Pie chart (by category)
- [ ] Date snapshot (show inventory value as of specific date)
- [ ] Export to Excel/PDF

**API Endpoint:**
- `GET /api/reports/inventory/valuation?date=`

**Priority:** P2 (Nice to have)  
**Story Points:** 5  
**Assigned to:** Backend + Frontend  
**Dependencies:** Story 4.1

---

## 📈 SPRINT METRICS

### Velocity Calculation
- **Total Story Points:** 72 points
- **Team Capacity (2 weeks):** 55 points (realistic)
- **Recommendation:** Prioritize P0 and P1 stories (67 points)
- **P2 Stories (Defer if needed):** Inventory Valuation Report (5 pts)

### Core Stories (P0 + P1): 67 points
- Database schema (5 pts)
- Add/edit/view/delete products (21 pts)
- Categories (8 pts)
- Barcode support (8 pts)
- Inventory tracking (15 pts)
- Stock alerts & history (10 pts)

### Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests written and passing
- [ ] API documented
- [ ] UI matches design mockups
- [ ] Responsive on mobile/tablet/desktop
- [ ] Barcode scanning tested with real scanner
- [ ] Stock calculations verified
- [ ] No critical bugs
- [ ] Deployed to staging

---

## 🎯 SUCCESS CRITERIA

Sprint 2 is successful if:
1. ✅ Users can add, edit, and delete products
2. ✅ Products organized by categories
3. ✅ Barcode generation and scanning works
4. ✅ Stock levels update automatically on sales
5. ✅ Manual stock adjustments work
6. ✅ Low stock alerts visible
7. ✅ Stock history tracked
8. ✅ Basic inventory reports available

---

## 🚧 DEPENDENCIES & BLOCKERS

### External Dependencies:
- **Barcode scanner hardware:** Need USB barcode scanner for testing (Order Week 4)
- **Barcode generation library:** Use `jsbarcode` or `bwip-js` (research Day 1 of sprint)
- **Image upload service:** Use cloud storage (AWS S3 or Cloudinary) or local storage

### Internal Dependencies:
- Sprint 2 depends on Sprint 1 completion (auth, database setup)
- Mobile app barcode scanner depends on product schema (Story 1.1)

---

## 📅 SPRINT SCHEDULE

**Week 5:**
- Day 1-2: Database schema, product CRUD APIs
- Day 3-5: Product UI (add/edit/view/list)

**Week 6:**
- Day 1-2: Categories, barcode support
- Day 3-4: Inventory tracking, stock adjustments
- Day 5: Low stock alerts, reports, testing

**Sprint Review:** End of Week 6, Friday 4:00 PM  
**Sprint Retrospective:** Friday 5:00 PM

---

## 🎨 DESIGN DELIVERABLES

**Needed from Designer (before Sprint 2 starts):**
- [ ] Product list view (table + grid)
- [ ] Add/edit product form
- [ ] Product detail page
- [ ] Category management UI
- [ ] Stock adjustment modal
- [ ] Low stock alerts widget
- [ ] Inventory reports layout
- [ ] Barcode label template (PDF)

---

## 📱 MOBILE APP (PARALLEL WORK)

**Mobile features for Sprint 2:**
- [ ] Product list (optimized for small screen)
- [ ] Add product (simplified form)
- [ ] Barcode scanner (camera-based)
- [ ] Stock adjustment (quick form)

---

**Document Status:** ✅ READY FOR SPRINT 2  
**Next Step:** Design review, Sprint 2 kickoff  
**Created:** 2026-02-23 by Klea (Product Manager)
