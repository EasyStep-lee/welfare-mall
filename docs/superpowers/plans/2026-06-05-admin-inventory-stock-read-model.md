# Admin Inventory Stock Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose `InventoryStock` balances to Admin as a local read-only inventory balance view.

**Architecture:** Extend the existing order inventory read model with a stock balance query. The API reads `InventoryStock` rows with optional `merchantId`, `productId`, and `skuId` filters, and Admin renders balances alongside reservation lifecycle evidence so operators can see sellable and reserved quantities without editing stock.

**Tech Stack:** NestJS order module, Prisma read repository, Jest API tests, React Admin app, Vitest + Testing Library, Docker local runtime smoke.

---

## File Structure

- Modify `apps/api/src/order/order-inventory.repository.ts`
- Modify `apps/api/src/order/order-inventory.service.ts`
- Modify `apps/api/src/order/order.controller.ts`
- Modify `apps/api/test/order/order-inventory.repository.spec.ts`
- Modify `apps/api/test/order/order-inventory.service.spec.ts`
- Modify `apps/api/test/order/order-read.e2e-spec.ts`
- Modify `apps/admin/src/api.ts`
- Modify `apps/admin/src/App.tsx`
- Modify `apps/admin/src/App.test.tsx`
- Modify `apps/admin/src/styles.css`
- Create `docs/superpowers/plans/2026-06-05-admin-inventory-stock-read-model.md`

## Tasks

### Task 1: RED API Tests

- [x] **Step 1: Add repository stock balance read test**

Extend `apps/api/test/order/order-inventory.repository.spec.ts` with a test proving `listStocks({ merchantId, productId, skuId })` calls Prisma `inventoryStock.findMany` with those filters, `updatedAt desc` ordering, `take: 100`, and returns `{ stocks }`.

- [x] **Step 2: Add service normalization test**

Extend `apps/api/test/order/order-inventory.service.spec.ts` with a test proving blank stock filters become `undefined`, non-empty filters are trimmed, and the service delegates to the repository.

- [x] **Step 3: Add API contract test**

Extend `apps/api/test/order/order-read.e2e-spec.ts` with `GET /api/orders/admin/inventory-stocks?merchantId=merchant-001&productId=product-001&skuId=sku-001`, expecting normalized service input and a stock balance response.

- [x] **Step 4: Run focused RED API tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-inventory.repository.spec.ts test/order/order-inventory.service.spec.ts test/order/order-read.e2e-spec.ts --runInBand
```

Expected: FAIL because the repository, service, and controller do not expose stock balances yet.

### Task 2: RED Admin Tests

- [x] **Step 1: Add initial stock balance render test**

Extend `apps/admin/src/App.test.tsx` so the default fetch mock returns `/orders/admin/inventory-stocks`, and assert Admin renders stock key, product, merchant, SKU/default SKU, available quantity, reserved quantity, and total quantity.

- [x] **Step 2: Add stock filter interaction test**

Add a test proving the stock merchant/product/SKU filters call `/orders/admin/inventory-stocks` with the expected query string.

- [x] **Step 3: Run focused RED Admin tests**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test --run
```

Expected: FAIL because Admin does not fetch or render stock balances yet.

### Task 3: Implementation

- [x] **Step 1: Implement API stock read model**

Add `listStocks(input)` to `OrderInventoryRepository` and `OrderInventoryService`, then add `GET /api/orders/admin/inventory-stocks` to `OrderController`.

- [x] **Step 2: Extend Admin API client**

Add `AdminInventoryStock`, response type, and `fetchAdminInventoryStocks` to `apps/admin/src/api.ts`.

- [x] **Step 3: Render Admin stock balance panel**

Add a read-only Admin panel for stock balances with filters, row count, product/SKU/merchant identifiers, and available/reserved/total quantities.

- [x] **Step 4: Refresh balances after stock-affecting actions**

Refresh stock balances after payment/refund actions and order list refreshes that can affect reservation state.

### Task 4: Verification

- [x] **Step 1: Run focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-inventory.repository.spec.ts test/order/order-inventory.service.spec.ts test/order/order-read.e2e-spec.ts --runInBand
pnpm --filter @welfare-mall/admin run test --run
```

Expected: PASS.

- [x] **Step 2: Run full local verification**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

- [x] **Step 3: Run local Docker runtime and browser smoke**

Run:

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
Invoke-RestMethod 'http://localhost:3000/api/orders/admin/inventory-stocks'
```

Expected: PASS, and Admin served assets contain `库存余额` and `inventory-stocks`.

## Boundaries

- This slice is read-only.
- This slice does not add Admin stock editing, adjustment, warehouse, batch, lot, or audit workflows.
- This slice does not add Merchant or Portal inventory views.
- This slice does not perform target-environment deployment or true-device acceptance.
