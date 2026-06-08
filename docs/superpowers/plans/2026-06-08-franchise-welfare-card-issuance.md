# Franchise Welfare Card Issuance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the backend foundation for franchise-issued welfare cards so the platform has an explicit account and ledger model before Portal combination payment consumes card balance.

**Architecture:** Add API-owned welfare-card account and ledger tables under the sales franchise. The issue endpoint creates or reuses one buyer account per franchise, credits the balance, and writes an idempotent issue ledger entry keyed by `requestId`.

**Business Constraints:** Franchise is the sales party and welfare-card issuer. Merchant publishes products and fulfills goods, with actual merchant address, but does not issue user welfare cards. User cash payment remains online WeChat/Alipay only; offline/manual/bank-transfer remains settlement payout confirmation only. No store/shop subject is introduced.

**Out of Scope:** Portal combination payment, card debit/refund state machine, Franchise console UI, real auth/RBAC for issuing cards, and merchant settlement payout changes.

---

### Task 1: RED Welfare Card Issuance

**Files:**
- Add: `apps/api/test/franchise/welfare-card.repository.spec.ts`
- Add: `apps/api/test/franchise/welfare-card.service.spec.ts`
- Add: `apps/api/test/franchise/welfare-card.e2e-spec.ts`

- [x] **Step 1: Add failing tests**

Cover:

- Issuing welfare-card balance creates or reuses the franchise/buyer account.
- Issuing writes a credit ledger entry with type `issue`.
- Duplicate `requestId` returns the existing ledger/account and does not increment balance again.
- Service rejects blank IDs and non-positive amounts before repository writes.
- HTTP route is `POST /api/franchises/:franchiseId/welfare-cards/issue`.

Evidence:
- Initial RED failed because `welfare-card-status`, `welfare-card.repository`, and `welfare-card.service` did not exist.

### Task 2: GREEN Welfare Card Issuance

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/src/franchise/franchise.controller.ts`
- Modify: `apps/api/src/franchise/franchise.module.ts`
- Add: `apps/api/src/franchise/welfare-card-status.ts`
- Add: `apps/api/src/franchise/welfare-card.repository.ts`
- Add: `apps/api/src/franchise/welfare-card.service.ts`

- [x] **Step 1: Add account and ledger schema**

Add `WelfareCardAccount` with one account per `(franchiseId, buyerUserId)` and `WelfareCardLedgerEntry` with unique `requestId`.

- [x] **Step 2: Add repository/service/controller**

Implement `issueWelfareCard` with validation, idempotency, balance credit, and ledger write.

Evidence:
- `pnpm --filter @welfare-mall/api run prisma:generate` passed.
- Focused welfare-card tests passed: 3 suites, 7 tests.

### Task 3: Verification

- [x] **Step 1: Run focused API verification**

Run:

```powershell
pnpm --filter @welfare-mall/api run prisma:validate
pnpm --filter @welfare-mall/api run typecheck
pnpm --filter @welfare-mall/api run test -- test/franchise/welfare-card.repository.spec.ts test/franchise/welfare-card.service.spec.ts test/franchise/welfare-card.e2e-spec.ts --runInBand
```

Evidence:
- `pnpm --filter @welfare-mall/api run prisma:validate` passed.
- `pnpm --filter @welfare-mall/api run typecheck` passed.
- Focused welfare-card tests passed: 3 suites, 7 tests.

- [x] **Step 2: Run business-boundary guard**

Run:

```powershell
pnpm run verify:business-boundary
```

Evidence:
- `pnpm run verify:business-boundary` passed with `Business boundary check passed (36 known deviation files tracked).`

- [x] **Step 3: Run full verification**

Run:

```powershell
pnpm run verify
git diff --check
```

Evidence:
- `pnpm run verify` passed, including frontend stack boundary, business boundary, Prisma generate, lint, typecheck, API Jest 66/66 suites and 272/272 tests, Admin Vitest 22/22 tests, Merchant Vitest 16/16 tests, Portal Vitest 18/18 tests, and user-miniprogram Vitest 35/35 tests.
- `git diff --check` exited 0. It printed Windows LF/CRLF working-copy warnings only.
- `prisma db push --skip-generate` synced the Docker MySQL schema for local runtime verification.
- `powershell -NoProfile -ExecutionPolicy Bypass -File tools/start-docker-runtime.ps1` rebuilt and restarted API/Admin/Merchant/Portal containers.
- Live API verification on `localhost:3000` passed:
  - First `POST /api/franchises/franchise-local-review/welfare-cards/issue` returned `idempotentReplay=false`, `ledgerEntry.type=issue`, and `balanceAmount=12345`.
  - Repeating the same `requestId` returned `idempotentReplay=true` and kept `balanceAmount=12345`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.

### Task 4: Completion

- [x] Commit feature work on `codex/franchise-welfare-card-issuance`.
- [x] Push branch and open PR.
- [x] Wait for GitHub checks.
- [x] Merge PR to `main`.
- [x] Open docs-only completion PR marking this plan complete after the feature merge.

Evidence:
- Feature branch: `codex/franchise-welfare-card-issuance`.
- Feature commit: `14e59307dd1bdb64d40de50ecb9af10b0aa5d39a`.
- Feature PR: `https://github.com/EasyStep-lee/welfare-mall/pull/247`.
- GitHub checks passed: `docs-check`, `project-foundation-check`.
- Squash merge commit: `53a3cd82f44e29322475f21295078486194b3856`.
- Docs-only completion branch: `codex/docs-franchise-welfare-card-issuance-complete`.
