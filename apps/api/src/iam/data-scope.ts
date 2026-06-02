export type DataScope =
  | { type: 'platform' }
  | { type: 'franchise'; franchiseId: string }
  | { type: 'merchant'; merchantId: string }
  | { type: 'self'; userId: string };

export type DataScopeTarget = {
  franchiseId?: string;
  merchantId?: string;
  userId?: string;
};

export type DataScopeResult = { allowed: true } | { allowed: false; reason: string };

export function evaluateDataScope(input: { scope: DataScope; target: DataScopeTarget }): DataScopeResult {
  if (input.scope.type === 'platform') {
    return { allowed: true };
  }

  if (input.scope.type === 'franchise') {
    return input.scope.franchiseId === input.target.franchiseId
      ? { allowed: true }
      : { allowed: false, reason: 'franchise scope mismatch' };
  }

  if (input.scope.type === 'merchant') {
    return input.scope.merchantId === input.target.merchantId
      ? { allowed: true }
      : { allowed: false, reason: 'merchant scope mismatch' };
  }

  return input.scope.userId === input.target.userId ? { allowed: true } : { allowed: false, reason: 'self scope mismatch' };
}

