import { z } from 'zod';

// Fiscal Receipt Schema for Albania & Kosovo
export const createFiscalReceiptSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID'),
  country: z.enum(['AL', 'XK'], {
    errorMap: () => ({ message: 'Country must be AL (Albania) or XK (Kosovo)' }),
  }),
});

export const fiscalReceiptQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  status: z.enum(['pending', 'verified', 'failed']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

export const verifyFiscalReceiptSchema = z.object({
  receiptId: z.string().uuid('Invalid receipt ID'),
});

export type CreateFiscalReceiptInput = z.infer<typeof createFiscalReceiptSchema>;
export type FiscalReceiptQueryInput = z.infer<typeof fiscalReceiptQuerySchema>;
export type VerifyFiscalReceiptInput = z.infer<typeof verifyFiscalReceiptSchema>;
