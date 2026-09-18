import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@jewellery-erp/shared';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return users.map((u) => ({
      ...u,
      role: u.role as UserRole,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  async createUser(data: { email: string; name: string; password: string; role: UserRole }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name,
        passwordHash,
        role: data.role,
        isActive: true,
      },
    });

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as UserRole,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt.toISOString(),
    };
  }

  async toggleActive(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role as UserRole,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
