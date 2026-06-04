const { execFileSync } = require('node:child_process');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function hasFlag(argv, flagName) {
  return argv.includes(flagName);
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function runNodeScript(scriptPath) {
  return execFileSync('node', [scriptPath], { encoding: 'utf8' }).trim();
}

function buildPreflight(argv) {
  const commitSha = git(['rev-parse', 'HEAD']);
  const shortSha = git(['rev-parse', '--short=12', 'HEAD']);
  const branchName = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  const workingTreeStatus = git(['status', '--porcelain']);
  const workingTreeClean = workingTreeStatus.length === 0;

  if (hasFlag(argv, '--require-main')) {
    assert(branchName === 'main', `Expected branch main for target deployment preflight, got ${branchName}`);
  }

  if (hasFlag(argv, '--require-clean')) {
    assert(workingTreeClean, 'Expected a clean working tree for target deployment preflight');
  }

  runNodeScript('tools/verify-target-deployment-handoff.cjs');
  const releaseManifest = JSON.parse(runNodeScript('tools/print-docker-release-manifest.cjs'));

  return {
    commitSha,
    shortSha,
    branchName,
    workingTreeClean,
    releaseManifest,
    localGates: [
      'pnpm run verify',
      'pnpm run docker:image-build:preflight',
      'pnpm run docker:release:manifest',
      'pnpm run docker:runtime:smoke',
      'pnpm run docker:page-smoke',
      'pnpm run docker:order-flow-smoke',
      'pnpm run target:runtime:env-check',
      'pnpm run target:runtime:smoke'
    ],
    targetGates: [
      'pnpm run target:runtime:env-check -- --env-file .\\deploy\\target-runtime.env --require-real-values',
      'node tools/verify-target-runtime-smoke.cjs --live --env-file .\\deploy\\target-runtime.env --require-real-values'
    ],
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
      'This preflight proves local release readiness metadata only; it does not deploy or accept the target environment.'
  };
}

function main() {
  const preflight = buildPreflight(process.argv.slice(2));
  console.log(JSON.stringify(preflight, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
