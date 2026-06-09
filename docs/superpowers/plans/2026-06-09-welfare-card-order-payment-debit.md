# Welfare Card Order Payment Debit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect franchise-issued welfare cards to order payment creation so mixed payments debit the buyer's welfare-card account and leave the remaining cash amount for online WeChat/Alipay payment.

**Architecture:** Keep order checkout's existing amount split. At payment creation, if `welfareCardPayableAmount > 0`, resolve the sales franchise from the order's product lines, debit the buyer's active welfare-card account for that franchise inside the same transaction as payment creation, and write a signed `payment` ledger entry.

**Business Constraints:** Franchise is the sales party and welfare-card issuer. Users can only spend the welfare card issued by the sales franchise. Merchant publishes and fulfills goods, but does not issue or own user welfare-card balance. User cash payment is online WeChat/Alipay only; `cash` is not a user payment/refund channel. No store/shop subject is introduced.

**Out of Scope:** Portal payment UI, real WeChat/Alipay adapter invocation, welfare-card refund return, multi-franchise checkout splitting, and franchise console balance screens.

---

### Task 1: RED Payment Debit And Channel Boundary

**Files:**
- Modify: `apps/api/test/order/order-payment.service.spec.ts`
- Modify: `apps/api/test/order/order-payment.repository.spec.ts`
- Modify: `apps/api/test/order/order-payment.e2e-spec.ts`
- Modify: `apps/api/test/order/order-refund.service.spec.ts`
- Modify: `apps/api/test/order/order-refund.e2e-spec.ts`

- [x] **Step 1: Add failing payment tests**

Cover:

- Payment service rejects `cash` before repository writes.
- Payment API rejects `cash` before service call.
- Repository debits the sales franchise welfare-card account and writes a signed `payment` ledger entry.
- Repository rejects insufficient welfare-card balance before creating payment.

Evidence:
- Initial RED failed because `cash` was accepted by service/API and repository did not query/debit welfare-card account.

- [x] **Step 2: Add failing refund channel tests**

Cover:

- Refund service rejects `cash` before repository writes.
- Refund API rejects `cash` before service call.

Evidence:
- Refund service RED failed because `cash` was accepted.

### Task 2: GREEN Payment Debit

**Files:**
- Modify: `apps/api/src/order/order-payment-status.ts`
- Modify: `apps/api/src/order/order-refund-status.ts`
- Modify: `apps/api/src/order/order-payment.service.ts`
- Modify: `apps/api/src/order/order-payment.repository.ts`
- Modify: `apps/api/src/order/order-refund.service.ts`
- Modify: `apps/api/src/order/order.controller.ts`

- [x] **Step 1: Remove offline cash channel from API enums and validation**

Payment and refund channels are now only `wechat` and `alipay`.

- [x] **Step 2: Debit welfare-card account during payment creation**

If `welfareCardPayableAmount > 0`, resolve one sales franchise from order lines, find the buyer's active franchise welfare-card account, decrement balance, and write a `payment` ledger entry with a negative amount and `orderNo`.

Evidence:
- Focused payment/refund tests passed: 5 suites, 35 tests.
- `pnpm --filter @welfare-mall/api run typecheck` passed.

### Task 3: Verification

- [x] **Step 1: Run focused API verification**

Run:

```powershell
pnpm --filter @welfare-mall/api run typecheck
pnpm --filter @welfare-mall/api run test -- test/order/order-payment.service.spec.ts test/order/order-payment.repository.spec.ts test/order/order-payment.e2e-spec.ts test/order/order-refund.service.spec.ts test/order/order-refund.e2e-spec.ts --runInBand
```

Evidence:
- `pnpm --filter @welfare-mall/api run typecheck` passed.
- Focused payment/refund tests passed: 5 suites, 35 tests.

- [x] **Step 2: Run business-boundary guard**

Run:

```powershell
pnpm run verify:business-boundary
```

Evidence:
- `pnpm run verify:business-boundary` passed with `Business boundary check passed (32 known deviation files tracked).`

- [x] **Step 3: Run full verification**

Run:

```powershell
pnpm run verify
git diff --check
```

Evidence:
- `pnpm run verify` passed, including frontend stack boundary, business boundary, Prisma generate, lint, typecheck, API Jest 66/66 suites and 279/279 tests, Admin Vitest 22/22 tests, Merchant Vitest 16/16 tests, Portal Vitest 18/18 tests, and user-miniprogram Vitest 35/35 tests.
- `git diff --check` exited 0. It printed Windows LF/CRLF working-copy warnings only.

- [x] **Step 4: Run Docker runtime verification**

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/start-docker-runtime.ps1
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Evidence:
- Docker runtime rebuilt and started API/Admin/Merchant/Portal on ports 3000/5173/5174/5175.
- Live API mixed-payment check issued 2000 cents to `franchise-local-review`, created order `ORDER-20260609094541697-RHCWI1`, created pending WeChat payment with `welfareCardPayableAmount=1000` and `cashPayableAmount=5990`, and rejected `cash` payment channel with HTTP 400.
- MySQL confirmed buyer `buyer-runtime-20260609054541` account balance became 1000, with ledger entries `issue +2000 balanceAfter=2000` and `payment -1000 balanceAfter=1000` linked to the order.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.

### Task 4: Completion

- [x] Commit feature work on `codex/welfare-card-order-payment-debit`.
- [x] Push branch and open PR.
- [x] Wait for GitHub checks.
- [x] Merge PR to `main`.
- [x] Open docs-only completion PR marking this plan complete after the feature merge.

Evidence:
- Feature commit: `2d32d8c feat: debit welfare card on order payment`.
- Feature PR: `#249 feat: debit welfare card on order payment`.
- GitHub Actions run `Project docs check` completed successfully, including `project-foundation-check` and `docs-check`.
- Feature PR was squash-merged to `main` as `1676be8 feat: debit welfare card on order payment`.
- Docs-only completion branch: `codex/docs-welfare-card-order-payment-debit-complete`.
