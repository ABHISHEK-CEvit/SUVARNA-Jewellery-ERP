-- AlterTable BusinessSettings: Add configured gold 18k, 20k, 14k rates
ALTER TABLE "BusinessSettings"
  ADD COLUMN IF NOT EXISTS "todayGold18kRate" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "todayGold20kRate" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "todayGold14kRate" DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- AlterTable DailyMetalRate: Add gold 18k, 20k, 14k rates
ALTER TABLE "DailyMetalRate"
  ADD COLUMN IF NOT EXISTS "gold18kRate" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "gold20kRate" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "gold14kRate" DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- AlterTable SalesInvoice: Add rate snapshots, discount amounts, invalidation/restoration fields
ALTER TABLE "SalesInvoice"
  ADD COLUMN IF NOT EXISTS "goldRate18k" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "goldRate20k" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "goldRate14k" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "overallDiscountPercentage" DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "overallDiscountAmount" DECIMAL(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "invalidatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "invalidatedById" TEXT,
  ADD COLUMN IF NOT EXISTS "invalidationReason" TEXT,
  ADD COLUMN IF NOT EXISTS "restoredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "restoredById" TEXT;

-- AlterTable SalesInvoiceItem: Add stoneCarat
ALTER TABLE "SalesInvoiceItem"
  ADD COLUMN IF NOT EXISTS "stoneCarat" DECIMAL(8,2) DEFAULT 0.00;