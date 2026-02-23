# 🎨 HANDOFF: Gesa → Mela
## Design System → UI Implementation

**Date:** 2026-02-23 16:20 CET  
**From:** Gesa (Designer)  
**To:** Mela (UI Implementation Specialist)  
**Coordinator:** Marco (Team Lead)  
**Priority:** 🔴 CRITICAL  
**Status:** 🔄 IN PROGRESS

---

## 🎯 **HANDOFF PURPOSE**

Gesa has completed the design system foundations. Now Mela will implement these designs as reusable UI components using shadcn/ui + Tailwind CSS + TypeScript.

**Goal:** Transform Gesa's Figma designs into production-ready, type-safe React components.

---

## ✅ **WHAT GESA HAS COMPLETED**

### 1. **Design System Foundations**
- ✅ Color palette defined (primary, secondary, neutrals, semantic)
- ✅ Typography system (headings, body, labels)
- ✅ Spacing scale (4px, 8px, 16px, 24px, 32px, 48px, 64px)
- ✅ Border radius scale (sm, md, lg, xl, full)
- ✅ Shadow system (sm, md, lg, xl)

### 2. **Component Designs**
- ✅ Button (primary, secondary, outline, ghost, danger)
- ✅ Input (text, number, email, password, textarea)
- ✅ Select / Dropdown
- ✅ Checkbox & Radio
- ✅ Card layouts
- ✅ Modal/Dialog
- ✅ Table
- ✅ Navigation (sidebar, top bar)

### 3. **Color Palette**

#### **Brand Colors:**
- **Primary:** `#0066CC` (Tafa Blue)
- **Primary Dark:** `#004C99`
- **Primary Light:** `#3385D6`

#### **Semantic Colors:**
- **Success:** `#10B981` (Green)
- **Warning:** `#F59E0B` (Orange)
- **Error:** `#EF4444` (Red)
- **Info:** `#3B82F6` (Blue)

#### **Neutral Colors:**
- **Gray 50:** `#F9FAFB`
- **Gray 100:** `#F3F4F6`
- **Gray 200:** `#E5E7EB`
- **Gray 300:** `#D1D5DB`
- **Gray 400:** `#9CA3AF`
- **Gray 500:** `#6B7280`
- **Gray 600:** `#4B5563`
- **Gray 700:** `#374151`
- **Gray 800:** `#1F2937`
- **Gray 900:** `#111827`

---

## 📦 **WHAT MELA RECEIVES**

### **1. FIGMA FILES**

**Figma Project:** FiscalNext Design System  
**Link:** [Insert Figma link here]

**Files Structure:**
```
FiscalNext/
├── 📄 Design System
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Components
│   └── Icons
├── 📄 Web Admin Dashboard
│   ├── Login & Registration
│   ├── Dashboard Home
│   ├── Products
│   └── Settings
├── 📄 POS Interface
│   ├── Main Screen
│   ├── Checkout
│   └── Receipts
└── 📄 Mobile App
    ├── POS Mobile
    └── Manager App
```

### **2. DESIGN TOKENS**

Create this file: `styles/design-tokens.ts`

```typescript
export const colors = {
  primary: {
    DEFAULT: '#0066CC',
    dark: '#004C99',
    light: '#3385D6',
    50: '#E6F2FF',
    100: '#CCE5FF',
    500: '#0066CC',
    600: '#0052A3',
    700: '#004C99',
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
};

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};
```

### **3. TAILWIND CONFIGURATION**

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0066CC',
          dark: '#004C99',
          light: '#3385D6',
          50: '#E6F2FF',
          100: '#CCE5FF',
          500: '#0066CC',
          600: '#0052A3',
          700: '#004C99',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
```

---

## 🎯 **COMPONENT SPECIFICATIONS**

### **Component 1: Button**

**Figma:** Design System → Components → Button

**Variants:**
- `primary` - Solid blue background
- `secondary` - Outline with primary color
- `outline` - Gray outline
- `ghost` - No border, hover effect
- `danger` - Red for destructive actions

**Sizes:**
- `sm` - 32px height, 12px font
- `md` - 40px height, 14px font (default)
- `lg` - 48px height, 16px font

**States:**
- Default
- Hover
- Active (pressed)
- Disabled
- Loading (with spinner)

**TypeScript Interface:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

**Example Implementation:**
```typescript
import { Button } from '@/components/ui/button';

<Button variant="primary" size="md">
  Save Product
</Button>

<Button variant="danger" loading>
  Deleting...
</Button>
```

---

### **Component 2: Input**

**Figma:** Design System → Components → Input

**Types:**
- Text
- Number
- Email
- Password (with toggle visibility)
- Textarea

**States:**
- Default
- Focus
- Error (red border + error message)
- Disabled

**Features:**
- Label (optional)
- Placeholder
- Helper text
- Error message
- Icon (left or right)

**TypeScript Interface:**
```typescript
interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'textarea';
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}
```

---

### **Component 3: Card**

**Figma:** Design System → Components → Card

**Variants:**
- `default` - White background, subtle shadow
- `bordered` - With border
- `elevated` - Larger shadow

**Anatomy:**
- Header (optional)
- Body (content)
- Footer (optional)

**TypeScript Interface:**
```typescript
interface CardProps {
  variant?: 'default' | 'bordered' | 'elevated';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}
```

---

### **Component 4: Modal/Dialog**

**Figma:** Design System → Components → Modal

**Features:**
- Overlay (semi-transparent background)
- Close button (X icon)
- Header with title
- Body with content
- Footer with actions
- Keyboard support (ESC to close)
- Focus trap

**Sizes:**
- `sm` - 400px width
- `md` - 600px width (default)
- `lg` - 800px width
- `xl` - 1000px width

**TypeScript Interface:**
```typescript
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

---

### **Component 5: Table**

**Figma:** Design System → Components → Table

**Features:**
- Column headers
- Sortable columns (icon indicators)
- Row hover effect
- Alternating row colors (optional)
- Actions column (dropdown menu)
- Pagination (footer)
- Loading state (skeleton)
- Empty state

**TypeScript Interface:**
```typescript
interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}
```

---

## 🚀 **QUICK START FOR MELA**

### **Step 1: Setup shadcn/ui (30 min)**

```bash
# Navigate to web-admin project
cd /Users/admin/.openclaw/workspace/programfiskalizimi/code/fiscalnext-monorepo/apps/web-admin

# Install shadcn/ui CLI
npx shadcn-ui@latest init

# Choose options:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes

# Install components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
```

### **Step 2: Customize Tailwind (15 min)**

1. Update `tailwind.config.js` with Gesa's colors (see above)
2. Update `globals.css` with custom CSS variables
3. Test with a simple button

### **Step 3: Build First Component (1 hour)**

Start with Button component:

```typescript
// components/ui/button.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-dark',
        secondary: 'border border-primary text-primary hover:bg-primary-50',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
        ghost: 'hover:bg-gray-100 text-gray-700',
        danger: 'bg-error text-white hover:bg-red-600',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? <Spinner /> : children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### **Step 4: Create Storybook (Optional, 2 hours)**

Document components for team:

```bash
# Install Storybook
npx storybook@latest init

# Create stories
# components/ui/button.stories.tsx
```

---

## 📋 **MELA'S IMMEDIATE TASKS**

### **Day 2 Tasks (4-6 hours):**
- [ ] Setup shadcn/ui
- [ ] Configure Tailwind with Gesa's colors
- [ ] Implement Button component (all variants)
- [ ] Implement Input component
- [ ] Test components in demo page

### **Day 3 Tasks:**
- [ ] Implement Card component
- [ ] Implement Modal/Dialog component
- [ ] Implement Table component
- [ ] Create component documentation

### **Day 4 Tasks:**
- [ ] Select/Dropdown component
- [ ] Checkbox & Radio components
- [ ] Navigation components
- [ ] Review with Gesa

---

## 📞 **COMMUNICATION**

### **Questions for Gesa:**
- **Slack:** #design channel, tag @gesa
- **Figma Comments:** Add comments directly in Figma
- **Design Review:** Schedule 30-min call if needed

### **Feedback Loop:**
1. Mela implements component
2. Mela posts screenshot in #design
3. Gesa reviews and approves/requests changes
4. Iterate until approved

---

## ✅ **HANDOFF CHECKLIST**

### **Gesa's Checklist:**
- [x] Design system complete
- [x] Component designs finalized
- [x] Color palette documented
- [x] Typography system defined
- [ ] Figma link shared with Mela
- [ ] Design tokens exported
- [ ] Walkthrough call scheduled (if needed)

### **Mela's Checklist:**
- [ ] Received Figma access
- [ ] Reviewed all component designs
- [ ] Setup shadcn/ui
- [ ] Configured Tailwind
- [ ] First component implemented
- [ ] Confirmed no blockers

---

## 🎉 **HANDOFF COMPLETION**

### **Success Criteria:**
- ✅ Mela has Figma access
- ✅ Mela understands design system
- ✅ Button component implemented and matches design
- ✅ Tailwind configured with correct colors
- ✅ Ready to build remaining components

### **Expected Timeline:**
- **Figma Review:** 30 minutes
- **shadcn/ui Setup:** 30 minutes
- **First Component:** 1 hour
- **Total:** ~2 hours to full productivity

---

## 📝 **NOTES**

- Design system is fully documented in Figma
- All measurements are in px (easily convertible to rem)
- Accessibility considered (WCAG AA contrast ratios)
- Dark mode designs coming in Sprint 2
- Mobile-responsive breakpoints defined

---

## 🚀 **READY TO BUILD!**

Mela, you now have everything to build beautiful, consistent UI components!

**Gesa's designs are pixel-perfect and ready for implementation! 🎨**

---

**Handoff Coordinator:** Marco (Team Lead)  
**Status:** 🔄 IN PROGRESS  
**Expected Completion:** 5:00 PM CET  
**Next Update:** After Mela implements first component

---

**🎯 ACTION: Mela, please confirm in #design when you successfully implement the Button component!**
