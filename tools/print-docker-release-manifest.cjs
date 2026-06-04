const { execFileSync } = require('node:child_process');

const imageNames = {
  api: 'welfare-mall-v2-api',
  admin: 'welfare-mall-v2-admin',
  merchant: 'welfare-mall-v2-merchant',
  portal: 'welfare-mall-v2-portal'
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readOption(argv, flagName) {
  const index = argv.indexOf(flagName);
  if (index === -1) {
    return undefined;
  }

  const value = argv[index + 1];
  assert(value && !value.startsWith('--'), `${flagName} requires a value`);
  return value;
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function buildManifest(argv) {
  const commitSha = git(['rev-parse', 'HEAD']);
  const shortSha = git(['rev-parse', '--short=12', 'HEAD']);
  const imageTag = readOption(argv, '--tag') || process.env.WELFARE_MALL_IMAGE_TAG || `git-${shortSha}`;

  const images = {};
  for (const [service, imageName] of Object.entries(imageNames)) {
    images[service] = `${imageName}:${imageTag}`;
  }

  return {
    commitSha,
    shortSha,
    imageTag,
    images,
    commands: {
      imageBuildPreflight: `WELFARE_MALL_IMAGE_TAG=${imageTag} pnpm run docker:image-build:preflight`,
      targetRuntimeEnvCheck:
        'pnpm run target:runtime:env-check -- --env-file .\\deploy\\target-runtime.env --require-real-values',
      targetRuntimeSmoke:
        'node tools/verify-target-runtime-smoke.cjs --live --env-file .\\deploy\\target-runtime.env --require-real-values'
    },
    boundary:
      'This manifest records local release artifacts only; it does not prove target deployment or acceptance.'
  };
}

function main() {
  const manifest = buildManifest(process.argv.slice(2));
  console.log(JSON.stringify(manifest, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
