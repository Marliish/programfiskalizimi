# @fiscalnext/api

FiscalNext API Server - Fastify-based backend for the fiscalization platform.

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code

## API Structure

```
src/
├── config/          # Configuration files
├── middleware/      # Custom middleware
├── routes/          # API routes
├── services/        # Business logic
│   ├── auth/        # Authentication service
│   ├── pos/         # Point of sale service
│   ├── fiscal/      # Fiscal integration service
│   ├── inventory/   # Inventory management
│   ├── reporting/   # Reports and analytics
│   └── notification/# Notifications
├── types/           # TypeScript types
├── utils/           # Utilities
└── server.ts        # Main server file
```

## API Endpoints

### Authentication (Public)
- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login
- `POST /v1/auth/refresh` - Refresh access token
- `POST /v1/auth/forgot-password` - Request password reset
- `POST /v1/auth/reset-password` - Reset password
- `POST /v1/auth/verify-email` - Verify email

### POS (Protected)
- `POST /v1/pos/checkout` - Create transaction
- `GET /v1/pos/transactions` - List transactions
- `GET /v1/pos/transactions/:id` - Get transaction
- `POST /v1/pos/transactions/:id/void` - Void transaction

### Inventory (Protected)
- `GET /v1/inventory/products` - List products
- `POST /v1/inventory/products` - Create product
- `PUT /v1/inventory/products/:id` - Update product
- `DELETE /v1/inventory/products/:id` - Delete product
- `GET /v1/inventory/stock` - Get stock levels
- `POST /v1/inventory/stock/adjust` - Adjust stock

### Fiscal (Protected)
- `POST /v1/fiscal/submit` - Submit fiscal receipt
- `GET /v1/fiscal/status/:id` - Get submission status
- `POST /v1/fiscal/retry/:id` - Retry failed submission
- `GET /v1/fiscal/receipts` - List fiscal receipts

### Reporting (Protected)
- `GET /v1/reports/dashboard` - Dashboard statistics
- `GET /v1/reports/sales` - Sales report
- `GET /v1/reports/products` - Product performance
- `POST /v1/reports/export` - Export report

## Authentication

All protected routes require a JWT token in the `Authorization` header:

```
Authorization: Bearer <access-token>
```

## Multi-Tenancy

All requests are automatically filtered by `tenantId` from the JWT token. No need to pass tenantId in requests.

## Error Handling

All errors follow this format:

```json
{
  "error": "Error Type",
  "message": "Human-readable message",
  "details": [] // Optional, for validation errors
}
```

## Development

Start the API server:

```bash
npm run dev
```

The server will start at http://localhost:5000

Health check: http://localhost:5000/health
