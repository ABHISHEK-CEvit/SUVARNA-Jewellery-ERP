import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, CreateCategorySchema, UpdateCategorySchema } from '@jewellery-erp/shared';

@Controller('api/v1/categories')
@UseGuards(AuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getCategories(
    @Query('activeOnly') activeOnly?: string,
    @Query('metalType') metalType?: string,
  ) {
    const data = await this.categoriesService.findAll({
      activeOnly: activeOnly === 'true',
      metalType,
    });
    return { success: true, data };
  }

  @Get(':id')
  async getCategoryById(@Param('id') id: string) {
    const data = await this.categoriesService.findById(id);
    return { success: true, data };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async createCategory(@Body() body: any) {
    const validated = CreateCategorySchema.parse(body);
    const data = await this.categoriesService.create(validated);
    return { success: true, message: 'Category created successfully', data };
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async updateCategory(@Param('id') id: string, @Body() body: any) {
    const validated = UpdateCategorySchema.parse(body);
    const data = await this.categoriesService.update(id, validated);
    return { success: true, message: 'Category updated successfully', data };
  }

  @Patch(':id/toggle-status')
  @Roles(UserRole.ADMIN)
  async toggleCategoryStatus(@Param('id') id: string) {
    const data = await this.categoriesService.toggleStatus(id);
    return {
      success: true,
      message: `Category "${data.name}" marked as ${data.isActive ? 'Active' : 'Inactive'}`,
      data,
    };
  }
}
