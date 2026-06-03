import { createRequire } from 'node:module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);

const order = {
  orderNo: 'ORDER-20260603-001',
  status: 'pending_payment',
  totalAmount: 13980,
  welfareCardPayableAmount: 5000,
  cashPayableAmount: 8980,
  receiverName: 'Li Lei',
  receiverPhone: '13800000000',
  receiverAddress: 'Pudong Avenue 1',
  lines: [
    {
      displayName: 'Local Rice',
      displaySkuCode: 'SKU-RICE-5KG',
      quantity: 2,
      unitPriceAmount: 6990,
      lineTotalAmount: 13980
    }
  ]
};

function mountPage() {
  let pageDefinition;
  const requests = [];

  global.Page = vi.fn((definition) => {
    pageDefinition = definition;
  });
  global.getApp = vi.fn(() => ({ globalData: { apiBaseUrl: 'http://localhost:3000/api' } }));
  global.wx = {
    request: vi.fn((request) => {
      requests.push(request);
      request.success({ statusCode: 200, data: { order } });
    })
  };

  delete require.cache[require.resolve('./index.js')];
  require('./index.js');

  const page = {
    ...pageDefinition,
    data: { ...pageDefinition.data },
    setData(update) {
      this.data = { ...this.data, ...update };
    }
  };

  return { page, requests };
}

describe('user mini-program order detail page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads one local buyer order detail', async () => {
    const { page, requests } = mountPage();

    await page.loadOrderDetail('ORDER-20260603-001');

    expect(requests[0]).toMatchObject({
      method: 'GET',
      url: 'http://localhost:3000/api/orders/ORDER-20260603-001?buyerUserId=local-user-001'
    });
    expect(page.data.order).toEqual(order);
    expect(page.data.orderDisplay).toMatchObject({
      orderNo: 'ORDER-20260603-001',
      statusText: '待支付',
      totalText: '¥139.80',
      welfareCardText: '¥50.00',
      cashText: '¥89.80',
      receiverText: 'Li Lei / 13800000000 / Pudong Avenue 1'
    });
    expect(page.data.orderDisplay.lines[0]).toMatchObject({
      displayName: 'Local Rice',
      skuText: 'SKU-RICE-5KG',
      quantityText: 'x2',
      lineTotalText: '¥139.80'
    });
  });
});
