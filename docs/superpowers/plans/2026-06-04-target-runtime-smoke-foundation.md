# Target Runtime Smoke Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first target-environment runtime smoke foundation so deployment can move beyond local Docker with explicit URL/env inputs and repeatable HTTP checks.

**Architecture:** Add a target runtime env example plus a Node smoke script. Default mode verifies the deploy env template exists and contains the required target URL keys. `--live` mode reads environment variables and checks API health plus Admin/Merchant/Portal HTML and built frontend assets against the provided target URLs.

**Tech Stack:** Node.js HTTP/HTTPS client, target runtime env template, API health endpoint, Vite built asset inspection.

---

## File Structure

- Modify `package.json`: add `target:runtime:smoke`.
- Create `deploy/target-runtime.env.example`: document required target smoke inputs.
- Create `tools/verify-target-runtime-smoke.cjs`: static env-template gate and optional live target smoke.
- Create `docs/superpowers/plans/2026-06-04-target-runtime-smoke-foundation.md`: track this slice.

## Tasks

### Task 1: RED Command

- [x] **Step 1: Add failing target smoke command**

Add `target:runtime:smoke` to `package.json` pointing at `tools/verify-target-runtime-smoke.cjs`.

- [x] **Step 2: Run RED target smoke command**

Run:

```powershell
pnpm run target:runtime:smoke
```

Expected: FAIL because `tools/verify-target-runtime-smoke.cjs` does not exist yet.

### Task 2: Target Runtime Smoke Foundation

- [x] **Step 1: Add target env example**

Create `deploy/target-runtime.env.example` with:

- `TARGET_API_BASE_URL`
- `TARGET_ADMIN_URL`
- `TARGET_MERCHANT_URL`
- `TARGET_PORTAL_URL`
- `TARGET_EXPECTED_API_SERVICE`

- [x] **Step 2: Implement target runtime smoke script**

Create `tools/verify-target-runtime-smoke.cjs` so default mode verifies the env example and `--live` mode verifies:

- `GET {TARGET_API_BASE_URL}/health` returns the expected API service
- Admin, Merchant, and Portal URLs return HTML
- each frontend page exposes a built JavaScript asset
- each built asset contains `TARGET_API_BASE_URL`

- [x] **Step 3: Run GREEN target smoke command**

Run:

```powershell
pnpm run target:runtime:smoke
```

Expected: PASS in static mode.

### Task 3: Verification

- [x] **Step 1: Run focused target and Docker gates**

Run:

```powershell
pnpm run target:runtime:smoke
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
pnpm run docker:order-flow-smoke
```

Expected: PASS.

- [x] **Step 2: Run full verification and diff hygiene**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

### Task 4: GitHub Integration

- [x] **Step 1: Commit the slice**

Run:

```powershell
git add package.json deploy/target-runtime.env.example tools/verify-target-runtime-smoke.cjs docs/superpowers/plans/2026-06-04-target-runtime-smoke-foundation.md
git commit -m "test: add target runtime smoke foundation"
```

- [x] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/target-runtime-smoke-foundation
```

Expected: branch is pushed and PR targets `main`.

## Acceptance Boundary

This slice creates the repeatable target runtime smoke gate and required env contract. It does not deploy to a target server, provision domains or TLS, configure Nginx/CDN, run WeChat DevTools, verify true-device behavior, execute real payment/refund providers, or complete formal business acceptance.
