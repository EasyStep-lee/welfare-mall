# Merchant Fulfillment Complete Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let merchants mark paid fulfillment orders complete after they finish delivery or pickup.

**Architecture:** Extend the existing read-only merchant fulfillment projection with one write action. The API validates `merchantId`, confirms the order contains at least one merchant-owned order line, requires the current order header status to be `paid`, and then updates both `OrderHeader.status` and `OrderState.status` to `completed`. The merchant web app adds a compact action button to each fulfillment card and refreshes the queue after success. This slice does not create fulfillment task records, inventory reservations, pickup codes, shipment tracking, logistics handoff, or settlement records.

**Tech Stack:** NestJS order module, Prisma, Jest, React merchant app, Vitest.

---

## File Structure

- Modify `apps/api/src/order/order-fulfillment.repository.ts`: add transactional merchant-owned paid-order completion.
- Modify `apps/api/src/order/order-fulfillment.service.ts`: validate input and expose completion use case.
- Modify `apps/api/src/order/order.controller.ts`: add `POST /api/orders/merchant/fulfillment/:orderNo/complete`.
- Modify `apps/api/test/order/order-fulfillment.repository.spec.ts`: cover complete success, merchant ownership rejection, and non-paid rejection.
- Modify `apps/api/test/order/order-fulfillment.service.spec.ts`: cover service validation/delegation.
- Modify `apps/api/test/order/order-fulfillment.e2e-spec.ts`: cover HTTP contract.
- Modify `apps/merchant/src/api.ts`: add complete-order client.
- Modify `apps/merchant/src/App.tsx`: add confirmation button and refresh fulfillment queue on success.
- Modify `apps/merchant/src/App.test.tsx`: prove the button calls the API and refreshes the queue.
- Modify `apps/merchant/src/styles.css`: add action-row styling if needed.

## Tasks

### Task 1: API Merchant Completion Action

- [ ] **Step 1: Write failing API tests**

Add tests proving:

- repository completes a paid order containing merchant-owned lines and updates both `orderHeader` and `orderState` to `completed`.
- repository returns `null` when the order is not owned by the merchant.
- repository throws `BadRequestException` when the order is not `paid`.
- service rejects blank `merchantId` and blank `orderNo`.
- HTTP `POST /api/orders/merchant/fulfillment/ORDER-20260603-001/complete` accepts `{ merchantId }` and returns `{ order }`.

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-fulfillment --runInBand
```

Expected: FAIL because the completion repository method, service method, and route do not exist.

- [ ] **Step 2: Implement API completion behavior**

Add the repository transaction, service method, and controller route. Keep the route before `GET /:orderNo` so it cannot be captured as a buyer order detail request.

- [ ] **Step 3: Re-run API tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-fulfillment --runInBand
```

Expected: PASS.

### Task 2: Merchant Web Completion Button

- [ ] **Step 1: Write failing merchant UI test**

Extend `apps/merchant/src/App.test.tsx` to click `确认完成` on a fulfillment card, assert the request uses:

```text
POST http://localhost:3000/api/orders/merchant/fulfillment/ORDER-20260603-001/complete
body {"merchantId":"merchant-001"}
```

Then assert the fulfillment queue is fetched again and a success message is shown.

Run:

```powershell
pnpm --filter @welfare-mall/merchant run test -- --run
```

Expected: FAIL because the client and button do not exist.

- [ ] **Step 2: Implement merchant UI completion behavior**

Add API client, render a `确认完成` button on each fulfillment card, call the API, show a success message, and reload fulfillment orders.

- [ ] **Step 3: Re-run merchant tests**

Run:

```powershell
pnpm --filter @welfare-mall/merchant run test -- --run
```

Expected: PASS.

### Task 3: Verification

- [ ] **Step 1: Run focused order and merchant tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order --runInBand
pnpm --filter @welfare-mall/merchant run test -- --run
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
git add docs/superpowers/plans/2026-06-03-merchant-fulfillment-complete-action.md apps/api/src/order apps/api/test/order apps/merchant
git commit -m "feat: complete merchant fulfillment orders"
```

- [ ] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/merchant-fulfillment-complete-action
```

Expected: branch is pushed and a PR targets `main`.

## Acceptance Boundary

This slice proves local API and merchant-web source-level completion of paid merchant fulfillment orders. It does not prove inventory reservation, fulfillment task persistence, shipment tracking, pickup code generation, logistics mini-program handoff, Docker/browser runtime behavior, target-environment deployment, true-device behavior, settlement, or formal business acceptance.
