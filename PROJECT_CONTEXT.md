# SUVARNA Jewellery ERP — Project Context

## 1. Project Overview

SUVARNA is a modular jewellery ERP system designed primarily for small and medium-sized jewellery shops.

The system is being developed to provide practical shop management, customer management, jewellery sales/billing, payments, customer ledger, and sales analytics without forcing small jewellers to maintain complex product-level inventory.

The project is being developed incrementally in phases.

IMPORTANT:
The repository is the source of truth for the current implementation state.
Do not assume that something is implemented merely because it is mentioned in this document. Inspect the actual code, Prisma schema, migrations, and APIs before making changes.

---

## 2. Core Product Philosophy

SUVARNA is intentionally BILL-CENTRIC / SALES-CENTRIC in its base version.

The base system does NOT require individual product tracking.

Do NOT assume that every jewellery item must have:

- Product ID
- SKU
- Barcode
- Product Master record
- Piece-level inventory tracking

A sales/bill item can instead contain:

- Jewellery category
- Description
- Metal type
- Purity/Karat
- Gross weight
- Stone weight
- Net weight
- Rate
- Making charges
- Wastage
- Stone charges
- Discount
- Tax
- Final amount

Not every field needs to be mandatory for every type of jewellery.

Detailed inventory/product/SKU functionality is a future extension, not a base requirement.

---

## 3. Approved Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### Backend

- Node.js
- TypeScript
- NestJS
- REST APIs

### Database

- PostgreSQL

### ORM

- Prisma

### Architecture

- Modular monolith

### Development

- Docker / Docker Compose
- Git / GitHub
- Environment variables for secrets

Do NOT replace this architecture unless explicitly approved.

Do NOT introduce microservices unnecessarily.

---

## 4. Repository Structure

The project currently uses a workspace/monorepo structure containing:

- Frontend application
- NestJS backend
- Shared TypeScript package
- Prisma schema and migrations
- Docker configuration
- Project implementation plan

Important project documentation:

- `implementation_plan.md`
- `PROJECT_CONTEXT.md`

Before modifying the project, inspect these files and the actual source code.

---

## 5. Database Principles

The database uses PostgreSQL with Prisma.

Financial values and weights should use appropriate PostgreSQL numeric/decimal representations rather than relying on JavaScript floating-point arithmetic.

Customer balances must remain compatible with the customer ledger.

Do NOT create an isolated mutable customer balance that can become inconsistent with ledger transactions.

Customer opening balances must have explicit:

- DEBIT
- CREDIT

semantics.

Customers with historical transactions must not be hard-deleted.

Use active/inactive status where appropriate.

Database changes must use Prisma migrations.

Never reset or destroy the existing database merely to make development easier.

---

## 6. GST / Tax Rules

GST must be configurable.

NEVER hardcode 3% GST.

The business/shop should have a configurable default GST.

A category may have a GST override when explicitly configured.

Tax logic should remain isolated/configurable so that actual GST rules can be verified before production use.

---

## 7. Metal Rate Rules

Metal rates must be associated with a date using a `rateDate` or equivalent field.

The current phase only requires current-rate display/update.

The database should preserve the ability to support historical metal rates later.

Current supported rate concepts include:

- Gold 22K
- Gold 24K
- Silver

---

## 8. Analytics Philosophy

The system should report actual recorded sales/revenue data.

Do NOT calculate or claim profit unless reliable cost/purchase data exists.

Future analytics can include:

- Total sales
- Bill count
- Category-wise sales
- Category-wise quantity/value
- Recorded weight
- Payment method breakdown
- Date/month trends

Profit analysis is deferred until reliable purchase/cost information exists.

---

# 9. Phase Plan

## Phase 1 — Foundation + Database + Authentication

STATUS: COMPLETED

Implemented:

- Project foundation
- PostgreSQL
- Prisma
- NestJS backend
- React frontend
- Shared package
- Authentication
- User roles
- Business/shop foundation
- Database migrations
- Seed data

Phase 1 authentication tests passed.

---

## Phase 2 — Shop Settings, Categories & Customers

STATUS: IMPLEMENTATION SUBSTANTIALLY COMPLETED / VERIFICATION PENDING

Implemented:

### Settings

- Business/shop settings
- Configurable GST
- Gold 22K rate
- Gold 24K rate
- Silver rate
- Current rate display
- Rate history support
- `rateDate`

### Categories

- Category listing
- Category creation
- Category editing
- Active/inactive status
- Metal type
- GST override support
- Duplicate detection

### Customers

- Customer directory
- Search
- Pagination
- Customer profile
- Customer ledger view
- Customer creation
- Customer editing
- Debit/Credit opening balance
- Opening ledger entry
- Historical transaction protection
- Customer active/inactive status

### Frontend

- Dashboard
- Customers
- Categories
- Shop Settings
- Metal rate ticker

### Testing completed

21 unit tests currently pass.

Full workspace build currently passes.

---

## 10. Known Phase 2 Issue

An E2E test file currently fails.

The reported failure occurs during NestJS application bootstrapping inside the Vitest E2E environment.

The reported symptoms include:

- `validateAndLogin` being undefined
- 500 response from auth login inside the E2E test
- undefined cookies
- cascading undefined category ID

The reported suspected cause is a Vitest + NestJS + Supertest + CommonJS/ESM test-environment interoperability issue involving `cookieParser`.

IMPORTANT:

Do not assume that this means the production application authentication is broken.

Phase 1 authentication worked and the 21 unit tests pass.

Before changing application code, inspect the E2E test configuration and determine whether the problem is isolated to the test runner.

Do not spend excessive effort rewriting the application merely to solve a test-environment problem.

---

## 11. Current Phase 2 Verification Priority

Before declaring Phase 2 completely verified, inspect and manually verify:

1. Admin login
2. Staff login
3. Settings viewing/updating
4. GST configuration
5. Metal rate update
6. Metal rate display
7. Category creation/editing
8. Category activation/deactivation
9. Customer creation
10. Debit opening balance
11. Credit opening balance
12. Customer ledger entry
13. Customer search
14. Customer editing
15. Customer active/inactive behavior
16. Historical customer deletion protection
17. Backend authorization
18. Existing Phase 1 authentication

Pay particular attention to customer opening balance and ledger consistency.

---

# 12. Future / Deferred Modules

The following are NOT part of the current Phase 2 implementation:

- Supplier management
- Karigar management
- Purchase management
- Product Master
- Product IDs
- SKU
- Barcode management
- Piece-level inventory
- Stock management
- Stock ledger
- Detailed inventory
- Advanced accounting
- Multi-branch
- Multi-tenant SaaS
- Mobile application
- External integrations

These may be considered in future phases.

Do not implement them unless explicitly approved.

---

# 13. Planned Future Phases

## Phase 3

Sales / billing:

- Sales invoice
- Bill creation
- Bill items
- Jewellery attributes
- Payments
- Invoice generation
- Printing

## Phase 4

- Customer ledger improvements
- Returns
- Adjustments

## Phase 5

- Dashboard improvements
- Sales reports
- Category-wise analytics
- Date/month reporting

## Phase 6

- Audit logs
- Data export
- Backup
- Security hardening

## Phase 7+

Optional future modules:

- Suppliers
- Karigars
- Purchases
- Inventory
- Stock
- Other advanced ERP functionality

## Production

Later:

- VPS/cloud deployment
- HTTPS
- Domain
- Database backups
- Monitoring
- Production security

---

# 14. Development Rules for AI Coding Agents

Before making changes:

1. Inspect the existing repository.
2. Read `PROJECT_CONTEXT.md`.
3. Read `implementation_plan.md`.
4. Inspect the actual implementation.
5. Do not assume missing features without checking the code.
6. Preserve the approved architecture.
7. Make the smallest appropriate changes.
8. Avoid unnecessary dependencies.
9. Do not implement future phases without explicit approval.
10. Do not redesign working modules unnecessarily.
11. Do not hardcode secrets.
12. Do not expose `.env` contents.
13. Do not reset/destroy the database unnecessarily.

The AI coding agent should implement only the task explicitly requested.

If a task is ambiguous, inspect the existing design and preserve established decisions rather than inventing a new architecture.

---

# 15. Git Responsibility

Git operations are handled by the project owner.

AI coding agents must NOT:

- git add
- git commit
- git push
- git reset
- git checkout
- rewrite Git history

The developer/project owner will review changes and create Git checkpoints.

---

# 16. Current Handoff State

Current repository state:

- Phase 1: COMPLETED
- Phase 2: SUBSTANTIALLY IMPLEMENTED
- Phase 2 unit tests: 21 passing
- Full build: passing
- Phase 2 E2E test: currently failing due to test-environment issue
- Detailed manual verification: pending
- Git checkpoint: to be created by project owner

The next developer/AI agent should NOT restart Phase 1.

The next task should be to inspect the current Phase 2 implementation and complete/verify only what is necessary.

Do NOT begin Phase 3 until Phase 2 has been reviewed and explicitly approved.

---

# 17. Important Principle

SUVARNA should remain practical for small jewellery businesses.

Avoid unnecessary enterprise complexity.

Prefer:

- Simple workflows
- Clear data models
- Reliable financial calculations
- Strong authorization
- Maintainable modular code
- Incremental development
- Verifiable phases

The system should be capable of expanding later without forcing complex inventory/product tracking into the base version.
