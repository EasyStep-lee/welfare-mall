const path = require('node:path');
const {
  parseTargetRuntimeEnvFile,
  resolveEnvFileFromArgs,
  validateTargetRuntimeEnv
} = require('./target-runtime-env.cjs');

const root = path.resolve(__dirname, '..');

function main() {
  const envFilePath = resolveEnvFileFromArgs(process.argv.slice(2));
  const values = parseTargetRuntimeEnvFile(envFilePath);

  validateTargetRuntimeEnv(values, {
    fileLabel: path.relative(root, envFilePath) || envFilePath,
    requireRealValues: process.argv.includes('--require-real-values')
  });

  console.log(`Target runtime env file verified: ${path.relative(root, envFilePath) || envFilePath}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
