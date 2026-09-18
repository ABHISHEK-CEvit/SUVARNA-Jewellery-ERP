-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "openingBalanceType" TEXT NOT NULL DEFAULT 'DEBIT';

-- CreateTable
CREATE TABLE "DailyMetalRate" (
    "id" TEXT NOT NULL,
    "rateDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gold22kRate" DECIMAL(10,2) NOT NULL,
    "gold24kRate" DECIMAL(10,2) NOT NULL,
    "silverRate" DECIMAL(10,2) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMetalRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyMetalRate_rateDate_idx" ON "DailyMetalRate"("rateDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetalRate_rateDate_key" ON "DailyMetalRate"("rateDate");
