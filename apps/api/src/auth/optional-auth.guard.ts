import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtTokenService } from './jwt-token.service';
import { parseBearerToken } from './auth.guard';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwtTokenService: JwtTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined>; user?: unknown }>();
    const token = parseBearerToken(request.headers.authorization);
    if (!token) {
      return true;
    }

    try {
      request.user = this.jwtTokenService.verifyAccessToken(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid Bearer token.');
    }
  }
}
