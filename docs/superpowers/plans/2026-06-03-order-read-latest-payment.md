# Order Read Latest Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let order list/detail reads expose the latest payment order so the user mini program can show persisted payment status after refresh.

**Architecture:** Keep payment creation and callback behavior unchanged. Add a `latestPayment` projection to order read records by querying `OrderPayment` rows keyed by `orderNo` and selecting the newest payment per order. User mini-program display helpers format the optional payment into list/detail state; pages render it when present. This does not create provider prepay parameters or call `wx.requestPayment`.

**Tech Stack:** NestJS order read service/repository, Prisma, native WeChat mini program CommonJS helpers, Jest, Vitest.

---

## File Structure

- Modify `apps/api/src/order/order-checkout.repository.ts`: extend order read record type with optional `latestPayment`.
- Modify `apps/api/src/order/order-read.repository.ts`: attach latest payment records to list/detail results.
- Modify `apps/api/test/order/order-read.repository.spec.ts`: cover latest payment lookup and mapping.
- Modify `apps/api/test/order/order-read.service.spec.ts`: keep service contract compatible with enriched records.
- Modify `apps/api/test/order/order-read.e2e-spec.ts`: prove HTTP returns `latestPayment`.
- Modify `apps/user-miniprogram/utils/order.js`: format latest payment labels.
- Modify `apps/user-miniprogram/utils/order.test.mjs`: cover list/detail payment display.
- Modify `apps/user-miniprogram/pages/orders/index.wxml`: render payment status on order cards.
- Modify `apps/user-miniprogram/pages/orders/index.test.mjs`: prove payment display state.
- Modify `apps/user-miniprogram/pages/order-detail/index.wxml`: render persisted latest payment before local payment result.
- Modify `apps/user-miniprogram/pages/order-detail/index.test.mjs`: prove loaded payment display state.

## Tasks

### Task 1: API Order Read Projection

- [x] **Step 1: Write failing API read tests**

Add tests proving:

- `OrderReadRepository.listOrdersByBuyer` queries payments for returned order numbers and attaches the newest payment as `latestPayment`.
- `OrderReadRepository.findOrderForBuyer` attaches `latestPayment` for detail reads.
- HTTP list/detail responses include `latestPayment` when the service returns it.

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read --runInBand
```

Expected: FAIL because order reads do not yet attach payment data.

- [x] **Step 2: Implement API read projection**

Extend order read records with `latestPayment`. Query `orderPayment.findMany` for the order numbers in the read result, ordered newest first, and attach the first payment per `orderNo`.

- [x] **Step 3: Re-run API read tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read --runInBand
```

Expected: PASS.

### Task 2: User Mini Program Payment Display

- [x] **Step 1: Write failing mini-program display tests**

Add tests proving:

- order summary display includes `paymentText` from `latestPayment`.
- order detail display includes `latestPaymentDisplay`.
- order list/detail pages preserve those display fields after loading.

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/order.test.mjs pages/orders/index.test.mjs pages/order-detail/index.test.mjs --run
```

Expected: FAIL because display helpers and markup do not render persisted payment status.

- [x] **Step 2: Implement mini-program display**

Format optional `latestPayment` with channel/status labels and render it on order cards and order details. Keep local `paymentDisplay` from newly created payments as the immediate result block.

- [x] **Step 3: Re-run mini-program display tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/order.test.mjs pages/orders/index.test.mjs pages/order-detail/index.test.mjs --run
```

Expected: PASS.

### Task 3: Verification

- [x] **Step 1: Run focused order and mini-program tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order --runInBand
pnpm --filter @welfare-mall/user-miniprogram run test -- --run
```

- [x] **Step 2: Run full repository gate**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

### Task 4: GitHub Integration

- [x] **Step 1: Commit the slice**

Run:

```powershell
git add docs/superpowers/plans/2026-06-03-order-read-latest-payment.md apps/api/src/order apps/api/test/order apps/user-miniprogram
git commit -m "feat: expose latest order payment reads"
```

- [x] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/order-read-latest-payment
```

Expected: branch is pushed and a PR targets `main`.

## Acceptance Boundary

This slice proves local API and mini-program source-level visibility of persisted payment orders. It does not prove WeChat provider prepay creation, `wx.requestPayment`, payment callback processing in a live environment, true-device behavior, target-environment deployment, actual funds movement, franchise settlement, or formal business acceptance.
