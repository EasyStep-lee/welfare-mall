const http = require('node:http');

const pageTargets = [
  {
    name: 'Admin',
    url: 'http://localhost:5173/',
    expectedAssetSnippets: ['商品审核', '订单管理', 'http://localhost:3000/api']
  },
  {
    name: 'Merchant',
    url: 'http://localhost:5174/',
    expectedAssetSnippets: ['商品提审', '履约订单', 'http://localhost:3000/api']
  },
  {
    name: 'Portal',
    url: 'http://localhost:5175/',
    expectedAssetSnippets: ['企业福利商品目录', '可选商品', 'http://localhost:3000/api']
  }
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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

  throw new Error(`${name} page smoke failed: ${lastError.message}`);
}

function extractScriptPath(html, name) {
  const scriptPath = html.match(/<script[^>]+src="([^"]+\.js)"/)?.[1];
  assert(scriptPath, `${name} page did not expose a built Vite JavaScript asset`);
  return scriptPath;
}

async function verifyPage(target) {
  await retry(target.name, async () => {
    const page = await get(target.url);
    assert(page.statusCode === 200, `${target.name} page returned HTTP ${page.statusCode}`);
    assert(page.body.toLowerCase().includes('<html'), `${target.name} page did not return an HTML shell`);

    const scriptPath = extractScriptPath(page.body, target.name);
    const assetUrl = new URL(scriptPath, target.url).toString();
    const asset = await get(assetUrl);
    assert(asset.statusCode === 200, `${target.name} asset returned HTTP ${asset.statusCode}`);

    for (const snippet of target.expectedAssetSnippets) {
      assert(asset.body.includes(snippet), `${target.name} asset did not include expected text: ${snippet}`);
    }
  });
}

async function main() {
  for (const target of pageTargets) {
    await verifyPage(target);
  }

  console.log('Docker page smoke verified.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
