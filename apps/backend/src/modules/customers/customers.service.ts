import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerDto,
  CustomerLedgerEntryDto,
  PaginatedResponse,
} from '@jewellery-erp/shared';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  private mapCustomer(c: any): CustomerDto {
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      city: c.city,
      state: c.state,
      pan: c.pan,
      gstin: c.gstin,
      openingBalance: Number(c.openingBalance),
      openingBalanceType: c.openingBalanceType as 'DEBIT' | 'CREDIT',
      currentBalance: Number(c.currentBalance),
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    };
  }

  private mapLedgerEntry(entry: any): CustomerLedgerEntryDto {
    return {
      id: entry.id,
      customerId: entry.customerId,
      date: entry.date.toISOString().split('T')[0],
      entryType: entry.entryType,
      debitAmount: Number(entry.debitAmount),
      creditAmount: Number(entry.creditAmount),
      runningBalance: Number(entry.runningBalance),
      referenceInvoiceId: entry.referenceInvoiceId,
      remarks: entry.remarks,
      createdAt: entry.createdAt.toISOString(),
    };
  }

  async findAll(params: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<CustomerDto>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { gstin: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, customers] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: customers.map((c) => this.mapCustomer(c)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string): Promise<CustomerDto & { ledgerEntries?: CustomerLedgerEntryDto[] }> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        ledgerEntries: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    return {
      ...this.mapCustomer(customer),
      ledgerEntries: customer.ledgerEntries.map((l) => this.mapLedgerEntry(l)),
    };
  }

  async create(input: CreateCustomerInput): Promise<CustomerDto> {
    const openingBalance = Number(input.openingBalance || 0);
    const openingBalanceType = input.openingBalanceType || 'DEBIT';

    // Positive balance = Debit (receivable / customer owes shop)
    // Negative balance = Credit (advance / shop owes customer)
    const currentBalance = openingBalanceType === 'CREDIT' ? -openingBalance : openingBalance;

    return await this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          name: input.name.trim(),
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          address: input.address?.trim() || null,
          city: input.city?.trim() || null,
          state: input.state?.trim() || null,
          pan: input.pan?.trim() || null,
          gstin: input.gstin?.trim() || null,
          openingBalance,
          openingBalanceType,
          currentBalance,
          isActive: true,
        },
      });

      if (openingBalance > 0) {
        await tx.customerLedgerEntry.create({
          data: {
            customerId: customer.id,
            entryType: 'OPENING_BALANCE',
            debitAmount: openingBalanceType === 'DEBIT' ? openingBalance : 0.0,
            creditAmount: openingBalanceType === 'CREDIT' ? openingBalance : 0.0,
            runningBalance: currentBalance,
            remarks: `Opening Balance (${openingBalanceType})`,
          },
        });
      }

      return this.mapCustomer(customer);
    });
  }

  async update(id: string, input: UpdateCustomerInput): Promise<CustomerDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.phone !== undefined && { phone: input.phone ? input.phone.trim() : null }),
        ...(input.email !== undefined && { email: input.email ? input.email.trim() : null }),
        ...(input.address !== undefined && { address: input.address ? input.address.trim() : null }),
        ...(input.city !== undefined && { city: input.city ? input.city.trim() : null }),
        ...(input.state !== undefined && { state: input.state ? input.state.trim() : null }),
        ...(input.pan !== undefined && { pan: input.pan ? input.pan.trim() : null }),
        ...(input.gstin !== undefined && { gstin: input.gstin ? input.gstin.trim() : null }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    return this.mapCustomer(updated);
  }

  async toggleStatus(id: string): Promise<CustomerDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: { isActive: !customer.isActive },
    });

    return this.mapCustomer(updated);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            salesInvoices: true,
            paymentReceipts: true,
            ledgerEntries: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    if (
      customer._count.salesInvoices > 0 ||
      customer._count.paymentReceipts > 0 ||
      customer._count.ledgerEntries > 0
    ) {
      throw new BadRequestException(
        'Customer has historical financial ledger records or transactions and cannot be permanently deleted. Please set status to Inactive instead.',
      );
    }

    await this.prisma.customer.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Customer "${customer.name}" deleted successfully`,
    };
  }

  async getCustomerLedger(customerId: string): Promise<CustomerLedgerEntryDto[]> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID "${customerId}" not found`);
    }

    const entries = await this.prisma.customerLedgerEntry.findMany({
      where: { customerId },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    return entries.map((e) => this.mapLedgerEntry(e));
  }
}
