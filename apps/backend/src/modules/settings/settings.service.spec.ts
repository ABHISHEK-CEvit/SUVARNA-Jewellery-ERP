import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let settingsService: SettingsService;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      businessSettings: {
        findUnique: vi.fn(),
        create: vi.fn(),
        upsert: vi.fn(),
      },
      dailyMetalRate: {
        upsert: vi.fn(),
        findMany: vi.fn(),
      },
    };
    settingsService = new SettingsService(mockPrismaService);
  });

  it('should return existing business settings and metal rates', async () => {
    const mockSettings = {
      id: 'default',
      shopName: 'Shree Jewellers',
      tagline: 'Pure & Hallmark',
      address: 'Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      phone: '9876543210',
      email: 'test@jewel.com',
      gstin: '27ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
      bankName: 'SBI',
      bankAccountNo: '1234567890',
      bankIfsc: 'SBIN0001234',
      invoicePrefix: 'INV',
      termsConditions: 'No returns without bill',
      defaultGstRate: 3.0,
      todayGold22kRate: 7200.0,
      todayGold24kRate: 7800.0,
      todaySilverRate: 90.0,
      updatedAt: new Date('2026-09-18T10:00:00Z'),
    };

    mockPrismaService.businessSettings.findUnique.mockResolvedValue(mockSettings);

    const result = await settingsService.getSettings();

    expect(result.shopName).toBe('Shree Jewellers');
    expect(result.defaultGstRate).toBe(3.0);
    expect(result.todayGold22kRate).toBe(7200.0);
    expect(result.todayGold24kRate).toBe(7800.0);
    expect(result.todaySilverRate).toBe(90.0);
  });

  it('should create default business settings if none exist', async () => {
    mockPrismaService.businessSettings.findUnique.mockResolvedValue(null);
    mockPrismaService.businessSettings.create.mockResolvedValue({
      id: 'default',
      shopName: 'My Jewellery Shop',
      defaultGstRate: 3.0,
      todayGold22kRate: 0.0,
      todayGold24kRate: 0.0,
      todaySilverRate: 0.0,
      updatedAt: new Date(),
    });

    const result = await settingsService.getSettings();

    expect(result.shopName).toBe('My Jewellery Shop');
    expect(mockPrismaService.businessSettings.create).toHaveBeenCalled();
  });

  it('should update business settings and record daily metal rate snapshot', async () => {
    const updateInput = {
      shopName: 'Shree Jewellers Updated',
      tagline: 'Best Hallmark',
      address: 'Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      phone: '9876543210',
      email: 'info@shree.com',
      gstin: '27ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
      bankName: 'HDFC',
      bankAccountNo: '9876543210',
      bankIfsc: 'HDFC0001234',
      invoicePrefix: 'SJ',
      termsConditions: 'Terms apply',
      defaultGstRate: 3.0,
      todayGold24kRate: 7850.0,
      todayGold22kRate: 7250.0,
      todayGold20kRate: 6600.0,
      todayGold18kRate: 5950.0,
      todayGold14kRate: 4600.0,
      todaySilverRate: 92.0,
    };

    mockPrismaService.businessSettings.upsert.mockResolvedValue({
      ...updateInput,
      id: 'default',
      updatedAt: new Date(),
    });

    mockPrismaService.dailyMetalRate.upsert.mockResolvedValue({
      id: 'rate-1',
      rateDate: new Date(),
      gold22kRate: 7250.0,
      gold24kRate: 7850.0,
      silverRate: 92.0,
      createdById: 'admin-1',
    });

    const result = await settingsService.updateSettings(updateInput, 'admin-1');

    expect(result.shopName).toBe('Shree Jewellers Updated');
    expect(result.todayGold22kRate).toBe(7250.0);
    expect(mockPrismaService.businessSettings.upsert).toHaveBeenCalled();
    expect(mockPrismaService.dailyMetalRate.upsert).toHaveBeenCalled();
  });

  it('should return metal rate history with formatted date and numeric values', async () => {
    const mockHistory = [
      {
        id: 'rate-1',
        rateDate: new Date('2026-09-18T00:00:00Z'),
        gold22kRate: 7250.0,
        gold24kRate: 7850.0,
        silverRate: 92.0,
        createdAt: new Date('2026-09-18T05:00:00Z'),
      },
    ];

    mockPrismaService.dailyMetalRate.findMany.mockResolvedValue(mockHistory);

    const result = await settingsService.getMetalRateHistory();

    expect(result).toHaveLength(1);
    expect(result[0].rateDate).toBe('2026-09-18');
    expect(result[0].gold22kRate).toBe(7250.0);
  });
});
