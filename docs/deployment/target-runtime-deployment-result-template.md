# Target Runtime Deployment Result Template

## Deployment Metadata

- Target environment:
- Deployment date:
- Deployed commit SHA:
- Deployed by:
- Release image tag:
- API base URL:
- Admin URL:
- Merchant URL:
- Portal URL:

## Local Readiness Already Verified

Record the latest local readiness evidence before target execution:

```powershell
pnpm run verify
pnpm run docker:image-build:preflight
pnpm run docker:release:manifest
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
pnpm run docker:order-flow-smoke
pnpm run target:runtime:env-check
pnpm run target:runtime:smoke
```

- Local verification timestamp:
- Docker image build preflight result:
- Docker image tag:
- Docker release manifest:
- Docker order-flow smoke order number:
- Notes:

## Target Runtime Smoke Evidence

Run and paste the relevant output:

```powershell
pnpm run target:runtime:env-check -- --env-file .\deploy\target-runtime.env --require-real-values
node tools/verify-target-runtime-smoke.cjs --live --env-file .\deploy\target-runtime.env --require-real-values
```

- Env-file check result:
- Smoke timestamp:
- API health result:
- Admin asset result:
- Merchant asset result:
- Portal asset result:
- Overall result:

## Manual And True-Device Acceptance Pending

Keep each item explicit until completed:

- Admin browser acceptance:
- Merchant browser acceptance:
- Portal browser acceptance:
- WeChat DevTools compilation:
- true-device mini-program acceptance:
- real payment/refund provider acceptance:
- business signoff:

## Rollback Record

Complete this section if rollback is needed:

- Rollback decision time:
- Failure summary:
- Failed commit SHA:
- Restored commit/image/tag:
- Rollback command or platform action:
- Post-rollback API health:
- Post-rollback frontend smoke:
- Remaining follow-up:

## Forbidden Claims

Until the relevant evidence exists, do not mark these as complete:

- target environment deployed
- target runtime accepted
- real payment/refund completed
- WeChat DevTools accepted
- true-device accepted
- formal business acceptance completed
