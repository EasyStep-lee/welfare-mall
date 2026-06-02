import { PermissionCode } from './permissions';

export type PermissionEvaluationInput = {
  userPermissions: PermissionCode[];
  requiredPermissions: PermissionCode[];
};

export type PermissionEvaluationResult = {
  allowed: boolean;
  missingPermissions: PermissionCode[];
};

export function evaluatePermissions(input: PermissionEvaluationInput): PermissionEvaluationResult {
  const userPermissionSet = new Set(input.userPermissions);
  const missingPermissions = input.requiredPermissions.filter((permission) => !userPermissionSet.has(permission));

  return {
    allowed: missingPermissions.length === 0,
    missingPermissions
  };
}

