import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BillingService } from './billing.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRole, UserDto } from '@jewellery-erp/shared';

describe('BillingService', () => {
  let billingService: BillingService;
  let mockPrismaService: any;

  const mockStaffUser: UserDto = {
    id: 'user-staff-1',
    email: 'staff@jewellery.com',
    name: 'Counter Cashier (Staff)',
    role: UserRole.STAFF,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const mockAdminUser: UserDto = {
    id: 'user-admin-1',
    email: 'admin@jewellery.com',
    name: 'Shop Owner (Admin)',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const mockCustomer = {
    id: 'cust-1',
    name: 'Ramesh Patel',
    phone: '9876543210',
    email: 'ramesh@example.com',
    address: 'Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    openingBalance: 0,
    openingBalanceType: 'DEBIT',
    currentBalance: 0,
    isActive: true,
    createdAt: new Date(),
  };

  const mockSettings = {
    id: 'default',
    shopName: 'Shree Gold & Silver Jewellers',
    state: 'Maharashtra',
    stateCode: '27',
    defaultGstRate: 3.0,
    todayGold24kRate: 7850.0,
    todayGold22kRate: 7250.0,
    todayGold20kRate: 6600.0,
    todayGold18kRate: 5950.0,
    todayGold14kRate: 4600.0,
    todaySilverRate: 92.0,
  };

  beforeEach(() => {
    mockPrismaService = {
      customer: {
        findUnique: vi.fn(),
      },
      businessSettings: {
        findUnique: vi.fn(),
      },
      category: {
        findUnique: vi.fn(),
      },
      salesInvoice: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      salesInvoiceItem: {
        deleteMany: vi.fn(),
      },
      paymentReceipt: {
        create: vi.fn(),
        deleteMany: vi.fn(),
      },
      salesInvoiceHistory: {
        create: vi.fn(),
      },
      billCorrectionRequest: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => cb(mockPrismaService)),
    };

    billingService = new BillingService(mockPrismaService);
  });

  describe('Invoice Number Generation', () => {
    it('should generate DDMMYYYY + 000001 sequence for first bill of the day', async () => {
      mockPrismaService.salesInvoice.findFirst.mockResolvedValue(null);

      const invoiceNumber = await billingService.generateInvoiceNumber();
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear());
      const expectedPrefix = `${day}${month}${year}`;

      expect(invoiceNumber).toBe(`${expectedPrefix}000001`);
    });

    it('should increment existing sequence atomically', async () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear());
      const expectedPrefix = `${day}${month}${year}`;

      mockPrismaService.salesInvoice.findFirst.mockResolvedValue({
        invoiceNumber: `${expectedPrefix}000042`,
      });

      const invoiceNumber = await billingService.generateInvoiceNumber();
      expect(invoiceNumber).toBe(`${expectedPrefix}000043`);
    });
  });

  describe('Bill Creation & Full Payment', () => {
    it('should create bill with multiple items and full payment', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.businessSettings.findUnique.mockResolvedValue(mockSettings);
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-ring',
        name: 'Ring',
        gstRate: 3.0,
        discountRate: 5.0,
      });
      mockPrismaService.salesInvoice.findFirst.mockResolvedValue(null);

      const mockSavedInvoice = {
        id: 'inv-1',
        invoiceNumber: '18092026000001',
        invoiceDate: new Date(),
        customerId: mockCustomer.id,
        customerName: mockCustomer.name,
        customerPhone: mockCustomer.phone,
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
        createdById: mockStaffUser.id,
        createdBy: { id: mockStaffUser.id, name: mockStaffUser.name, role: mockStaffUser.role },
        editCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: 'item-1',
            invoiceId: 'inv-1',
            categoryId: 'cat-ring',
            categoryName: 'Ring',
            description: '22K Gold Handcrafted Ring',
            designStyle: 'Traditional',
            metalType: 'GOLD',
            purity: '22K (916)',
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
            discountPercentage: 5.0,
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
            id: 'pay-1',
            receiptNumber: 'REC-18092026000001',
            date: new Date(),
            invoiceId: 'inv-1',
            customerId: mockCustomer.id,
            paymentMode: 'UPI',
            amount: 37183,
            createdAt: new Date(),
          },
        ],
      };

      mockPrismaService.salesInvoice.create.mockResolvedValue(mockSavedInvoice);

      const result = await billingService.createBill(
        {
          customerId: 'cust-1',
          items: [
            {
              categoryId: 'cat-ring',
              categoryName: 'Ring',
              description: '22K Gold Handcrafted Ring',
              designStyle: 'Traditional',
              metalType: 'GOLD',
              purity: '22K (916)',
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
        },
        mockStaffUser,
      );

      expect(result.invoiceNumber).toBe('18092026000001');
      expect(result.netAmount).toBe(37183);
      expect(result.paidAmount).toBe(37183);
      expect(result.balanceAmount).toBe(0);
      expect(result.items[0].ratePerTola).toBe(81646.6);
      expect(mockPrismaService.salesInvoice.create).toHaveBeenCalled();
    });

    it('should dynamically read configured GST rate from settings (e.g. 5.0%) and snapshot into bill', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.businessSettings.findUnique.mockResolvedValue({
        ...mockSettings,
        defaultGstRate: 5.0, // Configured 5% GST instead of default 3%
      });
      mockPrismaService.salesInvoice.findFirst.mockResolvedValue(null);

      mockPrismaService.salesInvoice.create.mockImplementation((args: any) => {
        return Promise.resolve({
          id: 'inv-gst-test',
          invoiceNumber: args.data.invoiceNumber,
          invoiceDate: new Date(),
          customerId: mockCustomer.id,
          customerName: mockCustomer.name,
          grossItemsAmount: args.data.grossItemsAmount,
          totalDiscount: args.data.totalDiscount,
          taxableAmount: args.data.taxableAmount,
          gstRate: args.data.gstRate, // Must be 5.0
          cgstAmount: args.data.cgstAmount,
          sgstAmount: args.data.sgstAmount,
          igstAmount: args.data.igstAmount,
          totalTaxAmount: args.data.totalTaxAmount,
          roundOff: args.data.roundOff,
          netAmount: args.data.netAmount,
          paidAmount: args.data.paidAmount,
          balanceAmount: 0,
          status: 'ACTIVE',
          createdById: mockStaffUser.id,
          editCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
          payments: [],
        });
      });

      const result = await billingService.createBill(
        {
          customerId: 'cust-1',
          items: [
            {
              categoryName: 'Gold Bar',
              description: 'Pure Gold Bar',
              metalType: 'GOLD',
              purity: '24K (999)',
              netWeight: 10,
              metalRatePerGram: 8000,
            },
          ],
          paymentMode: 'CASH',
        },
        mockStaffUser,
      );

      // Metal Value = 10 * 8000 = 80,000
      // Taxable = 80,000
      // GST 5% = 4000 (CGST 2000, SGST 2000)
      // Net Amount = 84,000
      expect(result.gstRate).toBe(5.0);
      expect(result.totalTaxAmount).toBe(4000);
      expect(result.cgstAmount).toBe(2000);
      expect(result.sgstAmount).toBe(2000);
      expect(result.netAmount).toBe(84000);
    });

    it('should throw BadRequestException if no items are provided', async () => {
      await expect(
        billingService.createBill(
          {
            customerId: 'cust-1',
            items: [],
            paymentMode: 'CASH',
          },
          mockStaffUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if customer is not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(
        billingService.createBill(
          {
            customerId: 'non-existent',
            items: [
              {
                categoryName: 'Ring',
                description: 'Gold Ring',
                metalType: 'GOLD',
                purity: '22K',
                netWeight: 5,
                metalRatePerGram: 7000,
              },
            ],
            paymentMode: 'CASH',
          },
          mockStaffUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Staff vs Admin Edit Permissions & History', () => {
    const baseInvoice = {
      id: 'inv-1',
      invoiceNumber: '18092026000001',
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
      createdById: 'user-staff-1',
      createdBy: { id: 'user-staff-1', name: 'Staff Cashier', role: UserRole.STAFF },
      editCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      history: [],
      items: [],
      payments: [],
    };

    it('should permit Staff to make ONE direct edit within 30 minutes on staff bill', async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const invoice = { ...baseInvoice, createdAt: tenMinutesAgo, editCount: 0 };
      mockPrismaService.salesInvoice.findUnique.mockResolvedValue(invoice);
      mockPrismaService.businessSettings.findUnique.mockResolvedValue(mockSettings);

      const updatedInvoiceMock = {
        ...invoice,
        editCount: 1,
        lastEditedById: mockStaffUser.id,
        items: [],
        payments: [],
      };
      mockPrismaService.salesInvoice.update.mockResolvedValue(updatedInvoiceMock);

      const result = await billingService.updateBill(
        'inv-1',
        {
          items: [
            {
              categoryName: 'Ring',
              description: 'Gold Ring Modified',
              metalType: 'GOLD',
              purity: '22K',
              netWeight: 5,
              metalRatePerGram: 7000,
            },
          ],
          paymentMode: 'CASH',
          changeReason: 'Customer requested ring change',
        },
        mockStaffUser,
      );

      expect(mockPrismaService.salesInvoiceHistory.create).toHaveBeenCalled();
      expect(result.editCount).toBe(1);
    });

    it('should reject Staff attempting a second direct edit', async () => {
      const invoice = { ...baseInvoice, editCount: 1, createdAt: new Date() };
      mockPrismaService.salesInvoice.findUnique.mockResolvedValue(invoice);

      await expect(
        billingService.updateBill(
          'inv-1',
          {
            items: [
              {
                categoryName: 'Ring',
                description: 'Attempted 2nd edit',
                metalType: 'GOLD',
                purity: '22K',
                netWeight: 5,
                metalRatePerGram: 7000,
              },
            ],
            paymentMode: 'CASH',
          },
          mockStaffUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject Staff attempting an edit after 30 minutes', async () => {
      const fortyFiveMinutesAgo = new Date(Date.now() - 45 * 60 * 1000);
      const invoice = { ...baseInvoice, editCount: 0, createdAt: fortyFiveMinutesAgo };
      mockPrismaService.salesInvoice.findUnique.mockResolvedValue(invoice);

      await expect(
        billingService.updateBill(
          'inv-1',
          {
            items: [
              {
                categoryName: 'Ring',
                description: 'Late edit',
                metalType: 'GOLD',
                purity: '22K',
                netWeight: 5,
                metalRatePerGram: 7000,
              },
            ],
            paymentMode: 'CASH',
          },
          mockStaffUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject Staff attempting to edit an Admin-created bill', async () => {
      const adminCreatedInvoice = {
        ...baseInvoice,
        createdById: mockAdminUser.id,
        createdBy: { id: mockAdminUser.id, name: mockAdminUser.name, role: UserRole.ADMIN },
        editCount: 0,
        createdAt: new Date(),
      };
      mockPrismaService.salesInvoice.findUnique.mockResolvedValue(adminCreatedInvoice);

      await expect(
        billingService.updateBill(
          'inv-1',
          {
            items: [
              {
                categoryName: 'Ring',
                description: 'Staff trying to edit Admin bill',
                metalType: 'GOLD',
                purity: '22K',
                netWeight: 5,
                metalRatePerGram: 7000,
              },
            ],
            paymentMode: 'CASH',
          },
          mockStaffUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should permit Admin to edit after 30 minutes with unlimited edits at any time', async () => {
      const twoHoursAgo = new Date(Date.now() - 120 * 60 * 1000);
      const invoice = { ...baseInvoice, editCount: 2, createdAt: twoHoursAgo };
      mockPrismaService.salesInvoice.findUnique.mockResolvedValue(invoice);
      mockPrismaService.businessSettings.findUnique.mockResolvedValue(mockSettings);

      const updatedInvoiceMock = {
        ...invoice,
        editCount: 3,
        lastEditedById: mockAdminUser.id,
        items: [],
        payments: [],
      };
      mockPrismaService.salesInvoice.update.mockResolvedValue(updatedInvoiceMock);

      const result = await billingService.updateBill(
        'inv-1',
        {
          items: [
            {
              categoryName: 'Necklace',
              description: 'Admin corrected necklace weight',
              metalType: 'GOLD',
              purity: '22K',
              netWeight: 20,
              metalRatePerGram: 7250,
            },
          ],
          paymentMode: 'CARD',
          changeReason: 'Admin audit correction',
        },
        mockAdminUser,
      );

      expect(mockPrismaService.salesInvoiceHistory.create).toHaveBeenCalled();
      expect(result.editCount).toBe(3);
    });

    it('should allow updating customer on existing bill during edit', async () => {
      const invoice = { ...baseInvoice, editCount: 0, createdAt: new Date() };
      mockPrismaService.salesInvoice.findUnique.mockResolvedValue(invoice);
      mockPrismaService.businessSettings.findUnique.mockResolvedValue(mockSettings);
      mockPrismaService.customer.findUnique.mockResolvedValue({
        id: 'cust-2',
        name: 'Suresh Shah',
        phone: '9822012345',
      });

      const updatedInvoiceMock = {
        ...invoice,
        customerId: 'cust-2',
        customerName: 'Suresh Shah',
        customerPhone: '9822012345',
        editCount: 1,
        items: [],
        payments: [],
      };
      mockPrismaService.salesInvoice.update.mockResolvedValue(updatedInvoiceMock);

      const result = await billingService.updateBill(
        'inv-1',
        {
          customerId: 'cust-2',
          items: [
            {
              categoryName: 'Ring',
              description: 'Gold Ring',
              metalType: 'GOLD',
              purity: '22K',
              netWeight: 5,
              metalRatePerGram: 7000,
            },
          ],
          paymentMode: 'CASH',
          changeReason: 'Reassigned to Suresh Shah',
        },
        mockAdminUser,
      );

      expect(result.customerId).toBe('cust-2');
      expect(result.customerName).toBe('Suresh Shah');
    });

    it('should allow Staff to raise a correction request for staff-created bills', async () => {
      mockPrismaService.salesInvoice.findUnique.mockResolvedValue(baseInvoice);
      mockPrismaService.billCorrectionRequest.create.mockResolvedValue({
        id: 'req-1',
        invoiceId: 'inv-1',
        requestedById: mockStaffUser.id,
        requestedByName: mockStaffUser.name,
        requestedByRole: mockStaffUser.role,
        reason: 'Customer requested address update after 30m window',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        invoice: { invoiceNumber: baseInvoice.invoiceNumber, customerName: baseInvoice.customerName },
      });

      const request = await billingService.createCorrectionRequest(
        'inv-1',
        'Customer requested address update after 30m window',
        mockStaffUser,
      );

      expect(request.status).toBe('PENDING');
      expect(request.requestedById).toBe(mockStaffUser.id);
      expect(mockPrismaService.billCorrectionRequest.create).toHaveBeenCalled();
    });

    it('should reject correction request for Admin-created bills', async () => {
      const adminCreatedInvoice = {
        ...baseInvoice,
        createdBy: { id: mockAdminUser.id, name: mockAdminUser.name, role: UserRole.ADMIN },
      };
      mockPrismaService.salesInvoice.findUnique.mockResolvedValue(adminCreatedInvoice);

      await expect(
        billingService.createCorrectionRequest(
          'inv-1',
          'Attempt correction request on admin bill',
          mockStaffUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Admin Bill Invalidation & Restoration', () => {
    const activeInvoice = {
      id: 'inv-1',
      invoiceNumber: '18092026000001',
      invoiceDate: new Date(),
      netAmount: 50000,
      status: 'ACTIVE',
      createdById: 'user-staff-1',
      createdBy: { id: 'user-staff-1', name: 'Staff Cashier', role: UserRole.STAFF },
      history: [],
      items: [],
      payments: [],
    };

    it('should allow Admin to invalidate a bill with reason', async () => {
      mockPrismaService.salesInvoice.findUnique.mockResolvedValue(activeInvoice);
      mockPrismaService.salesInvoice.update.mockResolvedValue({
        ...activeInvoice,
        status: 'INVALID',
        invalidationReason: 'Customer returned items immediately',
        invalidatedAt: new Date(),
        invalidatedById: mockAdminUser.id,
      });

      const result = await billingService.invalidateBill(
        'inv-1',
        'Customer returned items immediately',
        mockAdminUser,
      );

      expect(result.status).toBe('INVALID');
      expect(mockPrismaService.salesInvoiceHistory.create).toHaveBeenCalled();
    });

    it('should reject Staff attempting to invalidate a bill with ForbiddenException', async () => {
      await expect(
        billingService.invalidateBill('inv-1', 'Staff attempt', mockStaffUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow Admin to restore an INVALID bill to ACTIVE', async () => {
      const invalidInvoice = {
        ...activeInvoice,
        status: 'INVALID',
        invalidationReason: 'Mistakenly invalidated',
      };
      mockPrismaService.salesInvoice.findUnique.mockResolvedValue(invalidInvoice);
      mockPrismaService.salesInvoice.update.mockResolvedValue({
        ...invalidInvoice,
        status: 'ACTIVE',
        restoredAt: new Date(),
        restoredById: mockAdminUser.id,
      });

      const result = await billingService.restoreBill('inv-1', 'Restoring bill', mockAdminUser);

      expect(result.status).toBe('ACTIVE');
      expect(mockPrismaService.salesInvoiceHistory.create).toHaveBeenCalled();
    });

    it('should reject restoring a bill that is already ACTIVE', async () => {
      mockPrismaService.salesInvoice.findUnique.mockResolvedValue(activeInvoice);

      await expect(
        billingService.restoreBill('inv-1', 'Already active', mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Sales Analytics Integrity', () => {
    it('should exclude INVALID bills from total sales amount', async () => {
      mockPrismaService.salesInvoice.findMany.mockResolvedValue([
        { netAmount: 25000 },
        { netAmount: 35000 },
      ]);
      mockPrismaService.salesInvoice.count.mockResolvedValue(1); // 1 invalid bill

      const analytics = await billingService.getSalesAnalytics();

      expect(analytics.totalSalesAmount).toBe(60000);
      expect(analytics.totalValidBills).toBe(2);
      expect(analytics.invalidBillsCount).toBe(1);
    });
  });

  describe('Rate Snapshots for Configured Purity Rates', () => {
    it('should snapshot configured 24K, 22K, 20K, 18K, 14K Gold and Silver rates directly from Settings without mathematical derivation', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.businessSettings.findUnique.mockResolvedValue(mockSettings);
      mockPrismaService.salesInvoice.findFirst.mockResolvedValue(null);

      let capturedData: any = null;
      mockPrismaService.salesInvoice.create.mockImplementation((args: any) => {
        capturedData = args.data;
        return Promise.resolve({
          ...capturedData,
          id: 'inv-rate-snapshot',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: { id: mockStaffUser.id, name: mockStaffUser.name, role: mockStaffUser.role },
          items: [],
          payments: [],
        });
      });

      await billingService.createBill(
        {
          customerId: 'cust-1',
          items: [
            {
              categoryName: 'Gold Ring',
              description: '22K Ring',
              metalType: 'GOLD',
              purity: '22K (916)',
              netWeight: 5,
              metalRatePerGram: 7250,
            },
          ],
          paymentMode: 'CASH',
        },
        mockStaffUser,
      );

      expect(capturedData.goldRate24k).toBe(7850);
      expect(capturedData.goldRate22k).toBe(7250);
      expect(capturedData.goldRate20k).toBe(6600);
      expect(capturedData.goldRate18k).toBe(5950);
      expect(capturedData.goldRate14k).toBe(4600);
      expect(capturedData.silverRate).toBe(92);
    });
  });
});
