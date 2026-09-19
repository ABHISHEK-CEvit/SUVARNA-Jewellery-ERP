-- AlterTable Category
ALTER TABLE "Category" ADD COLUMN "discountRate" DECIMAL(5,2) NOT NULL DEFAULT 0.00;

-- AlterTable SalesInvoice
ALTER TABLE "SalesInvoice" ADD COLUMN "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 3.00,
ADD COLUMN "editCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastEditedAt" TIMESTAMP(3),
ADD COLUMN "lastEditedById" TEXT;

-- AlterTable SalesInvoiceItem
ALTER TABLE "SalesInvoiceItem" ALTER COLUMN "categoryId" DROP NOT NULL,
ADD COLUMN "categoryName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "designStyle" TEXT,
ADD COLUMN "ratePerTola" DECIMAL(10,2),
ADD COLUMN "hasStone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stoneType" TEXT,
ADD COLUMN "stoneCharges" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN "makingCharges" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN "discountApplicable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "discountPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
ADD COLUMN "itemSubtotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN "gstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- CreateTable SalesInvoiceHistory
CREATE TABLE "SalesInvoiceHistory" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "changeReason" TEXT,
    "changedById" TEXT NOT NULL,
    "changedByName" TEXT NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changedFields" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesInvoiceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesInvoiceHistory_invoiceId_idx" ON "SalesInvoiceHistory"("invoiceId");

-- AddForeignKey
ALTER TABLE "SalesInvoiceHistory" ADD CONSTRAINT "SalesInvoiceHistory_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SalesInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable BillCorrectionRequest
CREATE TABLE "BillCorrectionRequest" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestedByName" TEXT NOT NULL,
    "requestedByRole" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolvedById" TEXT,
    "resolvedByName" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillCorrectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillCorrectionRequest_invoiceId_idx" ON "BillCorrectionRequest"("invoiceId");

-- CreateIndex
CREATE INDEX "BillCorrectionRequest_status_idx" ON "BillCorrectionRequest"("status");

-- AddForeignKey
ALTER TABLE "BillCorrectionRequest" ADD CONSTRAINT "BillCorrectionRequest_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SalesInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
