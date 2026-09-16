import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@jewellery-erp/shared';

@Controller('api/v1/users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async getUsers() {
    const users = await this.usersService.findAll();
    return {
      success: true,
      data: users,
    };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async createUser(
    @Body() body: { email: string; name: string; password: string; role: UserRole }
  ) {
    const user = await this.usersService.createUser(body);
    return {
      success: true,
      message: 'User created successfully',
      data: user,
    };
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  async toggleActive(@Param('id') id: string) {
    const user = await this.usersService.toggleActive(id);
    return {
      success: true,
      message: `User status changed to ${user.isActive ? 'Active' : 'Inactive'}`,
      data: user,
    };
  }
}
