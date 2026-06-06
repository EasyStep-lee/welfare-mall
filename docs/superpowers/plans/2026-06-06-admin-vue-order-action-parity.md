# Admin Vue Order Action Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore core Admin order actions on the Vue 3 + Element Plus foundation.

**Architecture:** Keep the Vue Admin runtime and existing Admin API client. Wire local management buttons to `processOrderPaymentCallback`, `createOrderRefund`, and `processOrderRefundCallback`, then refresh order and inventory read models. Use deterministic local IDs/timestamps so tests and local smoke remain stable. This slice does not add new backend behavior or real payment-provider integration.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Vitest, @vue/test-utils.

---

### Task 1: Write Failing Admin Order Action Tests

**Files:**
- Modify: `apps/admin/src/App.test.ts`

- [x] **Step 1: Add failing tests for order payment/refund actions**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- src/App.test.ts --run
```

Expected: FAIL because the Vue order panel does not call payment callback, refund request, or refund callback APIs yet.

### Task 2: Implement Vue Order Action Wiring

**Files:**
- Modify: `apps/admin/src/App.ts`

- [x] **Step 1: Wire payment confirmation**

Clicking `确认支付` posts a deterministic local payment callback for pending payment orders.

- [x] **Step 2: Wire refund request**

Clicking `提交退款` posts a deterministic local refund request for paid orders.

- [x] **Step 3: Wire refund success confirmation**

Clicking `确认退款` posts a deterministic local refund callback for processing refunds.

- [x] **Step 4: Refresh read models**

After order actions, refresh orders plus inventory reservations/stocks so visible state stays consistent.

### Task 3: Verification

- [x] **Step 1: Run focused Admin tests and typecheck**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- src/App.test.ts --run
pnpm --filter @welfare-mall/admin run typecheck
pnpm run verify:frontend-stack
```

- [x] **Step 2: Run full local verification and Docker smoke**

Run:

```powershell
pnpm run verify
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

- [x] **Step 3: Commit, push, open PR, and merge**

Commit message:

```text
feat: restore admin Vue order actions
```

- [x] **Step 4: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark Task 3 complete.
