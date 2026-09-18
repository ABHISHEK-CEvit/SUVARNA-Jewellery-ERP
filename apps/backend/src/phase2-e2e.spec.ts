import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import supertest from 'supertest';
const request: any = typeof supertest === 'function' ? supertest : ((supertest as any).default || supertest);
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaService } from './prisma.service';

import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { SettingsController } from './modules/settings/settings.controller';
import { SettingsService } from './modules/settings/settings.service';
import { CategoriesController } from './modules/categories/categories.controller';
import { CategoriesService } from './modules/categories/categories.service';
import { CustomersController } from './modules/customers/customers.controller';
import { CustomersService } from './modules/customers/customers.service';
import { UsersController } from './modules/users/users.controller';
import { UsersService } from './modules/users/users.service';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/jewellery_erp?schema=public';

// Configure NestJS constructor injection metadata for Vitest/esbuild environment
Reflect.defineMetadata('design:paramtypes', [AuthService], AuthController);
Reflect.defineMetadata('design:paramtypes', [PrismaService], AuthService);
Reflect.defineMetadata('design:paramtypes', [SettingsService], SettingsController);
Reflect.defineMetadata('design:paramtypes', [PrismaService], SettingsService);
Reflect.defineMetadata('design:paramtypes', [CategoriesService], CategoriesController);
Reflect.defineMetadata('design:paramtypes', [PrismaService], CategoriesService);
Reflect.defineMetadata('design:paramtypes', [CustomersService], CustomersController);
Reflect.defineMetadata('design:paramtypes', [PrismaService], CustomersService);
Reflect.defineMetadata('design:paramtypes', [UsersService], UsersController);
Reflect.defineMetadata('design:paramtypes', [PrismaService], UsersService);
Reflect.defineMetadata('design:paramtypes', [PrismaService], AuthGuard);
Reflect.defineMetadata('design:paramtypes', [Reflector], RolesGuard);

describe('Phase 2 E2E Integration & RBAC Verification', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminCookie: string;
  let staffCookie: string;
  let testCategoryId: string;
  let testCustomerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const cookieMiddleware = (cookieParser as any).default || cookieParser;
    app = moduleFixture.createNestApplication();
    app.use(cookieMiddleware());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Clean up test records
    try {
      if (testCustomerId) {
        await prisma.customerLedgerEntry.deleteMany({ where: { customerId: testCustomerId } });
        await prisma.customer.deleteMany({ where: { id: testCustomerId } });
      }
      if (testCategoryId) {
        await prisma.category.deleteMany({ where: { id: testCategoryId } });
      }
    } catch (e) {
      // Ignore cleanup error
    }
    await app.close();
  }, 30000);

  // 1. PHASE 1 AUTH VERIFICATION
  describe('Phase 1 Auth Verification', () => {
    it('should log in as Admin and receive session_id cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@jewellery.com', password: 'admin123' });

      if (res.status !== 200 && res.status !== 201) {
        console.error('LOGIN FAILED:', res.status, res.body);
      }

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('ADMIN');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      adminCookie = cookies.find((c: string) => c.startsWith('session_id='));
      expect(adminCookie).toBeDefined();
    });

    it('should log in as Staff and receive session_id cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'staff@jewellery.com', password: 'staff123' });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('STAFF');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      staffCookie = cookies.find((c: string) => c.startsWith('session_id='));
      expect(staffCookie).toBeDefined();
    });

    it('should block unauthenticated requests to protected endpoints', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/settings');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // 2. PHASE 2 SHOP SETTINGS & METAL RATES
  describe('Phase 2 Settings & Metal Rates', () => {
    it('should allow both Admin and Staff to view settings', async () => {
      const resStaff = await request(app.getHttpServer())
        .get('/api/v1/settings')
        .set('Cookie', staffCookie);
      expect(resStaff.status).toBe(200);
      expect(resStaff.body.data.shopName).toBeDefined();

      const resAdmin = await request(app.getHttpServer())
        .get('/api/v1/settings')
        .set('Cookie', adminCookie);
      expect(resAdmin.status).toBe(200);
      expect(resAdmin.body.data.shopName).toBeDefined();
    });

    it('should block Staff from modifying settings with 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/settings')
        .set('Cookie', staffCookie)
        .send({
          shopName: 'Hacked Store',
          invoicePrefix: 'HACK',
          defaultGstRate: 5.0,
          todayGold22kRate: 9000,
          todayGold24kRate: 10000,
          todaySilverRate: 100,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow Admin to update settings and daily metal rates', async () => {
      const updateData = {
        shopName: 'Shree Gold & Silver Jewellers',
        tagline: 'Pure & Hallmark Certified',
        address: 'Bazaar Main Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        stateCode: '27',
        phone: '+91 98765 43210',
        email: 'contact@shreejewellers.com',
        gstin: '27AAAAA0000A1Z5',
        pan: 'ABCDE1234F',
        invoicePrefix: 'INV',
        defaultGstRate: 3.0,
        todayGold22kRate: 7280.0,
        todayGold24kRate: 7880.0,
        todaySilverRate: 92.5,
      };

      const res = await request(app.getHttpServer())
        .put('/api/v1/settings')
        .set('Cookie', adminCookie)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.todayGold22kRate).toBe(7280.0);
    });

    it('should return rates history containing the updated rate date snapshot', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/settings/rates-history')
        .set('Cookie', staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].rateDate).toBeDefined();
      expect(res.body.data[0].gold22kRate).toBe(7280.0);
    });

    it('should return latest rates via /api/v1/settings/rates', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/settings/rates')
        .set('Cookie', staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.gold22kRate).toBe(7280.0);
      expect(res.body.data.silverRate).toBe(92.5);
    });
  });

  // 3. PHASE 2 CATEGORIES
  describe('Phase 2 Jewellery Categories', () => {
    it('should allow Staff to list categories', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .set('Cookie', staffCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should block Staff from creating a category with 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Cookie', staffCookie)
        .send({
          name: 'Staff Unauthorized Category',
          metalType: 'GOLD',
          defaultPurity: '916',
          defaultHsnCode: '7113',
          gstRate: 3.0,
        });

      expect(res.status).toBe(403);
    });

    it('should allow Admin to create a category with configurable GST rate', async () => {
      const uniqueName = `Test Antique Pendant ${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Cookie', adminCookie)
        .send({
          name: uniqueName,
          metalType: 'GOLD',
          defaultPurity: '916',
          defaultHsnCode: '7113',
          gstRate: 3.0,
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe(uniqueName);
      expect(res.body.data.gstRate).toBe(3.0);
      testCategoryId = res.body.data.id;
    });

    it('should reject duplicate category names with 409 Conflict', async () => {
      const cat = await prisma.category.findUnique({ where: { id: testCategoryId } });
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Cookie', adminCookie)
        .send({
          name: cat?.name,
          metalType: 'GOLD',
          defaultHsnCode: '7113',
          gstRate: 3.0,
        });

      expect(res.status).toBe(409);
    });

    it('should allow Admin to toggle category active status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${testCategoryId}/toggle-status`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });
  });

  // 4. PHASE 2 CUSTOMER MANAGEMENT & LEDGER INTEGRITY
  describe('Phase 2 Customer Management & Ledger Compatibility', () => {
    it('should allow Staff to create customer with DEBIT opening balance and generate CustomerLedgerEntry', async () => {
      const timestamp = Date.now();
      const res = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Cookie', staffCookie)
        .send({
          name: `Rameshchandra Mehta ${timestamp}`,
          phone: `987${String(timestamp).slice(-7)}`,
          email: `mehta${timestamp}@example.com`,
          city: 'Mumbai',
          state: 'Maharashtra',
          pan: 'ABCDE1234F',
          gstin: '27AAAAA0000A1Z5',
          openingBalance: 5000.0,
          openingBalanceType: 'DEBIT',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.openingBalance).toBe(5000.0);
      expect(res.body.data.openingBalanceType).toBe('DEBIT');
      expect(res.body.data.currentBalance).toBe(5000.0);

      testCustomerId = res.body.data.id;

      // Verify matching CustomerLedgerEntry was created in database
      const ledgerEntry = await prisma.customerLedgerEntry.findFirst({
        where: { customerId: testCustomerId },
      });

      expect(ledgerEntry).toBeDefined();
      expect(ledgerEntry?.entryType).toBe('OPENING_BALANCE');
      expect(Number(ledgerEntry?.debitAmount)).toBe(5000.0);
      expect(Number(ledgerEntry?.creditAmount)).toBe(0.0);
      expect(Number(ledgerEntry?.runningBalance)).toBe(5000.0);
    });

    it('should allow creating customer with CREDIT opening balance (advance payment)', async () => {
      const timestamp = Date.now() + 1;
      const res = await request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Cookie', staffCookie)
        .send({
          name: `Suman Lata Sharma ${timestamp}`,
          phone: `986${String(timestamp).slice(-7)}`,
          openingBalance: 2500.0,
          openingBalanceType: 'CREDIT',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.currentBalance).toBe(-2500.0);

      const custId = res.body.data.id;
      const ledgerEntry = await prisma.customerLedgerEntry.findFirst({
        where: { customerId: custId },
      });
      expect(Number(ledgerEntry?.creditAmount)).toBe(2500.0);
      expect(Number(ledgerEntry?.runningBalance)).toBe(-2500.0);

      // Cleanup
      await prisma.customerLedgerEntry.deleteMany({ where: { customerId: custId } });
      await prisma.customer.deleteMany({ where: { id: custId } });
    });

    it('should search customers by name, phone, or GSTIN', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/customers?search=Rameshchandra')
        .set('Cookie', staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.items[0].id).toBe(testCustomerId);
    });

    it('should fetch customer profile with ledger history', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/customers/${testCustomerId}/ledger`)
        .set('Cookie', staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].entryType).toBe('OPENING_BALANCE');
      expect(res.body.data[0].runningBalance).toBe(5000.0);
    });

    it('should reject hard delete of customer with historical ledger records', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/customers/${testCustomerId}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('historical financial ledger');
    });

    it('should allow toggling customer status between active and inactive', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/customers/${testCustomerId}/toggle-status`)
        .set('Cookie', staffCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });
  });
});
