# Auth Identity Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move key buyer and merchant API routes onto the JWT identity contract while preserving the current local-development compatibility path.

**Architecture:** Add optional JWT authentication for existing order, fulfillment, and merchant settlement routes. When a valid Bearer token is present, the API derives `buyerUserId` or `merchantId` from `request.user.subjectId` and ignores conflicting query/body identity fields; when no token is present, the existing local-development query/body identity path remains available until frontend clients are migrated.

**Tech Stack:** NestJS, TypeScript, JWT AuthModule, Jest, Supertest.

---

### Task 1: Buyer Order Identity Contract

**Files:**
- Modify: `apps/api/src/auth/auth.guard.ts`
- Create: `apps/api/src/auth/optional-auth.guard.ts`
- Modify: `apps/api/src/auth/auth.module.ts`
- Modify: `apps/api/src/order/order.module.ts`
- Modify: `apps/api/src/order/order.controller.ts`
- Test: `apps/api/test/order/order-read.e2e-spec.ts`
- Test: `apps/api/test/order/order-checkout.e2e-spec.ts`

- [x] **Step 1: Write failing buyer identity tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read.e2e-spec.ts test/order/order-checkout.e2e-spec.ts --runInBand
```

Expected: FAIL because order list/detail/cancel/checkout still use query/body `buyerUserId` even when a JWT is present.

- [x] **Step 2: Implement optional JWT guard**

`OptionalAuthGuard` verifies a Bearer token when present, writes the decoded JWT payload to `request.user`, rejects invalid tokens with `401`, and allows legacy no-token requests to continue.

- [x] **Step 3: Resolve buyer identity from JWT when present**

Order list, order detail, order cancel, and order checkout use `request.user.subjectId` when `request.user.subjectType === 'buyer'`.

- [x] **Step 4: Verify buyer identity focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read.e2e-spec.ts test/order/order-checkout.e2e-spec.ts --runInBand
```

Expected: PASS.

### Task 2: Merchant Fulfillment Identity Contract

**Files:**
- Modify: `apps/api/src/order/order.controller.ts`
- Test: `apps/api/test/order/order-fulfillment.e2e-spec.ts`

- [x] **Step 1: Write failing merchant fulfillment identity tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-fulfillment.e2e-spec.ts --runInBand
```

Expected: FAIL because fulfillment list/complete still use query/body `merchantId` even when a merchant JWT is present.

- [x] **Step 2: Resolve merchant identity from JWT when present**

Merchant fulfillment list and completion use `request.user.subjectId` when `request.user.subjectType === 'merchant'`.

- [x] **Step 3: Verify merchant fulfillment focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-fulfillment.e2e-spec.ts --runInBand
```

Expected: PASS.

### Task 3: Merchant Settlement Identity Contract

**Files:**
- Modify: `apps/api/src/settlement/settlement.module.ts`
- Modify: `apps/api/src/settlement/settlement.controller.ts`
- Test: `apps/api/test/settlement/settlement.e2e-spec.ts`

- [x] **Step 1: Write failing merchant settlement identity tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/settlement/settlement.e2e-spec.ts --runInBand
```

Expected: FAIL because merchant bill/statement lists still use query `merchantId` even when a merchant JWT is present.

- [x] **Step 2: Resolve settlement merchant identity from JWT when present**

Merchant bill and statement list endpoints use `request.user.subjectId` when `request.user.subjectType === 'merchant'`.

- [x] **Step 3: Verify merchant settlement focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/settlement/settlement.e2e-spec.ts --runInBand
```

Expected: PASS.

### Task 4: Slice Verification

**Files:**
- Modify: `docs/superpowers/plans/2026-06-06-auth-identity-contract.md`

- [x] **Step 1: Run full verification**

Run:

```powershell
pnpm run verify
```

Expected: PASS.

- [ ] **Step 2: Commit, push, open PR, and merge**

Commit message:

```text
feat: derive buyer and merchant identity from JWT
```

- [ ] **Step 3: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark Task 4 complete.
