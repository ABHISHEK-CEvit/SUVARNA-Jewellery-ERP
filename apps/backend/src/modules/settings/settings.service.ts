import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdateBusinessSettingsInput, BusinessSettingsDto } from '@jewellery-erp/shared';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<BusinessSettingsDto> {
    let settings = await this.prisma.businessSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await this.prisma.businessSettings.create({
        data: {
          id: 'default',
          shopName: 'My Jewellery Shop',
          defaultGstRate: 3.00,
          todayGold22kRate: 0.00,
          todayGold24kRate: 0.00,
          todaySilverRate: 0.00,
        },
      });
    }

    return {
      ...settings,
      defaultGstRate: Number(settings.defaultGstRate),
      todayGold22kRate: Number(settings.todayGold22kRate),
      todayGold24kRate: Number(settings.todayGold24kRate),
      todaySilverRate: Number(settings.todaySilverRate),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  async updateSettings(input: UpdateBusinessSettingsInput, userId?: string): Promise<BusinessSettingsDto> {
    const updated = await this.prisma.businessSettings.upsert({
      where: { id: 'default' },
      update: {
        shopName: input.shopName,
        tagline: input.tagline,
        address: input.address,
        city: input.city,
        state: input.state,
        stateCode: input.stateCode,
        phone: input.phone,
        email: input.email,
        gstin: input.gstin,
        pan: input.pan,
        bankName: input.bankName,
        bankAccountNo: input.bankAccountNo,
        bankIfsc: input.bankIfsc,
        invoicePrefix: input.invoicePrefix,
        termsConditions: input.termsConditions,
        defaultGstRate: input.defaultGstRate,
        todayGold22kRate: input.todayGold22kRate,
        todayGold24kRate: input.todayGold24kRate,
        todaySilverRate: input.todaySilverRate,
      },
      create: {
        id: 'default',
        shopName: input.shopName,
        tagline: input.tagline,
        address: input.address,
        city: input.city,
        state: input.state,
        stateCode: input.stateCode,
        phone: input.phone,
        email: input.email,
        gstin: input.gstin,
        pan: input.pan,
        bankName: input.bankName,
        bankAccountNo: input.bankAccountNo,
        bankIfsc: input.bankIfsc,
        invoicePrefix: input.invoicePrefix,
        termsConditions: input.termsConditions,
        defaultGstRate: input.defaultGstRate,
        todayGold22kRate: input.todayGold22kRate,
        todayGold24kRate: input.todayGold24kRate,
        todaySilverRate: input.todaySilverRate,
      },
    });

    // Record daily metal rate snapshot tied to rateDate (start of day UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    await this.prisma.dailyMetalRate.upsert({
      where: { rateDate: today },
      update: {
        gold22kRate: input.todayGold22kRate,
        gold24kRate: input.todayGold24kRate,
        silverRate: input.todaySilverRate,
        createdById: userId,
      },
      create: {
        rateDate: today,
        gold22kRate: input.todayGold22kRate,
        gold24kRate: input.todayGold24kRate,
        silverRate: input.todaySilverRate,
        createdById: userId,
      },
    });

    return {
      ...updated,
      defaultGstRate: Number(updated.defaultGstRate),
      todayGold22kRate: Number(updated.todayGold22kRate),
      todayGold24kRate: Number(updated.todayGold24kRate),
      todaySilverRate: Number(updated.todaySilverRate),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async getMetalRateHistory(limit: number = 30) {
    const history = await this.prisma.dailyMetalRate.findMany({
      orderBy: { rateDate: 'desc' },
      take: limit,
    });

    return history.map((r) => ({
      id: r.id,
      rateDate: r.rateDate.toISOString().split('T')[0],
      gold22kRate: Number(r.gold22kRate),
      gold24kRate: Number(r.gold24kRate),
      silverRate: Number(r.silverRate),
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getLatestRates() {
    const settings = await this.getSettings();
    return {
      gold22kRate: settings.todayGold22kRate,
      gold24kRate: settings.todayGold24kRate,
      silverRate: settings.todaySilverRate,
      updatedAt: settings.updatedAt,
    };
  }
}

