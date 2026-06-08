# Auth Entrypoints Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add minimal real login entrypoints for Admin, Merchant, and Portal so local users stop landing directly in fixed-identity workbenches without authentication.

**Architecture:** Reuse the existing API `/api/auth/login` local JWT contract. Each frontend blocks its workbench until a user logs in, stores its own token/user pair in localStorage, then loads the existing read models. This slice deliberately does not add Franchise console, department RBAC screens, welfare-card issuance, combination payment, or dynamic merchant switching.

**Business Constraints:** Keep the project subject chain as platform -> franchise -> merchant -> product/SKU -> order. Merchant is the publishing and fulfillment party with an address. Franchise remains the true sales party and welfare-card issuer, but franchise login/issuance is a later slice. User cash payment remains online WeChat/Alipay only; offline/manual payout is settlement-only.

**Tech Stack:** Vue 3 + Vite + Element Plus for Admin/Merchant, Vue 3 + Vite for Portal, existing NestJS auth API.

---

### Task 1: RED Login Entrypoints

**Files:**
- Modify: `apps/admin/src/App.test.ts`
- Modify: `apps/merchant/src/App.test.ts`
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Add failing UI tests**

Add tests requiring:

- Admin shows `平台登录`, does not load `/products/review-queue`, posts `admin-local/local-dev-password` to `/api/auth/login`, stores `welfareMallAdminAccessToken`, and then loads the workbench.
- Merchant shows `商户登录`, does not load `/orders/merchant/fulfillment`, posts `merchant-local/local-dev-password`, stores `welfareMallMerchantAccessToken`, and then loads the workbench.
- Portal shows `用户登录`, does not load `/product-pools/catalog`, posts `buyer-local/local-dev-password`, stores `welfareMallPortalAccessToken`, and then loads the catalog.

Evidence:
- Initial RED after fixing the Vitest localStorage fixture failed exactly on missing login UI:
  - Admin expected text to contain `平台登录`.
  - Merchant expected text to contain `商户登录`.
  - Portal expected text to contain `用户登录`.

### Task 2: GREEN Login Entrypoints

**Files:**
- Modify: `apps/admin/src/api.ts`
- Modify: `apps/admin/src/App.ts`
- Modify: `apps/merchant/src/api.ts`
- Modify: `apps/merchant/src/App.ts`
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`

- [x] **Step 1: Add login API client methods**

Add `loginAdmin`, `loginMerchant`, and `loginPortal` wrappers around `/api/auth/login`.

- [x] **Step 2: Gate workbenches behind local login state**

Admin, Merchant, and Portal read their own stored user/token pair. If absent, render only the login entrypoint and do not call the workbench/catalog read APIs.

- [x] **Step 3: Load existing data after successful login**

On successful login, persist token/user in localStorage, show the returned display name, and call the existing data-loading function.

Evidence:
- `pnpm --filter @welfare-mall/admin run test -- App.test.ts --run` passed: 17/17.
- `pnpm --filter @welfare-mall/merchant run test -- App.test.ts --run` passed: 11/11.
- `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed: 18/18.

### Task 3: Verification

- [x] **Step 1: Run focused typechecks**

Evidence:
- `pnpm --filter @welfare-mall/admin run typecheck` passed.
- `pnpm --filter @welfare-mall/merchant run typecheck` passed.
- `pnpm --filter @welfare-mall/portal run typecheck` passed.

- [x] **Step 2: Run business-boundary guard**

Evidence:
- `pnpm run verify:business-boundary` passed with `Business boundary check passed (36 known deviation files tracked).`

- [x] **Step 3: Run full verification**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS. Report Windows LF/CRLF working-copy warnings separately if they appear.

Evidence:
- `pnpm run verify` passed, including frontend stack boundary, business boundary, Prisma generate, lint, typecheck, API Jest 63/63 suites and 265/265 tests, Admin Vitest 22/22 tests, Merchant Vitest 16/16 tests, Portal Vitest 18/18 tests, and user-miniprogram Vitest 35/35 tests.
- `git diff --check` exited 0. It printed Windows LF/CRLF working-copy warnings only.
- `powershell -NoProfile -ExecutionPolicy Bypass -File tools/start-docker-runtime.ps1` rebuilt and restarted API/Admin/Merchant/Portal containers.
- Served bundle checks passed for:
  - Admin: `平台登录`, `登录平台工作台`, `welfareMallAdminAccessToken`.
  - Merchant: `商户登录`, `登录商户工作台`, `welfareMallMerchantAccessToken`.
  - Portal: `用户登录`, `登录用户端`, `welfareMallPortalAccessToken`.
- Browser verification passed on `localhost`:
  - Admin: `平台登录` -> `商品审核` with `本地平台管理员`.
  - Merchant: `商户登录` -> `履约订单` with `本地商户操作员`.
  - Portal: `用户登录` -> `企业福利商品目录` with `本地用户`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- `pnpm run verify:business-boundary` passed with `Business boundary check passed (36 known deviation files tracked).`

### Task 4: Completion

- [ ] Commit feature work on `codex/auth-entrypoints-foundation`.
- [ ] Push branch and open PR.
- [ ] Wait for GitHub checks.
- [ ] Merge PR to `main`.
- [ ] Open docs-only completion PR marking this plan complete after the feature merge.
