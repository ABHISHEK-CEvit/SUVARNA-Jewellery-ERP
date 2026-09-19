-- AlterTable SalesInvoiceItem: Add missing Phase 3 columns
ALTER TABLE "SalesInvoiceItem"
  ADD COLUMN IF NOT EXISTS "taxableAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "metalType" TEXT NOT NULL DEFAULT 'GOLD';

-- AlterTable SalesInvoice: Idempotent safeguard for taxableAmount
ALTER TABLE "SalesInvoice"
  ADD COLUMN IF NOT EXISTS "taxableAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00;
