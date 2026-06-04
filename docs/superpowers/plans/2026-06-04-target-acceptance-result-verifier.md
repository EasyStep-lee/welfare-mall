# Target Acceptance Result Verifier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a target acceptance result verifier so Admin/Merchant/Portal browser acceptance, WeChat DevTools compilation, true-device mini-program checks, real payment/refund provider checks, and business signoff cannot be claimed without recorded evidence.

**Architecture:** Add a Markdown acceptance result template under `docs/deployment/` and a root Node.js verifier. Default mode validates the template structure. `--acceptance-file <path> --require-complete` validates a filled acceptance evidence file, requiring concrete timestamps/operators/results and complete status for each acceptance gate.

**Tech Stack:** Node.js filesystem parsing, Markdown evidence file validation, deployment handoff docs.

---

## File Structure

- Modify `package.json`: add `target:acceptance:result:verify`.
- Create `docs/deployment/target-runtime-acceptance-result-template.md`: formal acceptance evidence template.
- Create `tools/verify-target-acceptance-result.cjs`: verify template and filled acceptance files.
- Modify `docs/deployment/target-runtime-deployment-runbook.md`: reference acceptance result verification after live target smoke.
- Modify `docs/deployment/target-runtime-release-handoff.md`: require acceptance result verification before acceptance claims.
- Modify `tools/verify-target-deployment-handoff.cjs`: require acceptance verifier references.
- Create `docs/superpowers/plans/2026-06-04-target-acceptance-result-verifier.md`: track this slice.

## Tasks

### Task 1: RED Command

- [x] **Step 1: Add failing acceptance result verifier command**

Add `target:acceptance:result:verify` to `package.json` pointing at `tools/verify-target-acceptance-result.cjs`.

- [x] **Step 2: Run RED acceptance result verifier command**

Run:

```powershell
pnpm run target:acceptance:result:verify
```

Expected: FAIL because `tools/verify-target-acceptance-result.cjs` does not exist yet.

### Task 2: Acceptance Verifier Behavior

- [x] **Step 1: Add acceptance result template**

Create `docs/deployment/target-runtime-acceptance-result-template.md` with sections for metadata, browser acceptance, WeChat DevTools, true-device mini-program, real payment/refund provider checks, business signoff, and forbidden claims.

- [x] **Step 2: Implement template and filled-result verifier**

Create `tools/verify-target-acceptance-result.cjs` so default mode validates the template, while `--acceptance-file <path> --require-complete` requires concrete complete evidence.

- [x] **Step 3: Add verifier self-test**

The verifier must construct a temporary valid completed acceptance result and confirm the empty template fails completed verification.

- [x] **Step 4: Update deployment docs and handoff verifier**

Require `pnpm run target:acceptance:result:verify -- --acceptance-file <path> --require-complete` in runbook, release handoff, and handoff verifier.

### Task 3: Verification

- [x] **Step 1: Run focused acceptance verifier gates**

Run:

```powershell
pnpm run target:acceptance:result:verify
node tools/verify-target-acceptance-result.cjs --self-test
pnpm run target:deployment:handoff
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

- [ ] **Step 1: Commit the slice**

Run:

```powershell
git add package.json tools docs/deployment docs/superpowers/plans/2026-06-04-target-acceptance-result-verifier.md
git commit -m "test: add target acceptance result verifier"
```

- [ ] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/target-acceptance-result-verifier
```

Expected: branch is pushed and PR targets `main`.

## Acceptance Boundary

This slice verifies recorded acceptance evidence only. It does not run browser walkthroughs, WeChat DevTools, true-device checks, real payment/refund providers, target deployment, registry push, or formal business acceptance.
