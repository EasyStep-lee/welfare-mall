import { SetMetadata } from '@nestjs/common';
import { PermissionCode } from './permissions';

export const REQUIRED_PERMISSIONS_METADATA_KEY = 'requiredPermissions';

export function RequirePermissions(...permissions: PermissionCode[]) {
  return SetMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, permissions);
}

