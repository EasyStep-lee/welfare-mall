import { createRequire } from 'node:module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);

const order = {
  orderNo: 'ORDER-20260603-001',
  status: 'pending_payment',
  totalAmount: 13980,
  welfareCardPayableAmount: 5000,
  cashPayableAmount: 8980,
  latestPayment: {
    paymentNo: 'PAY-20260603-001',
    status: 'pending',
    channel: 'wechat'
  },
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

const payment = {
  paymentNo: 'PAY-20260603-001',
  status: 'pending',
  channel: 'wechat'
};

const paidOrder = {
  ...order,
  status: 'paid',
  latestPayment: {
    paymentNo: 'PAY-20260603-PAID',
    status: 'paid',
    channel: 'wechat'
  }
};

const refreshedPaidOrder = {
  ...paidOrder,
  latestPayment: {
    paymentNo: 'PAY-20260603-REFRESHED',
    status: 'paid',
    channel: 'wechat'
  }
};

const refund = {
  refundNo: 'REF-20260603-001',
  status: 'processing',
  channel: 'wechat',
  refundAmount: 13980
};

const orderWithRefund = {
  ...order,
  status: 'refund_processing',
  latestRefund: refund
};

function mountPage(options = {}) {
  let pageDefinition;
  const requests = [];
  const orderResponses = options.orderResponses ? [...options.orderResponses] : [options.order || order];

  global.Page = vi.fn((definition) => {
    pageDefinition = definition;
  });
  global.getApp = vi.fn(() => ({ globalData: { apiBaseUrl: 'http://localhost:3000/api' } }));
  global.wx = {
    request: vi.fn((request) => {
      requests.push(request);
      if (request.url.endsWith('/orders/payments')) {
        request.success({ statusCode: 201, data: { payment } });
        return;
      }
      if (request.url.endsWith('/orders/refunds')) {
        request.success({ statusCode: 201, data: { refund } });
        return;
      }

      request.success({ statusCode: 200, data: { order: orderResponses.shift() || orderResponses[0] || order } });
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
      latestPaymentDisplay: {
        paymentNo: 'PAY-20260603-001',
        statusText: '待支付',
        channelText: '微信支付'
      },
      receiverText: 'Li Lei / 13800000000 / Pudong Avenue 1'
    });
    expect(page.data.orderDisplay.lines[0]).toMatchObject({
      displayName: 'Local Rice',
      skuText: 'SKU-RICE-5KG',
      quantityText: 'x2',
      lineTotalText: '¥139.80'
    });
  });

  it('creates a WeChat payment order from the loaded order snapshot', async () => {
    const { page, requests } = mountPage();

    await page.loadOrderDetail('ORDER-20260603-001');
    await page.submitPayment();

    expect(requests[1]).toMatchObject({
      method: 'POST',
      url: 'http://localhost:3000/api/orders/payments',
      data: {
        orderNo: 'ORDER-20260603-001',
        channel: 'wechat',
        totalAmount: 13980,
        welfareCardPayableAmount: 5000,
        cashPayableAmount: 8980
      }
    });
    expect(requests[1].data.requestId).toMatch(/^mini-payment-ORDER-20260603-001-\d+$/);
    expect(page.data.payment).toEqual(payment);
    expect(page.data.paymentDisplay).toEqual({
      paymentNo: 'PAY-20260603-001',
      statusText: '待支付',
      channelText: '微信支付'
    });
  });

  it('refreshes the current order detail from the latest order read state', async () => {
    const { page, requests } = mountPage({ orderResponses: [order, refreshedPaidOrder] });

    await page.loadOrderDetail('ORDER-20260603-001');
    await page.refreshOrderDetail();

    expect(requests[1]).toMatchObject({
      method: 'GET',
      url: 'http://localhost:3000/api/orders/ORDER-20260603-001?buyerUserId=local-user-001'
    });
    expect(page.data.order).toEqual(refreshedPaidOrder);
    expect(page.data.orderDisplay).toMatchObject({
      orderNo: 'ORDER-20260603-001',
      statusText: '已支付',
      latestPaymentDisplay: {
        paymentNo: 'PAY-20260603-REFRESHED',
        statusText: '已支付',
        channelText: '微信支付'
      }
    });
    expect(page.data.canRequestRefund).toBe(true);
  });

  it('creates a full after-sale refund request from a paid order', async () => {
    const { page, requests } = mountPage({ order: paidOrder });

    await page.loadOrderDetail('ORDER-20260603-001');
    await page.submitRefund();

    expect(requests[1]).toMatchObject({
      method: 'POST',
      url: 'http://localhost:3000/api/orders/refunds',
      data: {
        paymentNo: 'PAY-20260603-PAID',
        orderNo: 'ORDER-20260603-001',
        channel: 'wechat',
        refundAmount: 13980,
        reason: 'after_sale'
      }
    });
    expect(requests[1].data.requestId).toMatch(/^mini-refund-ORDER-20260603-001-\d+$/);
    expect(page.data.refund).toEqual(refund);
    expect(page.data.refundDisplay).toEqual({
      refundNo: 'REF-20260603-001',
      statusText: '退款处理中',
      channelText: '微信支付',
      refundAmountText: '¥139.80'
    });
    expect(page.data.order.status).toBe('refund_processing');
    expect(page.data.orderDisplay.statusText).toBe('退款处理中');
  });

  it('displays the latest refund returned by order detail', async () => {
    const { page } = mountPage({ order: orderWithRefund });

    await page.loadOrderDetail('ORDER-20260603-001');

    expect(page.data.orderDisplay.latestRefundDisplay).toEqual({
      refundNo: 'REF-20260603-001',
      statusText: '退款处理中',
      channelText: '微信支付',
      refundAmountText: '¥139.80'
    });
  });
});
