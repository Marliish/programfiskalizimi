// POS Validation Schemas
import { z } from 'zod';

export const transactionItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  taxRate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
  discountAmount: z.number().min(0, 'Discount cannot be negative').default(0),
});

export const paymentSchema = z.object({
  paymentMethod: z.enum(['cash', 'card', 'mobile', 'bank_transfer'], {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  amount: z.number().positive('Payment amount must be positive'),
  referenceNumber: z.string().optional(),
});

export const createTransactionSchema = z.object({
  locationId: z.string().min(1).optional(),
  customerId: z.string().min(1).optional(),
  items: z.array(transactionItemSchema).min(1, 'At least one item is required'),
  payments: z.array(paymentSchema).min(1, 'At least one payment is required'),
});

export const listTransactionsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  status: z.enum(['completed', 'voided', 'refunded']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export type TransactionItemInput = z.infer<typeof transactionItemSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
