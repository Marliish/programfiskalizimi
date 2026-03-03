import { z } from 'zod';

// Registration validation schema
export const registerSchema = z.object({
  // Business Information (required by backend)
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  country: z.enum(['AL', 'XK'], { required_error: 'Please select a country' }),
  
  // Business Information (optional - collected but not sent to backend yet)
  businessType: z.enum(['retail', 'restaurant', 'service', 'other']).optional(),
  nipt: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  
  // User Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  
  // Terms
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Reset password schema
export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Product validation schema
export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(), // Changed from 'category' and made optional
  sellingPrice: z.number().min(0.01, 'Selling price must be greater than 0'), // Changed from 'price'
  costPrice: z.number().min(0, 'Cost price must be 0 or greater').optional(),
  taxRate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
  currency: z.enum(['ALL', 'EUR', 'USD']).optional(),
  unit: z.string().optional(),
  isActive: z.boolean(),
  imageUrl: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
