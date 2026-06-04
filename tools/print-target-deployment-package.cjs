const { execFileSync } = require('node:child_process');
const { readOption } = require('./target-runtime-env.cjs');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8' }).trim();
}

function runJson(command, args) {
  return JSON.parse(run(command, args));
}

function buildPackage(argv) {
  const registry = readOption(argv, '--registry') || process.env.WELFARE_MALL_IMAGE_REGISTRY;
  assert(registry && registry.trim(), 'A Docker registry is required. Pass --registry or set WELFARE_MALL_IMAGE_REGISTRY.');

  const args = ['--registry', registry.trim()];
  const tag = readOption(argv, '--tag') || process.env.WELFARE_MALL_IMAGE_TAG;
  if (tag) {
    args.push('--tag', tag);
  }

  run('node', ['tools/verify-target-deployment-handoff.cjs']);
  const registryPushPlan = runJson('node', ['tools/print-docker-registry-push-plan.cjs', ...args]);

  return {
    commitSha: registryPushPlan.commitSha,
    shortSha: registryPushPlan.shortSha,
    imageTag: registryPushPlan.imageTag,
    imageRegistry: registryPushPlan.imageRegistry,
    images: registryPushPlan.images,
    registryPushPlan,
    targetCommands: {
      localPreflight: 'pnpm run target:deployment:preflight -- --require-main --require-clean',
      imageBuild: registryPushPlan.commands.build,
      releaseManifest: `pnpm run docker:release:manifest -- --registry ${registryPushPlan.imageRegistry}`,
      registryPushPlan: `pnpm run docker:registry:push-plan -- --registry ${registryPushPlan.imageRegistry}`,
      envCheck:
        'pnpm run target:runtime:env-check -- --env-file .\\deploy\\target-runtime.env --require-real-values',
      liveSmoke:
        'node tools/verify-target-runtime-smoke.cjs --live --env-file .\\deploy\\target-runtime.env --require-real-values',
      resultVerify:
        'pnpm run target:deployment:result:verify -- --result-file .\\docs\\deployment\\target-runtime-deployment-result.md --require-real-values'
    },
    evidenceFiles: {
      envTemplate: 'deploy/target-runtime.env.example',
      envFile: 'deploy/target-runtime.env',
      runbook: 'docs/deployment/target-runtime-deployment-runbook.md',
      resultTemplate: 'docs/deployment/target-runtime-deployment-result-template.md',
      resultFile: 'docs/deployment/target-runtime-deployment-result.md',
      releaseHandoff: 'docs/deployment/target-runtime-release-handoff.md'
    },
    pendingAcceptance: [
      'target environment deployment',
      'target runtime live smoke',
      'Admin browser acceptance',
      'Merchant browser acceptance',
      'Portal browser acceptance',
      'WeChat DevTools compilation',
      'true-device mini-program acceptance',
      'real payment/refund provider acceptance',
      'formal business acceptance'
    ],
    targetExecutionStatus: 'pending',
    boundary:
      'This package is local handoff evidence only; it does not run docker push, deploy, run live target smoke, or accept the target environment.'
  };
}

function main() {
  console.log(JSON.stringify(buildPackage(process.argv.slice(2)), null, 2));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
