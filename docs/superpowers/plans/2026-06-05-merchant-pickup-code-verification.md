# Merchant Pickup Code Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require Merchant operators to submit the stored pickup code before completing pickup fulfillment tasks.

**Architecture:** Extend the merchant fulfillment complete request with optional `pickupCode`. The service normalizes the code and the repository rejects pickup tasks when the provided code is blank or does not match the task's stored `pickupCode`; delivery tasks continue to complete without a code. The Merchant app renders a pickup-code verification input only for pending pickup cards and sends it with the complete request.

**Tech Stack:** NestJS order fulfillment controller/service/repository, Jest, React Merchant app, Vitest, Docker local runtime/page smoke.

---

## File Structure

- Modify `apps/api/src/order/order.controller.ts`
- Modify `apps/api/src/order/order-fulfillment.service.ts`
- Modify `apps/api/src/order/order-fulfillment.repository.ts`
- Modify `apps/api/test/order/order-fulfillment.e2e-spec.ts`
- Modify `apps/api/test/order/order-fulfillment.service.spec.ts`
- Modify `apps/api/test/order/order-fulfillment.repository.spec.ts`
- Modify `apps/merchant/src/api.ts`
- Modify `apps/merchant/src/App.tsx`
- Modify `apps/merchant/src/App.test.tsx`
- Modify `apps/merchant/src/styles.css`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add failing backend and Merchant tests**

Add tests proving:

- controller forwards `pickupCode` from the complete request body.
- service trims optional `pickupCode` before calling the repository.
- pickup tasks are not completed when `pickupCode` is blank or mismatched.
- pickup tasks complete when `pickupCode` matches the stored code.
- delivery tasks still complete without `pickupCode`.
- Merchant pending pickup cards show a verification input and submit the entered code.

- [x] **Step 2: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-fulfillment.repository.spec.ts test/order/order-fulfillment.service.spec.ts test/order/order-fulfillment.e2e-spec.ts --runInBand
pnpm --filter @welfare-mall/merchant run test --run src/App.test.tsx
```

Expected: FAIL because complete requests do not carry or verify pickup codes yet.

### Task 2: Implementation

- [x] **Step 1: Add pickup-code validation to completion**

Extend complete inputs with optional `pickupCode`, normalize it in the service, and have the repository return `null` without updating when a pickup task has no matching code.

- [x] **Step 2: Add Merchant pickup-code entry**

Render a code input for pending pickup tasks, keep delivery cards unchanged, send the code with completion, and keep a short business-facing error path through the existing notice area.

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

- [x] **Step 3: Run live local pickup-code smoke**

Against Docker API, create a pickup order, mark payment paid, prove completion with a wrong code is rejected, prove completion with the returned `pickupCode` succeeds, and confirm Merchant page still loads without console errors.

### Task 4: GitHub Integration

- [x] **Step 1: Commit, push, PR, merge**

Commit message:

```text
feat: verify merchant pickup codes
```

Expected: PR targets `main` and includes RED/GREEN, full verify, Docker, live API, and browser smoke evidence.

Result:

- Feature commit: `9053520 feat: verify merchant pickup codes`
- Feature PR: `#121 feat: verify merchant pickup codes`
- Main merge commit: `337811c feat: verify merchant pickup codes (#121)`

## Acceptance Boundary

This slice verifies typed pickup codes for local Merchant fulfillment completion only. It does not add QR scanning, camera access, pickup-code expiration, one-time masking, SMS/phone privacy, shipment labels, logistics tracking, inventory reservation, target-environment deployment, true-device checks, or formal acceptance.
