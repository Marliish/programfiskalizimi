# 📊 Admin Dashboard Design - FiscalNext
**Designer:** Luna  
**Created:** 2026-02-23 (Day 2)  
**Status:** Complete - Ready for Implementation  
**Page:** Main Dashboard (Admin Panel)

---

## 🎯 Design Goals

1. **At-a-glance insights** - See today's performance immediately
2. **Quick actions** - Common tasks 1-2 clicks away
3. **Real-time updates** - Live sales, inventory alerts
4. **Clean & organized** - Not overwhelming despite lots of data
5. **Responsive** - Works on desktop, tablet, mobile

---

## 📐 Overall Layout Structure

### Desktop Layout (1280px+)

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER (Fixed top)                                                 │
├───────┬─────────────────────────────────────────────────────────────┤
│       │                                                             │
│       │              MAIN CONTENT AREA                              │
│ SIDE  │              (Scrollable)                                   │
│ NAV   │                                                             │
│       │  Stats Cards Row                                            │
│ (240px│  Charts & Graphs                                            │
│ fixed)│  Recent Activity                                            │
│       │  Quick Actions                                              │
│       │                                                             │
│       │                                                             │
└───────┴─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Breakdown

### 1. TOP HEADER BAR (Fixed)

**Height:** 64px  
**Background:** White  
**Border bottom:** 1px solid Gray 200  
**Shadow:** xs (0 1px 2px rgba(0,0,0,0.05))  
**Position:** Fixed top, z-index 50

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  [☰] FiscalNext Logo    [Search...]    🔔 [5]  👤 John Doe  ⚙️     │
└─────────────────────────────────────────────────────────────────────┘
    64px   Auto              Flex-1        Auto   Auto        48px
```

**Elements:**

1. **Hamburger Menu (Mobile only)**
   ```
   Size: 48x48px
   Icon: Menu (24x24px)
   Color: Gray 700
   Hover: Background Gray 100
   Shows: < 1024px only
   ```

2. **Logo + Brand**
   ```
   Logo height: 32px
   Text: "FiscalNext"
   Font size: 18px
   Font weight: 700
   Color: Primary 600
   Padding left: 24px (desktop), 16px (mobile)
   ```

3. **Global Search**
   ```
   Width: 400px (desktop), flex-1 (mobile)
   Height: 40px
   Padding: 8px 16px
   Border: 1px solid Gray 300
   Border radius: 6px
   Background: Gray 50
   Placeholder: "Search products, customers, invoices..."
   Icon: Search (20x20px, left side)
   Font size: 14px
   
   Focus:
     Border: Primary 500
     Background: White
     Ring: Primary 500 (2px)
   ```

4. **Notification Bell**
   ```
   Size: 40x40px
   Icon: Bell (20x20px)
   Color: Gray 600
   Hover: Background Gray 100
   Border radius: 6px
   
   Badge (if notifications):
     Position: Top right corner
     Size: 20x20px
     Background: Error 500
     Text: White, 12px, bold
     Border radius: Full (circle)
     Example: "5"
   ```

5. **User Menu Dropdown**
   ```
   Display: Flex, align center, gap 12px
   Padding: 8px 12px
   Border radius: 6px
   Cursor: pointer
   
   Hover: Background Gray 100
   
   Avatar:
     Size: 32x32px
     Border radius: Full (circle)
     Background: Primary 100
     Text: Initials (e.g., "JD")
     Color: Primary 700
     Font size: 14px, bold
   
   Name:
     Font size: 14px
     Font weight: 600
     Color: Gray 900
     Display: Desktop only (hide < 768px)
   
   Chevron Down:
     Size: 16x16px
     Color: Gray 500
   ```

**User Dropdown Menu (On click):**
```
Position: Absolute, right 16px, top 56px
Width: 240px
Background: White
Border: 1px solid Gray 200
Border radius: 8px
Shadow: lg
Padding: 8px
Z-index: 60

Menu Items:
├─ 👤 My Profile
├─ ⚙️ Settings
├─ 🏢 Business Info
├─ ──────────── (Divider)
├─ 📊 Activity Log
├─ 🆘 Help Center
├─ ──────────── (Divider)
└─ 🚪 Logout (Red text)

Each item:
  Height: 40px
  Padding: 8px 12px
  Border radius: 4px
  Font size: 14px
  Icon: 20x20px, left side
  Hover: Background Gray 100
  Active: Background Primary 50
```

---

### 2. SIDEBAR NAVIGATION (Desktop)

**Width:** 240px  
**Background:** White  
**Border right:** 1px solid Gray 200  
**Position:** Fixed left, top 64px (below header)  
**Height:** calc(100vh - 64px)  
**Overflow:** Auto (if menu items overflow)

**Layout:**
```
┌─────────────────────────┐
│                         │
│  📊 Dashboard           │ ← Active (Primary 50 bg)
│  🛒 POS                 │
│  📦 Products            │
│  📋 Inventory           │
│  🧾 Invoices            │
│  👥 Customers           │
│  📈 Reports             │
│  👤 Users               │
│  ⚙️ Settings            │
│                         │
│  ──────────────────     │ ← Divider
│                         │
│  🏢 Locations (2)       │ ← With badge
│  📱 Mobile App          │
│  🆘 Support             │
│                         │
└─────────────────────────┘
```

**Navigation Item:**
```
Height: 44px
Padding: 12px 16px
Display: Flex, align center, gap 12px
Border radius: 6px
Margin: 0 12px 4px 12px
Font size: 14px
Font weight: 500
Color: Gray 700
Cursor: pointer
Transition: All 200ms

Icon:
  Size: 20x20px
  Color: Gray 500

States:
  Default: 
    Background: Transparent
    
  Hover:
    Background: Gray 100
    
  Active:
    Background: Primary 50
    Color: Primary 700
    Icon color: Primary 600
    Font weight: 600
    Border left: 3px solid Primary 500 (inside padding)
    
  Disabled:
    Opacity: 0.5
    Cursor: not-allowed
```

**Badge (for items with notifications):**
```
Example: "Locations (2)"

Badge:
  Display: Inline-flex
  Padding: 2px 8px
  Background: Primary 100
  Color: Primary 700
  Font size: 12px
  Font weight: 600
  Border radius: Full (pill)
  Margin left: Auto
```

**Divider:**
```
Height: 1px
Background: Gray 200
Margin: 12px 16px
```

**Mobile (< 1024px):**
```
Sidebar becomes drawer:
  Position: Fixed
  Width: 280px
  Height: 100vh
  Background: White
  Shadow: 2xl
  Z-index: 70
  Transform: translateX(-100%)
  Transition: Transform 300ms
  
  Open state:
    Transform: translateX(0)
    
  Overlay:
    Position: Fixed
    Top: 0, left: 0, right: 0, bottom: 0
    Background: rgba(0,0,0,0.5)
    Z-index: 60
```

---

### 3. MAIN CONTENT AREA

**Padding:** 24px (desktop), 16px (mobile)  
**Background:** Gray 50  
**Min height:** calc(100vh - 64px)  
**Margin left:** 240px (desktop), 0 (mobile)

---

### 4. STATS CARDS ROW

**Layout:** Grid, 4 columns (desktop), 2 columns (tablet), 1 column (mobile)  
**Gap:** 24px  
**Margin bottom:** 24px

**Individual Stats Card:**
```
Background: White
Padding: 24px
Border radius: 8px
Border: 1px solid Gray 200
Shadow: xs
Transition: Shadow 200ms

Hover:
  Shadow: sm
  Border: Primary 200

Structure:
┌─────────────────────────────┐
│  Icon (circle)   Label      │
│                             │
│  Value (large)              │
│                             │
│  Change indicator           │
└─────────────────────────────┘
```

**Stats Card Specification:**

1. **Icon Container**
   ```
   Size: 48x48px
   Border radius: 12px
   Display: Flex, center
   Float: Right (or flex position)
   
   Background variants:
     - Revenue: Primary 100
     - Transactions: Success 100
     - Products: Warning 100
     - Customers: Purple 100
   
   Icon:
     Size: 24x24px
     Color: Matching (Primary 600, Success 600, etc.)
   ```

2. **Label**
   ```
   Font size: 14px
   Font weight: 500
   Color: Gray 600
   Text transform: Uppercase
   Letter spacing: 0.05em
   Margin bottom: 8px
   ```

3. **Value**
   ```
   Font size: 32px
   Font weight: 800
   Color: Gray 900
   Font family: Monospace (Fira Code)
   Line height: 1
   Margin bottom: 8px
   ```

4. **Change Indicator**
   ```
   Font size: 14px
   Font weight: 600
   Display: Flex, align center, gap 4px
   
   Positive change:
     Color: Success 600
     Icon: ArrowUp (16x16px)
     Text: "↑ 12% from yesterday"
     
   Negative change:
     Color: Error 600
     Icon: ArrowDown (16x16px)
     Text: "↓ 5% from yesterday"
     
   No change:
     Color: Gray 500
     Icon: Minus (16x16px)
     Text: "— No change"
   ```

**Example Stats Cards:**

**Card 1: Today's Revenue**
```
┌───────────────────────────┐
│  TODAY'S REVENUE     💰   │
│                           │
│  €2,847.50                │
│                           │
│  ↑ 12% from yesterday     │
└───────────────────────────┘
Icon: Currency (Primary 600 on Primary 100)
```

**Card 2: Transactions**
```
┌───────────────────────────┐
│  TRANSACTIONS        🛒   │
│                           │
│  156                      │
│                           │
│  ↑ 8% from yesterday      │
└───────────────────────────┘
Icon: ShoppingCart (Success 600 on Success 100)
```

**Card 3: Products Sold**
```
┌───────────────────────────┐
│  PRODUCTS SOLD       📦   │
│                           │
│  342                      │
│                           │
│  ↑ 15% from yesterday     │
└───────────────────────────┘
Icon: Package (Warning 600 on Warning 100)
```

**Card 4: New Customers**
```
┌───────────────────────────┐
│  NEW CUSTOMERS       👥   │
│                           │
│  24                       │
│                           │
│  ↑ 4% from yesterday      │
└───────────────────────────┘
Icon: Users (Purple 600 on Purple 100)
```

---

### 5. CHARTS SECTION

**Layout:** Grid, 2 columns (desktop), 1 column (tablet/mobile)  
**Gap:** 24px  
**Margin bottom:** 24px

**Chart Card:**
```
Background: White
Padding: 24px
Border radius: 8px
Border: 1px solid Gray 200
Shadow: xs
```

**Chart 1: Revenue Chart (Left, Larger)**
```
Grid span: 2 (desktop), 1 (tablet/mobile)

Header:
┌─────────────────────────────────────────────┐
│  Revenue Overview    [Day][Week][Month]     │
└─────────────────────────────────────────────┘

Title:
  Font size: 18px
  Font weight: 700
  Color: Gray 900
  
Tabs (Period selector):
  Display: Inline-flex
  Gap: 4px
  
  Tab:
    Padding: 6px 12px
    Border radius: 6px
    Font size: 14px
    Font weight: 500
    
    Inactive:
      Background: Transparent
      Color: Gray 600
      Hover: Background Gray 100
      
    Active:
      Background: Primary 500
      Color: White

Chart:
  Type: Line chart (smooth curves)
  Height: 300px
  Colors: Primary 500 (main line), Primary 100 (gradient fill)
  Grid: Gray 200 (subtle horizontal lines)
  Labels: Gray 600, 12px
  Tooltip: White card, shadow md, padding 12px
```

**Chart 2: Sales by Category (Right, Top)**
```
Header:
  Sales by Category
  
Chart:
  Type: Donut chart
  Height: 200px
  Colors: Primary, Success, Warning, Error, Purple (5 categories)
  
Legend:
  Position: Right side or below
  Font size: 14px
  Color squares: 12x12px, border radius 2px
  Gap: 12px
```

**Chart 3: Top Products (Right, Bottom)**
```
Header:
  Top Selling Products
  
List:
  Max items: 5
  Each item:
    Display: Flex, justify space-between
    Padding: 12px 0
    Border bottom: 1px solid Gray 200
    
    Left:
      Product name (14px, semibold, Gray 900)
      Quantity (12px, regular, Gray 600)
      
    Right:
      Revenue (14px, bold, Gray 900, monospace)
```

---

### 6. RECENT ACTIVITY SECTION

**Layout:** 1 column, full width  
**Margin bottom:** 24px

**Activity Card:**
```
Background: White
Padding: 24px
Border radius: 8px
Border: 1px solid Gray 200
Shadow: xs

Header:
┌────────────────────────────────────────────┐
│  Recent Activity         View All →        │
└────────────────────────────────────────────┘

Title: 18px, bold, Gray 900
Link: 14px, semibold, Primary 500
```

**Activity Item:**
```
Display: Flex, gap 16px, align start
Padding: 16px 0
Border bottom: 1px solid Gray 200

Structure:
┌─────────────────────────────────────────────┐
│  [Icon]  Event description     Time ago     │
│          Secondary info                     │
└─────────────────────────────────────────────┘

Icon:
  Size: 40x40px
  Border radius: 8px
  Display: Flex, center
  
  Variants:
    - Sale: Success 100 bg, ShoppingCart Success 600
    - Inventory: Warning 100 bg, Package Warning 600
    - User: Primary 100 bg, User Primary 600
    - Error: Error 100 bg, AlertCircle Error 600

Text:
  Description: 14px, regular, Gray 900
  Secondary: 14px, regular, Gray 600
  
Time:
  Font size: 14px
  Color: Gray 500
  Margin left: Auto
  Examples: "2 min ago", "1 hour ago", "Yesterday"
```

**Example Activity Items:**

```
🛒  New sale completed             2 min ago
    Invoice #1234 - €45.50

📦  Low stock alert                5 min ago
    Product "Coffee Beans" - 12 units left

👤  New customer registered        15 min ago
    John Doe - [email protected]

🧾  Fiscal receipt sent            1 hour ago
    Invoice #1233 - Albania Tax Authority
```

---

### 7. QUICK ACTIONS SECTION

**Layout:** Grid, 3 columns (desktop), 2 columns (tablet), 1 column (mobile)  
**Gap:** 16px  
**Margin bottom:** 24px

**Quick Action Card:**
```
Background: White
Padding: 20px
Border: 2px solid Gray 200
Border radius: 8px
Cursor: pointer
Transition: All 200ms

Display: Flex, flex-direction column, align center
Text align: Center
Gap: 12px

Hover:
  Border color: Primary 500
  Background: Primary 50
  Transform: translateY(-2px)
  Shadow: sm

Icon:
  Size: 32x32px
  Color: Primary 600
  
Title:
  Font size: 14px
  Font weight: 600
  Color: Gray 900
  
Description:
  Font size: 12px
  Color: Gray 600
```

**Example Quick Actions:**

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   🛒        │  │   📦         │  │   👥         │
│             │  │              │  │              │
│  New Sale   │  │  Add Product │  │  Add Customer│
│             │  │              │  │              │
│  Start POS  │  │  To inventory│  │  Register new│
└──────────────┘  └──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   📊        │  │   ⚙️         │  │   📱         │
│             │  │              │  │              │
│  Reports    │  │  Settings    │  │  Mobile App  │
│             │  │              │  │              │
│  View all   │  │  Configure   │  │  Download    │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 📱 Responsive Breakpoints

### Desktop (1280px+)
```
- Sidebar: Fixed 240px width
- Stats: 4 columns
- Charts: 2 columns
- Quick actions: 3 columns
- Content padding: 24px
```

### Tablet (768px - 1279px)
```
- Sidebar: Drawer (hidden by default)
- Stats: 2 columns
- Charts: 1 column
- Quick actions: 2 columns
- Content padding: 20px
```

### Mobile (< 768px)
```
- Sidebar: Drawer (hidden by default)
- Stats: 1 column
- Charts: 1 column (smaller)
- Quick actions: 1 column
- Content padding: 16px
- Hide user name in header
- Smaller chart heights
```

---

## 🎨 Color Usage

**Background Colors:**
- Page background: Gray 50
- Card backgrounds: White
- Sidebar: White
- Header: White

**Border Colors:**
- Default borders: Gray 200
- Hover borders: Primary 500
- Dividers: Gray 200

**Text Colors:**
- Primary text: Gray 900
- Secondary text: Gray 600
- Labels: Gray 500
- Links: Primary 500

**Accent Colors:**
- Primary actions: Primary 500
- Success indicators: Success 600
- Warnings: Warning 600
- Errors: Error 600

---

## ⚡ Interactive States

### Cards
```
Default:
  Shadow: xs
  Border: Gray 200
  
Hover:
  Shadow: sm
  Border: Gray 300
  Transform: translateY(-2px)
  Transition: 200ms
```

### Navigation Items
```
Default: Gray 700
Hover: Gray 100 background
Active: Primary 50 background, Primary 700 text
```

### Quick Action Cards
```
Default: Gray 200 border
Hover: Primary 500 border, Primary 50 background
```

---

## ♿ Accessibility

**Keyboard Navigation:**
- Tab through all interactive elements
- Focus indicators (3px Primary 500 ring)
- Escape closes dropdowns/drawers
- Arrow keys navigate menu items

**Screen Reader:**
- Semantic HTML (nav, main, aside)
- ARIA labels on icons
- Live region for notifications
- Role="region" for major sections

**Color Contrast:**
- All text passes WCAG AA (4.5:1+)
- Icon colors pass 3:1
- Interactive elements clearly identifiable

---

## 🔧 Implementation Notes

### Tech Stack
- **Framework:** Next.js 14+
- **Styling:** Tailwind CSS
- **Charts:** Recharts or Chart.js
- **Icons:** Lucide Icons
- **State:** Zustand or Redux Toolkit

### Component Structure
```typescript
components/
  dashboard/
    DashboardLayout.tsx         // Main layout with sidebar
    Header.tsx                  // Top header bar
    Sidebar.tsx                 // Left navigation
    StatsCard.tsx              // Reusable stats card
    RevenueChart.tsx           // Revenue line chart
    CategoryChart.tsx          // Donut chart
    TopProducts.tsx            // Top products list
    ActivityFeed.tsx           // Recent activity
    QuickActions.tsx           // Quick action cards
```

### Sample Data Structure
```typescript
interface DashboardStats {
  revenue: {
    value: number
    change: number
    changeType: 'increase' | 'decrease' | 'neutral'
  }
  transactions: {
    value: number
    change: number
    changeType: 'increase' | 'decrease' | 'neutral'
  }
  productsSold: {
    value: number
    change: number
    changeType: 'increase' | 'decrease' | 'neutral'
  }
  newCustomers: {
    value: number
    change: number
    changeType: 'increase' | 'decrease' | 'neutral'
  }
}

interface RevenueDataPoint {
  date: string
  revenue: number
}

interface ActivityItem {
  id: string
  type: 'sale' | 'inventory' | 'user' | 'error'
  title: string
  description: string
  timestamp: Date
}
```

---

## ✅ Design Checklist

Before implementation:
- [x] Layout structure defined
- [x] All components specified
- [x] Responsive breakpoints defined
- [x] Color usage documented
- [x] Interactive states specified
- [x] Accessibility considered
- [x] Component structure planned
- [x] Data structures defined

---

## 📊 Performance Considerations

- **Lazy load charts** (render only when visible)
- **Debounce search input** (300ms)
- **Virtual scroll** for long activity feeds
- **Optimize images** (lazy load, WebP)
- **Cache dashboard data** (5 minute TTL)
- **Skeleton loaders** while fetching data

---

**Status:** ✅ **Complete - Ready for Implementation**

**Designer:** Luna  
**Date:** 2026-02-23  
**For:** Elena (Frontend Developer) - Start implementing! 🚀

---

**Next:** POS Interface Main Screen design coming right now! 🛒
