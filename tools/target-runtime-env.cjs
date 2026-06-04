const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const defaultTargetRuntimeEnvPath = path.join(root, 'deploy', 'target-runtime.env.example');

const requiredTargetRuntimeEnvKeys = [
  'TARGET_API_BASE_URL',
  'TARGET_ADMIN_URL',
  'TARGET_MERCHANT_URL',
  'TARGET_PORTAL_URL',
  'TARGET_EXPECTED_API_SERVICE'
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function stripOptionalQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseTargetRuntimeEnvFile(envFilePath) {
  assert(fs.existsSync(envFilePath), `Target runtime env file does not exist: ${envFilePath}`);

  const values = {};
  const body = fs.readFileSync(envFilePath, 'utf8');
  for (const [index, rawLine] of body.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    assert(separatorIndex > 0, `${envFilePath}:${index + 1} must use KEY=value syntax`);

    const key = line.slice(0, separatorIndex).trim();
    const value = stripOptionalQuotes(line.slice(separatorIndex + 1).trim());
    values[key] = value;
  }

  return values;
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

function resolveEnvFileFromArgs(argv) {
  const envFile = readOption(argv, '--env-file');
  if (!envFile) {
    return defaultTargetRuntimeEnvPath;
  }

  return path.resolve(root, envFile);
}

function validateUrl(value, key) {
  let parsedUrl;
  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`${key} must be a valid URL`);
  }

  assert(['http:', 'https:'].includes(parsedUrl.protocol), `${key} must use http or https`);
  return parsedUrl;
}

function assertApiPrefix(apiBaseUrl) {
  const parsedUrl = validateUrl(apiBaseUrl, 'TARGET_API_BASE_URL');
  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
  assert(pathSegments.includes('api'), 'TARGET_API_BASE_URL must include the /api path segment');
}

function validateTargetRuntimeEnv(values, options = {}) {
  const fileLabel = options.fileLabel ?? 'target runtime env';
  const requireRealValues = Boolean(options.requireRealValues);

  for (const key of requiredTargetRuntimeEnvKeys) {
    assert(Object.prototype.hasOwnProperty.call(values, key), `${fileLabel} is missing ${key}`);
    assert(String(values[key]).trim(), `${fileLabel} has an empty ${key}`);
  }

  assertApiPrefix(values.TARGET_API_BASE_URL);
  validateUrl(values.TARGET_ADMIN_URL, 'TARGET_ADMIN_URL');
  validateUrl(values.TARGET_MERCHANT_URL, 'TARGET_MERCHANT_URL');
  validateUrl(values.TARGET_PORTAL_URL, 'TARGET_PORTAL_URL');
  assert(
    values.TARGET_EXPECTED_API_SERVICE === 'welfare-mall-api',
    'TARGET_EXPECTED_API_SERVICE must be welfare-mall-api'
  );

  if (requireRealValues) {
    for (const key of requiredTargetRuntimeEnvKeys) {
      assert(
        !String(values[key]).includes('example.com'),
        `${key} must not use example.com when --require-real-values is enabled`
      );
    }
  }
}

function collectTargetRuntimeEnvFromProcess() {
  const values = {};
  for (const key of requiredTargetRuntimeEnvKeys) {
    if (process.env[key] !== undefined) {
      values[key] = process.env[key];
    }
  }
  return values;
}

module.exports = {
  collectTargetRuntimeEnvFromProcess,
  defaultTargetRuntimeEnvPath,
  parseTargetRuntimeEnvFile,
  readOption,
  requiredTargetRuntimeEnvKeys,
  resolveEnvFileFromArgs,
  validateTargetRuntimeEnv
};
