import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomersService } from './customers.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CustomersService', () => {
  let customersService: CustomersService;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      customer: {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      customerLedgerEntry: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      $transaction: vi.fn(async (callback) => {
        return await callback(mockPrismaService);
      }),
    };
    customersService = new CustomersService(mockPrismaService);
  });

  it('should return paginated customers', async () => {
    mockPrismaService.customer.count.mockResolvedValue(1);
    mockPrismaService.customer.findMany.mockResolvedValue([
      {
        id: 'cust-1',
        name: 'Ramesh Patel',
        phone: '9876543210',
        email: 'ramesh@example.com',
        address: 'Bazaar Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pan: 'ABCDE1234F',
        gstin: null,
        openingBalance: 5000.0,
        openingBalanceType: 'DEBIT',
        currentBalance: 5000.0,
        isActive: true,
        createdAt: new Date('2026-09-18T10:00:00Z'),
      },
    ]);

    const result = await customersService.findAll({ search: 'Ramesh', page: 1, limit: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe('Ramesh Patel');
    expect(result.items[0].currentBalance).toBe(5000.0);
  });

  it('should create customer with DEBIT opening balance and create CustomerLedgerEntry', async () => {
    mockPrismaService.customer.create.mockResolvedValue({
      id: 'cust-2',
      name: 'Suresh Kumar',
      phone: '9123456780',
      email: null,
      address: null,
      city: null,
      state: null,
      pan: null,
      gstin: null,
      openingBalance: 10000.0,
      openingBalanceType: 'DEBIT',
      currentBalance: 10000.0,
      isActive: true,
      createdAt: new Date(),
    });

    const result = await customersService.create({
      name: 'Suresh Kumar',
      phone: '9123456780',
      openingBalance: 10000.0,
      openingBalanceType: 'DEBIT',
    });

    expect(result.name).toBe('Suresh Kumar');
    expect(result.currentBalance).toBe(10000.0);
    expect(mockPrismaService.customerLedgerEntry.create).toHaveBeenCalledWith({
      data: {
        customerId: 'cust-2',
        entryType: 'OPENING_BALANCE',
        debitAmount: 10000.0,
        creditAmount: 0.0,
        runningBalance: 10000.0,
        remarks: 'Opening Balance (DEBIT)',
      },
    });
  });

  it('should create customer with CREDIT opening balance and negative running balance', async () => {
    mockPrismaService.customer.create.mockResolvedValue({
      id: 'cust-3',
      name: 'Anjali Sharma',
      phone: '9988776655',
      email: null,
      address: null,
      city: null,
      state: null,
      pan: null,
      gstin: null,
      openingBalance: 3000.0,
      openingBalanceType: 'CREDIT',
      currentBalance: -3000.0,
      isActive: true,
      createdAt: new Date(),
    });

    const result = await customersService.create({
      name: 'Anjali Sharma',
      phone: '9988776655',
      openingBalance: 3000.0,
      openingBalanceType: 'CREDIT',
    });

    expect(result.currentBalance).toBe(-3000.0);
    expect(mockPrismaService.customerLedgerEntry.create).toHaveBeenCalledWith({
      data: {
        customerId: 'cust-3',
        entryType: 'OPENING_BALANCE',
        debitAmount: 0.0,
        creditAmount: 3000.0,
        runningBalance: -3000.0,
        remarks: 'Opening Balance (CREDIT)',
      },
    });
  });

  it('should not create ledger entry if opening balance is zero', async () => {
    mockPrismaService.customer.create.mockResolvedValue({
      id: 'cust-4',
      name: 'Kavita Roy',
      phone: '9876500000',
      email: null,
      address: null,
      city: null,
      state: null,
      pan: null,
      gstin: null,
      openingBalance: 0.0,
      openingBalanceType: 'DEBIT',
      currentBalance: 0.0,
      isActive: true,
      createdAt: new Date(),
    });

    await customersService.create({
      name: 'Kavita Roy',
      phone: '9876500000',
      openingBalance: 0.0,
      openingBalanceType: 'DEBIT',
    });

    expect(mockPrismaService.customerLedgerEntry.create).not.toHaveBeenCalled();
  });

  it('should reject hard-delete when customer has transaction history', async () => {
    mockPrismaService.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      name: 'Ramesh Patel',
      _count: {
        salesInvoices: 1,
        paymentReceipts: 0,
        ledgerEntries: 2,
      },
    });

    await expect(customersService.delete('cust-1')).rejects.toThrow(BadRequestException);
  });

  it('should allow hard-delete when customer has no transaction history', async () => {
    mockPrismaService.customer.findUnique.mockResolvedValue({
      id: 'cust-new',
      name: 'New Customer',
      _count: {
        salesInvoices: 0,
        paymentReceipts: 0,
        ledgerEntries: 0,
      },
    });
    mockPrismaService.customer.delete.mockResolvedValue({});

    const res = await customersService.delete('cust-new');
    expect(res.success).toBe(true);
    expect(mockPrismaService.customer.delete).toHaveBeenCalledWith({ where: { id: 'cust-new' } });
  });

  it('should toggle customer status', async () => {
    mockPrismaService.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      isActive: true,
    });
    mockPrismaService.customer.update.mockResolvedValue({
      id: 'cust-1',
      name: 'Ramesh Patel',
      phone: '9876543210',
      openingBalance: 0,
      openingBalanceType: 'DEBIT',
      currentBalance: 0,
      isActive: false,
      createdAt: new Date(),
    });

    const res = await customersService.toggleStatus('cust-1');
    expect(res.isActive).toBe(false);
  });
});
