# FiscalNext Admin Dashboard

Modern admin dashboard for the FiscalNext fiscalization platform.

## 🚀 Features (Day 1)

### ✅ Completed
- Next.js 14 project setup with App Router
- TypeScript configuration
- Tailwind CSS styling with custom design system
- Responsive layout system
- Authentication UI (Login page)
- Dashboard layout with sidebar navigation
- Reusable UI components (Button, Input, Card)
- API client setup with Axios
- Utility functions (formatCurrency, formatDate, etc.)
- Dashboard home page with stats and recent activity

### 📁 Project Structure

```
web-admin/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home (redirects to login)
│   ├── globals.css         # Global styles
│   ├── login/
│   │   └── page.tsx        # Login page
│   └── dashboard/
│       └── page.tsx        # Dashboard home
├── components/
│   ├── ui/
│   │   ├── Button.tsx      # Button component
│   │   ├── Input.tsx       # Input component
│   │   ├── Card.tsx        # Card component
│   │   └── index.ts        # Barrel export
│   └── layout/
│       ├── Sidebar.tsx     # Navigation sidebar
│       ├── Header.tsx      # Page header
│       ├── DashboardLayout.tsx
│       └── index.ts
├── lib/
│   ├── api.ts              # API client & endpoints
│   └── utils.ts            # Utility functions
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand (ready to use)
- **API Client:** Axios
- **Icons:** React Icons
- **Notifications:** React Hot Toast
- **Data Fetching:** TanStack Query

## 🎨 Design System

Based on DESIGN_SYSTEM.md:
- **Primary Color:** Blue (#3B82F6)
- **Font:** Inter
- **Spacing:** 8px grid system
- **Components:** Consistent button, input, card styles

## 📋 Routes

- `/` - Redirects to login
- `/login` - Login page
- `/dashboard` - Dashboard home (with sidebar layout)
- `/products` - Products management (TODO)
- `/customers` - Customer management (TODO)
- `/invoices` - Invoices (TODO)
- `/reports` - Reports (TODO)
- `/settings` - Settings (TODO)

## 🚀 Getting Started

```bash
# Install dependencies (from monorepo root)
pnpm install

# Run development server
pnpm --filter @fiscalnext/web-admin dev

# Build for production
pnpm --filter @fiscalnext/web-admin build
```

The app runs on http://localhost:3000

## 📝 TODO (Next Steps)

### Week 1 Priorities:
1. ✅ Login page
2. ⏳ Registration page
3. ⏳ Forgot password flow
4. ⏳ Dashboard statistics (connect to real API)
5. ⏳ User management pages
6. ⏳ Products CRUD pages
7. ⏳ Authentication state management

### Components to Build:
- [ ] Modal/Dialog
- [ ] Table/DataGrid
- [ ] Form components
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] Image uploader
- [ ] Search/Filter components

## 🔐 Authentication

API endpoint: `http://localhost:5000/v1/auth/login`

Mock credentials (update when backend is ready):
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

## 📚 Documentation

- Feature Specs: `/docs/FEATURE_SPECIFICATION.md`
- Architecture: `/docs/ARCHITECTURE_BLUEPRINT.md`
- Design System: `/designs/DESIGN_SYSTEM.md`

---

**Built by:** Elena (Frontend Developer)  
**Date:** 2026-02-23 (Day 1)  
**Status:** ✅ Foundation complete, ready for feature development
