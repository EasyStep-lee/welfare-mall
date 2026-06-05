# Fulfillment Pickup Code Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist and expose a local pickup code for pickup fulfillment tasks so Merchant operators can see the code they would use for handoff verification.

**Architecture:** Add an optional `pickupCode` field to `FulfillmentTask`. When payment callback creates fulfillment tasks, generate a stable code only for pickup orders and store `null` for delivery tasks. Merchant fulfillment reads return the code and the Merchant app renders it on pickup cards. Keep the existing complete action and task status flow unchanged.

**Tech Stack:** Prisma schema, NestJS order payment/fulfillment repositories, Jest, React Merchant app, Vitest, Docker local runtime/page smoke.

---

## File Structure

- Modify `apps/api/prisma/schema.prisma`
- Modify `apps/api/src/order/order-payment.repository.ts`
- Modify `apps/api/src/order/order-fulfillment.repository.ts`
- Modify `apps/api/test/order/order-payment.repository.spec.ts`
- Modify `apps/api/test/order/order-fulfillment.repository.spec.ts`
- Modify `apps/merchant/src/api.ts`
- Modify `apps/merchant/src/App.tsx`
- Modify `apps/merchant/src/App.test.tsx`
- Modify `apps/merchant/src/styles.css`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add failing backend and Merchant tests**

Add tests proving:

- paid pickup callbacks create fulfillment tasks with a pickup code.
- delivery fulfillment tasks keep `pickupCode = null`.
- Merchant fulfillment reads select and return `pickupCode`.
- Merchant pickup cards render the pickup code.

- [x] **Step 2: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-payment.repository.spec.ts test/order/order-fulfillment.repository.spec.ts --runInBand
pnpm --filter @welfare-mall/merchant run test --run src/App.test.tsx
```

Expected: FAIL because pickup code persistence and rendering are not wired yet.

### Task 2: Implementation

- [x] **Step 1: Add pickup code persistence**

Add `pickupCode` to fulfillment tasks, generate it for pickup orders during task creation, and keep delivery tasks null.

- [x] **Step 2: Expose and render pickup code**

Return `pickupCode` from Merchant fulfillment reads and render it in pickup fulfillment cards.

### Task 3: Verification

- [x] **Step 1: Run focused tests**

Run the same focused test commands from RED. Expected: PASS.

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

### Task 4: GitHub Integration

- [ ] **Step 1: Commit, push, PR, merge**

Commit message:

```text
feat: add fulfillment pickup codes
```

Expected: PR targets `main` and includes focused/full/Docker verification evidence.

## Acceptance Boundary

This slice persists and displays local pickup codes only. It does not add QR scan verification, pickup-code expiration, privacy-number integration, shipment labels, logistics tracking, inventory reservation, settlement, target-environment deployment, true-device checks, or formal acceptance.
