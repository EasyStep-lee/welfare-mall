import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { parseBearerToken } from './auth.guard';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined>; user?: unknown }>();
    const token = parseBearerToken(request.headers.authorization);
    if (!token) {
      return true;
    }

    try {
      request.user = await this.authService.authenticateAccessToken(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid Bearer token.');
    }
  }
}
