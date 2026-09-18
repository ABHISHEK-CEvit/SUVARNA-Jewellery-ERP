import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  UserRole,
  CreateCustomerSchema,
  UpdateCustomerSchema,
} from '@jewellery-erp/shared';

@Controller('api/v1/customers')
@UseGuards(AuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async getCustomers(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.customersService.findAll({
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return { success: true, data };
  }

  @Get(':id')
  async getCustomerById(@Param('id') id: string) {
    const data = await this.customersService.findById(id);
    return { success: true, data };
  }

  @Get(':id/ledger')
  async getCustomerLedger(@Param('id') id: string) {
    const data = await this.customersService.getCustomerLedger(id);
    return { success: true, data };
  }

  @Post()
  async createCustomer(@Body() body: any) {
    const validated = CreateCustomerSchema.parse(body);
    const data = await this.customersService.create(validated);
    return { success: true, message: 'Customer created successfully', data };
  }

  @Put(':id')
  async updateCustomer(@Param('id') id: string, @Body() body: any) {
    const validated = UpdateCustomerSchema.parse(body);
    const data = await this.customersService.update(id, validated);
    return { success: true, message: 'Customer updated successfully', data };
  }

  @Patch(':id/toggle-status')
  async toggleCustomerStatus(@Param('id') id: string) {
    const data = await this.customersService.toggleStatus(id);
    return {
      success: true,
      message: `Customer "${data.name}" marked as ${data.isActive ? 'Active' : 'Inactive'}`,
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteCustomer(@Param('id') id: string) {
    const result = await this.customersService.delete(id);
    return result;
  }
}
