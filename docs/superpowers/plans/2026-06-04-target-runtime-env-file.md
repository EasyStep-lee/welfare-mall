# Target Runtime Env File Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a target runtime env-file validation gate so target deployment operators can verify required URLs and service names before running live target smoke.

**Architecture:** Add a root script that validates the existing target env example by default and can validate a supplied target env file with real-value enforcement. Update deployment handoff docs and their static verifier so the env-file check becomes part of the target execution path.

**Tech Stack:** Node.js filesystem parsing, target runtime env template, existing target smoke and deployment handoff docs.

---

## File Structure

- Modify `package.json`: add `target:runtime:env-check`.
- Create `tools/verify-target-runtime-env.cjs`: validate target runtime env files.
- Modify `docs/deployment/target-runtime-deployment-runbook.md`: add env-file check step.
- Modify `docs/deployment/target-runtime-deployment-result-template.md`: add env-file check evidence.
- Modify `docs/deployment/target-runtime-release-handoff.md`: add env-file check evidence.
- Modify `tools/verify-target-deployment-handoff.cjs`: require env-file check references.
- Modify `tools/verify-target-runtime-smoke.cjs`: support `--env-file` for live smoke.
- Create `tools/target-runtime-env.cjs`: share env parsing and validation rules.
- Create `docs/superpowers/plans/2026-06-04-target-runtime-env-file.md`: track this slice.

## Tasks

### Task 1: RED Command

- [x] **Step 1: Add failing env-file check command**

Add `target:runtime:env-check` to `package.json` pointing at `tools/verify-target-runtime-env.cjs`.

- [x] **Step 2: Run RED env-file check command**

Run:

```powershell
pnpm run target:runtime:env-check
```

Expected: FAIL because `tools/verify-target-runtime-env.cjs` does not exist yet.

### Task 2: Env-File Validation

- [x] **Step 1: Implement target runtime env validator**

Create `tools/verify-target-runtime-env.cjs` so default mode validates `deploy/target-runtime.env.example`, and `--env-file <path> --require-real-values` validates a concrete target env file.

- [x] **Step 2: Update target deployment handoff docs**

Document both:

- `pnpm run target:runtime:env-check`
- `pnpm run target:runtime:env-check -- --env-file <path> --require-real-values`

- [x] **Step 3: Update deployment handoff verifier**

Require the env-file check commands in all target deployment handoff documents.

- [x] **Step 4: Run GREEN env-file check command**

Run:

```powershell
pnpm run target:runtime:env-check
```

Expected: PASS in default example-file mode.

### Task 3: Verification

- [x] **Step 1: Run focused target and Docker gates**

Run:

```powershell
pnpm run target:runtime:env-check
pnpm run target:deployment:handoff
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
git add package.json tools/verify-target-runtime-env.cjs tools/verify-target-deployment-handoff.cjs docs/deployment docs/superpowers/plans/2026-06-04-target-runtime-env-file.md
git commit -m "test: add target runtime env file check"
```

- [x] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/target-runtime-env-file
```

Expected: branch is pushed and PR targets `main`.

## Acceptance Boundary

This slice validates target runtime env files and updates deployment handoff evidence requirements. It does not deploy to a target server, provision domains or TLS, run live target smoke, run WeChat DevTools, verify true-device behavior, execute real payment/refund providers, or complete formal business acceptance.
