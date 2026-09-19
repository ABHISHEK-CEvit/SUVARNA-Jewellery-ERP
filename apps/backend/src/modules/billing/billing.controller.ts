import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  UserRole,
  UserDto,
  CreateSalesInvoiceSchema,
  UpdateSalesInvoiceSchema,
  CreateCorrectionRequestSchema,
  ResolveCorrectionRequestSchema,
  InvalidateBillSchema,
  RestoreBillSchema,
  ApiResponse,
  SalesInvoiceDto,
  BillCorrectionRequestDto,
} from '@jewellery-erp/shared';

@Controller('api/v1/billing')
@UseGuards(AuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createBill(
    @Body() body: any,
    @CurrentUser() currentUser: UserDto,
  ): Promise<ApiResponse<SalesInvoiceDto>> {
    const validated = CreateSalesInvoiceSchema.parse(body);
    const invoice = await this.billingService.createBill(validated, currentUser);
    return {
      success: true,
      message: 'Sales bill generated successfully',
      data: invoice,
    };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async findAll(
    @Query('search') search?: string,
    @Query('customerId') customerId?: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<{ items: SalesInvoiceDto[]; total: number }>> {
    const result = await this.billingService.findAll({
      search,
      customerId,
      date,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return {
      success: true,
      data: result,
    };
  }

  @Get('analytics/summary')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async getAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponse<{ totalSalesAmount: number; totalValidBills: number; invalidBillsCount: number }>> {
    const data = await this.billingService.getSalesAnalytics({ startDate, endDate });
    return {
      success: true,
      data,
    };
  }

  @Get('correction-requests')
  @Roles(UserRole.ADMIN)
  async findCorrectionRequests(
    @Query('status') status?: string,
  ): Promise<ApiResponse<BillCorrectionRequestDto[]>> {
    const requests = await this.billingService.findCorrectionRequests(status);
    return {
      success: true,
      data: requests,
    };
  }

  @Patch('correction-requests/:id')
  @Roles(UserRole.ADMIN)
  async resolveCorrectionRequest(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() currentUser: UserDto,
  ): Promise<ApiResponse<BillCorrectionRequestDto>> {
    const validated = ResolveCorrectionRequestSchema.parse(body);
    const updated = await this.billingService.resolveCorrectionRequest(
      id,
      validated.resolutionNotes || undefined,
      validated.status,
      currentUser,
    );
    return {
      success: true,
      message: `Correction request marked as ${validated.status}`,
      data: updated,
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async findById(@Param('id') id: string): Promise<ApiResponse<SalesInvoiceDto>> {
    const invoice = await this.billingService.findById(id);
    return {
      success: true,
      data: invoice,
    };
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async updateBill(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() currentUser: UserDto,
  ): Promise<ApiResponse<SalesInvoiceDto>> {
    const validated = UpdateSalesInvoiceSchema.parse(body);
    const updated = await this.billingService.updateBill(id, validated, currentUser);
    return {
      success: true,
      message: 'Sales bill updated successfully and revision archived',
      data: updated,
    };
  }

  @Post(':id/correction-request')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  async createCorrectionRequest(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() currentUser: UserDto,
  ): Promise<ApiResponse<BillCorrectionRequestDto>> {
    const validated = CreateCorrectionRequestSchema.parse(body);
    const request = await this.billingService.createCorrectionRequest(
      id,
      validated.reason,
      currentUser,
    );
    return {
      success: true,
      message: 'Correction request submitted to Admin',
      data: request,
    };
  }

  @Post(':id/invalidate')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async invalidateBill(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() currentUser: UserDto,
  ): Promise<ApiResponse<SalesInvoiceDto>> {
    const validated = InvalidateBillSchema.parse(body);
    const invoice = await this.billingService.invalidateBill(id, validated.reason, currentUser);
    return {
      success: true,
      message: 'Sales bill has been marked as INVALID',
      data: invoice,
    };
  }

  @Post(':id/restore')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async restoreBill(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() currentUser: UserDto,
  ): Promise<ApiResponse<SalesInvoiceDto>> {
    const validated = RestoreBillSchema.parse(body);
    const invoice = await this.billingService.restoreBill(id, validated.reason || undefined, currentUser);
    return {
      success: true,
      message: 'Sales bill has been restored to ACTIVE status',
      data: invoice,
    };
  }
}
