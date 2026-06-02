import { evaluatePermissions } from '../../src/iam/permission-evaluator';

describe('evaluatePermissions', () => {
  it('allows when the user has every required permission', () => {
    const result = evaluatePermissions({
      userPermissions: ['product:read', 'product:write'],
      requiredPermissions: ['product:read']
    });

    expect(result).toEqual({ allowed: true, missingPermissions: [] });
  });

  it('denies and reports missing permissions', () => {
    const result = evaluatePermissions({
      userPermissions: ['product:read'],
      requiredPermissions: ['product:read', 'product:write']
    });

    expect(result).toEqual({ allowed: false, missingPermissions: ['product:write'] });
  });
});

