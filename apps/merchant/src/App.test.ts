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
    let fulfillmentLoads = 0;
    let draftLoads = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/orders/merchant/fulfillment/ORDER-20260603-001/complete')) {
          return response({ order: { orderNo: 'ORDER-20260603-001', status: 'completed' } });
        }
        if (url.includes('/products/product-001/review-submissions')) {
          return response({
            productId: 'product-001',
            action: 'submit_review',
            fromStatus: 'draft',
            toStatus: 'pending_review'
          });
        }
        if (url.includes('/products/drafts/save')) {
          return response({
            productId: 'product-001',
            draftSnapshotId: 'snapshot-001',
            payload: JSON.parse(String(init?.body)).payload
          });
        }
        if (url.includes('/settlements/merchant-statements')) {
          return response(merchantSettlementStatementsResponse);
        }
        if (url.includes('/orders/merchant/fulfillment')) {
          fulfillmentLoads += 1;
          return response(fulfillmentLoads === 1 ? fulfillmentQueueResponse : { orders: [] });
        }
        if (url.includes('/products/review-queue')) {
          draftLoads += 1;
          return response(draftLoads === 1 ? draftQueueResponse : { status: 'draft', items: [] });
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

  it('completes a fulfillment order and refreshes the Vue list', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await clickButton(wrapper, '确认完成');
    await flushPromises();

    const completeCall = findRequest('/orders/merchant/fulfillment/ORDER-20260603-001/complete');
    expect(completeCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(completeCall?.[1]?.body))).toEqual({ merchantId: 'merchant-001' });
    expect(wrapper.text()).toContain('ORDER-20260603-001 已确认完成');
    expect(wrapper.text()).toContain('暂无待履约订单');
  });

  it('submits a draft product for review from the Vue workbench', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await clickButton(wrapper, '提交审核');
    await flushPromises();

    const submitCall = findRequest('/products/product-001/review-submissions');
    expect(submitCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(submitCall?.[1]?.body))).toEqual({ actorUserId: 'merchant-user-001' });
    expect(wrapper.text()).toContain('东北五常大米福利装 已提交审核');
    expect(wrapper.text()).toContain('暂无商品草稿');
  });

  it('saves a complete draft payload from visible Vue fields', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await clickButton(wrapper, '保存草稿');
    await flushPromises();

    const saveCall = findRequest('/products/drafts/save');
    expect(saveCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const requestBody = JSON.parse(String(saveCall?.[1]?.body));
    expect(requestBody.actorUserId).toBe('merchant-user-001');
    expect(requestBody.productId).toBeNull();
    expect(requestBody.payload).toMatchObject({
      code: 'P-RICE-001',
      name: '东北五常大米福利装',
      merchantId: 'merchant-001',
      franchiseId: 'franchise-001',
      categoryId: 'category-rice',
      brandId: 'brand-rice',
      originCountry: '中国'
    });
    expect(requestBody.payload.skus[0]).toMatchObject({
      code: 'SKU-P-RICE-001',
      priceAmount: 6990,
      specs: [{ name: '规格', value: '标准装' }]
    });
    expect(wrapper.text()).toContain('东北五常大米福利装 草稿已保存');
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
