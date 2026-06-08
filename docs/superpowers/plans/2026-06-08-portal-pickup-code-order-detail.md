# Portal Pickup Code Order Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let local Portal buyers see the pickup code on pickup order details when the API returns one.

**Architecture:** Keep Portal as Vue 3 + Vite. Reuse the existing buyer order detail API, which can already return `pickupCode` for pickup orders. Extend only Portal order typing and detail rendering; do not change order creation, merchant pickup-code verification, mini-program behavior, or backend pickup-code generation in this slice.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, Vue Test Utils, jsdom, Docker Compose.

---

### Task 1: Write Failing Portal Pickup-Code Detail Test

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Add a pickup order detail fixture with `pickupCode`**

Add a Portal order fixture where:
- `fulfillmentType` is `pickup`
- `pickupStoreName` is present
- `pickupCode` is `WM_PICKUP:FT-ORDER-PORTAL-PICKUP-001`

- [x] **Step 2: Assert order detail renders the pickup code**

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
```

Expected: FAIL because Portal order detail does not type or render `pickupCode` yet.

Evidence:
- RED: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` failed 1/12 because the pickup order detail text did not contain `取货码`.

### Task 2: Implement Portal Pickup-Code Detail Display

**Files:**
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`
- Modify: `apps/portal/src/styles.css`

- [x] **Step 1: Add optional `pickupCode` to `PortalOrderRecord`**

- [x] **Step 2: Render a compact `取货码` row in order detail only when `selectedOrder.pickupCode` is present**

- [x] **Step 3: Style the row within the existing order detail section without adding a new endpoint or workflow**

### Task 3: Verification

- [x] **Step 1: Run focused tests and typecheck**

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
pnpm --filter @welfare-mall/portal run typecheck
pnpm run verify:frontend-stack
```

Evidence:
- GREEN: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed with 12/12 tests.
- `pnpm --filter @welfare-mall/portal run typecheck` passed.
- `pnpm run verify:frontend-stack` passed.

- [x] **Step 2: Run full local verification**

```powershell
pnpm run verify
git diff --check
```

Evidence:
- `pnpm run verify` passed.
- `git diff --check` passed with Windows line-ending warnings only.

- [x] **Step 3: Runtime proof**

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then verify:
- API `GET /api/orders/:orderNo?buyerUserId=local-user-001` returns `pickupCode` for a local pickup order detail.
- Served `http://localhost:5175/assets/...` bundle contains `取货码` and `pickupCode`.
- Browser on `http://localhost:5175` opens that pickup order and shows the pickup code.

Evidence:
- `pnpm run docker:runtime:up` passed and rebuilt Portal bundle `/assets/index-C7cUekuA.js` plus `/assets/index-Bp_jzbxQ.css`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- API `GET /api/orders/ORDER-20260608033110176-JSFNGY?buyerUserId=local-user-001` returned `pickupCode = WM_PICKUP:FT-ORDER-20260608033110176-JSFNGY-MERCHANT-LOCAL-REVIEW-1780889470335`.
- Served bundle contains `取货码`, `pickupCode`, and `.pickup-code-row`.
- Browser on `http://localhost:5175` opened order `ORDER-20260608033110176-JSFNGY` and showed `取货码`, `本地自提点`, and the pickup code.

### Task 4: GitHub Integration

- [x] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
feat: show portal pickup codes
```

Evidence:
- Feature branch: `codex/portal-pickup-code-order-detail`
- Feature PR: `https://github.com/EasyStep-lee/welfare-mall/pull/219`
- Feature merge commit: `178f33d5122649ff3287ada410a4295d13fd4b47`
- GitHub checks: `docs-check` and `project-foundation-check` passed.

- [x] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

Evidence:
- Docs-only branch: `codex/docs-portal-pickup-code-complete`

## Acceptance Boundary

This slice proves Portal source/runtime behavior for buyer-visible pickup-code display on local pickup order details. It does not add QR scanning, pickup-code expiration, editable pickup stores, merchant completion changes, target-environment deployment, true-device checks, or formal business acceptance.
