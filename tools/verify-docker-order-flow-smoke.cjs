const http = require('node:http');

const apiBaseUrl = process.env.WELFARE_MALL_DOCKER_API_BASE_URL ?? 'http://localhost:3000/api';
const localProductId = 'product-local-review';
const localMerchantId = 'merchant-local-review';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function requestJson(method, path, body) {
  const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`;
  const url = new URL(path.replace(/^\/+/, ''), baseUrl);
  const payload = body === undefined ? undefined : JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const request = http.request(
      url,
      {
        method,
        timeout: 10_000,
        headers:
          payload === undefined
            ? undefined
            : {
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(payload)
              }
      },
      (response) => {
        let responseBody = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          responseBody += chunk;
        });
        response.on('end', () => {
          let data = null;
          if (responseBody.trim().length > 0) {
            try {
              data = JSON.parse(responseBody);
            } catch (error) {
              reject(new Error(`${method} ${url} returned non-JSON body: ${responseBody.slice(0, 200)}`));
              return;
            }
          }

          resolve({ statusCode: response.statusCode, data });
        });
      }
    );

    request.on('timeout', () => {
      request.destroy(new Error(`Timed out requesting ${method} ${url}`));
    });
    request.on('error', reject);

    if (payload !== undefined) {
      request.write(payload);
    }
    request.end();
  });
}

async function expectJson(method, path, expectedStatusCode, body) {
  const response = await requestJson(method, path, body);
  assert(
    response.statusCode === expectedStatusCode,
    `${method} ${path} returned HTTP ${response.statusCode}, expected ${expectedStatusCode}: ${JSON.stringify(response.data)}`
  );
  return response.data;
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

  throw new Error(`${name} did not become ready: ${lastError.message}`);
}

function findLocalCatalogItem(catalog) {
  for (const pool of catalog.productPools ?? []) {
    for (const item of pool.items ?? []) {
      if (item.productId === localProductId) {
        return item;
      }
    }
  }

  return null;
}

function requireLocalCatalogItem(catalog) {
  const item = findLocalCatalogItem(catalog);
  assert(
    item,
    [
      `Docker order flow smoke needs ${localProductId} in an active product pool.`,
      'Run the local review product seed and publish the product pool item before this live smoke.'
    ].join(' ')
  );
  assert(item.id, 'Local catalog item is missing id');
  assert(Number.isInteger(item.displayPriceAmount) && item.displayPriceAmount > 0, 'Local catalog item is missing a positive price');
  return item;
}

async function main() {
  await retry('API health', async () => {
    const health = await expectJson('GET', '/health', 200);
    assert(health.service === 'welfare-mall-api', 'API health did not return welfare-mall-api');
  });

  const catalog = await expectJson('GET', '/product-pools/catalog', 200);
  const item = requireLocalCatalogItem(catalog);
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '');
  const buyerUserId = `docker-smoke-user-${runId}`;
  const requestId = `docker-order-flow-${runId}`;

  const checkout = await expectJson('POST', '/orders', 201, {
    requestId,
    buyerUserId,
    items: [{ productPoolItemId: item.id, quantity: 1 }],
    welfareCardPaymentAmount: 0,
    fulfillment: {
      type: 'delivery',
      receiverName: 'Docker Smoke Buyer',
      receiverPhone: '13800000000',
      receiverAddress: 'Docker runtime order flow smoke address'
    }
  });
  const order = checkout.order;
  assert(order?.orderNo, 'Checkout response did not include order.orderNo');
  assert(order.status === 'pending_payment', `Created order status was ${order.status}, expected pending_payment`);
  assert(order.totalAmount === item.displayPriceAmount, `Created order total was ${order.totalAmount}, expected ${item.displayPriceAmount}`);

  const paymentResult = await expectJson('POST', '/orders/payments', 201, {
    requestId: `docker-payment-${runId}`,
    orderNo: order.orderNo,
    channel: 'wechat',
    totalAmount: order.totalAmount,
    welfareCardPayableAmount: order.welfareCardPayableAmount,
    cashPayableAmount: order.cashPayableAmount
  });
  const payment = paymentResult.payment;
  assert(payment?.paymentNo, 'Payment response did not include payment.paymentNo');
  assert(payment.status === 'pending', `Created payment status was ${payment.status}, expected pending`);

  await expectJson('POST', '/orders/payments/callbacks', 200, {
    providerEventId: `docker-payment-event-${runId}`,
    paymentNo: payment.paymentNo,
    providerPaymentNo: `docker-provider-payment-${runId}`,
    status: 'paid',
    paidAt: new Date().toISOString(),
    payload: { source: 'docker-order-flow-smoke' }
  });

  const buyerPaidDetail = await expectJson(
    'GET',
    `/orders/${encodeURIComponent(order.orderNo)}?buyerUserId=${encodeURIComponent(buyerUserId)}`,
    200
  );
  assert(buyerPaidDetail.order?.status === 'paid', `Buyer order status was ${buyerPaidDetail.order?.status}, expected paid`);
  assert(buyerPaidDetail.order?.latestPayment?.status === 'paid', 'Buyer order detail did not expose a paid latestPayment');

  const adminOrders = await expectJson('GET', '/orders/admin', 200);
  const adminOrder = (adminOrders.orders ?? []).find((candidate) => candidate.orderNo === order.orderNo);
  assert(adminOrder?.status === 'paid', 'Admin order list did not expose the paid smoke order');

  const fulfillmentQueue = await expectJson(
    'GET',
    `/orders/merchant/fulfillment?merchantId=${encodeURIComponent(localMerchantId)}`,
    200
  );
  const fulfillmentOrder = (fulfillmentQueue.orders ?? []).find((candidate) => candidate.orderNo === order.orderNo);
  assert(fulfillmentOrder?.status === 'paid', 'Merchant fulfillment queue did not expose the paid smoke order');
  assert(
    (fulfillmentOrder.lines ?? []).some((line) => line.productId === localProductId),
    'Merchant fulfillment order did not include the local product line'
  );

  const completed = await expectJson('POST', `/orders/merchant/fulfillment/${encodeURIComponent(order.orderNo)}/complete`, 200, {
    merchantId: localMerchantId
  });
  assert(completed.order?.status === 'completed', `Completed order status was ${completed.order?.status}, expected completed`);

  const buyerCompletedDetail = await expectJson(
    'GET',
    `/orders/${encodeURIComponent(order.orderNo)}?buyerUserId=${encodeURIComponent(buyerUserId)}`,
    200
  );
  assert(
    buyerCompletedDetail.order?.status === 'completed',
    `Buyer order status after fulfillment was ${buyerCompletedDetail.order?.status}, expected completed`
  );

  console.log(`Docker order flow smoke verified: ${order.orderNo}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
