import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import App from './App';

const draftQueueResponse = {
  status: 'draft',
  items: [
    {
      productId: 'product-001',
      code: 'P-RICE-001',
      name: '东北五常大米福利装',
      status: 'draft',
      saleStatus: 'off_sale',
      merchant: { id: 'merchant-001', code: 'M-001', name: '哈尔滨优选商贸' },
      franchise: { id: 'franchise-001', code: 'F-001', name: '黑龙江福利卡中心' },
      category: { id: 'category-001', code: 'grain', name: '粮油副食' },
      brand: { id: 'brand-001', code: 'wuchang', name: '五常香米' },
      origin: { country: '中国', province: '黑龙江', city: '哈尔滨', description: '五常核心产区' },
      skuCount: 2,
      imageCount: 3,
      qualificationCount: 1,
      parameterCount: 4,
      detailSectionCount: 2,
      primaryImageUrl: 'https://img.example.com/rice-cover.jpg',
      latestReviewLog: null
    }
  ]
};

const fulfillmentQueueResponse = {
  orders: [
    {
      id: 'fulfillment-task-001',
      taskNo: 'FT-ORDER-20260603-001-MERCHANT-001-001',
      orderNo: 'ORDER-20260603-001',
      status: 'paid',
      createdAt: '2026-06-03T08:10:00.000Z',
      updatedAt: '2026-06-03T08:10:00.000Z',
      completedAt: null,
      totalAmount: 13980,
      cashPayableAmount: 8980,
      welfareCardPayableAmount: 5000,
      fulfillmentType: 'delivery',
      receiverName: 'Li Lei',
      receiverPhone: '13800000000',
      receiverAddress: 'Pudong Avenue 1',
      pickupStoreName: null,
      pickupCode: null,
      latestPayment: { paymentNo: 'PAY-20260603-001', status: 'paid', channel: 'wechat' },
      lines: [{ displayName: 'Local Rice', displaySkuCode: 'SKU-RICE-5KG', quantity: 2, lineTotalAmount: 13980 }]
    }
  ]
};

const merchantSettlementStatementsResponse = {
  statements: [
    {
      id: 'statement-001',
      statementNo: 'MSS-20260606-001',
      merchantId: 'merchant-001',
      status: 'generated',
      itemCount: 2,
      grossAmount: 18980,
      refundOffsetAmount: 1000,
      adjustmentAmount: -500,
      netAmount: 17480,
      generatedAt: '2026-06-06T00:00:00.000Z',
      paidAt: null,
      items: []
    }
  ]
};

describe('Merchant Vue workbench', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/settlements/merchant-statements')) {
          return response(merchantSettlementStatementsResponse);
        }
        if (url.includes('/orders/merchant/fulfillment')) {
          return response(fulfillmentQueueResponse);
        }
        if (url.includes('/products/review-queue')) {
          return response(draftQueueResponse);
        }
        throw new Error(`Unexpected request: ${url}`);
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders Vue Element Plus merchant sections and loads core read models', async () => {
    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('商户运营工作台');
    expect(wrapper.text()).toContain('履约订单');
    expect(wrapper.text()).toContain('商品草稿');
    expect(wrapper.text()).toContain('商户结算');
    expect(wrapper.text()).toContain('东北五常大米福利装');
    expect(wrapper.text()).toContain('ORDER-20260603-001');
    expect(wrapper.text()).toContain('FT-ORDER-20260603-001-MERCHANT-001-001');
    expect(wrapper.text()).toContain('MSS-20260606-001');

    expect(requestUrls()).toContain(
      'http://localhost:3000/api/orders/merchant/fulfillment?merchantId=merchant-001&status=paid'
    );
    expect(requestUrls()).toContain('http://localhost:3000/api/products/review-queue?status=draft');
    expect(requestUrls()).toContain(
      'http://localhost:3000/api/settlements/merchant-statements?merchantId=merchant-001&status=generated'
    );
  });
});

function response(body: unknown) {
  return {
    ok: true,
    json: async () => body
  } as Response;
}

function requestUrls() {
  return vi.mocked(fetch).mock.calls.map(([input]) => String(input));
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
  await nextTick();
}
