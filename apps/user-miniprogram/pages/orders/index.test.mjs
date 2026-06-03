import { createRequire } from 'node:module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);

const orderResponse = {
  orders: [
    {
      orderNo: 'ORDER-20260603-001',
      status: 'pending_payment',
      totalAmount: 13980,
      lines: [{ displayName: 'Local Rice', quantity: 2 }]
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
      request.success({ statusCode: 200, data: orderResponse });
    }),
    navigateTo: vi.fn()
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

describe('user mini-program order list page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads local buyer orders and navigates to order detail', async () => {
    const { page, requests } = mountPage();

    await page.loadOrders();
    page.openOrderDetail({ currentTarget: { dataset: { orderNo: 'ORDER-20260603-001' } } });

    expect(requests[0]).toMatchObject({
      method: 'GET',
      url: 'http://localhost:3000/api/orders?buyerUserId=local-user-001'
    });
    expect(page.data.orders).toEqual(orderResponse.orders);
    expect(page.data.orderDisplays[0]).toMatchObject({
      orderNo: 'ORDER-20260603-001',
      statusText: '待支付',
      firstLineName: 'Local Rice',
      totalText: '¥139.80'
    });
    expect(wx.navigateTo).toHaveBeenCalledWith({
      url: '/pages/order-detail/index?orderNo=ORDER-20260603-001'
    });
  });
});
