import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined>; user?: unknown }>();
    const token = parseBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Bearer token is required.');
    }

    try {
      request.user = await this.authService.authenticateAccessToken(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid Bearer token.');
    }
  }
}

export function parseBearerToken(authorization: string | string[] | undefined): string | null {
  const header = Array.isArray(authorization) ? authorization[0] : authorization;
  const match = /^Bearer\s+(.+)$/iu.exec(header ?? '');
  return match?.[1]?.trim() || null;
}
