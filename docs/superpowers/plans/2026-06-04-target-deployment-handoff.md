# Target Deployment Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deployment handoff package for the target environment so local Docker readiness can transition into target execution with explicit runbook steps, evidence capture, rollback, human acceptance, and forbidden assumptions.

**Architecture:** Keep runtime code unchanged. Add Markdown handoff materials under `docs/deployment/` and a Node static verifier that enforces the required sections and commands. The verifier makes the deployment handoff repeatable and prevents future summaries from blending local verification with target-environment completion.

**Tech Stack:** Markdown deployment docs, Node.js static document verifier, existing Docker/target smoke commands.

---

## File Structure

- Modify `package.json`: add `target:deployment:handoff`.
- Create `docs/deployment/target-runtime-deployment-runbook.md`: target execution runbook.
- Create `docs/deployment/target-runtime-deployment-result-template.md`: evidence/result recording template.
- Create `docs/deployment/target-runtime-release-handoff.md`: release handoff and acceptance boundary.
- Create `tools/verify-target-deployment-handoff.cjs`: static verifier for required handoff documents.
- Create `docs/superpowers/plans/2026-06-04-target-deployment-handoff.md`: track this slice.

## Tasks

### Task 1: RED Command

- [x] **Step 1: Add failing handoff verification command**

Add `target:deployment:handoff` to `package.json` pointing at `tools/verify-target-deployment-handoff.cjs`.

- [x] **Step 2: Run RED handoff verification**

Run:

```powershell
pnpm run target:deployment:handoff
```

Expected: FAIL because `tools/verify-target-deployment-handoff.cjs` does not exist yet.

### Task 2: Deployment Handoff Package

- [x] **Step 1: Add target deployment handoff docs**

Create the runbook, result template, and release handoff docs. They must keep these boundaries separate:

- local readiness already verified
- target environment execution pending
- target runtime smoke evidence
- manual/browser/true-device acceptance pending
- rollback steps
- forbidden claims

- [x] **Step 2: Implement handoff verifier**

Create `tools/verify-target-deployment-handoff.cjs` so it verifies each required document exists and contains the required section markers plus:

- `pnpm run target:runtime:smoke`
- `node tools/verify-target-runtime-smoke.cjs --live`
- `pnpm run docker:runtime:smoke`
- `pnpm run docker:page-smoke`
- `pnpm run docker:order-flow-smoke`

- [x] **Step 3: Run GREEN handoff verification**

Run:

```powershell
pnpm run target:deployment:handoff
```

Expected: PASS.

### Task 3: Verification

- [x] **Step 1: Run focused deployment gates**

Run:

```powershell
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
git add package.json docs/deployment tools/verify-target-deployment-handoff.cjs docs/superpowers/plans/2026-06-04-target-deployment-handoff.md
git commit -m "docs: add target deployment handoff package"
```

- [x] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/target-deployment-handoff
```

Expected: branch is pushed and PR targets `main`.

## Acceptance Boundary

This slice creates target deployment handoff materials and a static verifier. It does not deploy to a target server, provision domains or TLS, configure Nginx/CDN, run live target smoke, run WeChat DevTools, verify true-device behavior, execute real payment/refund providers, or complete formal business acceptance.
