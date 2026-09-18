import { z } from 'zod';

export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

// Auth Login Schema
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// User Response Interface
export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

// Generic API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// --- Business Settings ---
export const UpdateBusinessSettingsSchema = z.object({
  shopName: z.string().min(2, 'Shop name is required'),
  tagline: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  stateCode: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  gstin: z.string().optional().nullable(),
  pan: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankAccountNo: z.string().optional().nullable(),
  bankIfsc: z.string().optional().nullable(),
  invoicePrefix: z.string().min(1, 'Invoice prefix is required'),
  termsConditions: z.string().optional().nullable(),
  defaultGstRate: z.number().min(0).max(100),
  todayGold22kRate: z.number().min(0),
  todayGold24kRate: z.number().min(0),
  todaySilverRate: z.number().min(0),
});

export type UpdateBusinessSettingsInput = z.infer<typeof UpdateBusinessSettingsSchema>;

export interface BusinessSettingsDto {
  id: string;
  shopName: string;
  tagline?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  stateCode?: string | null;
  phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  pan?: string | null;
  bankName?: string | null;
  bankAccountNo?: string | null;
  bankIfsc?: string | null;
  invoicePrefix: string;
  termsConditions?: string | null;
  defaultGstRate: number;
  todayGold22kRate: number;
  todayGold24kRate: number;
  todaySilverRate: number;
  updatedAt: string;
}

// --- Daily Metal Rate Record ---
export interface DailyMetalRateDto {
  id: string;
  rateDate: string;
  gold22kRate: number;
  gold24kRate: number;
  silverRate: number;
  createdAt: string;
}

// --- Categories ---
export const CreateCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  metalType: z.string().default('GOLD'),
  defaultPurity: z.string().optional().nullable(),
  defaultHsnCode: z.string().default('7113'),
  gstRate: z.number().min(0).max(100).default(3.00),
  isActive: z.boolean().default(true),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

export interface CategoryDto {
  id: string;
  name: string;
  metalType: string;
  defaultPurity?: string | null;
  defaultHsnCode: string;
  gstRate: number;
  isActive: boolean;
  createdAt: string;
}

// --- Customers ---
export const CreateCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters'),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pan: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  openingBalance: z.number().default(0.00),
  openingBalanceType: z.enum(['DEBIT', 'CREDIT']).default('DEBIT'),
});

export const UpdateCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters').optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pan: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;

export interface CustomerDto {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pan?: string | null;
  gstin?: string | null;
  openingBalance: number;
  openingBalanceType: 'DEBIT' | 'CREDIT';
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerLedgerEntryDto {
  id: string;
  customerId: string;
  date: string;
  entryType: string;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
  referenceInvoiceId?: string | null;
  remarks?: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

