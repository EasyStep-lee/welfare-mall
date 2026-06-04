# Target Runtime Release Handoff

## Local Readiness Already Verified

The current release line has local verification gates for:

- source verification through `pnpm run verify`
- Docker service health through `pnpm run docker:runtime:smoke`
- Docker-served frontend assets through `pnpm run docker:page-smoke`
- Docker API order flow through `pnpm run docker:order-flow-smoke`
- target smoke env contract through `pnpm run target:runtime:smoke`

This is local readiness only.

## Target Environment Execution Pending

Target deployment remains pending until a specific target environment is provided, configured, deployed, and checked with:

```powershell
node tools/verify-target-runtime-smoke.cjs --live
```

The target result must be recorded in `docs/deployment/target-runtime-deployment-result-template.md`.

## Target Runtime Smoke Evidence

The smoke evidence must include:

- deployed commit SHA
- API health response
- Admin built asset API base URL check
- Merchant built asset API base URL check
- Portal built asset API base URL check
- exact command output
- timestamp and operator

## Manual And True-Device Acceptance Pending

The following are not closed by this handoff:

- Admin browser acceptance
- Merchant browser acceptance
- Portal browser acceptance
- WeChat DevTools compilation
- true-device mini-program acceptance
- real payment/refund provider acceptance
- formal business acceptance

## Rollback Steps

Rollback should use the target platform's previous known-good artifact, image, or deployment slot. After rollback, run:

```powershell
node tools/verify-target-runtime-smoke.cjs --live
```

Record both the failed deployment and rollback evidence in the result template.

## Forbidden Claims

Do not report target deployment, target acceptance, real payment/refund acceptance, WeChat DevTools acceptance, true-device acceptance, or formal business acceptance until the matching target evidence has been recorded.
