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

function normalizeRegistry(value) {
  const registry = value?.trim();
  if (!registry) {
    return { imageRegistry: null, imageRegistryPrefix: '' };
  }

  const imageRegistry = registry.replace(/\/+$/, '');
  return {
    imageRegistry,
    imageRegistryPrefix: `${imageRegistry}/`
  };
}

function buildManifest(argv) {
  const commitSha = git(['rev-parse', 'HEAD']);
  const shortSha = git(['rev-parse', '--short=12', 'HEAD']);
  const imageTag = readOption(argv, '--tag') || process.env.WELFARE_MALL_IMAGE_TAG || `git-${shortSha}`;
  const { imageRegistry, imageRegistryPrefix } = normalizeRegistry(
    readOption(argv, '--registry') || process.env.WELFARE_MALL_IMAGE_REGISTRY
  );

  const images = {};
  for (const [service, imageName] of Object.entries(imageNames)) {
    images[service] = `${imageRegistryPrefix}${imageName}:${imageTag}`;
  }

  const imageBuildEnv = imageRegistry
    ? `WELFARE_MALL_IMAGE_REGISTRY=${imageRegistry} WELFARE_MALL_IMAGE_TAG=${imageTag}`
    : `WELFARE_MALL_IMAGE_TAG=${imageTag}`;

  return {
    commitSha,
    shortSha,
    imageTag,
    imageRegistry,
    imageRegistryPrefix,
    images,
    commands: {
      imageBuildPreflight: `${imageBuildEnv} pnpm run docker:image-build:preflight`,
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
