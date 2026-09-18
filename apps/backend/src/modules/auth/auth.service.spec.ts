import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      user: {
        findUnique: vi.fn(),
      },
    };
    authService = new AuthService(mockPrismaService);
  });

  it('should authenticate active user with valid credentials', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);
    const mockUser = {
      id: 'usr-123',
      email: 'admin@jewellery.com',
      name: 'Admin User',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date(),
    };

    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

    const result = await authService.validateAndLogin({
      email: 'admin@jewellery.com',
      password: 'secret123',
    });

    expect(result.user.email).toBe('admin@jewellery.com');
    expect(result.user.role).toBe('ADMIN');
    expect(result.sessionId).toBeDefined();
  });

  it('should throw UnauthorizedException on invalid password', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);
    const mockUser = {
      id: 'usr-123',
      email: 'admin@jewellery.com',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date(),
    };

    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      authService.validateAndLogin({
        email: 'admin@jewellery.com',
        password: 'wrongpassword',
      })
    ).rejects.toThrow('Invalid email or password');
  });

  it('should throw UnauthorizedException if user does not exist', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.validateAndLogin({
        email: 'nonexistent@jewellery.com',
        password: 'secret123',
      })
    ).rejects.toThrow('Invalid email or password');
  });
});
