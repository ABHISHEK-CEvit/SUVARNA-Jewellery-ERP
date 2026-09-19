import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import supertest from 'supertest';
const request: any = typeof supertest === 'function' ? supertest : ((supertest as any).default || supertest);
import * as cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaService } from './prisma.service';
import { BillingController } from './modules/billing/billing.controller';
import { BillingService } from './modules/billing/billing.service';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { UserRole } from '@jewellery-erp/shared';

// Reflection metadata for Vitest environment
Reflect.defineMetadata('design:paramtypes', [BillingService], BillingController);
Reflect.defineMetadata('design:paramtypes', [PrismaService], BillingService);
Reflect.defineMetadata('design:paramtypes', [PrismaService], AuthGuard);
Reflect.defineMetadata('design:paramtypes', [Reflector], RolesGuard);

describe('Phase 3 Billing E2E Workflows & API Tests', () => {
  let app: INestApplication;
  let mockPrismaService: any;

  const mockAdminUser = {
    id: 'admin-1',
    email: 'admin@jewellery.com',
    name: 'Admin Owner',
    role: UserRole.ADMIN,
    isActive: true,
  };

  const mockStaffUser = {
    id: 'staff-1',
    email: 'staff@jewellery.com',
    name: 'Staff Cashier',
    role: UserRole.STAFF,
    isActive: true,
  };

  let authenticatedUser: any = mockAdminUser;

  beforeAll(async () => {
    mockPrismaService = {
      user: {
        findUnique: vi.fn().mockImplementation(() => Promise.resolve(authenticatedUser)),
      },
      customer: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cust-1',
          name: 'Ramesh Patel',
          phone: '9876543210',
          state: 'Maharashtra',
        }),
      },
      businessSettings: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'default',
          shopName: 'Shree Jewellers',
          state: 'Maharashtra',
          stateCode: '27',
          defaultGstRate: 3.0,
          todayGold22kRate: 7250,
          todayGold24kRate: 7850,
          todaySilverRate: 92,
        }),
      },
      category: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cat-1',
          name: 'Ring',
          gstRate: 3.0,
          discountRate: 5.0,
        }),
      },
      salesInvoice: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
      },
      salesInvoiceItem: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      paymentReceipt: {
        create: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      salesInvoiceHistory: {
        create: vi.fn().mockResolvedValue({}),
      },
      billCorrectionRequest: {
        create: vi.fn().mockResolvedValue({
          id: 'req-1',
          invoiceId: 'inv-1',
          requestedById: 'staff-1',
          requestedByName: 'Staff Cashier',
          requestedByRole: 'STAFF',
          reason: 'Customer name spelling mistake',
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => cb(mockPrismaService)),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    const cookieMiddleware = (cookieParser as any).default || cookieParser;
    app = moduleFixture.createNestApplication();
    app.use(cookieMiddleware());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('POST /api/v1/billing — should create a new bill with multiple items and full payment', async () => {
    authenticatedUser = mockStaffUser;

    const mockSaved = {
      id: 'inv-1',
      invoiceNumber: '19092026000001',
      invoiceDate: new Date(),
      customerId: 'cust-1',
      customerName: 'Ramesh Patel',
      customerPhone: '9876543210',
      grossItemsAmount: 38000,
      totalDiscount: 1900,
      taxableAmount: 36100,
      gstRate: 3.0,
      cgstAmount: 541.5,
      sgstAmount: 541.5,
      igstAmount: 0,
      totalTaxAmount: 1083,
      roundOff: 0,
      netAmount: 37183,
      paidAmount: 37183,
      balanceAmount: 0,
      status: 'ACTIVE',
      createdById: 'staff-1',
      createdBy: { id: 'staff-1', name: 'Staff Cashier', role: 'STAFF' },
      editCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'item-1',
          invoiceId: 'inv-1',
          categoryId: 'cat-1',
          categoryName: 'Ring',
          description: 'Gold Ring',
          designStyle: 'Traditional',
          metalType: 'GOLD',
          purity: '22K',
          grossWeight: 5.5,
          stoneWeight: 0.5,
          netWeight: 5.0,
          metalRatePerGram: 7000,
          ratePerTola: 81646.6,
          metalValue: 35000,
          hasStone: true,
          stoneType: 'Ruby',
          stoneCharges: 1000,
          makingCharges: 2000,
          discountApplicable: true,
          discountPercentage: 5,
          discountAmount: 1900,
          itemSubtotal: 38000,
          taxableAmount: 36100,
          gstRate: 3.0,
          gstAmount: 1083,
          totalItemAmount: 37183,
        },
      ],
      payments: [
        {
          id: 'p-1',
          receiptNumber: 'REC-19092026000001',
          date: new Date(),
          invoiceId: 'inv-1',
          customerId: 'cust-1',
          paymentMode: 'UPI',
          amount: 37183,
          createdAt: new Date(),
        },
      ],
    };

    mockPrismaService.salesInvoice.create.mockResolvedValue(mockSaved);

    const res = await request(app.getHttpServer())
      .post('/api/v1/billing')
      .set('Cookie', [`session_id=${Buffer.from(JSON.stringify({ userId: mockStaffUser.id })).toString('base64')}`])
      .send({
        customerId: 'cust-1',
        items: [
          {
            categoryId: 'cat-1',
            categoryName: 'Ring',
            description: 'Gold Ring',
            designStyle: 'Traditional',
            metalType: 'GOLD',
            purity: '22K',
            grossWeight: 5.5,
            netWeight: 5.0,
            metalRatePerGram: 7000,
            hasStone: true,
            stoneType: 'Ruby',
            stoneWeight: 0.5,
            stoneCharges: 1000,
            makingCharges: 2000,
            discountApplicable: true,
            discountPercentage: 5,
          },
        ],
        paymentMode: 'UPI',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invoiceNumber).toBe('19092026000001');
    expect(res.body.data.netAmount).toBe(37183);
    expect(res.body.data.paidAmount).toBe(37183);
  });

  it('GET /api/v1/billing — should retrieve existing bills list', async () => {
    authenticatedUser = mockStaffUser;
    mockPrismaService.salesInvoice.findMany.mockResolvedValue([
      {
        id: 'inv-1',
        invoiceNumber: '19092026000001',
        invoiceDate: new Date(),
        customerId: 'cust-1',
        customerName: 'Ramesh Patel',
        grossItemsAmount: 38000,
        totalDiscount: 1900,
        taxableAmount: 36100,
        gstRate: 3.0,
        cgstAmount: 541.5,
        sgstAmount: 541.5,
        igstAmount: 0,
        totalTaxAmount: 1083,
        roundOff: 0,
        netAmount: 37183,
        paidAmount: 37183,
        balanceAmount: 0,
        status: 'ACTIVE',
        createdById: 'staff-1',
        editCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        payments: [],
      },
    ]);
    mockPrismaService.salesInvoice.count.mockResolvedValue(1);

    const res = await request(app.getHttpServer())
      .get('/api/v1/billing?search=Ramesh')
      .set('Cookie', [`session_id=${Buffer.from(JSON.stringify({ userId: mockStaffUser.id })).toString('base64')}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].customerName).toBe('Ramesh Patel');
  });

  it('GET /api/v1/billing/:id — should return single bill with full details for slip popup', async () => {
    authenticatedUser = mockStaffUser;
    mockPrismaService.salesInvoice.findFirst.mockResolvedValue({
      id: 'inv-1',
      invoiceNumber: '19092026000001',
      invoiceDate: new Date(),
      customerId: 'cust-1',
      customerName: 'Ramesh Patel',
      grossItemsAmount: 38000,
      totalDiscount: 1900,
      taxableAmount: 36100,
      gstRate: 3.0,
      cgstAmount: 541.5,
      sgstAmount: 541.5,
      igstAmount: 0,
      totalTaxAmount: 1083,
      roundOff: 0,
      netAmount: 37183,
      paidAmount: 37183,
      balanceAmount: 0,
      status: 'ACTIVE',
      createdById: 'staff-1',
      editCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
      payments: [],
      history: [],
      correctionRequests: [],
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/billing/19092026000001')
      .set('Cookie', [`session_id=${Buffer.from(JSON.stringify({ userId: mockStaffUser.id })).toString('base64')}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invoiceNumber).toBe('19092026000001');
  });

  it('PUT /api/v1/billing/:id — should allow Staff direct edit once within 30 min', async () => {
    authenticatedUser = mockStaffUser;

    const baseInv = {
      id: 'inv-1',
      invoiceNumber: '19092026000001',
      invoiceDate: new Date(),
      customerId: 'cust-1',
      customerName: 'Ramesh Patel',
      grossItemsAmount: 35000,
      totalDiscount: 0,
      taxableAmount: 35000,
      gstRate: 3.0,
      cgstAmount: 525,
      sgstAmount: 525,
      igstAmount: 0,
      totalTaxAmount: 1050,
      roundOff: 0,
      netAmount: 36050,
      paidAmount: 36050,
      balanceAmount: 0,
      status: 'ACTIVE',
      createdById: 'staff-1',
      createdBy: { id: 'staff-1', name: 'Staff Cashier', role: UserRole.STAFF },
      editCount: 0, // 0 edits so far
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago (< 30 min)
      updatedAt: new Date(),
      items: [],
      payments: [],
      history: [],
    };

    mockPrismaService.salesInvoice.findUnique.mockResolvedValue(baseInv);
    mockPrismaService.salesInvoice.update.mockResolvedValue({
      ...baseInv,
      editCount: 1,
      lastEditedById: 'staff-1',
    });

    const res = await request(app.getHttpServer())
      .put('/api/v1/billing/inv-1')
      .set('Cookie', [`session_id=${Buffer.from(JSON.stringify({ userId: mockStaffUser.id })).toString('base64')}`])
      .send({
        items: [
          {
            categoryName: 'Ring',
            description: 'Updated Ring Description',
            metalType: 'GOLD',
            purity: '22K',
            netWeight: 5,
            metalRatePerGram: 7000,
          },
        ],
        paymentMode: 'CASH',
        changeReason: 'Staff corrected ring description within 30 min window',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.editCount).toBe(1);
    expect(mockPrismaService.salesInvoiceHistory.create).toHaveBeenCalled();
  });

  it('PUT /api/v1/billing/:id — should block Staff 2nd direct edit with 403 Forbidden', async () => {
    authenticatedUser = mockStaffUser;

    const baseInv = {
      id: 'inv-1',
      invoiceNumber: '19092026000001',
      createdById: 'staff-1',
      createdBy: { id: 'staff-1', name: 'Staff Cashier', role: UserRole.STAFF },
      editCount: 1, // Already edited once!
      createdAt: new Date(),
      items: [],
      payments: [],
    };

    mockPrismaService.salesInvoice.findUnique.mockResolvedValue(baseInv);

    const res = await request(app.getHttpServer())
      .put('/api/v1/billing/inv-1')
      .set('Cookie', [`session_id=${Buffer.from(JSON.stringify({ userId: mockStaffUser.id })).toString('base64')}`])
      .send({
        items: [
          {
            categoryName: 'Ring',
            description: 'Attempt 2nd edit',
            netWeight: 5,
            metalRatePerGram: 7000,
            purity: '22K',
          },
        ],
        paymentMode: 'CASH',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Staff members can directly edit a bill only once');
  });

  it('POST /api/v1/billing/:id/correction-request — should allow Staff to submit correction request to Admin', async () => {
    authenticatedUser = mockStaffUser;
    mockPrismaService.salesInvoice.findUnique.mockResolvedValue({
      id: 'inv-1',
      invoiceNumber: '19092026000001',
      customerName: 'Ramesh Patel',
      createdBy: { id: 'staff-1', name: 'Staff Cashier', role: UserRole.STAFF },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/billing/inv-1/correction-request')
      .set('Cookie', [`session_id=${Buffer.from(JSON.stringify({ userId: mockStaffUser.id })).toString('base64')}`])
      .send({
        reason: 'Customer requested change to contact number after 30 min window',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
  });

  it('GET /api/v1/billing/correction-requests — should allow Admin to view requests', async () => {
    authenticatedUser = mockAdminUser;
    mockPrismaService.billCorrectionRequest.findMany.mockResolvedValue([
      {
        id: 'req-1',
        invoiceId: 'inv-1',
        requestedById: 'staff-1',
        requestedByName: 'Staff Cashier',
        requestedByRole: 'STAFF',
        reason: 'Customer requested change to contact number',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/api/v1/billing/correction-requests')
      .set('Cookie', [`session_id=${Buffer.from(JSON.stringify({ userId: mockAdminUser.id })).toString('base64')}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('POST /api/v1/billing/:id/invalidate — should allow Admin to invalidate a bill', async () => {
    authenticatedUser = mockAdminUser;
    const inv = {
      id: 'inv-1',
      invoiceNumber: '19092026000001',
      status: 'ACTIVE',
      netAmount: 50000,
      history: [],
      items: [],
      payments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      invoiceDate: new Date(),
    };
    mockPrismaService.salesInvoice.findUnique.mockResolvedValue(inv);
    mockPrismaService.salesInvoice.update.mockResolvedValue({
      ...inv,
      status: 'INVALID',
      invalidationReason: 'Customer returned items',
      invalidatedAt: new Date(),
      invalidatedById: mockAdminUser.id,
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/billing/inv-1/invalidate')
      .set('Cookie', [`session_id=${Buffer.from(JSON.stringify({ userId: mockAdminUser.id })).toString('base64')}`])
      .send({
        reason: 'Customer returned items',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('INVALID');
  });

  it('POST /api/v1/billing/:id/invalidate — should reject Staff with 403 Forbidden', async () => {
    authenticatedUser = mockStaffUser;

    const res = await request(app.getHttpServer())
      .post('/api/v1/billing/inv-1/invalidate')
      .set('Cookie', [`session_id=${Buffer.from(JSON.stringify({ userId: mockStaffUser.id })).toString('base64')}`])
      .send({
        reason: 'Staff trying to invalidate',
      });

    expect(res.status).toBe(403);
  });

  it('POST /api/v1/billing/:id/restore — should allow Admin to restore an INVALID bill', async () => {
    authenticatedUser = mockAdminUser;
    const invalidInv = {
      id: 'inv-1',
      invoiceNumber: '19092026000001',
      status: 'INVALID',
      netAmount: 50000,
      history: [],
      items: [],
      payments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      invoiceDate: new Date(),
    };
    mockPrismaService.salesInvoice.findUnique.mockResolvedValue(invalidInv);
    mockPrismaService.salesInvoice.update.mockResolvedValue({
      ...invalidInv,
      status: 'ACTIVE',
      restoredAt: new Date(),
      restoredById: mockAdminUser.id,
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/billing/inv-1/restore')
      .set('Cookie', [`session_id=${Buffer.from(JSON.stringify({ userId: mockAdminUser.id })).toString('base64')}`])
      .send({
        reason: 'Restoring by owner',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ACTIVE');
  });

  it('GET /api/v1/billing/analytics/summary — should allow Admin to get sales analytics', async () => {
    authenticatedUser = mockAdminUser;
    mockPrismaService.salesInvoice.findMany.mockResolvedValue([
      { netAmount: 10000 },
      { netAmount: 20000 },
    ]);
    mockPrismaService.salesInvoice.count.mockResolvedValue(1);

    const res = await request(app.getHttpServer())
      .get('/api/v1/billing/analytics/summary')
      .set('Cookie', [`session_id=${Buffer.from(JSON.stringify({ userId: mockAdminUser.id })).toString('base64')}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalSalesAmount).toBe(30000);
    expect(res.body.data.totalValidBills).toBe(2);
    expect(res.body.data.invalidBillsCount).toBe(1);
  });
});
