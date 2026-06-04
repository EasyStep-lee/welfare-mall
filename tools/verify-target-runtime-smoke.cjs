const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');
const {
  collectTargetRuntimeEnvFromProcess,
  parseTargetRuntimeEnvFile,
  readOption,
  requiredTargetRuntimeEnvKeys,
  validateTargetRuntimeEnv
} = require('./target-runtime-env.cjs');

const root = path.resolve(__dirname, '..');
const envExamplePath = path.join(root, 'deploy', 'target-runtime.env.example');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function verifyStaticEnvTemplate() {
  assert(fs.existsSync(envExamplePath), 'Missing deploy/target-runtime.env.example');

  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  for (const key of requiredTargetRuntimeEnvKeys) {
    assert(envExample.includes(`${key}=`), `deploy/target-runtime.env.example is missing ${key}`);
  }

  assert(
    envExample.includes('TARGET_API_BASE_URL=https://api.example.com/api'),
    'TARGET_API_BASE_URL example must include the /api prefix'
  );
  assert(
    envExample.includes('TARGET_EXPECTED_API_SERVICE=welfare-mall-api'),
    'TARGET_EXPECTED_API_SERVICE example must match the API health service name'
  );

  console.log('Target runtime static env template verified.');
}

function requireEnv(key) {
  const value = process.env[key]?.trim();
  assert(value, `${key} is required for --live target runtime smoke`);
  return value;
}

function get(url) {
  const parsedUrl = new URL(url);
  const client = parsedUrl.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.get(parsedUrl, { timeout: 15_000 }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        resolve({ statusCode: response.statusCode, body });
      });
    });

    request.on('timeout', () => {
      request.destroy(new Error(`Timed out requesting ${url}`));
    });
    request.on('error', reject);
  });
}

async function retry(name, operation) {
  let lastError;
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  throw new Error(`${name} target smoke failed: ${lastError.message}`);
}

function joinApiPath(apiBaseUrl, suffix) {
  const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`;
  return new URL(suffix.replace(/^\/+/, ''), baseUrl).toString();
}

function extractScriptPath(html, name) {
  const scriptPath = html.match(/<script[^>]+src="([^"]+\.js)"/)?.[1];
  assert(scriptPath, `${name} page did not expose a built JavaScript asset`);
  return scriptPath;
}

async function verifyApiHealth(apiBaseUrl, expectedService) {
  await retry('API health', async () => {
    const url = joinApiPath(apiBaseUrl, '/health');
    const response = await get(url);
    assert(response.statusCode === 200, `API health returned HTTP ${response.statusCode}`);
    const health = JSON.parse(response.body);
    assert(health.service === expectedService, `API health service was ${health.service}, expected ${expectedService}`);
  });
}

async function verifyFrontendAsset(name, pageUrl, expectedApiBaseUrl) {
  await retry(`${name} frontend`, async () => {
    const page = await get(pageUrl);
    assert(page.statusCode === 200, `${name} page returned HTTP ${page.statusCode}`);
    assert(page.body.toLowerCase().includes('<html'), `${name} page did not return an HTML shell`);

    const scriptPath = extractScriptPath(page.body, name);
    const assetUrl = new URL(scriptPath, pageUrl).toString();
    const asset = await get(assetUrl);
    assert(asset.statusCode === 200, `${name} asset returned HTTP ${asset.statusCode}`);
    assert(asset.body.includes(expectedApiBaseUrl), `${name} asset did not include ${expectedApiBaseUrl}`);
  });
}

async function verifyLiveTarget() {
  const apiBaseUrl = requireEnv('TARGET_API_BASE_URL');
  const expectedService = requireEnv('TARGET_EXPECTED_API_SERVICE');
  const frontends = [
    { name: 'Admin', url: requireEnv('TARGET_ADMIN_URL') },
    { name: 'Merchant', url: requireEnv('TARGET_MERCHANT_URL') },
    { name: 'Portal', url: requireEnv('TARGET_PORTAL_URL') }
  ];

  await verifyApiHealth(apiBaseUrl, expectedService);
  for (const frontend of frontends) {
    await verifyFrontendAsset(frontend.name, frontend.url, apiBaseUrl);
  }

  console.log('Target runtime live smoke verified.');
}

function loadEnvFileIfProvided() {
  const envFile = readOption(process.argv.slice(2), '--env-file');
  if (!envFile) {
    if (process.argv.includes('--require-real-values')) {
      validateTargetRuntimeEnv(collectTargetRuntimeEnvFromProcess(), {
        fileLabel: 'process environment',
        requireRealValues: true
      });
    }
    return;
  }

  const envFilePath = path.resolve(root, envFile);
  const values = parseTargetRuntimeEnvFile(envFilePath);
  validateTargetRuntimeEnv(values, {
    fileLabel: path.relative(root, envFilePath) || envFilePath,
    requireRealValues: process.argv.includes('--require-real-values')
  });
  Object.assign(process.env, values);
  console.log(`Target runtime env file loaded: ${path.relative(root, envFilePath) || envFilePath}`);
}

async function main() {
  loadEnvFileIfProvided();
  verifyStaticEnvTemplate();

  if (process.argv.includes('--live')) {
    await verifyLiveTarget();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
