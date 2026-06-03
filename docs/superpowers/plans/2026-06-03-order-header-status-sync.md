# Order Header Status Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `OrderHeader.status` aligned with payment and refund state transitions so buyer reads and merchant fulfillment queues reflect real paid/refund statuses.

**Architecture:** Reuse the existing order-domain repositories and state transition rules. When payment or refund transitions update `OrderState`, the same transaction also updates `OrderHeader.status` to the transition target. Duplicate callbacks keep the existing idempotent no-op behavior. This slice does not add fulfillment completion, shipping, pickup codes, inventory reservation, settlement, or new Prisma models.

**Tech Stack:** NestJS order module, Prisma, Jest.

---

## File Structure

- Modify `apps/api/src/order/order-payment.repository.ts`: update `OrderHeader.status` when a payment callback marks an order paid.
- Modify `apps/api/src/order/order-refund.repository.ts`: update `OrderHeader.status` when refund creation, refund success, or refund failure changes order state.
- Modify `apps/api/test/order/order-payment.repository.spec.ts`: prove paid callbacks update order header status and duplicate callbacks do not.
- Modify `apps/api/test/order/order-refund.repository.spec.ts`: prove refund transitions update order header status and duplicate callbacks do not.

## Tasks

### Task 1: Payment Header Status Sync

- [ ] **Step 1: Write failing payment repository test**

Extend `apps/api/test/order/order-payment.repository.spec.ts` so the first paid callback expects:

```ts
expect(tx.orderHeader.update).toHaveBeenCalledWith({
  where: { orderNo: 'ORDER-20260603-001' },
  data: { status: 'paid' }
});
```

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-payment.repository.spec.ts --runInBand
```

Expected: FAIL because `tx.orderHeader` is missing or not called.

- [ ] **Step 2: Implement payment header sync**

Add `orderHeader.update` to the payment transaction type and call it only when the first paid callback transitions the payment from `pending` to `paid`.

- [ ] **Step 3: Re-run payment repository test**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-payment.repository.spec.ts --runInBand
```

Expected: PASS.

### Task 2: Refund Header Status Sync

- [ ] **Step 1: Write failing refund repository tests**

Extend `apps/api/test/order/order-refund.repository.spec.ts` so:

- refund creation expects `orderHeader.update` with `refund_processing`.
- first successful refund callback expects `orderHeader.update` with `refunded`.
- duplicate callback expects no `orderHeader.update`.

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-refund.repository.spec.ts --runInBand
```

Expected: FAIL because header updates do not exist yet.

- [ ] **Step 2: Implement refund header sync**

Add `orderHeader.update` to refund repository clients and synchronize status for refund request, refund success, and refund failure transitions.

- [ ] **Step 3: Re-run refund repository test**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-refund.repository.spec.ts --runInBand
```

Expected: PASS.

### Task 3: Verification

- [ ] **Step 1: Run focused order tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order --runInBand
```

- [ ] **Step 2: Run full repository gate**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

### Task 4: GitHub Integration

- [ ] **Step 1: Commit the slice**

Run:

```powershell
git add docs/superpowers/plans/2026-06-03-order-header-status-sync.md apps/api/src/order apps/api/test/order
git commit -m "fix: sync order header status from payment and refund"
```

- [ ] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/order-header-status-sync
```

Expected: branch is pushed and a PR targets `main`.

## Acceptance Boundary

This slice proves local repository and API test coverage for synchronizing `OrderHeader.status` with payment/refund transitions. It does not prove merchant fulfillment completion actions, inventory reservation, pickup code generation, logistics mini-program handoff, Docker/runtime behavior, target-environment deployment, true-device behavior, or formal business acceptance.
