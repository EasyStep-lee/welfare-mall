import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import App from './App';

const reviewQueueResponse = {
  status: 'pending_review',
  items: [
    {
      productId: 'product-001',
      code: 'P-RICE-001',
      name: '东北五常大米福利装',
      status: 'pending_review',
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
      primarySku: { code: 'SKU-RICE-5KG', priceAmount: 6990, marketPriceAmount: 7990, specText: '规格: 5kg' },
      media: [{ type: 'main_image', url: 'https://img.example.com/rice-cover.jpg', sortOrder: 1 }],
      qualifications: [],
      parameters: [],
      detailSections: []
    }
  ]
};

const adminOrdersResponse = {
  orders: [
    {
      orderNo: 'ORDER-20260603-001',
      buyerUserId: 'user-001',
      status: 'paid',
      totalAmount: 13980,
      welfareCardPayableAmount: 5000,
      cashPayableAmount: 8980,
      fulfillmentType: 'delivery',
      receiverName: 'Li Lei',
      receiverPhone: '13800000000',
      receiverAddress: 'Pudong Avenue 1',
      pickupStoreName: null,
      latestPayment: { paymentNo: 'PAY-20260603-001', status: 'paid', channel: 'wechat' },
      latestRefund: null,
      fulfillmentSummary: { totalTasks: 1, pendingTasks: 1, completedTasks: 0, taskNos: ['FT-001'] },
      fulfillmentTasks: [],
      lines: [{ displayName: 'Local Rice', displaySkuCode: 'SKU-RICE-5KG', quantity: 2, lineTotalAmount: 13980 }]
    }
  ]
};

const adminInventoryReservationsResponse = {
  reservations: [
    {
      id: 'reservation-001',
      orderNo: 'ORDER-20260603-001',
      orderLineId: 'order-line-001',
      productId: 'product-001',
      skuId: 'sku-001',
      merchantId: 'merchant-001',
      quantity: 2,
      status: 'reserved',
      source: 'order_paid',
      releasedAt: null,
      createdAt: '2026-06-03T00:15:00.000Z',
      updatedAt: '2026-06-03T00:15:00.000Z'
    }
  ]
};

const adminInventoryStocksResponse = {
  stocks: [
    {
      id: 'stock-001',
      stockKey: 'product-001:sku-001',
      productId: 'product-001',
      skuId: 'sku-001',
      merchantId: 'merchant-001',
      availableQuantity: 99,
      reservedQuantity: 1,
      createdAt: '2026-06-05T00:00:00.000Z',
      updatedAt: '2026-06-05T00:30:00.000Z'
    }
  ]
};

const adminSettlementStatementsResponse = {
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
      payoutReference: null,
      payoutRemark: null,
      items: []
    }
  ]
};

describe('Admin Vue workbench', () => {
  beforeEach(() => {
    let reviewQueueLoads = 0;
    let settlementLoads = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/settlements/merchant-statements/MSS-20260606-001/confirm-offline-payout')) {
          return response({
            statement: {
              ...adminSettlementStatementsResponse.statements[0],
              status: 'paid_offline',
              paidAt: '2026-06-06T08:00:00.000Z',
              payoutReference: 'LOCAL-PAYOUT-MSS-20260606-001',
              payoutRemark: '本地线下打款确认'
            }
          });
        }
        if (url.includes('/settlements/merchant-statements/generate')) {
          return response({
            statement: {
              ...adminSettlementStatementsResponse.statements[0],
              statementNo: 'MSS-20260606-002'
            }
          });
        }
        if (url.includes('/products/product-001/review-decisions')) {
          return response({
            productId: 'product-001',
            decision: JSON.parse(String(init?.body))
          });
        }
        if (url.includes('/product-pools/items/publish')) {
          return response({
            itemId: 'pool-item-001',
            productId: 'product-001',
            status: 'published'
          });
        }
        if (url.includes('/settlements/merchant-statements')) {
          settlementLoads += 1;
          if (settlementLoads > 1) {
            return response({ statements: [] });
          }
          return response(adminSettlementStatementsResponse);
        }
        if (url.includes('/orders/admin/inventory-stocks')) {
          return response(adminInventoryStocksResponse);
        }
        if (url.includes('/orders/admin/inventory-reservations')) {
          return response(adminInventoryReservationsResponse);
        }
        if (url.includes('/orders/admin')) {
          return response(adminOrdersResponse);
        }
        if (url.includes('/products/review-queue')) {
          reviewQueueLoads += 1;
          return response(reviewQueueLoads === 1 ? reviewQueueResponse : { status: 'pending_review', items: [] });
        }
        throw new Error(`Unexpected request: ${url}`);
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders Vue Element Plus admin sections and loads core read models', async () => {
    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('平台管理工作台');
    expect(wrapper.text()).toContain('商品审核');
    expect(wrapper.text()).toContain('订单管理');
    expect(wrapper.text()).toContain('库存预占');
    expect(wrapper.text()).toContain('库存余额');
    expect(wrapper.text()).toContain('结算管理');
    expect(wrapper.text()).toContain('东北五常大米福利装');
    expect(wrapper.text()).toContain('ORDER-20260603-001');
    expect(wrapper.text()).toContain('product-001:sku-001');
    expect(wrapper.text()).toContain('MSS-20260606-001');

    expect(requestUrls()).toContain('http://localhost:3000/api/products/review-queue?status=pending_review');
    expect(requestUrls()).toContain('http://localhost:3000/api/orders/admin');
    expect(requestUrls()).toContain('http://localhost:3000/api/orders/admin/inventory-reservations');
    expect(requestUrls()).toContain('http://localhost:3000/api/orders/admin/inventory-stocks');
    expect(requestUrls()).toContain('http://localhost:3000/api/settlements/merchant-statements?status=generated');
  });

  it('approves a pending product review and refreshes the Vue queue', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await clickButton(wrapper, '通过审核');
    await flushPromises();

    const decisionCall = findRequest('/products/product-001/review-decisions');
    expect(decisionCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(decisionCall?.[1]?.body))).toEqual({
      action: 'approve',
      actorUserId: 'admin-user-001',
      reason: null
    });
    expect(wrapper.text()).toContain('东北五常大米福利装 已通过审核');
    expect(wrapper.text()).toContain('暂无待审核商品');
  });

  it('rejects a pending product review with the Admin default reason', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await clickButton(wrapper, '驳回审核');
    await flushPromises();

    const decisionCall = findRequest('/products/product-001/review-decisions');
    expect(decisionCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(decisionCall?.[1]?.body))).toEqual({
      action: 'reject',
      actorUserId: 'admin-user-001',
      reason: '资料不完整'
    });
    expect(wrapper.text()).toContain('东北五常大米福利装 已驳回审核');
    expect(wrapper.text()).toContain('暂无待审核商品');
  });

  it('publishes a reviewed product to the product pool', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await clickButton(wrapper, '发布商品池');
    await flushPromises();

    const publishCall = findRequest('/product-pools/items/publish');
    expect(publishCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(publishCall?.[1]?.body))).toEqual({
      productId: 'product-001',
      actorUserId: 'admin-user-001'
    });
    expect(wrapper.text()).toContain('东北五常大米福利装 已发布到商品池');
  });

  it('generates a settlement statement from the Vue settlement panel', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await clickButton(wrapper, '生成结算单');
    await flushPromises();

    const generateCall = findRequest('/settlements/merchant-statements/generate');
    expect(generateCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(generateCall?.[1]?.body))).toEqual({ merchantId: 'merchant-001' });
    expect(wrapper.text()).toContain('已生成结算单 MSS-20260606-002');
    expect(requestUrls().filter((url) => url.includes('/settlements/merchant-statements?status=generated')).length).toBeGreaterThanOrEqual(2);
  });

  it('confirms offline payout for a generated settlement statement', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await clickButton(wrapper, '确认线下打款');
    await flushPromises();

    const payoutCall = findRequest('/settlements/merchant-statements/MSS-20260606-001/confirm-offline-payout');
    expect(payoutCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(payoutCall?.[1]?.body))).toEqual({
      paidAt: '2026-06-06T08:00:00.000Z',
      payoutReference: 'LOCAL-PAYOUT-MSS-20260606-001',
      payoutRemark: '本地线下打款确认'
    });
    expect(wrapper.text()).toContain('MSS-20260606-001 已确认线下打款');
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

function findRequest(urlPart: string) {
  return vi.mocked(fetch).mock.calls.find(([input]) => String(input).includes(urlPart));
}

async function clickButton(wrapper: ReturnType<typeof mount>, text: string) {
  const button = wrapper.findAll('button').find((candidate) => candidate.text() === text);
  expect(button, `button ${text}`).toBeTruthy();
  await button!.trigger('click');
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
  await nextTick();
}
