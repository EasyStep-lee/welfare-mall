# User Pickup Code Order Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show buyer-visible pickup codes on user mini-program order details for pickup orders.

**Architecture:** Keep buyer order lists unchanged. When reading a single buyer order detail, the API loads the latest stored fulfillment pickup code for pickup orders and adds it to the detail payload. The user mini-program formats pickup fulfillment information with store name and pickup code, then renders the code in the existing order-detail fulfillment section.

**Tech Stack:** NestJS order read repository, Jest, user mini-program CommonJS display helpers, Vitest, WXML/WXSS, Docker local runtime smoke.

---

## File Structure

- Modify `apps/api/src/order/order-read.repository.ts`
- Modify `apps/api/test/order/order-read.repository.spec.ts`
- Modify `apps/user-miniprogram/utils/order.js`
- Modify `apps/user-miniprogram/utils/order.test.mjs`
- Modify `apps/user-miniprogram/pages/order-detail/index.test.mjs`
- Modify `apps/user-miniprogram/pages/order-detail/index.wxml`
- Modify `apps/user-miniprogram/pages/order-detail/index.wxss`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add failing backend pickup-code detail test**

Add a repository test proving `findOrderForBuyer()` returns `pickupCode` for a pickup order by reading fulfillment tasks, while `listOrdersByBuyer()` still does not query fulfillment tasks.

- [x] **Step 2: Add failing user mini-program display tests**

Add tests proving pickup order details format `receiverText` from `pickupStoreName`, expose `pickupCodeText`, and the order-detail page stores that display data after loading.

- [x] **Step 3: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read.repository.spec.ts --runInBand
pnpm --filter @welfare-mall/user-miniprogram run test --run utils/order.test.mjs pages/order-detail/index.test.mjs
```

Expected: FAIL because buyer order detail does not attach pickup codes and the mini-program formatter does not expose pickup display fields yet.

### Task 2: Implementation

- [x] **Step 1: Attach pickup code to buyer order detail**

Update the order read repository so single buyer detail reads fulfillment task pickup codes only for pickup orders and returns `pickupCode: string | null` on detail records.

- [x] **Step 2: Format and render pickup code in the user mini-program**

Update the display helper to use pickup store text for pickup orders and expose `pickupCodeText`; update order-detail WXML/WXSS to show a compact `取货码` row only when present.

### Task 3: Verification

- [x] **Step 1: Run focused tests**

Run the same focused commands from RED. Expected: PASS.

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

In the Docker-backed local API, create a pickup order, complete the payment callback, then fetch buyer order detail and confirm the returned `pickupCode` starts with `WM_PICKUP:`.

Evidence: `ORDER-20260605034607066-61B7PG` returned `WM_PICKUP:FT-ORDER-20260605034607066-61B7PG-MERCHANT-LOCAL-REVIEW-1780631167206`.
