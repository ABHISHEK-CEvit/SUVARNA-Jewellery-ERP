import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  CreateSalesInvoiceInput,
  UpdateSalesInvoiceInput,
  SalesInvoiceDto,
  SalesInvoiceItemDto,
  PaymentReceiptDto,
  SalesInvoiceHistoryDto,
  BillCorrectionRequestDto,
  UserDto,
  UserRole,
} from '@jewellery-erp/shared';
import { calculateItem, calculateInvoice, CalculatedItem } from './billing.calculator';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a safe DDMMYYYY + 6-digit sequence invoice number
   * e.g. 19092026000001
   */
  async generateInvoiceNumber(tx?: any): Promise<string> {
    const prisma = tx || this.prisma;
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    const datePrefix = `${day}${month}${year}`;

    // Find the latest invoice created today with this prefix
    const latestInvoice = await prisma.salesInvoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: datePrefix,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
      select: {
        invoiceNumber: true,
      },
    });

    let nextSequence = 1;
    if (latestInvoice && latestInvoice.invoiceNumber.length === 14) {
      const currentSeq = parseInt(latestInvoice.invoiceNumber.substring(8), 10);
      if (!isNaN(currentSeq)) {
        nextSequence = currentSeq + 1;
      }
    }

    const sequenceStr = String(nextSequence).padStart(6, '0');
    return `${datePrefix}${sequenceStr}`;
  }

  private mapItem(item: any): SalesInvoiceItemDto {
    return {
      id: item.id,
      invoiceId: item.invoiceId,
      categoryId: item.categoryId || null,
      categoryName: item.categoryName || (item.category ? item.category.name : ''),
      description: item.description,
      designStyle: item.designStyle || null,
      metalType: item.metalType,
      purity: item.purity,
      grossWeight: Number(item.grossWeight),
      stoneWeight: Number(item.stoneWeight),
      stoneCarat: item.stoneCarat ? Number(item.stoneCarat) : null,
      netWeight: Number(item.netWeight),
      metalRatePerGram: Number(item.metalRatePerGram),
      ratePerTola: item.ratePerTola ? Number(item.ratePerTola) : null,
      metalValue: Number(item.metalValue),
      hasStone: Boolean(item.hasStone),
      stoneType: item.stoneType || null,
      stoneCharges: Number(item.stoneCharges),
      makingCharges: Number(item.makingCharges),
      discountApplicable: Boolean(item.discountApplicable),
      discountPercentage: Number(item.discountPercentage),
      discountAmount: Number(item.discountAmount),
      itemSubtotal: Number(item.itemSubtotal),
      taxableAmount: Number(item.taxableAmount),
      gstRate: Number(item.gstRate),
      gstAmount: Number(item.gstAmount),
      totalItemAmount: Number(item.totalItemAmount),
    };
  }

  private mapPayment(p: any): PaymentReceiptDto {
    return {
      id: p.id,
      receiptNumber: p.receiptNumber,
      date: p.date.toISOString(),
      invoiceId: p.invoiceId,
      customerId: p.customerId,
      paymentMode: p.paymentMode,
      amount: Number(p.amount),
      referenceNumber: p.referenceNumber || null,
      notes: p.notes || null,
      createdAt: p.createdAt.toISOString(),
    };
  }

  private mapHistory(h: any): SalesInvoiceHistoryDto {
    let snapshotParsed = {};
    try {
      snapshotParsed = typeof h.snapshot === 'string' ? JSON.parse(h.snapshot) : h.snapshot;
    } catch {
      snapshotParsed = h.snapshot;
    }

    let changedFieldsParsed = null;
    try {
      changedFieldsParsed = h.changedFields ? JSON.parse(h.changedFields) : null;
    } catch {
      changedFieldsParsed = h.changedFields;
    }

    return {
      id: h.id,
      invoiceId: h.invoiceId,
      version: h.version,
      snapshot: snapshotParsed,
      changeReason: h.changeReason,
      changedById: h.changedById,
      changedByName: h.changedByName,
      changedByRole: h.changedByRole,
      changedFields: changedFieldsParsed,
      createdAt: h.createdAt.toISOString(),
    };
  }

  private mapCorrectionRequest(r: any): BillCorrectionRequestDto {
    return {
      id: r.id,
      invoiceId: r.invoiceId,
      invoiceNumber: r.invoice?.invoiceNumber,
      customerName: r.invoice?.customerName,
      requestedById: r.requestedById,
      requestedByName: r.requestedByName,
      requestedByRole: r.requestedByRole,
      reason: r.reason,
      status: r.status as any,
      resolvedById: r.resolvedById,
      resolvedByName: r.resolvedByName,
      resolutionNotes: r.resolutionNotes,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  public mapInvoice(invoice: any): SalesInvoiceDto {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate instanceof Date ? invoice.invoiceDate.toISOString() : (invoice.invoiceDate || new Date().toISOString()),
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      goldRate22k: Number(invoice.goldRate22k),
      goldRate24k: Number(invoice.goldRate24k),
      goldRate18k: invoice.goldRate18k ? Number(invoice.goldRate18k) : null,
      goldRate20k: invoice.goldRate20k ? Number(invoice.goldRate20k) : null,
      goldRate14k: invoice.goldRate14k ? Number(invoice.goldRate14k) : null,
      silverRate: invoice.silverRate ? Number(invoice.silverRate) : null,
      grossItemsAmount: Number(invoice.grossItemsAmount),
      totalDiscount: Number(invoice.totalDiscount),
      discountType: invoice.discountType || (Number(invoice.overallDiscountPercentage) > 0 ? 'OVERALL' : 'CATEGORY'),
      overallDiscountPercentage: invoice.overallDiscountPercentage ? Number(invoice.overallDiscountPercentage) : 0,
      overallDiscountAmount: invoice.overallDiscountAmount ? Number(invoice.overallDiscountAmount) : 0,
      taxableAmount: Number(invoice.taxableAmount),
      gstRate: Number(invoice.gstRate),
      cgstAmount: Number(invoice.cgstAmount),
      sgstAmount: Number(invoice.sgstAmount),
      igstAmount: Number(invoice.igstAmount),
      totalTaxAmount: Number(invoice.totalTaxAmount),
      roundOff: Number(invoice.roundOff),
      netAmount: Number(invoice.netAmount),
      paidAmount: Number(invoice.paidAmount),
      balanceAmount: Number(invoice.balanceAmount),
      status: invoice.status,
      version: (invoice.history?.length || 0) + 1,
      notes: invoice.notes,
      createdById: invoice.createdById,
      createdByName: invoice.createdBy?.name,
      createdByRole: invoice.createdBy?.role,
      editCount: invoice.editCount,
      lastEditedAt: invoice.lastEditedAt ? (invoice.lastEditedAt instanceof Date ? invoice.lastEditedAt.toISOString() : invoice.lastEditedAt) : null,
      lastEditedById: invoice.lastEditedById,
      invalidatedAt: invoice.invalidatedAt ? (invoice.invalidatedAt instanceof Date ? invoice.invalidatedAt.toISOString() : invoice.invalidatedAt) : null,
      invalidatedById: invoice.invalidatedById || null,
      invalidationReason: invoice.invalidationReason || null,
      restoredAt: invoice.restoredAt ? (invoice.restoredAt instanceof Date ? invoice.restoredAt.toISOString() : invoice.restoredAt) : null,
      restoredById: invoice.restoredById || null,
      createdAt: invoice.createdAt instanceof Date ? invoice.createdAt.toISOString() : (invoice.createdAt || new Date().toISOString()),
      updatedAt: invoice.updatedAt instanceof Date ? invoice.updatedAt.toISOString() : (invoice.updatedAt || new Date().toISOString()),
      items: (invoice.items || []).map((it: any) => this.mapItem(it)),
      payments: (invoice.payments || []).map((p: any) => this.mapPayment(p)),
      history: (invoice.history || []).map((h: any) => this.mapHistory(h)),
      correctionRequests: (invoice.correctionRequests || []).map((r: any) => this.mapCorrectionRequest(r)),
    };
  }

  /**
   * Create a new Sales Invoice with full payment within a database transaction
   */
  async createBill(input: CreateSalesInvoiceInput, currentUser: UserDto): Promise<SalesInvoiceDto> {
    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('At least one item is required on the bill');
    }

    // 1. Verify Customer
    const customer = await this.prisma.customer.findUnique({
      where: { id: input.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${input.customerId}" not found`);
    }

    // 2. Fetch Shop Settings for GST and Metal Rates snapshot
    const settings = await this.prisma.businessSettings.findUnique({
      where: { id: 'default' },
    });
    if (!settings) {
      throw new NotFoundException('Shop settings must be configured before creating bills');
    }
    const defaultGstRate = Number(settings.defaultGstRate);
    const gold22kRate = Number(settings.todayGold22kRate || 0);
    const gold24kRate = Number(settings.todayGold24kRate || 0);
    const gold18kRate = Number(settings.todayGold18kRate || 0);
    const gold20kRate = Number(settings.todayGold20kRate || 0);
    const gold14kRate = Number(settings.todayGold14kRate || 0);
    const silverRate = Number(settings.todaySilverRate || 0);

    // Check if interstate
    const isInterstate = Boolean(
      settings?.stateCode &&
      customer?.state &&
      customer.state.toLowerCase() !== (settings.state || '').toLowerCase()
    );

    // 3. Calculate all items independently
    const calculatedItems: CalculatedItem[] = [];
    for (const itemInput of input.items) {
      // If categoryId is provided, fetch category to verify/get configured discount rate if applicable
      let categoryGstRate = defaultGstRate;
      let categoryDiscountRate = itemInput.discountPercentage || 0;

      if (itemInput.categoryId) {
        const cat = await this.prisma.category.findUnique({
          where: { id: itemInput.categoryId },
        });
        if (cat) {
          categoryGstRate = Number(cat.gstRate);
          if (itemInput.discountApplicable && input.discountType !== 'OVERALL') {
            categoryDiscountRate = Number(cat.discountRate);
          }
        }
      }

      const calculated = calculateItem(
        {
          ...itemInput,
          discountPercentage: input.discountType !== 'OVERALL' && itemInput.discountApplicable ? categoryDiscountRate : 0,
        },
        categoryGstRate,
      );
      calculatedItems.push(calculated);
    }

    // 4. Calculate invoice totals with explicit discount handling
    const invoiceSummary = calculateInvoice(calculatedItems, defaultGstRate, isInterstate, {
      discountType: input.discountType || 'CATEGORY',
      overallDiscountPercentage: input.overallDiscountPercentage || 0,
      overallDiscountAmount: input.overallDiscountAmount || 0,
    });

    // Phase 3 Rule: Full payment required before completed bill is saved
    const paymentAmount = invoiceSummary.netAmount;
    if (paymentAmount <= 0) {
      throw new BadRequestException('Bill final amount must be greater than 0');
    }

    // 5. Database transaction to create bill, items, payment
    const createdInvoice = await this.prisma.$transaction(async (tx) => {
      const invoiceNumber = await this.generateInvoiceNumber(tx);
      const receiptNumber = `REC-${invoiceNumber}`;

      const invoice = await tx.salesInvoice.create({
        data: {
          invoiceNumber,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          goldRate22k: gold22kRate,
          goldRate24k: gold24kRate,
          goldRate18k: gold18kRate,
          goldRate20k: gold20kRate,
          goldRate14k: gold14kRate,
          silverRate: silverRate,
          grossItemsAmount: invoiceSummary.grossItemsAmount,
          oldGoldDeduction: 0.0,
          totalDiscount: invoiceSummary.totalDiscount,
          overallDiscountPercentage: invoiceSummary.overallDiscountPercentage || 0,
          overallDiscountAmount: invoiceSummary.overallDiscountAmount || 0,
          taxableAmount: invoiceSummary.taxableAmount,
          gstRate: invoiceSummary.gstRate,
          cgstAmount: invoiceSummary.cgstAmount,
          sgstAmount: invoiceSummary.sgstAmount,
          igstAmount: invoiceSummary.igstAmount,
          totalTaxAmount: invoiceSummary.totalTaxAmount,
          roundOff: invoiceSummary.roundOff,
          netAmount: invoiceSummary.netAmount,
          paidAmount: paymentAmount,
          balanceAmount: 0.0,
          status: 'ACTIVE',
          notes: input.notes || null,
          createdById: currentUser.id,
          items: {
            create: calculatedItems.map((ci) => ({
              categoryId: ci.categoryId || null,
              categoryName: ci.categoryName,
              description: ci.description,
              designStyle: ci.designStyle || null,
              metalType: ci.metalType,
              purity: ci.purity,
              grossWeight: ci.grossWeight,
              stoneWeight: ci.stoneWeight || 0.0,
              stoneCarat: ci.stoneCarat || 0.0,
              netWeight: ci.netWeight,
              metalRatePerGram: ci.metalRatePerGram,
              ratePerTola: ci.ratePerTola,
              metalValue: ci.metalValue,
              hasStone: ci.hasStone,
              stoneType: ci.stoneType || null,
              stoneCharges: ci.stoneCharges,
              makingCharges: ci.makingCharges,
              totalMakingCharge: ci.makingCharges,
              discountApplicable: ci.discountApplicable,
              discountPercentage: ci.discountPercentage,
              discountAmount: ci.discountAmount,
              itemSubtotal: ci.itemSubtotal,
              taxableAmount: ci.taxableAmount,
              gstRate: ci.gstRate,
              gstAmount: ci.gstAmount,
              totalItemAmount: ci.totalItemAmount,
            })),
          },
          payments: {
            create: {
              receiptNumber,
              customerId: customer.id,
              paymentMode: input.paymentMode,
              amount: paymentAmount,
              notes: `Payment for Bill #${invoiceNumber}`,
            },
          },
        },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          items: { include: { category: true } },
          payments: true,
          history: { orderBy: { version: 'desc' } },
          correctionRequests: { orderBy: { createdAt: 'desc' } },
        },
      });

      return invoice;
    });

    return this.mapInvoice(createdInvoice);
  }

  /**
   * Search / List existing bills
   */
  async findAll(query?: {
    search?: string;
    customerId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: SalesInvoiceDto[]; total: number }> {
    const where: any = {};

    if (query?.customerId) {
      where.customerId = query.customerId;
    }

    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { invoiceNumber: { contains: s, mode: 'insensitive' } },
        { id: { contains: s, mode: 'insensitive' } },
        { customerName: { contains: s, mode: 'insensitive' } },
        { customerPhone: { contains: s, mode: 'insensitive' } },
      ];
    }

    if (query?.date) {
      const targetDate = new Date(query.date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      where.invoiceDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (query?.startDate || query?.endDate) {
      where.invoiceDate = {};
      if (query.startDate) {
        where.invoiceDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.invoiceDate.lte = new Date(query.endDate);
      }
    }

    const [invoices, total] = await Promise.all([
      this.prisma.salesInvoice.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          items: { include: { category: true } },
          payments: true,
          history: { orderBy: { version: 'desc' } },
          correctionRequests: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        take: query?.limit ? Number(query.limit) : 50,
        skip: query?.page && query?.limit ? (Number(query.page) - 1) * Number(query.limit) : 0,
      }),
      this.prisma.salesInvoice.count({ where }),
    ]);

    return {
      items: invoices.map((inv) => this.mapInvoice(inv)),
      total,
    };
  }

  /**
   * Find single bill by ID or Invoice Number
   */
  async findById(id: string): Promise<SalesInvoiceDto> {
    const invoice = await this.prisma.salesInvoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        items: { include: { category: true } },
        payments: true,
        history: { orderBy: { version: 'desc' } },
        correctionRequests: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Sales bill with ID or Invoice Number "${id}" not found`);
    }

    return this.mapInvoice(invoice);
  }

  /**
   * Edit / Modify an existing bill.
   * Enforces:
   * - Staff: max 1 direct edit total, within 30 minutes of creation.
   * - Manager: unlimited edits, any time.
   * - Records SalesInvoiceHistory with previous version snapshot before modifying.
   */
  async updateBill(
    id: string,
    input: UpdateSalesInvoiceInput,
    currentUser: UserDto,
  ): Promise<SalesInvoiceDto> {
    const existing = await this.prisma.salesInvoice.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        items: { include: { category: true } },
        payments: true,
        history: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Sales bill with ID "${id}" not found`);
    }

    // Role-based permission verification
    const isAdmin = currentUser.role === UserRole.ADMIN;

    if (!isAdmin) {
      // Staff permission rules:
      // 1. Bill MUST have been created by STAFF
      if (existing.createdBy?.role !== UserRole.STAFF) {
        throw new ForbiddenException(
          'Staff members cannot edit bills created by Admin. Please ask Admin to edit.',
        );
      }

      // 2. Can edit only once per bill
      if (existing.editCount >= 1) {
        throw new ForbiddenException(
          'Staff members can directly edit a bill only once. Please raise a correction request to Admin.',
        );
      }

      // 3. Must happen within 30 minutes of bill creation
      const createdAtMs = new Date(existing.createdAt).getTime();
      const elapsedMinutes = (Date.now() - createdAtMs) / (1000 * 60);
      if (elapsedMinutes > 30) {
        throw new ForbiddenException(
          `The 30-minute direct edit window for staff has expired (${Math.round(elapsedMinutes)} minutes elapsed). Please raise a correction request to Admin.`,
        );
      }
    }

    // Determine target customer (support updating customer on bill)
    let targetCustomerId = existing.customerId;
    let targetCustomerName = existing.customerName;
    let targetCustomerPhone = existing.customerPhone;

    if (input.customerId && input.customerId !== existing.customerId) {
      const newCustomer = await this.prisma.customer.findUnique({
        where: { id: input.customerId },
      });
      if (!newCustomer) {
        throw new NotFoundException(`Customer with ID "${input.customerId}" not found`);
      }
      targetCustomerId = newCustomer.id;
      targetCustomerName = newCustomer.name;
      targetCustomerPhone = newCustomer.phone;
    }

    // Calculate new items
    const settings = await this.prisma.businessSettings.findUnique({
      where: { id: 'default' },
    });
    const defaultGstRate = Number(existing.gstRate) || (settings ? Number(settings.defaultGstRate) : 3.0);

    const calculatedItems: CalculatedItem[] = [];
    for (const itemInput of input.items) {
      let categoryGstRate = defaultGstRate;
      let categoryDiscountRate = itemInput.discountPercentage || 0;

      if (itemInput.categoryId) {
        const cat = await this.prisma.category.findUnique({
          where: { id: itemInput.categoryId },
        });
        if (cat) {
          categoryGstRate = Number(cat.gstRate);
          if (itemInput.discountApplicable && input.discountType !== 'OVERALL') {
            categoryDiscountRate = Number(cat.discountRate);
          }
        }
      }

      const calculated = calculateItem(
        {
          ...itemInput,
          discountPercentage: input.discountType !== 'OVERALL' && itemInput.discountApplicable ? categoryDiscountRate : 0,
        },
        categoryGstRate,
      );
      calculatedItems.push(calculated);
    }

    const invoiceSummary = calculateInvoice(calculatedItems, defaultGstRate, false, {
      discountType: input.discountType || 'CATEGORY',
      overallDiscountPercentage: input.overallDiscountPercentage || 0,
      overallDiscountAmount: input.overallDiscountAmount || 0,
    });
    const newNetAmount = invoiceSummary.netAmount;

    // Database transaction to archive previous state and update invoice
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Create history snapshot of previous state
      const nextVersion = (existing.history?.length || 0) + 1;
      const snapshot = JSON.stringify(this.mapInvoice(existing));

      await tx.salesInvoiceHistory.create({
        data: {
          invoiceId: existing.id,
          version: nextVersion,
          snapshot,
          changeReason: input.changeReason || `Bill modified by ${currentUser.name} (${currentUser.role})`,
          changedById: currentUser.id,
          changedByName: currentUser.name,
          changedByRole: currentUser.role,
          changedFields: JSON.stringify(['items', 'netAmount', 'payments', 'customer']),
        },
      });

      // 2. Remove old items and insert updated items
      await tx.salesInvoiceItem.deleteMany({
        where: { invoiceId: existing.id },
      });

      // 3. Update existing payments amount/mode to match new netAmount
      await tx.paymentReceipt.deleteMany({
        where: { invoiceId: existing.id },
      });

      await tx.paymentReceipt.create({
        data: {
          receiptNumber: `REC-${existing.invoiceNumber}-V${nextVersion}`,
          invoiceId: existing.id,
          customerId: targetCustomerId,
          paymentMode: input.paymentMode,
          amount: newNetAmount,
          notes: `Updated payment for Bill #${existing.invoiceNumber} (V${nextVersion})`,
        },
      });

      // 4. Update the invoice header
      const updatedInvoice = await tx.salesInvoice.update({
        where: { id: existing.id },
        data: {
          customerId: targetCustomerId,
          customerName: targetCustomerName,
          customerPhone: targetCustomerPhone,
          grossItemsAmount: invoiceSummary.grossItemsAmount,
          totalDiscount: invoiceSummary.totalDiscount,
          overallDiscountPercentage: invoiceSummary.overallDiscountPercentage || 0,
          overallDiscountAmount: invoiceSummary.overallDiscountAmount || 0,
          taxableAmount: invoiceSummary.taxableAmount,
          cgstAmount: invoiceSummary.cgstAmount,
          sgstAmount: invoiceSummary.sgstAmount,
          igstAmount: invoiceSummary.igstAmount,
          totalTaxAmount: invoiceSummary.totalTaxAmount,
          roundOff: invoiceSummary.roundOff,
          netAmount: newNetAmount,
          paidAmount: newNetAmount,
          notes: input.notes !== undefined ? input.notes : existing.notes,
          editCount: existing.editCount + 1,
          lastEditedAt: new Date(),
          lastEditedById: currentUser.id,
          items: {
            create: calculatedItems.map((ci) => ({
              categoryId: ci.categoryId || null,
              categoryName: ci.categoryName,
              description: ci.description,
              designStyle: ci.designStyle || null,
              metalType: ci.metalType,
              purity: ci.purity,
              grossWeight: ci.grossWeight,
              stoneWeight: ci.stoneWeight || 0.0,
              stoneCarat: ci.stoneCarat || 0.0,
              netWeight: ci.netWeight,
              metalRatePerGram: ci.metalRatePerGram,
              ratePerTola: ci.ratePerTola,
              metalValue: ci.metalValue,
              hasStone: ci.hasStone,
              stoneType: ci.stoneType || null,
              stoneCharges: ci.stoneCharges,
              makingCharges: ci.makingCharges,
              totalMakingCharge: ci.makingCharges,
              discountApplicable: ci.discountApplicable,
              discountPercentage: ci.discountPercentage,
              discountAmount: ci.discountAmount,
              itemSubtotal: ci.itemSubtotal,
              taxableAmount: ci.taxableAmount,
              gstRate: ci.gstRate,
              gstAmount: ci.gstAmount,
              totalItemAmount: ci.totalItemAmount,
            })),
          },
        },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          items: { include: { category: true } },
          payments: true,
          history: { orderBy: { version: 'desc' } },
          correctionRequests: { orderBy: { createdAt: 'desc' } },
        },
      });

      return updatedInvoice;
    });

    return this.mapInvoice(updated);
  }

  /**
   * Staff raises a correction request when direct edit is no longer permitted
   * Only allowed for bills originally created by STAFF
   */
  async createCorrectionRequest(
    invoiceId: string,
    reason: string,
    currentUser: UserDto,
  ): Promise<BillCorrectionRequestDto> {
    const invoice = await this.prisma.salesInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Sales bill with ID "${invoiceId}" not found`);
    }

    if (invoice.createdBy?.role !== UserRole.STAFF) {
      throw new ForbiddenException(
        'Correction requests can only be raised for staff-created bills. Admin-created bills can be modified directly by Admin.',
      );
    }

    const request = await this.prisma.billCorrectionRequest.create({
      data: {
        invoiceId: invoice.id,
        requestedById: currentUser.id,
        requestedByName: currentUser.name,
        requestedByRole: currentUser.role,
        reason: reason.trim(),
        status: 'PENDING',
      },
      include: {
        invoice: { select: { invoiceNumber: true, customerName: true } },
      },
    });

    return this.mapCorrectionRequest(request);
  }

  /**
   * List all correction requests (for Admin)
   */
  async findCorrectionRequests(status?: string): Promise<BillCorrectionRequestDto[]> {
    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const requests = await this.prisma.billCorrectionRequest.findMany({
      where,
      include: {
        invoice: { select: { invoiceNumber: true, customerName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => this.mapCorrectionRequest(r));
  }

  /**
   * Admin resolves or rejects a correction request
   */
  async resolveCorrectionRequest(
    id: string,
    resolutionNotes: string | undefined,
    status: 'RESOLVED' | 'REJECTED',
    currentUser: UserDto,
  ): Promise<BillCorrectionRequestDto> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can review and resolve correction requests');
    }

    const request = await this.prisma.billCorrectionRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Correction request with ID "${id}" not found`);
    }

    const updated = await this.prisma.billCorrectionRequest.update({
      where: { id },
      data: {
        status,
        resolutionNotes: resolutionNotes || null,
        resolvedById: currentUser.id,
        resolvedByName: currentUser.name,
      },
      include: {
        invoice: { select: { invoiceNumber: true, customerName: true } },
      },
    });

    return this.mapCorrectionRequest(updated);
  }

  /**
   * Admin invalidates a bill.
   * Stores invalidated status, date/time, user, and mandatory reason.
   * Preserves full history and excludes from valid sales analytics.
   */
  async invalidateBill(
    id: string,
    reason: string,
    currentUser: UserDto,
  ): Promise<SalesInvoiceDto> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can invalidate bills');
    }

    const existing = await this.prisma.salesInvoice.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        items: { include: { category: true } },
        payments: true,
        history: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Sales bill with ID "${id}" not found`);
    }

    if (existing.status === 'INVALID') {
      throw new BadRequestException('This bill is already marked as INVALID');
    }

    const nextVersion = (existing.history?.length || 0) + 1;
    const snapshot = JSON.stringify(this.mapInvoice(existing));

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.salesInvoiceHistory.create({
        data: {
          invoiceId: existing.id,
          version: nextVersion,
          snapshot,
          changeReason: `Bill invalidated by Admin (${currentUser.name}): ${reason.trim()}`,
          changedById: currentUser.id,
          changedByName: currentUser.name,
          changedByRole: currentUser.role,
          changedFields: JSON.stringify(['status', 'invalidationReason']),
        },
      });

      return await tx.salesInvoice.update({
        where: { id: existing.id },
        data: {
          status: 'INVALID',
          invalidatedAt: new Date(),
          invalidatedById: currentUser.id,
          invalidationReason: reason.trim(),
        },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          items: { include: { category: true } },
          payments: true,
          history: { orderBy: { version: 'desc' } },
          correctionRequests: { orderBy: { createdAt: 'desc' } },
        },
      });
    });

    return this.mapInvoice(updated);
  }

  /**
   * Admin restores an invalid bill back to ACTIVE.
   * Audit trail of who restored it, when, and optional reason is preserved.
   */
  async restoreBill(
    id: string,
    reason: string | undefined,
    currentUser: UserDto,
  ): Promise<SalesInvoiceDto> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can restore bills');
    }

    const existing = await this.prisma.salesInvoice.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        items: { include: { category: true } },
        payments: true,
        history: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Sales bill with ID "${id}" not found`);
    }

    if (existing.status !== 'INVALID') {
      throw new BadRequestException('Only INVALID bills can be restored');
    }

    const nextVersion = (existing.history?.length || 0) + 1;
    const snapshot = JSON.stringify(this.mapInvoice(existing));

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.salesInvoiceHistory.create({
        data: {
          invoiceId: existing.id,
          version: nextVersion,
          snapshot,
          changeReason: `Bill restored by Admin (${currentUser.name})${reason ? ': ' + reason.trim() : ''}`,
          changedById: currentUser.id,
          changedByName: currentUser.name,
          changedByRole: currentUser.role,
          changedFields: JSON.stringify(['status', 'restoredAt']),
        },
      });

      return await tx.salesInvoice.update({
        where: { id: existing.id },
        data: {
          status: 'ACTIVE',
          restoredAt: new Date(),
          restoredById: currentUser.id,
        },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          items: { include: { category: true } },
          payments: true,
          history: { orderBy: { version: 'desc' } },
          correctionRequests: { orderBy: { createdAt: 'desc' } },
        },
      });
    });

    return this.mapInvoice(updated);
  }

  /**
   * Sales Analytics safe query helper:
   * Historical versions in SalesInvoiceHistory are NEVER counted.
   * INVALID bills are EXCLUDED from valid sales totals.
   */
  async getSalesAnalytics(query?: { startDate?: string; endDate?: string }): Promise<{
    totalSalesAmount: number;
    totalValidBills: number;
    invalidBillsCount: number;
  }> {
    const whereValid: any = { status: { not: 'INVALID' } };
    const whereInvalid: any = { status: 'INVALID' };

    if (query?.startDate || query?.endDate) {
      whereValid.invoiceDate = {};
      whereInvalid.invoiceDate = {};
      if (query.startDate) {
        whereValid.invoiceDate.gte = new Date(query.startDate);
        whereInvalid.invoiceDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        whereValid.invoiceDate.lte = new Date(query.endDate);
        whereInvalid.invoiceDate.lte = new Date(query.endDate);
      }
    }

    const [validInvoices, invalidCount] = await Promise.all([
      this.prisma.salesInvoice.findMany({
        where: whereValid,
        select: { netAmount: true },
      }),
      this.prisma.salesInvoice.count({ where: whereInvalid }),
    ]);

    const totalSalesAmount = validInvoices.reduce((sum, inv) => sum + Number(inv.netAmount), 0);

    return {
      totalSalesAmount: Math.round((totalSalesAmount + Number.EPSILON) * 100) / 100,
      totalValidBills: validInvoices.length,
      invalidBillsCount: invalidCount,
    };
  }
}
