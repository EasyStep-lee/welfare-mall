# IAM RBAC Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first IAM foundation for Welfare Mall V2: permission catalog, RBAC permission evaluation, data-scope evaluation, route metadata decorators, guard behavior, audit event structure, and Prisma model shell.

**Architecture:** IAM starts with deterministic domain logic and tests before login is implemented. The API gains an `IamModule` that exposes a permission catalog and reusable guard/decorator primitives. Prisma receives the IAM table shell so later branches can add login, sessions, departments, positions, and persistence without changing permission semantics.

**Tech Stack:** NestJS, TypeScript, Jest, Prisma, OpenAPI, pnpm workspace.

---

## Scope

This branch implements IAM primitives only.

Included:

- Permission catalog constants.
- Role and user permission evaluation.
- Data scope evaluation for platform, franchise, merchant, and self scopes.
- `@RequirePermissions()` route metadata decorator.
- `PermissionGuard` that reads request user context.
- Structured audit event factory.
- IAM Prisma model shell.
- OpenAPI regeneration.

Not included:

- Password login.
- JWT/session persistence.
- Department and position workspaces.
- Admin UI.
- Merchant UI.
- Real user database queries.
- Proxy login sessions.

## File Structure

Create:

- `apps/api/src/iam/iam.module.ts`
- `apps/api/src/iam/permissions.ts`
- `apps/api/src/iam/permission-evaluator.ts`
- `apps/api/src/iam/data-scope.ts`
- `apps/api/src/iam/audit-event.ts`
- `apps/api/src/iam/require-permissions.decorator.ts`
- `apps/api/src/iam/permission.guard.ts`
- `apps/api/src/iam/iam.controller.ts`
- `apps/api/test/iam/permission-evaluator.spec.ts`
- `apps/api/test/iam/data-scope.spec.ts`
- `apps/api/test/iam/audit-event.spec.ts`
- `apps/api/test/iam/permission.guard.spec.ts`

Modify:

- `apps/api/src/app.module.ts`
- `apps/api/prisma/schema.prisma`
- `docs/superpowers/plans/2026-06-02-iam-rbac-audit.md`

## Task 1: Baseline Verification

**Files:**
- Read: `apps/api/src/app.module.ts`
- Read: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Confirm branch**

Run:

```powershell
git status -sb
git branch --show-current
```

Expected:

```text
## codex/iam-rbac-audit
codex/iam-rbac-audit
```

- [ ] **Step 2: Run current API checks**

Run:

```powershell
pnpm run verify:api
pnpm run build
```

Expected: both commands exit 0 before IAM changes.

## Task 2: Permission Catalog and Evaluator

**Files:**
- Create: `apps/api/src/iam/permissions.ts`
- Create: `apps/api/src/iam/permission-evaluator.ts`
- Create: `apps/api/test/iam/permission-evaluator.spec.ts`

- [ ] **Step 1: Write failing permission evaluator test**

Create `apps/api/test/iam/permission-evaluator.spec.ts`:

```ts
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
```

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- --runInBand test/iam/permission-evaluator.spec.ts
```

Expected: fails because `permission-evaluator` does not exist.

- [ ] **Step 2: Add permission catalog**

Create `apps/api/src/iam/permissions.ts`:

```ts
export const PermissionCodes = {
  ProductRead: 'product:read',
  ProductWrite: 'product:write',
  ProductAudit: 'product:audit',
  MerchantRead: 'merchant:read',
  MerchantWrite: 'merchant:write',
  FranchiseRead: 'franchise:read',
  FranchiseWrite: 'franchise:write',
  SettlementRead: 'settlement:read',
  SettlementAdjust: 'settlement:adjust',
  AuditRead: 'audit:read'
} as const;

export type PermissionCode = (typeof PermissionCodes)[keyof typeof PermissionCodes];

export const PermissionCatalog: Array<{ code: PermissionCode; name: string; risk: 'low' | 'medium' | 'high' }> = [
  { code: PermissionCodes.ProductRead, name: '商品查看', risk: 'low' },
  { code: PermissionCodes.ProductWrite, name: '商品编辑', risk: 'medium' },
  { code: PermissionCodes.ProductAudit, name: '商品审核', risk: 'high' },
  { code: PermissionCodes.MerchantRead, name: '商户查看', risk: 'low' },
  { code: PermissionCodes.MerchantWrite, name: '商户编辑', risk: 'high' },
  { code: PermissionCodes.FranchiseRead, name: '加盟商查看', risk: 'low' },
  { code: PermissionCodes.FranchiseWrite, name: '加盟商编辑', risk: 'high' },
  { code: PermissionCodes.SettlementRead, name: '结算查看', risk: 'medium' },
  { code: PermissionCodes.SettlementAdjust, name: '结算调整', risk: 'high' },
  { code: PermissionCodes.AuditRead, name: '审计查看', risk: 'medium' }
];
```

- [ ] **Step 3: Add permission evaluator**

Create `apps/api/src/iam/permission-evaluator.ts`:

```ts
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
```

- [ ] **Step 4: Verify evaluator**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- --runInBand test/iam/permission-evaluator.spec.ts
```

Expected: tests pass.

## Task 3: Data Scope Evaluator

**Files:**
- Create: `apps/api/src/iam/data-scope.ts`
- Create: `apps/api/test/iam/data-scope.spec.ts`

- [ ] **Step 1: Write failing data-scope tests**

Create `apps/api/test/iam/data-scope.spec.ts`:

```ts
import { evaluateDataScope } from '../../src/iam/data-scope';

describe('evaluateDataScope', () => {
  it('allows platform scope to access every target', () => {
    expect(evaluateDataScope({ scope: { type: 'platform' }, target: { merchantId: 'm-1' } })).toEqual({ allowed: true });
  });

  it('allows merchant scope only for its merchant id', () => {
    expect(evaluateDataScope({ scope: { type: 'merchant', merchantId: 'm-1' }, target: { merchantId: 'm-1' } })).toEqual({
      allowed: true
    });
    expect(evaluateDataScope({ scope: { type: 'merchant', merchantId: 'm-1' }, target: { merchantId: 'm-2' } })).toEqual({
      allowed: false,
      reason: 'merchant scope mismatch'
    });
  });
});
```

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- --runInBand test/iam/data-scope.spec.ts
```

Expected: fails because `data-scope` does not exist.

- [ ] **Step 2: Add evaluator**

Create `apps/api/src/iam/data-scope.ts`:

```ts
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
```

- [ ] **Step 3: Verify data scope**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- --runInBand test/iam/data-scope.spec.ts
```

Expected: tests pass.

## Task 4: Decorator and Guard

**Files:**
- Create: `apps/api/src/iam/require-permissions.decorator.ts`
- Create: `apps/api/src/iam/permission.guard.ts`
- Create: `apps/api/test/iam/permission.guard.spec.ts`

- [ ] **Step 1: Write failing guard tests**

Create `apps/api/test/iam/permission.guard.spec.ts` with tests proving the guard allows users with required permissions and rejects missing permissions.

- [ ] **Step 2: Add decorator**

Create `apps/api/src/iam/require-permissions.decorator.ts`:

```ts
import { SetMetadata } from '@nestjs/common';
import { PermissionCode } from './permissions';

export const REQUIRED_PERMISSIONS_METADATA_KEY = 'requiredPermissions';

export function RequirePermissions(...permissions: PermissionCode[]) {
  return SetMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, permissions);
}
```

- [ ] **Step 3: Add guard**

Create `apps/api/src/iam/permission.guard.ts` with a `CanActivate` implementation that reads required permissions from metadata and user permissions from `request.user.permissions`.

- [ ] **Step 4: Verify guard**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- --runInBand test/iam/permission.guard.spec.ts
```

Expected: tests pass.

## Task 5: Audit Event Factory

**Files:**
- Create: `apps/api/src/iam/audit-event.ts`
- Create: `apps/api/test/iam/audit-event.spec.ts`

- [ ] **Step 1: Write failing audit event tests**

Create `apps/api/test/iam/audit-event.spec.ts` proving audit events contain actor, action, target, reason, risk, and timestamp.

- [ ] **Step 2: Add audit event factory**

Create `apps/api/src/iam/audit-event.ts` with a pure `createAuditEvent()` function.

- [ ] **Step 3: Verify audit event**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- --runInBand test/iam/audit-event.spec.ts
```

Expected: tests pass.

## Task 6: IAM Module and Catalog Endpoint

**Files:**
- Create: `apps/api/src/iam/iam.module.ts`
- Create: `apps/api/src/iam/iam.controller.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Add IAM module and controller**

The controller exposes:

```text
GET /api/iam/permissions/catalog
```

The endpoint returns `PermissionCatalog`.

- [ ] **Step 2: Register IAM module**

Modify `apps/api/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { IamModule } from './iam/iam.module';

@Module({
  imports: [HealthModule, IamModule]
})
export class AppModule {}
```

- [ ] **Step 3: Add endpoint test**

Add an e2e test proving `GET /api/iam/permissions/catalog` returns the catalog.

- [ ] **Step 4: Verify endpoint**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- --runInBand test/iam/iam.e2e-spec.ts
```

Expected: tests pass.

## Task 7: Prisma IAM Model Shell

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Add IAM models**

Add models:

- `IamUser`
- `IamRole`
- `IamPermission`
- `IamUserRole`
- `IamRolePermission`
- `IamAuditLog`

Required fields:

- stable string ids
- unique codes for role and permission
- audit timestamps
- soft delete timestamp on user and role
- JSON metadata only for non-core audit context

- [ ] **Step 2: Validate Prisma schema**

Run:

```powershell
pnpm --filter @welfare-mall/api exec prisma validate
```

Expected: Prisma schema is valid.

## Task 8: OpenAPI, Verification, PR

**Files:**
- All files in this plan

- [ ] **Step 1: Regenerate OpenAPI**

Run:

```powershell
pnpm run openapi:generate
```

Expected: `packages/contracts/openapi/welfare-mall-api.openapi.json` includes `/api/iam/permissions/catalog`.

- [ ] **Step 2: Full verification**

Run:

```powershell
pnpm run verify:api
pnpm run build
pnpm run verify
```

Expected: all commands exit 0.

- [ ] **Step 3: Runtime smoke**

Run the built API on a temporary port and request:

```text
GET /api/iam/permissions/catalog
```

Expected: response contains permission code `product:read`.

- [ ] **Step 4: Commit and push**

Run:

```powershell
git status -sb
git add apps/api packages/contracts docs/superpowers/plans/2026-06-02-iam-rbac-audit.md
git commit -m "feat: add iam rbac audit foundation"
git push -u origin codex/iam-rbac-audit
```

Expected: branch is pushed and ready for a draft PR.

## Self-Review

Spec coverage:

- IAM starts with permission/data-scope/audit primitives before login.
- High-risk settlement and merchant permissions are named early.
- Data scope is explicit and not inferred by each controller.
- Audit event structure exists before high-risk writes are added.

Placeholder scan:

- This plan avoids unresolved placeholder markers.

Type consistency:

- Permission codes are strings with domain-action shape.
- `DataScope` uses platform, franchise, merchant, and self as explicit variants.
- IAM endpoint path uses the existing global `/api` prefix.

