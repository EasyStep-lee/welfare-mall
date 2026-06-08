# Portal Pickup Merchant Wording Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove store/pickup-point wording from Portal pickup order detail display. Pickup order details should present merchant-centered fulfillment text (`商户自提` plus order-line `履约商户`) while retaining the existing `pickupStoreName` compatibility payload for the checkout API.

**Architecture:** Keep Portal on Vue 3 + Vite. Do not change backend schema, checkout payload shape, or pickup-code behavior. This slice only changes buyer-visible Portal order detail wording so pickup is framed as merchant fulfillment instead of a store/pickup-point subject.

**Tech Stack:** Vue 3, Vite, Vitest, Vue Test Utils, Docker Compose.

---

### Task 1: RED Portal Pickup Detail Wording

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Write failing Portal pickup detail test**

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
```

Expected: FAIL because pickup order detail currently renders the raw `pickupStoreName` value such as `本地自提点`.

Evidence:
- RED Portal: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` failed because pickup order detail rendered `配送地址 本地自提点` and did not contain `履约方式`.

### Task 2: GREEN Portal Display

**Files:**
- Modify: `apps/portal/src/App.vue`

- [x] **Step 1: Render pickup detail as merchant fulfillment**

Show pickup order facts as `履约方式: 商户自提` instead of using the compatibility pickup location value as the main buyer-visible field.

- [x] **Step 2: Keep line-level merchant context visible**

Continue showing `履约商户 <merchantId>` on order lines.

- [x] **Step 3: Re-run focused tests and typecheck**

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
pnpm --filter @welfare-mall/portal run typecheck
pnpm run verify:frontend-stack
```

Evidence:
- GREEN Portal: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed with 17/17 tests.
- `pnpm --filter @welfare-mall/portal run typecheck` passed.
- `pnpm run verify:frontend-stack` passed.

### Task 3: Verification

- [x] **Step 1: Run full local verification**

```powershell
pnpm run verify
git diff --check
```

Evidence:
- `pnpm run verify` passed, including frontend stack boundary, Prisma generate, lint, typecheck, API Jest 63/63 suites, Admin Vitest 21/21 tests, Merchant Vitest 15/15 tests, Portal Vitest 17/17 tests, and user-miniprogram Vitest 35/35 tests.
- `git diff --check` passed with only Windows LF/CRLF working-copy warnings.

- [x] **Step 2: Runtime proof**

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then verify:
- Served `http://localhost:5175/assets/...` bundle contains `商户自提` and `履约商户`.
- Browser on `http://localhost:5175/` opens a pickup order detail showing merchant-centered pickup text without visible `本地自提点`/`门店自提` in the verified detail section.

Evidence:
- `pnpm run docker:runtime:up` rebuilt and restarted the API/Admin/Merchant/Portal runtime; Portal built `dist/assets/index-C7S9BKmD.js`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- Served `http://localhost:5175/assets/index-C7S9BKmD.js` contained `履约方式`, `商户自提`, and `履约商户`, and did not contain `本地自提点` or `门店自提`.
- Browser on `http://localhost:5175/` opened pickup order `ORDER-20260608033110176-JSFNGY` and showed `履约方式 商户自提`, `履约商户 merchant-local-review`, and `取货码`, with no `本地自提点` or `门店自提` in the detail section.

### Task 4: GitHub Integration

- [x] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
fix: show pickup orders as merchant fulfillment
```

Evidence:
- Feature branch: `codex/portal-pickup-merchant-wording`.
- Feature commit: `eb266b9 fix: show pickup orders as merchant fulfillment`.
- PR: #241 `fix: show pickup orders as merchant fulfillment`.
- GitHub checks: `docs-check` passed; `project-foundation-check` passed.
- Merged to `main` with squash commit `4fc24a3f1bd18fd1322e8a3e00db7fbe313b342b`.

- [x] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

Evidence:
- Docs-only branch: `codex/docs-portal-pickup-merchant-wording-complete`.
- Docs-only scope: this plan file only.

## Acceptance Boundary

This slice proves local Portal buyer-facing pickup detail wording is merchant-centered. It does not remove backend compatibility fields, add dynamic merchant selection, change pickup-code verification, alter Merchant/Admin fulfillment flows, deploy to target environments, or perform true-device/formal acceptance.
