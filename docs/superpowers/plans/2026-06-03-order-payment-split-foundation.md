# Order Payment Split Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the backend rule that splits an order amount into welfare-card payable amount and cash payable amount.

**Architecture:** Keep the split deterministic and payment-free. The amount preview endpoint accepts an optional `welfareCardPaymentAmount`, validates it against the backend-calculated `totalAmount`, and returns cash/welfare payable amounts whose sum equals `totalAmount`.

**Tech Stack:** NestJS 11, Prisma Client, Jest, Supertest, TypeScript.

---

## File Structure

- Create `apps/api/src/order/order-payment-split.ts`: pure split function for amount conservation and validation.
- Modify `apps/api/src/order/order-amount.service.ts`: include `welfareCardPaymentAmount` in preview input and apply the split function after total calculation.
- Modify `apps/api/src/order/order.controller.ts`: accept and validate optional `welfareCardPaymentAmount` before calling service.
- Modify `apps/api/test/order/order-amount.service.spec.ts`: cover welfare/cash split and invalid over-total amount.
- Modify `apps/api/test/order/order-amount-preview.e2e-spec.ts`: cover HTTP contract passing `welfareCardPaymentAmount`.
- Create `apps/api/test/order/order-payment-split.spec.ts`: pure split contract.

## Tasks

### Task 1: Payment Split Pure Rule

**Files:**
- Create: `apps/api/src/order/order-payment-split.ts`
- Test: `apps/api/test/order/order-payment-split.spec.ts`

- [x] **Step 1: Write failing split tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-payment-split.spec.ts --runInBand`

Expected: FAIL because `order-payment-split.ts` does not exist.

- [x] **Step 2: Implement split function**

The function must return `welfareCardPayableAmount = requested amount` and `cashPayableAmount = totalAmount - requested amount`. It must reject negative, non-integer, and over-total welfare-card amounts.

- [x] **Step 3: Re-run split tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-payment-split.spec.ts --runInBand`

Expected: PASS.

### Task 2: Amount Preview Service Split

**Files:**
- Modify: `apps/api/src/order/order-amount.service.ts`
- Modify: `apps/api/test/order/order-amount.service.spec.ts`

- [x] **Step 1: Write failing service tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-amount.service.spec.ts --runInBand`

Expected: FAIL because `welfareCardPaymentAmount` is ignored.

- [x] **Step 2: Apply split rule in service**

Default `welfareCardPaymentAmount` to `0` when omitted. Include the split result in `OrderAmountPreviewResult`.

- [x] **Step 3: Re-run service tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-amount.service.spec.ts --runInBand`

Expected: PASS.

### Task 3: HTTP Contract Split

**Files:**
- Modify: `apps/api/src/order/order.controller.ts`
- Modify: `apps/api/test/order/order-amount-preview.e2e-spec.ts`

- [x] **Step 1: Write failing HTTP contract tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-amount-preview.e2e-spec.ts --runInBand`

Expected: FAIL because controller does not forward `welfareCardPaymentAmount`.

- [x] **Step 2: Update controller request contract**

Accept optional `welfareCardPaymentAmount`, validate it as a non-negative integer, and forward it to `OrderAmountService.previewAmount`.

- [x] **Step 3: Re-run HTTP tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-amount-preview.e2e-spec.ts --runInBand`

Expected: PASS.

### Task 4: Verification and Runtime Proof

**Files:**
- Verify all changed files.

- [x] **Step 1: Run focused order tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order --runInBand`

Expected: PASS.

- [x] **Step 2: Run full repository gate**

Run: `pnpm run verify`

Expected: PASS.

- [x] **Step 3: Run local runtime API proof**

Seed and publish a local product pool item, then call `POST /api/orders/amount-preview` with `welfareCardPaymentAmount = 5000`.

Expected: `totalAmount = 13980`, `welfareCardPayableAmount = 5000`, `cashPayableAmount = 8980`.

### Task 5: GitHub Integration

**Files:**
- Commit all changed files.

- [x] **Step 1: Commit the slice**

Run: `git add docs/superpowers/plans/2026-06-03-order-payment-split-foundation.md apps/api/src/order apps/api/test/order`

Run: `git commit -m "feat: add order payment split foundation"`

- [x] **Step 2: Push and open a draft PR**

Run: `git push -u origin codex/order-payment-split-foundation`

Expected: branch is pushed and a draft PR is created against `main`.

Result: PR #31 was opened, marked ready after verification, and squash-merged into `main` as `b5a0cd5`.
