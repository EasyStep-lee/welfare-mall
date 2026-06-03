# Order Read Latest Refund Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each behavior change and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Return and display the latest refund snapshot on order read flows after a refund request exists.

**Architecture:** Extend the existing order read projection alongside `latestPayment`. `OrderReadRepository` queries `orderRefund` by order numbers, keeps the newest refund per order, and returns `latestRefund`. Admin and user mini-program order displays render refund number/status/channel/amount when present.

**Tech Stack:** NestJS order read repository/service/controller tests, React Admin app, native WeChat mini program CommonJS helpers, Vitest/Jest.

---

## File Structure

- Modify `apps/api/src/order/order-checkout.repository.ts`: add `OrderCheckoutRefundRecord` and `latestRefund`.
- Modify `apps/api/src/order/order-read.repository.ts`: attach latest refunds after latest payments.
- Modify `apps/api/test/order/order-read.repository.spec.ts`: prove latest refund attachment for buyer, admin, and detail reads.
- Modify `apps/api/test/order/order-read.service.spec.ts`: keep service pass-through coverage for `latestRefund`.
- Modify `apps/api/test/order/order-read.e2e-spec.ts`: prove API responses can carry `latestRefund`.
- Modify `apps/admin/src/api.ts`: add `latestRefund` to `AdminOrder`.
- Modify `apps/admin/src/App.tsx`: render refund information in order cards.
- Modify `apps/admin/src/App.test.tsx`: assert Admin order list displays latest refund.
- Modify `apps/user-miniprogram/utils/order.js`: add latest refund display to order summary/detail.
- Modify `apps/user-miniprogram/utils/order.test.mjs`: assert latest refund display mapping.
- Modify `apps/user-miniprogram/pages/order-detail/index.wxml`: render latest refund block from loaded order detail.
- Modify `apps/user-miniprogram/pages/order-detail/index.test.mjs`: assert loaded detail includes refund display.

## Tasks

### Task 1: API Latest Refund Projection

- [x] **Step 1: Write failing API repository and contract tests**

Extend order read tests so a read order with a refund returns:

- `latestRefund.refundNo`
- `latestRefund.status`
- `latestRefund.channel`
- `latestRefund.refundAmount`
- `latestRefund.reason`

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read --runInBand
```

Expected: FAIL because `OrderReadRepository` does not query `orderRefund` or return `latestRefund`.

- [x] **Step 2: Implement latest refund attachment**

Add `OrderCheckoutRefundRecord`, add optional `latestRefund`, query `this.prisma.orderRefund.findMany({ where: { orderNo: { in: orderNos } }, orderBy: { createdAt: "desc" } })`, and attach the newest refund per order.

- [x] **Step 3: Re-run API order read tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read --runInBand
```

Expected: PASS.

### Task 2: Admin Latest Refund Display

- [x] **Step 1: Write failing Admin UI test**

Extend `apps/admin/src/App.test.tsx` so the order management card displays refund information from `latestRefund`.

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- --run
```

Expected: FAIL because Admin order cards do not render refund information.

- [x] **Step 2: Implement Admin display**

Add `latestRefund` to `AdminOrder`, render `退款` metric with channel/status/amount/refund number when present.

- [x] **Step 3: Re-run Admin tests**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- --run
```

Expected: PASS.

### Task 3: User Mini-Program Latest Refund Display

- [x] **Step 1: Write failing user mini-program tests**

Extend `utils/order.test.mjs` and `pages/order-detail/index.test.mjs` so a loaded order detail with `latestRefund` displays refund number/status/channel/amount.

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/order.test.mjs pages/order-detail/index.test.mjs --run
```

Expected: FAIL because loaded order detail ignores `latestRefund`.

- [x] **Step 2: Implement user mini-program display**

Use existing refund display helper from `utils/refund.js` inside `utils/order.js`, and render a latest refund section in order detail WXML.

- [x] **Step 3: Re-run user mini-program tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/order.test.mjs pages/order-detail/index.test.mjs --run
```

Expected: PASS.

### Task 4: Verification

- [x] **Step 1: Run focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read --runInBand
pnpm --filter @welfare-mall/admin run test -- --run
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/order.test.mjs pages/order-detail/index.test.mjs --run
```

- [x] **Step 2: Run full repository gate**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

### Task 5: GitHub Integration

- [ ] **Step 1: Commit the slice**

Run:

```powershell
git add docs/superpowers/plans/2026-06-03-order-read-latest-refund.md apps/api apps/admin apps/user-miniprogram
git commit -m "feat: expose latest refund on order reads"
```

- [ ] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/order-read-latest-refund
```

Expected: branch is pushed and a PR targets `main`.

## Acceptance Boundary

This slice proves source-level order read projection and local UI display for the newest refund record. It does not implement refund approval, partial refund editing, provider callback processing, actual funds movement, online channel execution, franchise settlement, Docker/browser runtime rendering, WeChat DevTools compilation, true-device behavior, target-environment deployment, or formal business acceptance.
