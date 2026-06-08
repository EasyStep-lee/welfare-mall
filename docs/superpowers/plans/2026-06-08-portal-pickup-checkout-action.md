# Portal Pickup Checkout Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let local Portal buyers create pickup checkout orders from the product detail panel instead of being limited to delivery checkout.

**Architecture:** Keep Portal as Vue 3 + Vite. Reuse the existing `POST /api/orders` checkout contract, which already supports `fulfillment.type = pickup`. Add Portal UI state and typed checkout payload support only; do not change backend fulfillment, Merchant completion, pickup code generation, payments, refunds, Admin behavior, or target deployment in this slice.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, Vue Test Utils, jsdom, Docker Compose.

---

### Task 1: Write Failing Portal Pickup Checkout Test

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Assert product detail exposes a pickup fulfillment choice**

Open a product detail panel and expect a visible `选择门店自提履约方式` action.

- [x] **Step 2: Assert pickup checkout posts pickup fulfillment**

Click the pickup choice, create an order, and expect `POST /api/orders` to include:
- `buyerUserId: local-user-001`
- one selected product-pool item
- `welfareCardPaymentAmount: 0`
- `fulfillment.type: pickup`
- `fulfillment.pickupStoreName: 本地自提点`

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
```

Evidence:
- RED: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` failed 1/16 because the product detail panel did not expose `button[aria-label="选择门店自提履约方式"]`.

### Task 2: Implement Portal Pickup Checkout

**Files:**
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`
- Modify: `apps/portal/src/styles.css`

- [x] **Step 1: Add typed pickup fulfillment support to Portal checkout input**

Allow `PortalOrderCheckoutInput.fulfillment` to be either delivery or pickup.

- [x] **Step 2: Add Portal checkout fulfillment mode state**

Expose delivery and pickup mode buttons in the product detail checkout block, reset mode on product detail open/close, and keep the existing delivery default.

- [x] **Step 3: Post the selected fulfillment payload**

Use the selected checkout mode to send either the existing local delivery payload or the local pickup store payload.

Evidence:
- GREEN: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed with 16/16 tests.

### Task 3: Verification

- [x] **Step 1: Run focused tests and typecheck**

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
pnpm --filter @welfare-mall/portal run typecheck
pnpm run verify:frontend-stack
```

Evidence:
- `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed with 16/16 tests.
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
- API accepts a local Portal pickup checkout and returns `fulfillmentType = pickup` on order detail readback.
- Served `http://localhost:5175/assets/...` bundle contains `门店自提`, `本地自提点`, and `pickupStoreName`.
- Browser on `http://localhost:5175` opens product detail, selects `门店自提`, creates an order, and shows the created pickup order.

Evidence:
- `pnpm run docker:runtime:up` passed and rebuilt Portal served bundle `/assets/index-CMMPSvbw.js` and stylesheet `/assets/index-B9WWuusl.css`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- Served `http://localhost:5175/assets/index-CMMPSvbw.js` contains `门店自提`, `本地自提点`, `pickupStoreName`, and `pickup`.
- Runtime API proof created pickup order `ORDER-20260608053409515-86OUGX`; `GET /api/orders/ORDER-20260608053409515-86OUGX?buyerUserId=local-user-001` returned `fulfillmentType = pickup`, `pickupStoreName = 本地自提点`, and `receiverAddress = null`.
- Browser proof on `http://localhost:5175` opened product detail, selected `门店自提`, created order `ORDER-20260608053454055-MYPI88`, and showed `订单创建成功`, `门店自提`, `本地自提点`, and `待支付`. API reread of the browser-created order returned `fulfillmentType = pickup` and `pickupStoreName = 本地自提点`.

### Task 4: GitHub Integration

- [x] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
feat: let portal create pickup orders
```

- [x] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

Evidence:
- Feature branch `codex/portal-pickup-checkout-action` committed `0e133bf feat: let portal create pickup orders`.
- PR #227 `feat: let portal create pickup orders` passed `docs-check` and `project-foundation-check`, then merged into `main` with squash merge commit `2e2adc1261bb604910ce310ff1dcd6cbe31c9b04`.
- Docs-only branch `codex/docs-portal-pickup-checkout-complete` marks this plan complete.

## Acceptance Boundary

This slice proves Portal local source/runtime behavior for explicit pickup checkout creation. It does not add store selection, pickup-code verification, Merchant fulfillment completion changes, real logistics integration, target-environment deployment, true-device checks, or formal business acceptance.
