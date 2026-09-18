import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateCategoryInput, UpdateCategoryInput, CategoryDto } from '@jewellery-erp/shared';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private mapCategory(c: any): CategoryDto {
    return {
      id: c.id,
      name: c.name,
      metalType: c.metalType,
      defaultPurity: c.defaultPurity,
      defaultHsnCode: c.defaultHsnCode,
      gstRate: Number(c.gstRate),
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    };
  }

  async findAll(options?: { activeOnly?: boolean; metalType?: string }): Promise<CategoryDto[]> {
    const where: any = {};

    if (options?.activeOnly) {
      where.isActive = true;
    }

    if (options?.metalType) {
      where.metalType = options.metalType.toUpperCase();
    }

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return categories.map((c) => this.mapCategory(c));
  }

  async findById(id: string): Promise<CategoryDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return this.mapCategory(category);
  }

  async create(input: CreateCategoryInput): Promise<CategoryDto> {
    const existing = await this.prisma.category.findFirst({
      where: {
        name: {
          equals: input.name.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Category "${input.name.trim()}" already exists`);
    }

    const created = await this.prisma.category.create({
      data: {
        name: input.name.trim(),
        metalType: input.metalType || 'GOLD',
        defaultPurity: input.defaultPurity?.trim() || null,
        defaultHsnCode: input.defaultHsnCode?.trim() || '7113',
        gstRate: input.gstRate ?? 3.00,
        isActive: input.isActive ?? true,
      },
    });

    return this.mapCategory(created);
  }

  async update(id: string, input: UpdateCategoryInput): Promise<CategoryDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    if (input.name && input.name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const existing = await this.prisma.category.findFirst({
        where: {
          name: {
            equals: input.name.trim(),
            mode: 'insensitive',
          },
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(`Category "${input.name.trim()}" already exists`);
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.metalType !== undefined && { metalType: input.metalType }),
        ...(input.defaultPurity !== undefined && { defaultPurity: input.defaultPurity ? input.defaultPurity.trim() : null }),
        ...(input.defaultHsnCode !== undefined && { defaultHsnCode: input.defaultHsnCode.trim() }),
        ...(input.gstRate !== undefined && { gstRate: input.gstRate }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    return this.mapCategory(updated);
  }

  async toggleStatus(id: string): Promise<CategoryDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: { isActive: !category.isActive },
    });

    return this.mapCategory(updated);
  }
}
