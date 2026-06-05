# Inventory Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose inventory reservation lifecycle evidence to Admin as a local read-only inventory view.

**Architecture:** Add a focused order-inventory read model under the order module. The API reads `InventoryReservation` rows with optional `status`, `merchantId`, and `orderNo` filters, and Admin renders a read-only panel below order management with reservation status, order number, product, merchant, quantity, source, and release time.

**Tech Stack:** NestJS order module, Prisma read repository, Jest API tests, React Admin app, Vitest + Testing Library, Docker local runtime smoke.

---

## File Structure

- Create `apps/api/src/order/order-inventory.repository.ts`
- Create `apps/api/src/order/order-inventory.service.ts`
- Modify `apps/api/src/order/order.module.ts`
- Modify `apps/api/src/order/order.controller.ts`
- Create `apps/api/test/order/order-inventory.repository.spec.ts`
- Create `apps/api/test/order/order-inventory.service.spec.ts`
- Modify `apps/api/test/order/order-read.e2e-spec.ts`
- Modify `apps/admin/src/api.ts`
- Modify `apps/admin/src/App.tsx`
- Modify `apps/admin/src/App.test.tsx`
- Modify `apps/admin/src/styles.css`
- Create `docs/superpowers/plans/2026-06-05-inventory-read-model.md`

## Tasks

### Task 1: RED API Tests

- [x] **Step 1: Add repository read test**

Create `apps/api/test/order/order-inventory.repository.spec.ts` with a test proving `listReservations({ status: "reserved", merchantId: "merchant-001", orderNo: "ORDER-001" })` calls Prisma `inventoryReservation.findMany` with trimmed filters, `createdAt desc` ordering, `take: 100`, and returns `{ reservations: [...] }`.

- [x] **Step 2: Add service normalization test**

Create `apps/api/test/order/order-inventory.service.spec.ts` with a test proving blank filters become `undefined`, status stays optional, and the service delegates to the repository.

- [x] **Step 3: Add API contract test**

Extend `apps/api/test/order/order-read.e2e-spec.ts` with a mocked `OrderInventoryService` provider and a `GET /api/orders/admin/inventory-reservations?status=reserved&merchantId=merchant-001&orderNo=ORDER-001` test that expects the service input to be trimmed and the response to include one reservation row.

- [x] **Step 4: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-inventory.repository.spec.ts test/order/order-inventory.service.spec.ts test/order/order-read.e2e-spec.ts --runInBand
```

Expected: FAIL because `OrderInventoryRepository` and `OrderInventoryService` do not exist and the controller has no route.

### Task 2: API Implementation

- [x] **Step 1: Implement `OrderInventoryRepository`**

Create `apps/api/src/order/order-inventory.repository.ts` with `listReservations(input)` that reads `this.prisma.inventoryReservation.findMany`, applies optional `status`, `merchantId`, and `orderNo` filters, orders by `createdAt: "desc"`, limits to `100`, and returns `{ reservations }`.

- [x] **Step 2: Implement `OrderInventoryService`**

Create `apps/api/src/order/order-inventory.service.ts` with a `listReservations(input)` method that trims optional filters, drops empty strings, and delegates to the repository.

- [x] **Step 3: Wire API route**

Add `OrderInventoryRepository` and `OrderInventoryService` to `apps/api/src/order/order.module.ts`. Inject `OrderInventoryService` into `OrderController` and add `GET /api/orders/admin/inventory-reservations`.

### Task 3: RED Admin Tests

- [x] **Step 1: Add Admin API client test coverage through App test**

Extend `apps/admin/src/App.test.tsx` fetch mock so `/orders/admin/inventory-reservations` returns one reservation. Add an assertion that initial render calls the new endpoint and displays order number, merchant, product, quantity, reserved status, and release timestamp.

- [x] **Step 2: Add Admin filter interaction test**

Add a test that types `merchant-001` into the inventory merchant filter, clicks the filter button, and expects fetch to call `/orders/admin/inventory-reservations?merchantId=merchant-001`.

- [x] **Step 3: Run focused RED Admin tests**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test --run
```

Expected: FAIL because Admin does not fetch or render inventory reservations yet.

### Task 4: Admin Implementation

- [x] **Step 1: Extend Admin API types and client**

Add `AdminInventoryReservation`, `AdminInventoryReservationStatusFilter`, labels, response type, and `fetchAdminInventoryReservations` to `apps/admin/src/api.ts`.

- [x] **Step 2: Render inventory panel**

In `apps/admin/src/App.tsx`, add state and load function for inventory reservations. Render a compact read-only panel under order management with status tabs, merchant/order filters, a count badge, and reservation rows.

- [x] **Step 3: Style the inventory panel**

Add CSS to `apps/admin/src/styles.css` for the inventory panel, filters, list rows, and status badges using existing panel/card visual language.

### Task 5: Verification

- [x] **Step 1: Run focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-inventory.repository.spec.ts test/order/order-inventory.service.spec.ts test/order/order-read.e2e-spec.ts --runInBand
pnpm --filter @welfare-mall/admin run test --run
```

Expected: PASS.

- [x] **Step 2: Run local verification gates**

Run:

```powershell
pnpm run verify
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
git diff --check
```

Expected: PASS.

- [x] **Step 3: Run live API smoke**

Call:

```powershell
Invoke-RestMethod 'http://localhost:3000/api/orders/admin/inventory-reservations'
```

Expected: response contains `reservations` and can include the live smoke rows created by previous inventory slices.

## Completion Evidence

- Feature PR: #129
- Merged main commit: `6cca353 feat: add admin inventory reservation read model (#129)`
- Focused API tests: `pnpm --filter @welfare-mall/api run test -- test/order/order-inventory.repository.spec.ts test/order/order-inventory.service.spec.ts test/order/order-read.e2e-spec.ts --runInBand` passed, 3 suites / 11 tests.
- Focused Admin tests: `pnpm --filter @welfare-mall/admin run test --run` passed, 1 file / 12 tests.
- Full verification: `pnpm run verify` passed, including API 56 suites / 203 tests, Admin 12 tests, Merchant 6 tests, Portal 2 tests, and user mini-program 29 tests.
- Docker runtime: `pnpm run docker:runtime:up`, `pnpm run docker:runtime:smoke`, and `pnpm run docker:page-smoke` passed.
- Live API smoke: `Invoke-RestMethod 'http://localhost:3000/api/orders/admin/inventory-reservations' | ConvertTo-Json -Depth 6` returned `reservations`.
- Container status: API `3000`, Admin `5173`, Merchant `5174`, Portal `5175`, MySQL `3306`, and Redis `6379` were healthy under `docker compose -f docker-compose.yml ps`.
- Admin served asset smoke: `http://localhost:5173/assets/index-DadwNXRb.js` contained `库存预占`, `库存商户`, and `inventory-reservations`.
- Whitespace check: `git diff --check` reported no whitespace errors; only Git CRLF conversion warnings.

## Boundaries

- This slice is read-only.
- This slice does not decrement sellable stock.
- This slice does not edit or release reservations manually.
- This slice does not add Merchant/Portal inventory views.
