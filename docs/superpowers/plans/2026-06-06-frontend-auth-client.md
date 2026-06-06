# Frontend Auth Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Admin, Merchant, and the user mini-program request clients to send the unified JWT access token when one is available, without introducing new React UI work before the Vue 3 + Element Plus migration.

**Architecture:** Keep this slice at the request-client boundary. Admin and Merchant gain small access-token providers that default to localStorage and can be overridden in tests or future login shells. The mini-program `requestJson` reads `options.accessToken` first and falls back to `getApp().globalData.accessToken`. No backend auth behavior, Redis revocation, login UI, or Vue migration is included in this slice.

**Tech Stack:** TypeScript, Vite/Vitest, native WeChat mini-program JavaScript, JWT Bearer token contract.

---

### Task 1: Admin JWT Request Client

**Files:**
- Modify: `apps/admin/src/api.ts`
- Create: `apps/admin/src/api.test.ts`

- [x] **Step 1: Write failing Admin API client tests**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test --run src/api.test.ts
```

Expected: FAIL because Admin API helpers do not expose an access-token provider and do not add `Authorization: Bearer ...`.

- [x] **Step 2: Add Admin access-token provider and API fetch wrapper**

Default the provider to `localStorage.getItem('welfareMallAdminAccessToken')` when available. Preserve the old `fetch(url)` and `fetch(url, init)` call shape when no token exists.

- [x] **Step 3: Verify Admin focused and full tests**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test --run src/api.test.ts
pnpm --filter @welfare-mall/admin run test --run
pnpm --filter @welfare-mall/admin run typecheck
```

Expected: PASS.

### Task 2: Merchant JWT Request Client

**Files:**
- Modify: `apps/merchant/src/api.ts`
- Create: `apps/merchant/src/api.test.ts`

- [x] **Step 1: Write failing Merchant API client tests**

Run:

```powershell
pnpm --filter @welfare-mall/merchant run test --run src/api.test.ts
```

Expected: FAIL because Merchant API helpers do not expose an access-token provider and do not add `Authorization: Bearer ...`.

- [x] **Step 2: Add Merchant access-token provider and API fetch wrapper**

Default the provider to `localStorage.getItem('welfareMallMerchantAccessToken')` when available. Preserve the old no-token request call shape and JSON headers.

- [x] **Step 3: Verify Merchant focused and full tests**

Run:

```powershell
pnpm --filter @welfare-mall/merchant run test --run src/api.test.ts
pnpm --filter @welfare-mall/merchant run test --run
pnpm --filter @welfare-mall/merchant run typecheck
```

Expected: PASS.

### Task 3: User Mini-Program JWT Request Client

**Files:**
- Modify: `apps/user-miniprogram/utils/api.js`
- Modify: `apps/user-miniprogram/utils/api.test.mjs`

- [x] **Step 1: Write failing mini-program requestJson auth-header tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test --run utils/api.test.mjs
```

Expected: FAIL because `requestJson` does not send `Authorization` from either `options.accessToken` or `getApp().globalData.accessToken`.

- [x] **Step 2: Add mini-program auth-header merge**

Prefer `options.accessToken`, then fall back to `getApp().globalData.accessToken`, and preserve caller-provided headers.

- [x] **Step 3: Verify mini-program focused and full tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test --run utils/api.test.mjs
pnpm --filter @welfare-mall/user-miniprogram run test --run
```

Expected: PASS.

### Task 4: Slice Verification

**Files:**
- Create: `docs/superpowers/plans/2026-06-06-frontend-auth-client.md`

- [x] **Step 1: Run full local verification**

Run:

```powershell
pnpm run verify
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Expected: PASS with API/Admin/Merchant/Portal/MySQL/Redis healthy locally.

- [ ] **Step 2: Commit, push, open PR, and merge**

Commit message:

```text
feat: add frontend JWT auth clients
```

- [ ] **Step 3: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark Task 4 complete.
