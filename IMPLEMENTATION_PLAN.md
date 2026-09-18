# Architecture Blueprint & Development Roadmap: Sales-Centric Jewellery ERP

> **Target Audience:** Small Jewellery Shops in India
> **Core Architecture:** Sales-Centric Modular Monolith (React + NestJS + PostgreSQL + Prisma)
> **Status:** Final Revised Blueprint — Pending User Approval before Phase 1.

---

## 1. Core Product Philosophy (Sales-Centric, Zero Mandatory SKUs)

Small Indian jewellery shops operate in fast-paced counter environments where individual item tagging, SKUs, barcode labels, and pre-cataloged product masters are usually **absent**.

### Key Rules:
1. **Sales-Centric, Not Inventory-Centric**: The system centers on recording sales bills and generating actionable category analytics, revenue insights, and customer ledgers.
2. **Zero Mandatory SKUs or Product IDs**: Shopkeepers do **not** create a product catalog entry before creating a bill. Line items are generated dynamically during billing using a **Category** + **Flexible Description** + **Jewellery Attributes**.
3. **Flexible Line Item Structure**:
   ```
   Category: Ring
   Description: Gold ring
   Gross Weight: 5.240 g
   Stone Weight: 0.200 g
   Net Weight: 5.040 g
   Purity: 22K (916)
   Metal Rate: ₹7,250 / g
   Making Charges: ₹450 / g (or % or fixed)
   Stone Charges: ₹500
   Discount: ₹200
   Tax (GST): Configurable % per category/business
   Total Amount: ₹...
   ```
4. **Data Precision Guarantee**: Currency is strictly stored as `Decimal(12, 2)` (Rupees), and precious metal weights are strictly stored as `Decimal(12, 3)` (Grams up to `0.001g` / 1 milligram precision). JavaScript floating-point math (`0.1 + 0.2`) is strictly forbidden.

---

## 2. System Architecture

The application adopts a **Modular Monolith** architecture, separating concerns cleanly across 4 tiers without introducing microservice complexity.

```
[ Frontend: React 18 + Vite SPA (shadcn/ui + Tailwind CSS) ]
                        │
         HTTP REST API / HttpOnly Session Cookie
                        │
[ API & Auth Layer: NestJS Controllers + Session Guard + Zod Validation ]
                        │
[ Domain Services: Sales Billing, Configurable Tax, Customer Ledger, Analytics ]
                        │
[ Data Access: Prisma ORM ]
                        │
[ Database Engine: PostgreSQL 16 ]
```

### Architectural Principles:
* **Presentation Tier**: React SPA with Vite, Tailwind CSS, and shadcn/ui. Handles UI state, form entry, and printing layout.
* **API & Business Logic Tier**: NestJS framework providing modular services, Zod validation pipes, session authentication guards, and financial decimal calculation helpers.
* **Database Tier**: PostgreSQL 16 managed via Prisma ORM for type-safe database queries and migrations.
* **Environment Isolation**: Configuration secrets (`DATABASE_URL`, `SESSION_SECRET`, `PORT`, `CORS_ORIGIN`) are supplied via `.env` files.

---

## 3. Technology Stack & Rationale

| Component | Technology | Technical Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18/19 (TypeScript)** | Responsive SPA framework; optimal for fast keyboard-driven invoice data entry. |
| **Build Tool** | **Vite** | Instant HMR, lightweight dev server startup, optimized bundle generation. |
| **Styling & UI Components** | **Tailwind CSS + shadcn/ui** | Modern design tokens; accessible components tailored for high-density tables and fast billing dialogs. |
| **State & API Cache** | **TanStack Query + Zustand** | Background cache re-validation, optimistic UI updates, local state management for active draft bills. |
| **Forms & Validation** | **React Hook Form + Zod** | High-performance form handling without re-render lags; shared Zod validation schemas across frontend and backend. |
| **Backend Framework** | **NestJS (Node.js, TypeScript)** | Robust modular architecture with dependency injection, strict controller/service separation, and automatic OpenAPI/Swagger documentation. |
| **Database Engine** | **PostgreSQL 16** | Strict ACID compliance, native `NUMERIC/DECIMAL` types for precise currency and weight storage. |
| **ORM** | **Prisma ORM** | Type-safe database queries, schema migration management (`prisma migrate`), native Prisma `Decimal` support. |
| **Authentication** | **HTTP-Only Cookie + Stateful Sessions** | Immune to XSS token theft in `localStorage`; server-side session revocation capability. |
| **Development Setup** | **Docker Compose (PostgreSQL 16)** | Reproducible, isolated database container with persistent local volume binding on Windows PC. |
| **Testing Tools** | **Vitest + Jest / Supertest** | Fast unit testing for financial decimal algorithms and API endpoint integration tests. |

---

## 4. Base Version (MVP) Feature Scope

The Base Version focuses exclusively on the **Sales → Revenue → Category Analytics → Customer Ledger** workflow:

```
1. Authentication & Security
   ├── User Login / Logout
   ├── Password Hashing (Argon2 / bcrypt)
   ├── Stateful Session Guard (HTTP-Only Cookie)
   └── Role-Based Access Control (ADMIN vs. STAFF)

2. Shop & Business Settings
   ├── Shop Name, Address, Contact, Logo
   ├── Tax Configuration (GSTIN, State Code, Configurable Default GST %)
   ├── Metal Daily Rates Ticker (Gold 24K, 22K, 18K rate/g, Silver rate/g)
   └── Invoice Prefix & Terms & Conditions Note

3. Jewellery Category Management
   ├── Category Master (Ring, Earrings, Necklace, Chain, Bangle, Bracelet, Pendant, Nose Pin, Other)
   ├── Default Purity (916/22K, 750/18K, 999 Fine)
   ├── Default HSN Code (e.g. 7113)
   └── Configurable GST Rate & Default Making Charge Rules

4. Customer Management
   ├── Customer Directory (Name, Mobile, Address, PAN, GSTIN)
   ├── Customer Balance Tracking (Debit/Credit outstanding)
   └── Quick Customer Search & Auto-complete during billing

5. Sales & Billing Module (Core Feature)
   ├── Fast Billing Interface (Keyboard-first navigation)
   ├── Flexible Line Items (Category, Description, Gross Wt, Stone Wt, Net Wt, Purity, Rate/g, Making Charges, Stone Charge, Discount)
   ├── Old Gold Trade-In / Exchange Section (Description, Purity %, Gross Wt, Melt Loss, Net Fine Wt, Credit Value)
   ├── Configurable Tax Calculation Engine (CGST/SGST vs IGST, Tax inclusive/exclusive, Round-off)
   ├── Multi-Mode Payment Settlement (Cash, UPI, Card, Net Banking, Customer Ledger Credit)
   └── Invoice Printing Engine (A4, A5, and Thermal 3-inch / 4-inch receipt formats)

6. Sales Returns & Adjustments
   ├── Credit Note / Return Memo creation against existing invoices
   ├── Line item return processing & tax recalculation
   └── Automatic Customer Ledger adjustment

7. Customer Ledger Engine
   ├── Customer Account Statement (Debit/Credit transaction history)
   ├── Payment Receipt Vouchers
   └── Printable Account Statements

8. Dashboard & Category Sales Analytics (Strictly Sales & Revenue, No Profit)
   ├── Core Metrics: Total Sales Revenue, Total Bills Count, Total Cash Collected, Outstanding Credit
   ├── Category-wise Analytics: Total Quantity Sold, Total Net Weight Sold (grams), Total Revenue per Category
   ├── Category Comparison & Sales Trends over custom date ranges
   ├── Payment Method Breakdown (Cash vs. UPI vs. Card vs. Credit)
   └── Date-wise and Month-wise Sales Reports

9. Audit Log, Export & Backup System
   ├── Immutable Audit Log (Invoice created, cancelled, price override)
   ├── Data Export (Sales reports & category analytics to CSV/Excel & PDF)
   └── Database Backup Utility (1-Click SQL Dump download & automated background local backups)
```

---

## 5. Future / Optional Modules (Deferred to Phase 7+)

These modules are **explicitly excluded** from the Base Version MVP, while keeping the database and architecture prepared for them:

* **Supplier, Purchase Bill Recording & Procurement** (Deferred to Phase 7)
* **Karigar / Job-Work Management** (Raw gold issued vs fine gold received ledger - Deferred to Phase 7)
* **Detailed Inventory & Product Master** (Pre-cataloged items)
* **SKU & Barcode / Tag Management** (Piece-level barcode label printing)
* **Stock Ledger & Piece-Level Tracking** (Tray stock counts)
* **Multi-Branch Support & Stock Transfer**
* **Multi-Tenant Cloud SaaS**
* **Advanced Double-Entry Accounting & Profit/Cost Analysis**
* **Mobile Application (iOS / Android)**
* **External Integrations** (WhatsApp API, SMS Gateway, E-Way Bill NIC Portal)

---

## 6. Financial & Reporting Integrity (Revenue vs. Profit)

> **REMOVAL OF PROFIT ANALYTICS:** Because the MVP does not track item purchase costs or Karigar manufacturing expenses, **all profit calculations, profit margins, and cost-of-goods-sold analytics are REMOVED from the Base Version MVP**.
> 
> All dashboard metrics, reports, and analytics will strictly use clear, accurate **Sales and Revenue** terminology:
> * **Gross Sales Revenue**
> * **Net Sales Revenue** (after returns & discounts)
> * **Total Weight Sold (grams)**
> * **Total Bill Count**
> * **Tax Collected (CGST/SGST/IGST)**
> * **Payment Method Breakdown**
> 
> Profit analysis will only be introduced in Phase 7 after purchase/cost accounting modules are deployed.

---

## 7. Configurable Tax / GST Engine

Tax calculation is **never hardcoded to a fixed 3%**. It is driven dynamically by configurable rules managed inside `TaxCalculatorService`:

* **Configurable GST Rates**: Tax rates can be set per Category or overridden at the Business Settings level (e.g. 3% composite tax, 0% silver bullion, or 5% making charge tax).
* **Tax Inclusivity Toggle**: Support for both Tax-Exclusive pricing (Item Rate + Tax) and Tax-Inclusive pricing.
* **Jurisdiction Breakup**: Automatic splitting into **CGST + SGST** for intra-state sales, or **IGST** for inter-state sales based on Customer State vs Shop State.

---

## 8. Database / Entity Design (Prisma Schema)

The schema is **BILL-CENTRIC**, capturing sales transactions, customers, categories, payments, and audit history. Supplier and Purchase entities are omitted from the active MVP schema but foreign key extension points are reserved.

```prisma
enum Role {
  ADMIN
  STAFF
}

enum MetalType {
  GOLD
  SILVER
  PLATINUM
  DIAMOND
  OTHER
}

enum MakingChargeType {
  PER_GRAM
  PERCENTAGE
  FIXED
}

enum PaymentMode {
  CASH
  UPI
  CARD
  BANK_TRANSFER
  CHEQUE
  LEDGER
}

enum InvoiceStatus {
  ACTIVE
  CANCELLED
  RETURNED
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  name         String
  passwordHash String
  role         Role      @default(STAFF)
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  salesInvoices SalesInvoice[]
  auditLogs     AuditLog[]
}

model BusinessSettings {
  id               String   @id @default("default")
  shopName         String   @default("My Jewellery Shop")
  tagline          String?
  address          String?
  city             String?
  state            String?  @default("Maharashtra")
  stateCode        String?  @default("27")
  phone            String?
  email            String?
  gstin            String?
  pan             String?
  bankName         String?
  bankAccountNo    String?
  bankIfsc         String?
  invoicePrefix    String   @default("INV")
  termsConditions  String?
  defaultGstRate   Decimal  @default(3.00) @db.Decimal(5, 2) // Configurable default GST %
  todayGold22kRate Decimal  @default(0.00) @db.Decimal(10, 2)
  todayGold24kRate Decimal  @default(0.00) @db.Decimal(10, 2)
  todaySilverRate  Decimal  @default(0.00) @db.Decimal(10, 2)
  updatedAt        DateTime @updatedAt
}

model Category {
  id             String    @id @default(uuid())
  name           String    @unique // e.g. "Ring", "Earrings", "Necklace", "Chain", "Bangle"
  metalType      MetalType @default(GOLD)
  defaultPurity  String?   // e.g. "916", "750"
  defaultHsnCode String    @default("7113")
  gstRate        Decimal   @default(3.00) @db.Decimal(5, 2) // Configurable tax rate per category
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  
  salesItems     SalesInvoiceItem[]
}

model Customer {
  id             String    @id @default(uuid())
  name           String
  phone          String?   @index
  email          String?
  address        String?
  city           String?
  state          String?
  pan            String?
  gstin          String?
  openingBalance Decimal   @default(0.00) @db.Decimal(12, 2)
  currentBalance Decimal   @default(0.00) @db.Decimal(12, 2)
  createdAt      DateTime  @default(now())

  salesInvoices   SalesInvoice[]
  ledgerEntries   CustomerLedgerEntry[]
  paymentReceipts PaymentReceipt[]
}

model SalesInvoice {
  id               String        @id @default(uuid())
  invoiceNumber    String        @unique // e.g. "INV-2026-0001"
  invoiceDate      DateTime      @default(now())
  customerId       String?
  customer         Customer?     @relation(fields: [customerId], references: [id])
  customerName     String        // Preserved snapshot for cash walk-in customers
  customerPhone    String?
  
  // Rate Snapshots at time of sale
  goldRate22k      Decimal       @db.Decimal(10, 2)
  goldRate24k      Decimal       @db.Decimal(10, 2)
  silverRate       Decimal?      @db.Decimal(10, 2)

  // Financial Totals (Sales & Revenue)
  grossItemsAmount Decimal       @db.Decimal(12, 2)
  oldGoldDeduction Decimal       @default(0.00) @db.Decimal(12, 2)
  totalDiscount    Decimal       @default(0.00) @db.Decimal(12, 2)
  taxableAmount    Decimal       @db.Decimal(12, 2)
  cgstAmount       Decimal       @default(0.00) @db.Decimal(12, 2)
  sgstAmount       Decimal       @default(0.00) @db.Decimal(12, 2)
  igstAmount       Decimal       @default(0.00) @db.Decimal(12, 2)
  totalTaxAmount   Decimal       @db.Decimal(12, 2)
  roundOff         Decimal       @default(0.00) @db.Decimal(5, 2)
  netAmount        Decimal       @db.Decimal(12, 2)
  
  paidAmount       Decimal       @default(0.00) @db.Decimal(12, 2)
  balanceAmount    Decimal       @default(0.00) @db.Decimal(12, 2)
  
  status           InvoiceStatus @default(ACTIVE)
  notes            String?
  createdById      String
  createdBy        User          @relation(fields: [createdById], references: [id])
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  items            SalesInvoiceItem[]
  oldGoldExchanges OldGoldExchangeItem[]
  payments         PaymentReceipt[]
  ledgerEntries    CustomerLedgerEntry[]
}

model SalesInvoiceItem {
  id                 String           @id @default(uuid())
  invoiceId          String
  invoice            SalesInvoice     @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  categoryId         String
  category           Category         @relation(fields: [categoryId], references: [id])
  description        String           // Flexible item description (e.g. "22K Gold Handcrafted Ring")
  
  // Weights (3 Decimal Precision: 0.001g)
  grossWeight        Decimal          @db.Decimal(12, 3)
  stoneWeight        Decimal          @default(0.000) @db.Decimal(12, 3)
  netWeight          Decimal          @db.Decimal(12, 3) // grossWeight - stoneWeight
  
  purity             String           // e.g. "916", "22K"
  metalRatePerGram   Decimal          @db.Decimal(10, 2)
  metalValue         Decimal          @db.Decimal(12, 2) // netWeight * metalRatePerGram
  
  makingChargeType   MakingChargeType @default(PER_GRAM)
  makingChargeRate   Decimal          @default(0.00) @db.Decimal(10, 2)
  totalMakingCharge  Decimal          @default(0.00) @db.Decimal(12, 2)
  
  stoneValue         Decimal          @default(0.00) @db.Decimal(12, 2)
  wastagePercentage  Decimal          @default(0.00) @db.Decimal(5, 2)
  discountAmount     Decimal          @default(0.00) @db.Decimal(12, 2)
  
  totalItemAmount    Decimal          @db.Decimal(12, 2)
  hsnCode            String           @default("7113")
  gstRate            Decimal          @db.Decimal(5, 2) // Configurable tax rate snapshot
}

model OldGoldExchangeItem {
  id                   String       @id @default(uuid())
  invoiceId            String
  invoice              SalesInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  description          String       // e.g. "Old 22K Bangle Trade-In"
  grossWeight          Decimal      @db.Decimal(12, 3)
  dustMeltingDeduction Decimal      @default(0.000) @db.Decimal(12, 3)
  netFineWeight        Decimal      @db.Decimal(12, 3)
  purityPercentage     Decimal      @db.Decimal(5, 2) // e.g. 91.60 %
  ratePerGram          Decimal      @db.Decimal(10, 2)
  totalExchangeValue   Decimal      @db.Decimal(12, 2)
}

model PaymentReceipt {
  id              String      @id @default(uuid())
  receiptNumber   String      @unique
  date            DateTime    @default(now())
  invoiceId       String?
  invoice         SalesInvoice? @relation(fields: [invoiceId], references: [id])
  customerId      String?
  customer        Customer?   @relation(fields: [customerId], references: [id])
  paymentMode     PaymentMode @default(CASH)
  amount          Decimal     @db.Decimal(12, 2)
  referenceNumber String?     // UPI Txn ID, Cheque No, Card Ref
  notes           String?
  createdAt       DateTime    @default(now())
}

model CustomerLedgerEntry {
  id                 String        @id @default(uuid())
  customerId         String
  customer           Customer      @relation(fields: [customerId], references: [id])
  date               DateTime      @default(now())
  entryType          String        // "INVOICE", "PAYMENT", "RETURN", "ADJUSTMENT"
  debitAmount        Decimal       @default(0.00) @db.Decimal(12, 2)
  creditAmount       Decimal       @default(0.00) @db.Decimal(12, 2)
  runningBalance     Decimal       @db.Decimal(12, 2)
  referenceInvoiceId String?
  referenceInvoice   SalesInvoice? @relation(fields: [referenceInvoiceId], references: [id])
  remarks            String?
  createdAt          DateTime      @default(now())
}

model AuditLog {
  id            String   @id @default(uuid())
  entityType    String   // "SalesInvoice", "Customer", "User", "Category"
  entityId      String
  action        String   // "CREATE", "UPDATE", "CANCEL", "DELETE"
  performedById String
  performedBy   User     @relation(fields: [performedById], references: [id])
  oldValues     Json?
  newValues     Json?
  ipAddress     String?
  timestamp     DateTime @default(now())
}
```

---

## 9. Backup & Recovery Strategy

1. **Development Backup**:
   * Local `docker compose` volumes preserve database state across restarts.
   * `npx prisma db seed` provides instant mock data restoration for development and testing.
2. **Production Backup Plan**:
   * **Automated Daily Backups**: Local automated script generating compressed `pg_dump` files saved to local disk storage (`C:\Users\Admin\.jewellery_erp_backups\`).
   * **Off-Site Storage Roadmap**: Option to upload compressed daily backups to encrypted S3 / Cloud Storage buckets.
   * **Disaster Recovery**: Documented `pg_restore` procedure guaranteeing database recovery on a new machine within 5 minutes.

---

## 10. Deployment Strategy

```
[ Phase 1: Windows Local Dev PC (Node.js + Docker Compose PostgreSQL) ]
                        │
                        ▼
[ Phase 2: On-Premises Shop Server (Local Wi-Fi Network / Counter Tablets) ]
                        │
                        ▼
[ Phase 3: Cloud VPS Deployment (Ubuntu + Docker Compose + Nginx + Let's Encrypt SSL) ]
```

* Zero hardcoded URLs or credentials (`.env` file managed).
* Prisma migration scripts (`npx prisma migrate deploy`) enable seamless environment switching.

---

## 11. Antigravity AI Development Discipline

* **Phase-by-Phase Progress**: Build, test, verify, and approve one phase before starting the next.
* **No Unnecessary Code / Rewrites**: Inspect existing codebase before modifying; preserve working functionality.
* **Continuous Buildability**: The application must build and run cleanly after every phase.
* **Strict Verification**: Every business calculation must be backed by Vitest unit tests before declaring completion.

---

## 12. Revised Phase-by-Phase Development Roadmap

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Project Foundation, Database & Authentication                  │
│ • Setup Monorepo (apps/backend, apps/frontend, packages/shared)        │
│ • Setup Docker Compose (PostgreSQL 16) & Prisma Schema                  │
│ • User & Role entities (ADMIN, STAFF) with Argon2 password hashing      │
│ • HTTP-Only Cookie Session Guard & Auth API routes                      │
│ • Tailwind CSS + shadcn/ui foundation tokens in React                    │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Shop Settings, Categories & Customer Management                │
│ • Shop Settings (Name, Address, Configurable Default GST, Metal Rates)  │
│ • Category Master Management (Ring, Earrings, Chain, Bangle, etc.)      │
│ • Customer Directory & Balance tracking                                 │
│ • Shared Zod validation schemas across frontend & backend               │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Core Sales Billing, Payments & Invoice Generation              │
│ • Fast Multi-line Billing Interface (Category + Description + Weights)  │
│ • Precision Financial Engine (Making charges, Stone charges, Discount)  │
│ • Old Gold Trade-In deduction line items                                │
│ • Configurable Tax Engine (CGST/SGST vs IGST calculations)               │
│ • Multi-mode Payment Settlement (Cash, UPI, Card, Customer Credit)      │
│ • Printable Invoices (A4, A5, and Thermal receipt layouts)              │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: Customer Ledger, Sales Returns & Adjustments                   │
│ • Credit Notes & Sales Return memos against past bills                  │
│ • Customer Account Ledger (Debit/Credit running balance)                │
│ • Payment Receipt Vouchers & Account Statements                         │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: Dashboard, Sales Reports & Category Analytics (Revenue Only)   │
│ • Main Dashboard (Total revenue, bill count, cash collected, credit)    │
│ • Category-wise Analytics (Quantity sold, net weight sold, revenue)    │
│ • Category comparison & sales trends over date ranges                   │
│ • Date-wise & Month-wise sales reports                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 6: Audit Logs, Data Export, Backup & Security Hardening           │
│ • Immutable Audit Logging (Bill creation, cancellation, modifications)  │
│ • Export reports to CSV/Excel and PDF                                   │
│ • 1-Click Database SQL backup export utility                            │
│ • Security hardening & performance audit                                │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 7: Future / Optional Modules (Deferred from MVP)                  │
│ • Supplier & Purchase Bill Recording                                    │
│ • Karigar / Job-work fine gold ledger                                   │
│ • Piece-level Barcode Tagging & Inventory Master                        │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 8: Production Deployment Setup & Cloud Migration                  │
│ • Production Docker Compose setup                                       │
│ • Nginx Reverse Proxy with Let's Encrypt SSL setup                      │
│ • Automated offsite backup scripts & restore testing                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase Acceptance Criteria & Verification Tests

| Phase | Core Deliverable | Explicit Acceptance Criteria & Tests |
| :--- | :--- | :--- |
| **Phase 1** | Foundation & Auth | • Docker PostgreSQL connects & Prisma migrates clean.<br/>• User login sets HTTP-Only cookie.<br/>• Non-authenticated requests blocked by Auth Guard.<br/>• Unit tests pass for password hashing & session management. |
| **Phase 2** | Settings & Master Data | • Shop settings & daily metal rates can be set and updated.<br/>• Categories (Ring, Bangle, Chain, etc.) can be created and queried.<br/>• Customers can be added & searched with auto-complete. |
| **Phase 3** | Sales Billing & Invoices | • Bill can be created without pre-existing product catalog/SKUs.<br/>• Precision unit tests verify `Net Weight = Gross Wt - Stone Wt` (`0.001g`).<br/>• Financial unit tests verify making charges, stone charges, discounts, and configurable GST.<br/>• Old Gold trade-in deducts accurately.<br/>• Thermal and A4 print views render cleanly. |
| **Phase 4** | Customer Ledger & Returns | • Sales return creates credit note & updates customer balance.<br/>• Customer account statement accurately reflects debit/credit ledger history.<br/>• Payment receipt updates invoice paid amount & balance. |
| **Phase 5** | Analytics & Reports | • Dashboard displays total sales revenue, bill count, and cash collection.<br/>• Category analytics reports total quantity, net weight sold (g), and sales revenue per category.<br/>• Reports export cleanly to CSV & PDF. |
| **Phase 6** | Audit, Backup & Security | • Bill creation/cancellation generates append-only Audit Log.<br/>• 1-Click backup downloads valid PostgreSQL `.sql` dump.<br/>• All sensitive endpoints require authentication & appropriate role. |
