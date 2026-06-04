# Target Deployment Result Verifier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a target deployment result verifier so a filled deployment evidence file can be checked before anyone claims target deployment or target runtime acceptance.

**Architecture:** Add a root Node.js script that validates the existing result template by default, and validates a supplied Markdown result file with `--result-file <path> --require-real-values`. The verifier checks required sections, filled deployment metadata, real URLs, full image refs, target smoke evidence, pending manual acceptance fields, and forbidden-claim boundaries.

**Tech Stack:** Node.js filesystem parsing, Markdown evidence file validation, existing target runtime env validation helpers, deployment handoff docs.

---

## File Structure

- Modify `package.json`: add `target:deployment:result:verify`.
- Create `tools/verify-target-deployment-result.cjs`: verify target deployment result templates and filled result files.
- Modify `docs/deployment/target-runtime-deployment-runbook.md`: require result verification after recording target evidence.
- Modify `docs/deployment/target-runtime-release-handoff.md`: require result verification before target completion claims.
- Modify `docs/deployment/target-runtime-deployment-result-template.md`: include the result verifier command.
- Modify `tools/verify-target-deployment-handoff.cjs`: require result verifier references.
- Create `docs/superpowers/plans/2026-06-04-target-deployment-result-verifier.md`: track this slice.

## Tasks

### Task 1: RED Command

- [x] **Step 1: Add failing result verifier command**

Add `target:deployment:result:verify` to `package.json` pointing at `tools/verify-target-deployment-result.cjs`.

- [x] **Step 2: Run RED result verifier command**

Run:

```powershell
pnpm run target:deployment:result:verify
```

Expected: FAIL because `tools/verify-target-deployment-result.cjs` does not exist yet.

### Task 2: Result Verifier Behavior

- [x] **Step 1: Implement static template verification**

Create `tools/verify-target-deployment-result.cjs` so default mode validates `docs/deployment/target-runtime-deployment-result-template.md` exists and contains required sections and command references.

- [x] **Step 2: Implement filled result verification**

Support `--result-file <path> --require-real-values` and verify:

- deployment metadata fields are filled
- deployed commit SHA looks like a git SHA
- release image tag and registry are concrete
- API/Admin/Merchant/Portal image refs use the same registry and tag
- API/Admin/Merchant/Portal URLs are valid HTTP(S) URLs
- API base URL includes `/api`
- target env-file and live smoke results are filled
- manual and true-device acceptance fields are present, but may remain pending

- [x] **Step 3: Add result verifier self-test**

The verifier must construct a temporary valid result and an invalid empty template check so contract failures are covered without needing a real target server.

- [x] **Step 4: Update deployment docs and handoff verifier**

Require `pnpm run target:deployment:result:verify -- --result-file <path> --require-real-values` in the runbook, result template, release handoff, and handoff verifier.

### Task 3: Verification

- [x] **Step 1: Run focused result verifier gates**

Run:

```powershell
pnpm run target:deployment:result:verify
node tools/verify-target-deployment-result.cjs --self-test
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

- [x] **Step 1: Commit the slice**

Run:

```powershell
git add package.json tools docs/deployment docs/superpowers/plans/2026-06-04-target-deployment-result-verifier.md
git commit -m "test: add target deployment result verifier"
```

- [x] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/target-deployment-result-verifier
```

Expected: branch is pushed and PR targets `main`.

## Acceptance Boundary

This slice verifies recorded target deployment evidence. It does not run `docker push`, authenticate to any registry, deploy to a target server, run live target smoke, run WeChat DevTools, verify true-device behavior, execute real payment/refund providers, or complete formal business acceptance.
