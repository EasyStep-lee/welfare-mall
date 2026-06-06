# Auth JWT and Frontend Stack Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first unified JWT authentication foundation and a hard frontend stack boundary for the Admin/Merchant Vue 3 + Element Plus migration.

**Architecture:** The API gains a local-development JWT login path, HS256 access-token signing, Bearer-token verification, and a protected `/api/auth/me` endpoint that establishes `request.user` as the future identity source. The repository also gains a frontend stack boundary verifier that allows only the two known React legacy workspaces during migration and can be switched to full enforcement after Admin/Merchant are migrated.

**Tech Stack:** NestJS, TypeScript, Node crypto, Jest, Supertest, pnpm workspace, Vue 3 migration boundary, Element Plus target stack.

---

### Task 1: JWT Auth Foundation

**Files:**
- Create: `apps/api/src/auth/authenticated-user.ts`
- Create: `apps/api/src/auth/jwt-token.service.ts`
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/auth.guard.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/auth.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/test/auth/jwt.service.spec.ts`
- Test: `apps/api/test/auth/auth.e2e-spec.ts`

- [x] **Step 1: Write failing JWT service and Auth API tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/auth --runInBand
```

Expected: FAIL because `src/auth/jwt-token.service` and `/api/auth/*` do not exist.

- [x] **Step 2: Implement JWT signing and verification**

Use HS256 with Node `crypto`, token fields `sub`, `username`, `displayName`, `subjectType`, `subjectId`, `permissions`, `iat`, and `exp`.

- [x] **Step 3: Implement local-development login**

Expose `POST /api/auth/login` for local `admin-local`, `merchant-local`, and `buyer-local` users. The default local password is `local-dev-password`, overridable by `LOCAL_AUTH_PASSWORD`.

- [x] **Step 4: Implement protected current-user endpoint**

Expose `GET /api/auth/me`, require `Authorization: Bearer <token>`, and return the authenticated user from `request.user`.

- [x] **Step 5: Verify JWT focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/auth --runInBand
```

Expected: PASS.

### Task 2: Frontend Stack Boundary

**Files:**
- Create: `docs/frontend-stack-migration-status.json`
- Create: `tools/verify-frontend-stack-boundary.cjs`
- Modify: `package.json`

- [x] **Step 1: Prove the missing boundary check fails**

Run:

```powershell
node tools/verify-frontend-stack-boundary.cjs
```

Expected: FAIL because the verifier does not exist.

- [x] **Step 2: Add migration status manifest**

Record target stack:

```json
{
  "admin": ["Vue 3", "TypeScript", "Vite", "Pinia", "Element Plus"],
  "merchant": ["Vue 3", "TypeScript", "Vite", "Pinia", "Element Plus"],
  "portal": ["Vue 3", "TypeScript", "Vite"]
}
```

- [x] **Step 3: Add verifier script**

The verifier allows React only in `@welfare-mall/admin` and `@welfare-mall/merchant` while `migrationStatus` is `in_progress`. When switched to `enforced`, Admin/Merchant must have Vue 3 + Element Plus + Pinia and must not contain React dependencies/imports/TSX source.

- [x] **Step 4: Add verifier to root verification chain**

`pnpm run verify` runs `pnpm run verify:frontend-stack` before the existing lint/typecheck/test chain.

- [x] **Step 5: Verify frontend stack boundary**

Run:

```powershell
pnpm run verify:frontend-stack
```

Expected: PASS with `Frontend stack boundary check passed (in_progress).`

### Task 3: Slice Verification

**Files:**
- Modify: root verification behavior through `package.json`

- [x] **Step 1: Run full verification**

Run:

```powershell
pnpm run verify
```

Expected: PASS.

- [ ] **Step 2: Commit, push, open PR, and merge**

Commit message:

```text
feat: add jwt auth foundation and frontend stack boundary
```

- [ ] **Step 3: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark Task 3 complete.
