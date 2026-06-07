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
      merchant: { id: 'merchant-local-review', code: 'M-LOCAL-REVIEW', name: '本地优选商户' },
      franchise: { id: 'franchise-local-review', code: 'F-LOCAL-REVIEW', name: '本地福利卡中心' },
      category: { id: 'category-local-review', code: 'local-grain', name: '粮油副食' },
      brand: { id: 'brand-local-review', code: 'local-wuchang', name: '五常香米' },
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

const completedFulfillmentQueueResponse = {
  orders: [
    {
      ...fulfillmentQueueResponse.orders[0],
      id: 'fulfillment-task-completed-001',
      taskNo: 'FT-ORDER-20260603-COMPLETED-MERCHANT-001-001',
      orderNo: 'ORDER-20260603-COMPLETED',
      status: 'completed',
      completedAt: '2026-06-03T09:20:00.000Z'
    }
  ]
};

const pickupFulfillmentQueueResponse = {
  orders: [
    {
      ...fulfillmentQueueResponse.orders[0],
      id: 'fulfillment-task-pickup-001',
      taskNo: 'FT-ORDER-20260603-PICKUP-MERCHANT-001-001',
      orderNo: 'ORDER-20260603-PICKUP',
      fulfillmentType: 'pickup',
      receiverName: null,
      receiverPhone: null,
      receiverAddress: null,
      pickupStoreName: '浦东福利自提点',
      pickupCode: 'PICKUP-8899'
    }
  ]
};

const merchantSettlementStatementsResponse = {
  statements: [
    {
      id: 'statement-001',
      statementNo: 'MSS-20260606-001',
      merchantId: 'merchant-local-review',
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
    vi.restoreAllMocks();
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
      'http://localhost:3000/api/orders/merchant/fulfillment?merchantId=merchant-local-review&status=paid'
    );
    expect(requestUrls()).toContain('http://localhost:3000/api/products/review-queue?status=draft');
    expect(requestUrls()).toContain(
      'http://localhost:3000/api/settlements/merchant-statements?merchantId=merchant-local-review&status=generated'
    );
  });

  it('filters merchant settlement statements by status from visible controls', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await clickButton(wrapper, '已打款');
    await flushPromises();

    expect(requestUrls()).toContain(
      'http://localhost:3000/api/settlements/merchant-statements?merchantId=merchant-local-review&status=paid_offline'
    );
  });

  it('exports currently loaded merchant settlement statements as csv', async () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const createObjectURL = vi.fn((blob: Blob) => {
      expect(blob).toBeInstanceOf(Blob);
      return 'blob:merchant-settlements';
    });
    const revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });

    try {
      const wrapper = mount(App);
      await flushPromises();

      await clickButton(wrapper, '导出结算CSV');
      await flushPromises();

      expect(createObjectURL).toHaveBeenCalledTimes(1);
      const firstCreateObjectURLCall = createObjectURL.mock.calls[0];
      expect(firstCreateObjectURLCall).toBeTruthy();
      const csv = await readBlobText(firstCreateObjectURLCall![0]);
      expect(csv).toContain('MSS-20260606-001');
      expect(csv).toContain('merchant-local-review');
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:merchant-settlements');
    } finally {
      Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectURL });
      Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevokeObjectURL });
    }
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
    expect(JSON.parse(String(completeCall?.[1]?.body))).toEqual({ merchantId: 'merchant-local-review' });
    expect(wrapper.text()).toContain('ORDER-20260603-001 已确认完成');
    expect(wrapper.text()).toContain('暂无待履约订单');
  });

  it('filters merchant fulfillment orders by status, order number, and task number', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/orders/merchant/fulfillment')) {
          return response(url.includes('status=completed') ? completedFulfillmentQueueResponse : fulfillmentQueueResponse);
        }
        if (url.includes('/products/review-queue')) {
          return response({ status: 'draft', items: [] });
        }
        if (url.includes('/settlements/merchant-statements')) {
          return response({ statements: [] });
        }
        throw new Error(`Unexpected request: ${url}`);
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await setFieldValue(wrapper, '订单号', 'ORDER-20260603-COMPLETED');
    await setFieldValue(wrapper, '任务号', 'FT-ORDER-20260603-COMPLETED-MERCHANT-001-001');
    await clickButton(wrapper, '已完成');
    await flushPromises();

    expect(requestUrls()).toContain(
      'http://localhost:3000/api/orders/merchant/fulfillment?merchantId=merchant-local-review&status=completed&orderNo=ORDER-20260603-COMPLETED&taskNo=FT-ORDER-20260603-COMPLETED-MERCHANT-001-001'
    );
    expect(wrapper.text()).toContain('ORDER-20260603-COMPLETED');
    expect(findButton(wrapper, '确认完成')).toBeUndefined();
  });

  it('requires the visible pickup code when completing pickup fulfillment orders', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/orders/merchant/fulfillment/ORDER-20260603-PICKUP/complete')) {
          return response({ order: { orderNo: 'ORDER-20260603-PICKUP', status: 'completed' } });
        }
        if (url.includes('/orders/merchant/fulfillment')) {
          return response(pickupFulfillmentQueueResponse);
        }
        if (url.includes('/products/review-queue')) {
          return response({ status: 'draft', items: [] });
        }
        if (url.includes('/settlements/merchant-statements')) {
          return response({ statements: [] });
        }
        throw new Error(`Unexpected request: ${url}`);
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('浦东福利自提点');
    await setFieldValue(wrapper, '提货码', 'PICKUP-8899');
    await clickButton(wrapper, '确认完成');
    await flushPromises();

    const completeCall = findRequest('/orders/merchant/fulfillment/ORDER-20260603-PICKUP/complete');
    expect(JSON.parse(String(completeCall?.[1]?.body))).toEqual({ merchantId: 'merchant-local-review', pickupCode: 'PICKUP-8899' });
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
    expect(JSON.parse(String(submitCall?.[1]?.body))).toEqual({ actorUserId: 'merchant-user-local' });
    expect(wrapper.text()).toContain('东北五常大米福利装 已提交审核');
    expect(wrapper.text()).toContain('暂无商品草稿');
  });

  it('saves a complete draft payload from visible Vue fields', async () => {
    const wrapper = mount(App);
    await flushPromises();

    for (const label of [
      '商品编码',
      '商品名称',
      '商品分类',
      '商品品牌',
      '产地省份',
      '产地城市',
      '销售价',
      '规格',
      '主图地址',
      '详情图地址',
      '资质文件',
      '商品参数',
      '图文说明'
    ]) {
      expect(wrapper.text()).toContain(label);
    }

    await clickButton(wrapper, '保存草稿');
    await flushPromises();

    const saveCall = findRequest('/products/drafts/save');
    expect(saveCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const requestBody = JSON.parse(String(saveCall?.[1]?.body));
    expect(requestBody.actorUserId).toBe('merchant-user-local');
    expect(requestBody.productId).toBeNull();
    expect(requestBody.payload).toMatchObject({
      code: 'P-RICE-001',
      name: '东北五常大米福利装',
      merchantId: 'merchant-local-review',
      franchiseId: 'franchise-local-review',
      categoryId: 'category-local-review',
      brandId: 'brand-local-review',
      originCountry: '中国'
    });
    expect(requestBody.payload.skus[0]).toMatchObject({
      code: 'SKU-P-RICE-001',
      priceAmount: 6990,
      specs: [{ name: '规格', value: '标准装' }]
    });
    expect(wrapper.text()).toContain('东北五常大米福利装 草稿已保存');
  });

  it('refreshes the draft queue after saving so the saved draft can be submitted for review', async () => {
    let draftLoads = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/products/product-saved-001/review-submissions')) {
          return response({
            productId: 'product-saved-001',
            action: 'submit_review',
            fromStatus: 'draft',
            toStatus: 'pending_review'
          });
        }
        if (url.includes('/products/drafts/save')) {
          return response({
            productId: 'product-saved-001',
            draftSnapshotId: 'snapshot-saved-001',
            payload: JSON.parse(String(init?.body)).payload
          });
        }
        if (url.includes('/products/review-queue')) {
          draftLoads += 1;
          return response(
            draftLoads === 1
              ? { status: 'draft', items: [] }
              : {
                  status: 'draft',
                  items: [
                    {
                      ...draftQueueResponse.items[0],
                      productId: 'product-saved-001',
                      code: 'P-RICE-001',
                      name: '东北五常大米福利装'
                    }
                  ]
                }
          );
        }
        if (url.includes('/orders/merchant/fulfillment')) {
          return response({ orders: [] });
        }
        if (url.includes('/settlements/merchant-statements')) {
          return response({ statements: [] });
        }
        throw new Error(`Unexpected request: ${url}`);
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('暂无商品草稿');

    await clickButton(wrapper, '保存草稿');
    await flushPromises();

    expect(draftLoads).toBe(2);
    expect(wrapper.text()).toContain('东北五常大米福利装');

    await clickButton(wrapper, '提交审核');
    await flushPromises();

    const submitCall = findRequest('/products/product-saved-001/review-submissions');
    expect(submitCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(submitCall?.[1]?.body))).toEqual({ actorUserId: 'merchant-user-local' });
  });

  it('saves edited master data fields from the visible Vue draft form', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await setFieldValue(wrapper, '产地省份', '吉林');
    await setFieldValue(wrapper, '产地城市', '长春');
    await setFieldValue(wrapper, '规格', '10kg 礼盒');
    await setFieldValue(wrapper, '主图地址', 'https://img.example.com/rice-main-new.jpg');
    await setFieldValue(wrapper, '详情图地址', 'https://img.example.com/rice-detail-new.jpg');
    await setFieldValue(wrapper, '资质文件', 'https://img.example.com/certs/rice-new.pdf');
    await setFieldValue(wrapper, '商品参数', '净含量 10kg');
    await setFieldValue(wrapper, '图文说明', '升级礼盒装福利说明。');

    await clickButton(wrapper, '保存草稿');
    await flushPromises();

    const saveCall = findRequest('/products/drafts/save');
    const requestBody = JSON.parse(String(saveCall?.[1]?.body));
    expect(requestBody.payload).toMatchObject({
      originProvince: '吉林',
      originCity: '长春',
      originDescription: '吉林长春优选产区'
    });
    expect(requestBody.payload.skus[0].specs).toEqual([{ name: '规格', value: '10kg 礼盒' }]);
    expect(requestBody.payload.media).toEqual([
      {
        type: 'main_image',
        url: 'https://img.example.com/rice-main-new.jpg',
        sortOrder: 1,
        altText: '东北五常大米福利装'
      },
      {
        type: 'detail_image',
        url: 'https://img.example.com/rice-detail-new.jpg',
        sortOrder: 2,
        altText: '东北五常大米福利装详情'
      }
    ]);
    expect(requestBody.payload.qualifications[0].fileUrl).toBe('https://img.example.com/certs/rice-new.pdf');
    expect(requestBody.payload.parameters[0].value).toBe('净含量 10kg');
    expect(requestBody.payload.detailSections[0].content).toBe('升级礼盒装福利说明。');
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
  const button = findButton(wrapper, text);
  expect(button, `button ${text}`).toBeTruthy();
  await button!.trigger('click');
}

function findButton(wrapper: ReturnType<typeof mount>, text: string) {
  return wrapper.findAll('button').find((candidate) => candidate.text() === text);
}

function readBlobText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

async function setFieldValue(wrapper: ReturnType<typeof mount>, label: string, value: string) {
  const labelWrapper = wrapper.findAll('label').find((candidate) => candidate.text().includes(label));
  expect(labelWrapper, `field ${label}`).toBeTruthy();
  const control = labelWrapper!.find('input,textarea');
  expect(control.exists(), `control ${label}`).toBe(true);
  await control.setValue(value);
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
  await nextTick();
}
