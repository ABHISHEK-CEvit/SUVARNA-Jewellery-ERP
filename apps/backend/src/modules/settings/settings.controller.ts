import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, UpdateBusinessSettingsInput, UpdateBusinessSettingsSchema } from '@jewellery-erp/shared';

@Controller('api/v1/settings')
@UseGuards(AuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    const data = await this.settingsService.getSettings();
    return { success: true, data };
  }

  @Put()
  @Roles(UserRole.ADMIN)
  async updateSettings(@Body() body: any, @CurrentUser('id') userId: string) {
    const validated = UpdateBusinessSettingsSchema.parse(body);
    const data = await this.settingsService.updateSettings(validated, userId);
    return { success: true, message: 'Shop settings and metal rates updated successfully', data };
  }

  @Get('rates-history')
  async getMetalRateHistory() {
    const data = await this.settingsService.getMetalRateHistory();
    return { success: true, data };
  }

  @Get('rates')
  async getLatestRates() {
    const data = await this.settingsService.getLatestRates();
    return { success: true, data };
  }
}

