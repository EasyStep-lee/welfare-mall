import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from '../../src/iam/permission.guard';
import { PermissionCode } from '../../src/iam/permissions';

function createContext(userPermissions: PermissionCode[]): ExecutionContext {
  const request = { user: { permissions: userPermissions } };

  return {
    getClass: () => class TestController {},
    getHandler: () => function testHandler() {},
    switchToHttp: () => ({
      getRequest: () => request
    })
  } as unknown as ExecutionContext;
}

describe('PermissionGuard', () => {
  it('allows a user with every required permission', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['product:read'])
    } as unknown as Reflector;
    const guard = new PermissionGuard(reflector);

    expect(guard.canActivate(createContext(['product:read', 'product:write']))).toBe(true);
  });

  it('rejects a user missing a required permission', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['product:write'])
    } as unknown as Reflector;
    const guard = new PermissionGuard(reflector);

    expect(guard.canActivate(createContext(['product:read']))).toBe(false);
  });
});

