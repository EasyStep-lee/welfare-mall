const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const requiredFiles = [
  'apps/api/Dockerfile',
  'apps/admin/Dockerfile',
  'apps/merchant/Dockerfile',
  'apps/portal/Dockerfile',
  'tools/start-docker-runtime.ps1',
  'docker-compose.yml'
];

const requiredComposeSnippets = [
  'api:',
  'admin:',
  'merchant:',
  'portal:',
  '"3000:3000"',
  '"5173:5173"',
  '"5174:5174"',
  '"5175:5175"',
  'DATABASE_URL=mysql://welfare_mall:welfare_mall_password@mysql:3306/welfare_mall_v2',
  'API_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175',
  'VITE_ADMIN_API_BASE_URL=http://localhost:3000/api',
  'VITE_MERCHANT_API_BASE_URL=http://localhost:3000/api',
  'VITE_API_BASE_URL=http://localhost:3000/api'
];

const liveTargets = [
  { name: 'API health', url: 'http://localhost:3000/api/health', expectedBody: 'welfare-mall-api' },
  {
    name: 'Admin shell',
    url: 'http://localhost:5173/',
    expectedBody: '<html',
    expectedAssetBody: 'http://localhost:3000/api'
  },
  {
    name: 'Merchant shell',
    url: 'http://localhost:5174/',
    expectedBody: '<html',
    expectedAssetBody: 'http://localhost:3000/api'
  },
  {
    name: 'Portal shell',
    url: 'http://localhost:5175/',
    expectedBody: '<html',
    expectedAssetBody: 'http://localhost:3000/api'
  }
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readRelative(filePath) {
  return fs.readFileSync(path.join(root, filePath), 'utf8');
}

function verifyStaticConfig() {
  for (const filePath of requiredFiles) {
    assert(fs.existsSync(path.join(root, filePath)), `Missing required Docker runtime file: ${filePath}`);
  }

  const compose = readRelative('docker-compose.yml');
  for (const snippet of requiredComposeSnippets) {
    assert(compose.includes(snippet), `docker-compose.yml is missing required runtime snippet: ${snippet}`);
  }

  console.log('Docker runtime static config verified.');
}

function get(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { timeout: 10_000 }, (response) => {
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

  throw new Error(`${name} did not become healthy: ${lastError.message}`);
}

async function verifyLiveRuntime() {
  for (const target of liveTargets) {
    const { name, url, expectedBody, expectedAssetBody } = target;
    await retry(name, async () => {
      const response = await get(url);
      assert(response.statusCode === 200, `${name} returned HTTP ${response.statusCode}`);
      assert(
        response.body.toLowerCase().includes(expectedBody.toLowerCase()),
        `${name} response did not include ${expectedBody}`
      );

      if (expectedAssetBody) {
        const scriptPath = response.body.match(/<script[^>]+src="([^"]+\.js)"/)?.[1];
        assert(scriptPath, `${name} did not expose a Vite JavaScript asset`);
        const assetUrl = new URL(scriptPath, url).toString();
        const assetResponse = await get(assetUrl);
        assert(assetResponse.statusCode === 200, `${name} asset returned HTTP ${assetResponse.statusCode}`);
        assert(assetResponse.body.includes(expectedAssetBody), `${name} asset did not include ${expectedAssetBody}`);
      }
    });
  }

  console.log('Docker runtime live smoke verified.');
}

async function main() {
  verifyStaticConfig();

  if (process.argv.includes('--live')) {
    await verifyLiveRuntime();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
