import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategoriesService } from './categories.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let categoriesService: CategoriesService;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      category: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
    categoriesService = new CategoriesService(mockPrismaService);
  });

  it('should return all categories with numeric gstRate', async () => {
    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Ring',
        metalType: 'GOLD',
        defaultPurity: '916',
        defaultHsnCode: '7113',
        gstRate: 3.0,
        isActive: true,
        createdAt: new Date('2026-09-18T10:00:00Z'),
      },
    ];

    mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

    const result = await categoriesService.findAll();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Ring');
    expect(result[0].gstRate).toBe(3.0);
    expect(result[0].metalType).toBe('GOLD');
  });

  it('should filter by activeOnly and metalType', async () => {
    mockPrismaService.category.findMany.mockResolvedValue([]);

    await categoriesService.findAll({ activeOnly: true, metalType: 'SILVER' });

    expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
      where: { isActive: true, metalType: 'SILVER' },
      orderBy: { name: 'asc' },
    });
  });

  it('should find category by ID', async () => {
    mockPrismaService.category.findUnique.mockResolvedValue({
      id: 'cat-1',
      name: 'Bangle',
      metalType: 'GOLD',
      defaultPurity: '916',
      defaultHsnCode: '7113',
      gstRate: 3.0,
      isActive: true,
      createdAt: new Date(),
    });

    const result = await categoriesService.findById('cat-1');
    expect(result.name).toBe('Bangle');
  });

  it('should throw NotFoundException if category does not exist', async () => {
    mockPrismaService.category.findUnique.mockResolvedValue(null);

    await expect(categoriesService.findById('non-existent')).rejects.toThrow(NotFoundException);
  });

  it('should create a new category', async () => {
    mockPrismaService.category.findFirst.mockResolvedValue(null);
    mockPrismaService.category.create.mockResolvedValue({
      id: 'cat-2',
      name: 'Necklace',
      metalType: 'GOLD',
      defaultPurity: '916',
      defaultHsnCode: '7113',
      gstRate: 3.0,
      isActive: true,
      createdAt: new Date(),
    });

    const result = await categoriesService.create({
      name: 'Necklace',
      metalType: 'GOLD',
      defaultPurity: '916',
      defaultHsnCode: '7113',
      gstRate: 3.0,
      isActive: true,
    });

    expect(result.name).toBe('Necklace');
    expect(mockPrismaService.category.create).toHaveBeenCalled();
  });

  it('should reject creating duplicate category name', async () => {
    mockPrismaService.category.findFirst.mockResolvedValue({ id: 'cat-1', name: 'Ring' });

    await expect(
      categoriesService.create({
        name: 'Ring',
        metalType: 'GOLD',
        defaultPurity: '916',
        defaultHsnCode: '7113',
        gstRate: 3.0,
        isActive: true,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should toggle category active status', async () => {
    mockPrismaService.category.findUnique.mockResolvedValue({
      id: 'cat-1',
      name: 'Ring',
      metalType: 'GOLD',
      defaultPurity: '916',
      defaultHsnCode: '7113',
      gstRate: 3.0,
      isActive: true,
      createdAt: new Date(),
    });

    mockPrismaService.category.update.mockResolvedValue({
      id: 'cat-1',
      name: 'Ring',
      metalType: 'GOLD',
      defaultPurity: '916',
      defaultHsnCode: '7113',
      gstRate: 3.0,
      isActive: false,
      createdAt: new Date(),
    });

    const result = await categoriesService.toggleStatus('cat-1');
    expect(result.isActive).toBe(false);
  });
});
