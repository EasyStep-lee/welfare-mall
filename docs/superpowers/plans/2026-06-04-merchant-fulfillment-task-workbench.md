# Merchant Fulfillment Task Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Merchant fulfillment panel show task-backed fulfillment metadata so local merchants can distinguish task number, task status, creation time, and completion time after the fulfillment task foundation.

**Architecture:** Keep the existing Merchant fulfillment API contract endpoint and completion action. Extend the task-backed API record and Merchant client type to include the business task number (`taskNo`) plus task metadata, then render task number and task timeline fields in the fulfillment cards. Keep status tabs mapped to existing API status values (`paid` and `completed`) so no route shape changes are required.

**Tech Stack:** React Merchant app, TypeScript API client types, Vitest/Testing Library, Docker local runtime/page smoke.

---

## File Structure

- Modify `apps/api/src/order/order-fulfillment.repository.ts`
- Modify `apps/api/test/order/order-fulfillment.repository.spec.ts`
- Modify `apps/merchant/src/api.ts`
- Modify `apps/merchant/src/App.tsx`
- Modify `apps/merchant/src/App.test.tsx`
- Modify `apps/merchant/src/styles.css`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add failing Merchant workbench tests**

Add tests proving:

- API fulfillment records expose `taskNo`.
- pending fulfillment cards show business task number, pending task status label, and created time.
- completed fulfillment cards show completed task status label and completed time.
- pending cards keep the existing complete action.
- completed cards do not show the complete action.

- [x] **Step 2: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/merchant run test --run src/App.test.tsx
```

Expected: FAIL because task metadata is not rendered yet.

### Task 2: Implementation

- [x] **Step 1: Extend Merchant fulfillment client type**

Add `taskNo`, `id`, `createdAt`, `updatedAt`, and `completedAt` fields to `MerchantFulfillmentOrder`.

- [x] **Step 2: Render task metadata**

Render task number, status label, created time, and completed time in the fulfillment card. Use the task `id` as task number because the current API response exposes task identity through `id`.

- [x] **Step 3: Guard completed actions**

Only show `确认完成` for pending/paid fulfillment tasks. Completed tasks should stay read-only.

### Task 3: Verification

- [x] **Step 1: Run focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/merchant run test --run src/App.test.tsx
```

- [x] **Step 2: Run full local gates**

Run:

```powershell
pnpm run verify
pnpm run docker:runtime:up
pnpm run docker:page-smoke
git diff --check
```

Expected: PASS.

### Task 4: GitHub Integration

- [ ] **Step 1: Commit, push, PR, merge**

Commit message:

```text
feat: show merchant fulfillment task metadata
```

Expected: PR targets `main` and includes focused/full/Docker verification evidence.

## Acceptance Boundary

This slice improves local Merchant visibility for task-backed fulfillment. It does not add task assignment, batching, shipment labels, pickup codes, logistics tracking, inventory reservation, settlement, target-environment deployment, true-device checks, or formal acceptance.
