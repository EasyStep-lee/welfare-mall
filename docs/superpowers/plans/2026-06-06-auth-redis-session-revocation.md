# Auth Redis Session Revocation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move unified JWT auth from stateless-only tokens to short-lived JWT plus Redis-backed session and token revocation checks.

**Architecture:** Keep JWT as the API bearer-token format, but add `sessionId` and `jti` claims to every access token. Login creates an auth session record and stores it with a TTL. Auth guards verify signature and expiry, then reject tokens whose `jti` is revoked or whose session no longer exists. Logout revokes the current token until its expiry and removes the session. Local tests use the same store with an in-memory fallback when `REDIS_URL` is absent; Docker runtime sets `REDIS_URL=redis://redis:6379`.

**Tech Stack:** NestJS, TypeScript, JWT HS256, Redis, Jest, Supertest, Docker Compose.

---

### Task 1: JWT Session Claims

**Files:**
- Modify: `apps/api/src/auth/authenticated-user.ts`
- Modify: `apps/api/src/auth/jwt-token.service.ts`
- Test: `apps/api/test/auth/jwt.service.spec.ts`

- [x] **Step 1: Write failing JWT session-claim tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/auth/jwt.service.spec.ts --runInBand
```

Expected: FAIL because signed tokens do not include `sessionId` or `jti`.

- [x] **Step 2: Add sessionId and jti claims**

Extend `AccessTokenPayload` and `JwtTokenService.signAccessToken()` to include required session claims.

- [x] **Step 3: Verify JWT focused test**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/auth/jwt.service.spec.ts --runInBand
```

Expected: PASS.

### Task 2: Session Store and Guard Enforcement

**Files:**
- Create: `apps/api/src/auth/auth-session.store.ts`
- Modify: `apps/api/src/auth/auth.service.ts`
- Modify: `apps/api/src/auth/auth.guard.ts`
- Modify: `apps/api/src/auth/optional-auth.guard.ts`
- Modify: `apps/api/src/auth/auth.module.ts`
- Modify: `apps/api/package.json`
- Modify: `pnpm-lock.yaml`

- [x] **Step 1: Write failing login/session/logout tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/auth/auth.e2e-spec.ts --runInBand
```

Expected: FAIL because login does not return a `sessionId`, logout does not exist, and guards do not check session revocation.

- [x] **Step 2: Implement Redis-backed auth session store**

Add `auth:session:{sessionId}` and `auth:revoked:{jti}` keys with TTLs. Use in-memory fallback only when `REDIS_URL` is absent so unit/e2e tests remain local and deterministic.

- [x] **Step 3: Enforce session and revocation in guards**

Move guard validation through `AuthService.authenticateAccessToken()` so `AuthGuard` and `OptionalAuthGuard` share the same signature, expiry, session, and revocation checks.

- [x] **Step 4: Add logout endpoint**

Add `POST /api/auth/logout` protected by `AuthGuard`. It revokes the current `jti` until token expiry and removes the current session.

### Task 3: Verification

**Files:**
- Modify: `docker-compose.yml`
- Create: `docs/superpowers/plans/2026-06-06-auth-redis-session-revocation.md`

- [x] **Step 1: Run auth and identity focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/auth/auth.e2e-spec.ts test/auth/jwt.service.spec.ts --runInBand
pnpm --filter @welfare-mall/api run test -- test/order/order-read.e2e-spec.ts test/order/order-checkout.e2e-spec.ts test/order/order-fulfillment.e2e-spec.ts test/settlement/settlement.e2e-spec.ts --runInBand
```

Expected: PASS.

- [x] **Step 2: Run full local verification and Docker smoke**

Run:

```powershell
pnpm run verify
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Expected: PASS with API/Admin/Merchant/Portal/MySQL/Redis healthy locally.

- [ ] **Step 3: Commit, push, open PR, and merge**

Commit message:

```text
feat: add Redis-backed auth session revocation
```

- [ ] **Step 4: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark Task 3 complete.
