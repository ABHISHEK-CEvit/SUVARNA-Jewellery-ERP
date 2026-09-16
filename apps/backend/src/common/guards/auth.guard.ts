import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.cookies?.['session_id'];

    if (!sessionId) {
      throw new UnauthorizedException('Authentication session required');
    }

    // In a stateless/signed-session setup or database lookup:
    // Decode or lookup user session from database/memory:
    try {
      const decodedPayload = JSON.parse(
        Buffer.from(sessionId, 'base64').toString('utf-8')
      );

      if (!decodedPayload?.userId) {
        throw new UnauthorizedException('Invalid authentication session');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decodedPayload.userId },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User account is inactive or deleted');
      }

      // Attach user to request context
      request.user = user;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Session expired or invalid token');
    }
  }
}
