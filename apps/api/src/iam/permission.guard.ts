import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { evaluatePermissions } from './permission-evaluator';
import { PermissionCode } from './permissions';
import { REQUIRED_PERMISSIONS_METADATA_KEY } from './require-permissions.decorator';

type RequestWithUser = {
  user?: {
    permissions?: PermissionCode[];
  };
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<PermissionCode[]>(REQUIRED_PERMISSIONS_METADATA_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const result = evaluatePermissions({
      userPermissions: request.user?.permissions ?? [],
      requiredPermissions
    });

    return result.allowed;
  }
}

