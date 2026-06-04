# Deployment Handoff Image Build Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fold the Docker image build preflight into the target deployment handoff materials so target execution cannot skip the local image-build gate.

**Architecture:** Tighten `tools/verify-target-deployment-handoff.cjs` first so handoff verification fails until the runbook, result template, and release handoff all include `pnpm run docker:image-build:preflight`. Then update the deployment documents while preserving the local-vs-target boundary.

**Tech Stack:** Markdown deployment docs, Node.js static verifier, existing Docker image build preflight command.

---

## File Structure

- Modify `tools/verify-target-deployment-handoff.cjs`: require `pnpm run docker:image-build:preflight`.
- Modify `docs/deployment/target-runtime-deployment-runbook.md`: include image-build preflight in local readiness and target preparation.
- Modify `docs/deployment/target-runtime-deployment-result-template.md`: add image-build preflight evidence.
- Modify `docs/deployment/target-runtime-release-handoff.md`: include image-build preflight in local readiness and release evidence.
- Create `docs/superpowers/plans/2026-06-04-deployment-handoff-image-build-gate.md`: track this slice.

## Tasks

### Task 1: RED Handoff Gate

- [x] **Step 1: Require image-build preflight in handoff verifier**

Add `pnpm run docker:image-build:preflight` to the required snippets for all target deployment handoff documents.

- [x] **Step 2: Run RED handoff verifier**

Run:

```powershell
pnpm run target:deployment:handoff
```

Expected: FAIL because the deployment handoff docs do not yet mention `pnpm run docker:image-build:preflight`.

### Task 2: Handoff Document Updates

- [x] **Step 1: Update deployment runbook**

Add the image-build preflight to local readiness and target preparation steps without implying target deployment has been completed.

- [x] **Step 2: Update deployment result template**

Add an evidence line for image-build preflight output.

- [x] **Step 3: Update release handoff**

List image-build preflight as a local readiness gate before target execution.

- [x] **Step 4: Run GREEN handoff verifier**

Run:

```powershell
pnpm run target:deployment:handoff
```

Expected: PASS.

### Task 3: Verification

- [x] **Step 1: Run focused gates**

Run:

```powershell
pnpm run target:deployment:handoff
pnpm run target:runtime:env-check
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
git add tools/verify-target-deployment-handoff.cjs docs/deployment docs/superpowers/plans/2026-06-04-deployment-handoff-image-build-gate.md
git commit -m "docs: require docker image build preflight in deployment handoff"
```

- [x] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/deployment-handoff-image-build-gate
```

Expected: branch is pushed and PR targets `main`.

## Acceptance Boundary

This slice updates handoff requirements so local image-build preflight evidence is recorded before target execution. It does not deploy to a target server, push images to a registry, provision domains or TLS, run live target smoke, run WeChat DevTools, verify true-device behavior, execute real payment/refund providers, or complete formal business acceptance.
