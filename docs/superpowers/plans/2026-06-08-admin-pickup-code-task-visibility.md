# Admin Pickup Code Task Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let local Admin operators see stored pickup codes on pickup fulfillment task details in the Admin order workbench.

**Architecture:** Extend the existing Admin order read model with the already-persisted `FulfillmentTask.pickupCode`, then render the value inside the existing fulfillment task detail row only when present. Keep the slice read-only; Portal pickup-code display and Merchant pickup-code verification remain unchanged.

**Tech Stack:** NestJS, Prisma, Vue 3, Vite, Element Plus, Vitest, Vue Test Utils, jsdom, Docker Compose.

---

### Task 1: API Admin Fulfillment Task Pickup Code

**Files:**
- Modify: `apps/api/test/order/order-read.repository.spec.ts`
- Modify: `apps/api/src/order/order-read.repository.ts`

- [x] **Step 1: Write the failing API read-model test**

Add an Admin order read assertion that a pickup fulfillment task includes:
- `taskNo`
- `pickupCode: WM_PICKUP:<taskNo>`

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- order-read.repository
```

Expected: FAIL because Admin fulfillment task details currently omit `pickupCode`.

Evidence:
- RED: `pnpm --filter @welfare-mall/api run test -- order-read.repository` failed because `fulfillmentTaskSummarySelect()` did not include `pickupCode`.

- [x] **Step 2: Implement API read-model pickup code**

Add nullable `pickupCode` to `AdminOrderFulfillmentTask`, select it from `FulfillmentTask`, and attach it in `groupFulfillmentTasksByOrderNo`.

- [x] **Step 3: Re-run focused API test**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- order-read.repository
```

Expected: PASS.

Evidence:
- GREEN: `pnpm --filter @welfare-mall/api run test -- order-read.repository` passed with 10/10 tests.

### Task 2: Admin Vue Pickup Code Display

**Files:**
- Modify: `apps/admin/src/App.test.ts`
- Modify: `apps/admin/src/api.ts`
- Modify: `apps/admin/src/App.ts`

- [x] **Step 1: Write the failing Admin UI test**

Add a pickup fulfillment task fixture with `pickupCode: WM_PICKUP:FT-PICKUP-001` and assert the Admin order card renders:
- `取货码`
- `WM_PICKUP:FT-PICKUP-001`

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- App.test.ts --run
```

Expected: FAIL because Admin task rows currently render task number, merchant, status, and completed time only.

Evidence:
- RED: `pnpm --filter @welfare-mall/admin run test -- App.test.ts --run` failed because the Admin order task details did not contain `取货码`.

- [x] **Step 2: Implement Admin Vue display**

Add optional `pickupCode` to the Admin order type and render `取货码 <code>` in `renderOrderFulfillmentTasks` when present.

- [x] **Step 3: Re-run focused Admin test**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- App.test.ts --run
```

Expected: PASS.

Evidence:
- GREEN: `pnpm --filter @welfare-mall/admin run test -- App.test.ts --run` passed with 15/15 tests.

### Task 3: Verification

- [x] **Step 1: Run focused tests and typechecks**

```powershell
pnpm --filter @welfare-mall/api run test -- order-read.repository
pnpm --filter @welfare-mall/admin run test -- App.test.ts --run
pnpm --filter @welfare-mall/admin run typecheck
pnpm run verify:frontend-stack
```

Evidence:
- `pnpm --filter @welfare-mall/api run test -- order-read.repository` passed with 10/10 tests.
- `pnpm --filter @welfare-mall/admin run test -- App.test.ts --run` passed with 15/15 tests.
- `pnpm --filter @welfare-mall/admin run typecheck` passed.
- `pnpm run verify:frontend-stack` passed.

- [x] **Step 2: Run full local verification**

```powershell
pnpm run verify
git diff --check
```

Evidence:
- `pnpm run verify` passed.
- `git diff --check` passed with Windows line-ending warnings only.

- [x] **Step 3: Runtime proof**

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then verify:
- API `GET /api/orders/admin?status=paid&fulfillmentStatus=pending` returns a local pickup task with `pickupCode`.
- Served `http://localhost:5173/assets/...` bundle contains `取货码`.
- Browser on `http://localhost:5173` shows the pickup code in Admin order task details.

Evidence:
- `pnpm run docker:runtime:up` passed and rebuilt Admin bundle `/assets/index-BWktoJho.js`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- API `GET /api/orders/admin?status=paid&fulfillmentStatus=pending` returned pickup task `FT-ORDER-20260608033110176-JSFNGY-MERCHANT-LOCAL-REVIEW-1780889470335` with `pickupCode = WM_PICKUP:FT-ORDER-20260608033110176-JSFNGY-MERCHANT-LOCAL-REVIEW-1780889470335`.
- Served bundle `/assets/index-BWktoJho.js` contains `取货码`, `pickupCode`, and `order-fulfillment-task`.
- Browser on `http://localhost:5173` showed `取货码 WM_PICKUP:FT-ORDER-20260608033110176-JSFNGY-MERCHANT-LOCAL-REVIEW-1780889470335` inside Admin fulfillment task details.

### Task 4: GitHub Integration

- [x] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
feat: show admin pickup codes
```

Evidence:
- Feature branch `codex/admin-pickup-code-task-visibility` committed `23381f5 feat: show admin pickup codes`.
- PR #233 `feat: show admin pickup codes` passed `docs-check` and `project-foundation-check`.
- PR #233 was squash-merged into `main` as `f22edb4 feat: show admin pickup codes`.

- [x] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

Evidence:
- Docs-only branch `codex/docs-admin-pickup-code-task-visibility-complete` marks this GitHub integration section complete.

## Acceptance Boundary

This slice proves local Admin source/runtime behavior for read-only pickup-code visibility on fulfillment task details. It does not change pickup-code generation, Merchant verification, Portal buyer display, QR scanning, logistics tracking, target-environment deployment, true-device checks, or formal business acceptance.
