import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtTokenService } from './jwt-token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtTokenService: JwtTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined>; user?: unknown }>();
    const token = parseBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Bearer token is required.');
    }

    try {
      request.user = this.jwtTokenService.verifyAccessToken(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid Bearer token.');
    }
  }
}

function parseBearerToken(authorization: string | string[] | undefined): string | null {
  const header = Array.isArray(authorization) ? authorization[0] : authorization;
  const match = /^Bearer\s+(.+)$/iu.exec(header ?? '');
  return match?.[1]?.trim() || null;
}
