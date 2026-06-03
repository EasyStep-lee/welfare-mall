# Admin Order Management Read Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each behavior change and superpowers:verification-before-completion before claiming completion.

**Goal:** Give Admin a first read-only order management view after user checkout/payment/fulfillment slices.

**Architecture:** Add an admin-scoped order read path that lists recent orders without requiring a buyer filter, then render that queue in the Admin web app beside the existing product review workflow. Reuse the existing order read projection with latest payment and snapshot lines. This slice is read-only: no refund approval, payment repair, status override, merchant assignment, shipment, pickup code, settlement, export, or permissions model changes.

**Tech Stack:** NestJS order module, Prisma, Jest, React Admin app, Vitest.

---

## File Structure

- Modify `apps/api/src/order/order-read.repository.ts`: add recent-order listing without buyer scope.
- Modify `apps/api/src/order/order-read.service.ts`: expose admin order listing use case.
- Modify `apps/api/src/order/order.controller.ts`: add `GET /api/orders/admin`.
- Modify `apps/api/test/order/order-read.repository.spec.ts`: cover recent admin order listing.
- Modify `apps/api/test/order/order-read.service.spec.ts`: cover service delegation.
- Modify `apps/api/test/order/order-read.e2e-spec.ts`: cover HTTP contract and route order.
- Modify `apps/admin/src/api.ts`: add Admin order read client and types.
- Modify `apps/admin/src/App.tsx`: render read-only order management panel.
- Modify `apps/admin/src/App.test.tsx`: prove orders are loaded and displayed.
- Modify `apps/admin/src/styles.css`: add compact order panel styling if needed.

## Tasks

### Task 1: API Admin Order Read

- [ ] **Step 1: Write failing API tests**

Add tests proving:

- repository lists recent orders newest first without buyer filter and attaches latest payment.
- service delegates to the repository and returns `{ orders }`.
- HTTP `GET /api/orders/admin` returns recent order summaries and is not captured by `GET /api/orders/:orderNo`.

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read --runInBand
```

Expected: FAIL because the admin listing method and route do not exist.

- [ ] **Step 2: Implement API admin order read**

Add repository/service methods and the controller route. Keep `GET /admin` before `GET /:orderNo`.

- [ ] **Step 3: Re-run API tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read --runInBand
```

Expected: PASS.

### Task 2: Admin Web Order Panel

- [ ] **Step 1: Write failing Admin UI test**

Extend `apps/admin/src/App.test.tsx` to mock `/orders/admin`, assert the request is made, and verify the page renders order number, buyer, status, receiver, total amount, latest payment, and line snapshot.

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- --run
```

Expected: FAIL because the Admin order client and panel do not exist.

- [ ] **Step 2: Implement Admin order panel**

Add API client/types, load the order list on mount, render a compact read-only management panel, and show an empty state.

- [ ] **Step 3: Re-run Admin tests**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- --run
```

Expected: PASS.

### Task 3: Verification

- [ ] **Step 1: Run focused API and Admin tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order --runInBand
pnpm --filter @welfare-mall/admin run test -- --run
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
git add docs/superpowers/plans/2026-06-03-admin-order-management-read.md apps/api/src/order apps/api/test/order apps/admin
git commit -m "feat: add admin order management read view"
```

- [ ] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/admin-order-management-read
```

Expected: branch is pushed and a PR targets `main`.

## Acceptance Boundary

This slice proves local source-level Admin read-only order management with automated API and Admin tests. It does not prove runtime Docker/browser rendering, RBAC, refund approval, payment repair, status override, merchant assignment, fulfillment task operations, pickup code generation, logistics handoff, settlement, export, target-environment deployment, true-device behavior, or formal business acceptance.
