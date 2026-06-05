# User Mini-Program Order Cancel Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a local buyer cancel a pending-payment order from the user mini-program order detail page after the backend cancel API is available.

**Architecture:** Keep this as a thin client integration slice. Add a buyer-scoped cancel URL helper, expose a cancel button only for `pending_payment` order details, call `POST /api/orders/:orderNo/cancel` with the local buyer ID and a `user_cancel` reason, then replace the page's order snapshot with the returned cancelled order display. Errors remain page-local and do not mutate the loaded order.

**Tech Stack:** user mini-program CommonJS page modules, Vitest page harness, existing `requestJson` API helper, local Docker smoke.

---

## File Structure

- Modify `apps/user-miniprogram/utils/api.js`
- Modify `apps/user-miniprogram/utils/api.test.mjs`
- Modify `apps/user-miniprogram/pages/order-detail/index.js`
- Modify `apps/user-miniprogram/pages/order-detail/index.test.mjs`
- Modify `apps/user-miniprogram/pages/order-detail/index.wxml`
- Modify `apps/user-miniprogram/pages/order-detail/index.wxss`
- Create `docs/superpowers/plans/2026-06-05-user-miniprogram-order-cancel-action.md`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add cancel URL helper test**

Extend `apps/user-miniprogram/utils/api.test.mjs` to expect `orderCancelUrl(orderNo)` to build `POST /orders/:orderNo/cancel` URLs with encoded order numbers and normalized API base URL.

- [x] **Step 2: Add order detail cancel success test**

Extend `apps/user-miniprogram/pages/order-detail/index.test.mjs` to load a pending-payment order, call `cancelOrder`, assert the request payload includes `buyerUserId: local-user-001` and `reason: user_cancel`, and assert the page updates to the returned cancelled order.

- [x] **Step 3: Add order detail cancel guard/error tests**

Prove paid orders cannot be cancelled from the page and that cancel request failures keep the existing order snapshot while surfacing a cancel error.

- [x] **Step 4: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/api.test.mjs pages/order-detail/index.test.mjs --run
```

Expected: FAIL because the cancel URL helper and page action do not exist yet.

Actual RED: FAIL with `orderCancelUrl is not a function` and `page.cancelOrder is not a function`. An initial Jest-style `--runInBand` attempt failed because this package uses Vitest; the corrected command uses `--run`.

### Task 2: Implementation

- [x] **Step 1: Add cancel URL helper**

Export `orderCancelUrl(orderNo, baseUrl)` from `utils/api.js`.

- [x] **Step 2: Add page cancel state and action**

Add `canCancelOrder`, `cancellingOrder`, and `cancelError` page state. Implement `cancelOrder` with pending-payment guard, POST request, returned order replacement, and error handling.

- [x] **Step 3: Add WXML/WXSS action surface**

Render a secondary cancel button next to the pending-payment payment action and show cancel errors without hiding payment errors.

### Task 3: Verification

- [x] **Step 1: Run focused user mini-program tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/api.test.mjs pages/order-detail/index.test.mjs --run
```

Expected: PASS.

Actual: PASS with 2 files / 13 tests.

- [x] **Step 2: Run full local verification**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

Actual: PASS. `pnpm run verify` passed with API 58 suites / 217 tests, Admin 14 tests, Merchant 6 tests, Portal 2 tests, and user mini-program 9 files / 32 tests. `git diff --check` passed with CRLF warnings only.

- [x] **Step 3: Run local Docker smoke**

Run:

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Expected: PASS locally.

Actual: PASS locally. `pnpm run docker:runtime:up`, `pnpm run docker:runtime:smoke`, and `pnpm run docker:page-smoke` completed successfully.

## Boundaries

- This slice uses the fixed local buyer identity already used by the mini-program.
- This slice does not add WeChat DevTools true-device acceptance.
- This slice does not deploy to the target environment.
- This slice does not add automatic payment timeout cancellation.

## Completion Evidence

- Feature PR: <https://github.com/EasyStep-lee/welfare-mall/pull/137>
- Merged main commit: `74781e3 feat: add user miniprogram order cancel action (#137)`
- RED evidence: `pnpm --filter @welfare-mall/user-miniprogram run test -- utils/api.test.mjs pages/order-detail/index.test.mjs --run` failed with `orderCancelUrl is not a function` and `page.cancelOrder is not a function`.
- Focused GREEN evidence: `pnpm --filter @welfare-mall/user-miniprogram run test -- utils/api.test.mjs pages/order-detail/index.test.mjs --run` passed with 2 files / 13 tests.
- Full verification evidence: `pnpm run verify` passed with API 58 suites / 217 tests, Admin 14 tests, Merchant 6 tests, Portal 2 tests, and user mini-program 9 files / 32 tests.
- Static diff evidence: `git diff --check` passed with CRLF warnings only.
- Docker runtime evidence: `pnpm run docker:runtime:up`, `pnpm run docker:runtime:smoke`, and `pnpm run docker:page-smoke` passed locally.
- Acceptance boundary: local Docker/runtime and automated mini-program tests only; target-environment deployment, WeChat DevTools true-device acceptance, and formal business acceptance remain outside this slice.
