# 🎨 FiscalNext Design System - Complete Guide
**Version:** 1.0  
**Created:** 2026-02-23  
**Designer:** Luna  
**Status:** Foundation - Ready for Implementation

---

## 🎯 Design Principles

### Our Design Philosophy
1. **Professional & Trustworthy** - This is financial software; users must feel confident
2. **Speed & Efficiency** - Cashiers need to complete transactions quickly
3. **Clarity Over Complexity** - Every element has a purpose
4. **Accessible to All** - Works for tech-savvy and non-tech users
5. **Beautiful, Not Flashy** - Modern and clean, not distracting

### Design Goals
- **3 seconds or less** to complete a sale
- **Zero training** for basic POS operations
- **Touch-first** design (works on tablets/phones)
- **Readable from 1 meter away** (for POS screens)
- **Works in bright sunlight** (high contrast)

---

## 🎨 Color System

### Primary Brand Colors

**Blue Family** (Trust, Security, Professional)
```
Primary 50:  #EFF6FF  // Backgrounds, subtle highlights
Primary 100: #DBEAFE  // Hover states, light backgrounds
Primary 200: #BFDBFE  // Disabled states
Primary 300: #93C5FD  // Borders, dividers
Primary 400: #60A5FA  // Secondary actions
Primary 500: #3B82F6  // PRIMARY - Main brand color
Primary 600: #2563EB  // Hover states for primary
Primary 700: #1D4ED8  // Active states
Primary 800: #1E40AF  // Dark mode primary
Primary 900: #1E3A8A  // Very dark, high contrast
```

**Usage:**
- Buttons, links, active states: Primary 500
- Hover: Primary 600
- Focus rings: Primary 500 with 20% opacity
- Backgrounds: Primary 50
- Dark mode: Primary 400

### Secondary Colors

**Green** (Success, Money, Positive)
```
Success 50:  #ECFDF5
Success 100: #D1FAE5
Success 200: #A7F3D0
Success 300: #6EE7B7
Success 400: #34D399
Success 500: #10B981  // Success actions
Success 600: #059669
Success 700: #047857
Success 800: #065F46
Success 900: #064E3B
```

**Usage:**
- Payment complete
- Stock available
- Positive metrics
- Success messages

**Orange/Yellow** (Warning, Attention)
```
Warning 50:  #FFFBEB
Warning 100: #FEF3C7
Warning 200: #FDE68A
Warning 300: #FCD34D
Warning 400: #FBBF24
Warning 500: #F59E0B  // Warning states
Warning 600: #D97706
Warning 700: #B45309
Warning 800: #92400E
Warning 900: #78350F
```

**Usage:**
- Low stock alerts
- Pending actions
- Caution messages
- Items that need attention

**Red** (Error, Danger, Critical)
```
Error 50:  #FEF2F2
Error 100: #FEE2E2
Error 200: #FECACA
Error 300: #FCA5A5
Error 400: #F87171
Error 500: #EF4444  // Error states
Error 600: #DC2626
Error 700: #B91C1C
Error 800: #991B1B
Error 900: #7F1D1D
```

**Usage:**
- Error messages
- Delete actions
- Out of stock
- Critical alerts
- Void transactions

### Neutral Colors (Grays)

**Gray Scale** (Text, Backgrounds, Borders)
```
Gray 50:  #F9FAFB  // Page backgrounds
Gray 100: #F3F4F6  // Card backgrounds, subtle borders
Gray 200: #E5E7EB  // Borders, dividers
Gray 300: #D1D5DB  // Input borders, disabled text
Gray 400: #9CA3AF  // Placeholder text
Gray 500: #6B7280  // Secondary text
Gray 600: #4B5563  // Body text
Gray 700: #374151  // Headings
Gray 800: #1F2937  // Dark headings
Gray 900: #111827  // Primary text, very dark mode
```

**Usage:**
- Text: Gray 900 (primary), Gray 600 (secondary), Gray 400 (disabled)
- Backgrounds: White (main), Gray 50 (subtle), Gray 100 (cards)
- Borders: Gray 200 (standard), Gray 300 (inputs)

### Semantic Colors

**Info** (Blue)
```
Info: #3B82F6 (same as Primary 500)
Info Light: #DBEAFE
```

**Purple** (Premium, Special features)
```
Purple 500: #8B5CF6
Purple 600: #7C3AED
```
**Usage:** Premium features, AI insights, special offers

---

## 📝 Typography

### Font Families

**Primary Font: Inter**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Helvetica Neue', Arial, sans-serif;
```
**Why Inter?**
- Designed for screens
- Excellent readability
- Professional and modern
- Free and open-source
- Variable font (efficient)

**Monospace Font: Fira Code** (for numbers, receipts, codes)
```css
font-family: 'Fira Code', 'SF Mono', Monaco, 'Cascadia Code', 
             'Roboto Mono', monospace;
```

### Font Sizes & Hierarchy

```
// Display (Large headers, hero text)
Display XL: 4.5rem (72px) - Line height: 1.1 - Weight: 800
Display LG: 3.75rem (60px) - Line height: 1.1 - Weight: 800
Display MD: 3rem (48px) - Line height: 1.2 - Weight: 700

// Headings
H1: 2.25rem (36px) - Line height: 1.25 - Weight: 700
H2: 1.875rem (30px) - Line height: 1.3 - Weight: 700
H3: 1.5rem (24px) - Line height: 1.4 - Weight: 600
H4: 1.25rem (20px) - Line height: 1.5 - Weight: 600
H5: 1.125rem (18px) - Line height: 1.5 - Weight: 600
H6: 1rem (16px) - Line height: 1.5 - Weight: 600

// Body Text
Body XL: 1.25rem (20px) - Line height: 1.7 - Weight: 400
Body LG: 1.125rem (18px) - Line height: 1.6 - Weight: 400
Body MD: 1rem (16px) - Line height: 1.6 - Weight: 400 [DEFAULT]
Body SM: 0.875rem (14px) - Line height: 1.5 - Weight: 400
Body XS: 0.75rem (12px) - Line height: 1.5 - Weight: 400

// Special
Caption: 0.875rem (14px) - Line height: 1.4 - Weight: 500
Overline: 0.75rem (12px) - Line height: 1.2 - Weight: 600 - Uppercase
Button: 0.875rem (14px) - Line height: 1.5 - Weight: 600

// POS Specific (Larger for touch screens)
POS Product Name: 1.125rem (18px) - Weight: 600
POS Price: 1.5rem (24px) - Weight: 700 - Mono font
POS Total: 2.25rem (36px) - Weight: 800 - Mono font
```

### Font Weights

```
Thin: 100       // Rarely used
Light: 300      // Subtle text
Regular: 400    // Body text [DEFAULT]
Medium: 500     // Emphasis
Semibold: 600   // Headings, buttons
Bold: 700       // Strong headings
Extrabold: 800  // Display text
Black: 900      // Rarely used
```

### Text Colors

```
Primary Text: Gray 900 (#111827)
Secondary Text: Gray 600 (#4B5563)
Disabled Text: Gray 400 (#9CA3AF)
Placeholder: Gray 500 (#6B7280)
Link: Primary 500 (#3B82F6)
Link Hover: Primary 600 (#2563EB)
Inverted (on dark): White (#FFFFFF)
```

---

## 📏 Spacing & Layout

### Spacing Scale (8px base)

```
0:    0px      // No space
0.5:  2px      // Hairline
1:    4px      // Tiny
1.5:  6px      // XXS
2:    8px      // XS
2.5:  10px     // 
3:    12px     // SM
3.5:  14px     // 
4:    16px     // MD [BASE]
5:    20px     // 
6:    24px     // LG
7:    28px     // 
8:    32px     // XL
9:    36px     // 
10:   40px     // 2XL
11:   44px     // 
12:   48px     // 3XL
14:   56px     // 4XL
16:   64px     // 5XL
20:   80px     // 6XL
24:   96px     // 7XL
32:   128px    // 8XL
40:   160px    // 9XL
48:   192px    // 10XL
```

**Usage Examples:**
- Component padding: 4 (16px)
- Card padding: 6 (24px)
- Section padding: 8-12 (32-48px)
- Button padding X: 4-6 (16-24px)
- Button padding Y: 2-3 (8-12px)
- Gap between items: 2-4 (8-16px)

### Grid System

**Desktop (1280px+):**
```
Columns: 12
Gutter: 24px
Margin: 48px
Max width: 1440px
```

**Tablet (768px - 1279px):**
```
Columns: 12
Gutter: 16px
Margin: 32px
Max width: 100%
```

**Mobile (< 768px):**
```
Columns: 4
Gutter: 16px
Margin: 16px
Max width: 100%
```

**POS Tablet (Portrait):**
```
Columns: 6
Gutter: 16px
Margin: 16px
Optimized for: iPad, Android tablets
```

### Container Widths

```
xs: 320px   // Mobile min
sm: 640px   // Small mobile
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
2xl: 1536px // Extra large
full: 100%  // Full width
```

---

## 🔲 Border Radius

```
None: 0px       // Sharp corners
XS:   2px       // Subtle rounding
SM:   4px       // Small elements
MD:   6px       // Buttons, inputs [DEFAULT]
LG:   8px       // Cards
XL:   12px      // Large cards
2XL:  16px      // Modals
3XL:  24px      // Hero sections
Full: 9999px    // Pills, circles
```

**Usage:**
- Buttons: 6px (md)
- Inputs: 6px (md)
- Cards: 8px (lg)
- Modals: 16px (2xl)
- Badges: 9999px (full)
- Product images: 8px (lg)

---

## 🎴 Shadows & Elevation

### Shadow Levels

```css
/* No shadow */
none: box-shadow: none;

/* Subtle - Cards, inputs */
xs: box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Small - Hovered cards */
sm: box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
                0 1px 2px 0 rgba(0, 0, 0, 0.06);

/* Medium - Dropdowns */
md: box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                0 2px 4px -1px rgba(0, 0, 0, 0.06);

/* Large - Modals */
lg: box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
                0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* Extra Large - Dialogs */
xl: box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* 2XL - Popups */
2xl: box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Inner shadow */
inner: box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
```

**Usage:**
- Cards: xs or sm
- Buttons (hover): sm
- Dropdowns: md
- Modals: lg or xl
- Floating elements: xl
- POS transaction complete: 2xl (celebration effect)

### Focus Rings

```css
/* Default focus */
focus: box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);

/* Error focus */
focus-error: box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.5);

/* Success focus */
focus-success: box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.5);
```

---

## 🧩 Component Library

### Buttons

#### Primary Button
```
Background: Primary 500
Text: White
Padding: 12px 24px (py-3 px-6)
Border radius: 6px
Font weight: 600
Font size: 14px
Height: 40px (md) or 48px (lg)

Hover: Background → Primary 600
Active: Background → Primary 700
Disabled: Background → Gray 300, Text → Gray 500
Focus: Ring Primary 500 (3px)
```

#### Secondary Button
```
Background: Transparent
Border: 1px solid Gray 300
Text: Gray 700
Padding: 12px 24px
Border radius: 6px
Font weight: 600
Font size: 14px

Hover: Background → Gray 50
Active: Background → Gray 100
Disabled: Border → Gray 200, Text → Gray 400
```

#### Danger Button
```
Background: Error 500
Text: White
Same dimensions as Primary

Hover: Background → Error 600
Active: Background → Error 700
```

#### Success Button
```
Background: Success 500
Text: White
Same dimensions as Primary

Hover: Background → Success 600
Active: Background → Success 700
```

#### Ghost Button
```
Background: Transparent
Text: Primary 500
No border
Padding: 12px 24px

Hover: Background → Primary 50
Active: Background → Primary 100
```

#### Icon Button
```
Size: 40x40px (md) or 48x48px (lg)
Padding: 8px
Border radius: 6px
Center icon (20x20px for md, 24x24px for lg)

Hover: Background → Gray 100
Active: Background → Gray 200
```

### Inputs

#### Text Input
```
Height: 40px
Padding: 12px 16px
Border: 1px solid Gray 300
Border radius: 6px
Font size: 14px
Background: White

Hover: Border → Gray 400
Focus: Border → Primary 500, Ring Primary 500 (3px)
Error: Border → Error 500, Ring Error 500 (3px)
Disabled: Background → Gray 100, Border → Gray 200
```

#### Select Dropdown
```
Same as text input
Add chevron-down icon (right side)
```

#### Checkbox
```
Size: 20x20px
Border: 2px solid Gray 300
Border radius: 4px

Checked: Background → Primary 500, Border → Primary 500
Focus: Ring Primary 500 (3px)
```

#### Radio Button
```
Size: 20x20px
Border: 2px solid Gray 300
Border radius: 50% (full circle)

Selected: Border → Primary 500, Inner dot Primary 500
Focus: Ring Primary 500 (3px)
```

#### Toggle Switch
```
Width: 44px
Height: 24px
Border radius: 9999px (full)
Background (off): Gray 300
Background (on): Primary 500

Thumb:
  Size: 20x20px
  Position: Left (off), Right (on)
  Background: White
  Shadow: sm
```

### Cards

#### Basic Card
```
Background: White
Padding: 24px
Border radius: 8px
Shadow: xs
Border: 1px solid Gray 200 (optional)

Hover: Shadow → sm
```

#### Product Card (POS)
```
Background: White
Padding: 16px
Border radius: 8px
Border: 2px solid Gray 200
Min height: 120px

Hover: Border → Primary 500, Shadow → sm
Active: Border → Primary 600, Background → Primary 50
```

#### Stats Card
```
Background: White
Padding: 24px
Border radius: 8px
Border left: 4px solid (Primary/Success/Warning/Error)
Shadow: sm
```

### Modals

```
Background: White
Padding: 32px
Border radius: 16px
Shadow: xl
Max width: 600px (md), 800px (lg), 1000px (xl)
Overlay: rgba(0, 0, 0, 0.5)

Header:
  Font size: 24px (H3)
  Font weight: 700
  Margin bottom: 16px

Body:
  Font size: 14px
  Color: Gray 600

Footer:
  Margin top: 24px
  Gap: 12px
  Align right
```

### Badges

```
Padding: 4px 12px
Border radius: 9999px (full)
Font size: 12px
Font weight: 600
Display: inline-flex
Align items: center

Success Badge: Background → Success 100, Text → Success 700
Warning Badge: Background → Warning 100, Text → Warning 700
Error Badge: Background → Error 100, Text → Error 700
Info Badge: Background → Primary 100, Text → Primary 700
Neutral Badge: Background → Gray 100, Text → Gray 700
```

### Alerts

```
Padding: 16px
Border radius: 8px
Border left: 4px solid
Font size: 14px
Display: flex
Gap: 12px
Icon size: 20x20px

Success Alert: 
  Background → Success 50
  Border → Success 500
  Text → Success 800

Warning Alert:
  Background → Warning 50
  Border → Warning 500
  Text → Warning 800

Error Alert:
  Background → Error 50
  Border → Error 500
  Text → Error 800

Info Alert:
  Background → Primary 50
  Border → Primary 500
  Text → Primary 800
```

### Tables

```
Table:
  Width: 100%
  Border: 1px solid Gray 200
  Border radius: 8px
  Overflow: hidden

Header:
  Background: Gray 50
  Padding: 12px 16px
  Font size: 12px
  Font weight: 600
  Text: Gray 700
  Text transform: uppercase

Row:
  Padding: 16px
  Border bottom: 1px solid Gray 200
  Font size: 14px
  
  Hover: Background → Gray 50

Striped Rows:
  Even rows: Background → Gray 50
```

### Tooltips

```
Background: Gray 900
Padding: 8px 12px
Border radius: 6px
Font size: 12px
Color: White
Shadow: md
Max width: 240px
Arrow: 8x8px triangle
```

### Loading Spinner

```
Size: 24px (md), 32px (lg), 48px (xl)
Border: 3px solid Gray 200
Border top: 3px solid Primary 500
Border radius: 50%
Animation: spin 1s linear infinite
```

---

## 🎯 POS-Specific Components

### Product Grid Item
```
Width: 150px (sm), 180px (md), 200px (lg)
Height: 160px (sm), 180px (md), 200px (lg)
Padding: 12px
Border: 2px solid Gray 200
Border radius: 8px
Background: White
Display: flex
Flex direction: column
Gap: 8px

Image container:
  Aspect ratio: 1:1
  Border radius: 6px
  Background: Gray 100
  
Product name:
  Font size: 14px
  Font weight: 600
  Color: Gray 900
  Lines: 2
  Overflow: ellipsis

Price:
  Font size: 18px
  Font weight: 700
  Color: Primary 600
  Font: Monospace

Hover: Border → Primary 500
Active: Background → Primary 50, Border → Primary 600
```

### Cart Item
```
Padding: 12px
Border bottom: 1px solid Gray 200
Display: flex
Gap: 12px
Align items: center

Product name:
  Font size: 14px
  Font weight: 600

Quantity controls:
  Button size: 32x32px
  Border radius: 4px
  Background: Gray 100
  
  Hover: Background → Gray 200
  
Quantity display:
  Font size: 16px
  Font weight: 600
  Min width: 40px
  Text align: center
  Font: Monospace

Price:
  Font size: 16px
  Font weight: 700
  Color: Gray 900
  Font: Monospace
  Margin left: auto
```

### Total Display
```
Background: Primary 50
Padding: 24px
Border radius: 12px
Border: 2px solid Primary 200

Label:
  Font size: 14px
  Font weight: 600
  Color: Gray 600
  Text transform: uppercase

Amount:
  Font size: 36px
  Font weight: 800
  Color: Primary 700
  Font: Monospace
  Letter spacing: -0.02em
```

### Payment Method Button
```
Width: 100%
Height: 80px
Padding: 16px
Border: 2px solid Gray 200
Border radius: 8px
Background: White
Display: flex
Flex direction: column
Align items: center
Gap: 8px

Icon:
  Size: 32x32px
  Color: Gray 600

Label:
  Font size: 14px
  Font weight: 600
  Color: Gray 900

Hover: Border → Primary 500, Background → Primary 50
Active: Border → Primary 600, Background → Primary 100
```

---

## 🖼️ Iconography

### Icon Library
**Recommended:** Lucide Icons or Heroicons
**Style:** Outlined (default), Solid (for filled states)
**License:** MIT (free for commercial use)

### Icon Sizes
```
xs: 16x16px   // Small badges, inline text
sm: 20x20px   // Buttons, inputs
md: 24x24px   // Navigation, cards [DEFAULT]
lg: 32x32px   // Feature highlights
xl: 48x48px   // Large features
2xl: 64x64px  // Hero sections
```

### Icon Colors
```
Default: Gray 600
Hover: Gray 700
Active: Primary 500
Disabled: Gray 400
Success: Success 500
Warning: Warning 500
Error: Error 500
```

### Essential Icons for POS
```
- shopping-cart (Cart)
- credit-card (Payment)
- printer (Receipt)
- barcode (Scan)
- plus/minus (Quantity)
- trash (Delete)
- x (Close/Cancel)
- check (Confirm)
- search (Search products)
- user (Customer)
- clock (History)
- settings (Settings)
- logout (Logout)
- menu (Navigation)
- chevron-down (Dropdown)
- alert-circle (Warning)
- check-circle (Success)
- x-circle (Error)
- info (Information)
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile first approach */
sm: 640px   /* Tablet portrait */
md: 768px   /* Tablet landscape */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large desktop */

/* POS specific */
pos-tablet: 768px   /* iPad / Android tablet portrait */
pos-landscape: 1024px /* Tablet landscape */
```

### Responsive Typography
```
Mobile (< 640px):
  H1: 28px (instead of 36px)
  H2: 24px (instead of 30px)
  Body: 16px (same)

Tablet (640px - 1023px):
  H1: 32px
  H2: 26px
  Body: 16px

Desktop (1024px+):
  H1: 36px
  H2: 30px
  Body: 16px
```

---

## ♿ Accessibility Standards

### WCAG 2.1 Level AA Compliance

**Color Contrast:**
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

**Touch Targets:**
- Minimum: 44x44px
- Recommended: 48x48px
- POS screens: 56x56px (larger for speed)

**Keyboard Navigation:**
- All interactive elements must be keyboard accessible
- Visible focus indicators (3px ring)
- Logical tab order
- Escape key closes modals
- Enter key submits forms

**Screen Reader Support:**
- Proper ARIA labels
- Semantic HTML (button, nav, main, etc.)
- Alt text for images
- Form labels

**Motion & Animation:**
- Respect prefers-reduced-motion
- No auto-playing videos
- Optional animations

---

## 🌙 Dark Mode (Future)

**Note:** Not in MVP, but design tokens are prepared

```
Dark Background: #0F172A (Gray 900)
Dark Surface: #1E293B (Gray 800)
Dark Border: #334155 (Gray 700)
Dark Text Primary: #F1F5F9 (Gray 100)
Dark Text Secondary: #CBD5E1 (Gray 400)
```

---

## 🎭 Animation & Motion

### Transition Timing
```
Fast: 150ms     // Hover states, simple transitions
Normal: 200ms   // Default [DEFAULT]
Slow: 300ms     // Modals, complex animations
Slower: 500ms   // Page transitions
```

### Easing Functions
```
ease-in: cubic-bezier(0.4, 0, 1, 1)
ease-out: cubic-bezier(0, 0, 0.2, 1) [DEFAULT]
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```

### Common Animations
```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide in from right */
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* Scale up */
@keyframes scaleUp {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Spin (loading) */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

**Usage:**
- Button hover: No animation (instant)
- Modal open: Scale up (200ms)
- Dropdown: Slide in from top (150ms)
- Notification: Slide in from right (300ms)
- Loading: Spin (1s infinite)

---

## 📋 Implementation Guidelines

### CSS Framework
**Recommended:** Tailwind CSS v3+
**Why:** Utility-first, highly customizable, perfect for our design system

### Tailwind Config Customization
```js
// tailwind.config.js structure
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { /* our blue scale */ },
        success: { /* our green scale */ },
        warning: { /* our orange scale */ },
        error: { /* our red scale */ },
      },
      fontFamily: {
        sans: ['Inter', ...],
        mono: ['Fira Code', ...],
      },
      // ... more customization
    },
  },
}
```

### Component Library
**Recommended:** shadcn/ui
**Why:** Unstyled, customizable, copy-paste components, works with Tailwind

### Design Tokens
All colors, spacing, typography should be stored as CSS variables or Tailwind config for easy theming and consistency.

---

## ✅ Design Checklist

Before implementing any UI:
- [ ] Uses color from our palette (no random colors)
- [ ] Typography follows our scale (no arbitrary font sizes)
- [ ] Spacing uses 8px grid (4, 8, 16, 24, 32, etc.)
- [ ] Touch targets are minimum 44px (preferably 48px)
- [ ] Color contrast passes WCAG AA (4.5:1)
- [ ] Has hover state (if interactive)
- [ ] Has focus state (keyboard navigation)
- [ ] Has disabled state (if applicable)
- [ ] Looks good on mobile, tablet, desktop
- [ ] Tested with screen reader (if complex)
- [ ] Loading state defined (if async)
- [ ] Error state defined (if can fail)

---

## 🎯 Next Steps

**For Developers:**
1. Set up Tailwind CSS with our custom config
2. Install shadcn/ui base components
3. Create component library folder
4. Implement each component following this spec
5. Create Storybook for component showcase

**For Designer (Me):**
1. ✅ Color palette defined
2. ✅ Typography system defined
3. ✅ Component specifications defined
4. 🔄 Create Figma design file
5. 🔄 Design login page wireframe
6. 📅 Tomorrow: Design POS interface
7. 📅 Tomorrow: Design dashboard layout

---

**Created by:** Luna (UI/UX Designer)  
**Date:** 2026-02-23  
**Version:** 1.0  
**Status:** Ready for Implementation ✅
