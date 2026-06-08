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
      qualifications: [
        {
          type: 'origin_certificate',
          title: '产地证明',
          certificateNo: 'CERT-RICE-001',
          fileUrl: 'https://img.example.com/certs/rice.pdf'
        }
      ],
      parameters: [{ groupName: '基础参数', name: '净含量', value: '5kg', valueType: 'text', sortOrder: 1 }],
      detailSections: [{ type: 'text', title: '福利说明', content: '适合企业福利发放', sortOrder: 1 }]
    }
  ]
};

const adminOrdersResponse = {
  orders: [
    {
      orderNo: 'ORDER-20260603-PENDING',
      buyerUserId: 'user-pending',
      status: 'pending_payment',
      totalAmount: 6990,
      welfareCardPayableAmount: 0,
      cashPayableAmount: 6990,
      fulfillmentType: 'delivery',
      receiverName: 'Han Mei',
      receiverPhone: '13900000000',
      receiverAddress: 'Century Avenue 2',
      pickupStoreName: null,
      latestPayment: { paymentNo: 'PAY-20260603-PENDING', status: 'pending', channel: 'wechat' },
      latestRefund: null,
      fulfillmentSummary: { totalTasks: 0, pendingTasks: 0, completedTasks: 0, taskNos: [] },
      fulfillmentTasks: [],
      lines: [{ displayName: 'Pending Rice', displaySkuCode: 'SKU-RICE-5KG', quantity: 1, lineTotalAmount: 6990 }]
    },
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
      fulfillmentTasks: [
        {
          taskNo: 'FT-001',
          merchantId: 'merchant-001',
          status: 'pending',
          pickupCode: 'WM_PICKUP:FT-001',
          createdAt: '2026-06-03T00:20:00.000Z',
          completedAt: null
        }
      ],
      lines: [{ displayName: 'Local Rice', displaySkuCode: 'SKU-RICE-5KG', quantity: 2, lineTotalAmount: 13980 }]
    },
    {
      orderNo: 'ORDER-20260603-REFUND',
      buyerUserId: 'user-refund',
      status: 'refund_processing',
      totalAmount: 13980,
      welfareCardPayableAmount: 5000,
      cashPayableAmount: 8980,
      fulfillmentType: 'delivery',
      receiverName: 'Wang Fang',
      receiverPhone: '13700000000',
      receiverAddress: 'Zhangjiang Road 3',
      pickupStoreName: null,
      latestPayment: { paymentNo: 'PAY-20260603-REFUND', status: 'paid', channel: 'wechat' },
      latestRefund: {
        refundNo: 'REF-20260603-001',
        status: 'processing',
        channel: 'wechat',
        refundAmount: 13980,
        reason: 'after_sale'
      },
      fulfillmentSummary: { totalTasks: 1, pendingTasks: 0, completedTasks: 1, taskNos: ['FT-REFUND-001'] },
      fulfillmentTasks: [],
      lines: [{ displayName: 'Refund Rice', displaySkuCode: 'SKU-RICE-5KG', quantity: 2, lineTotalAmount: 13980 }]
    },
    {
      orderNo: 'ORDER-20260603-CANCELLED',
      buyerUserId: 'user-cancelled',
      status: 'cancelled',
      totalAmount: 6990,
      welfareCardPayableAmount: 0,
      cashPayableAmount: 6990,
      fulfillmentType: 'delivery',
      receiverName: 'Zhao Min',
      receiverPhone: '13600000000',
      receiverAddress: 'Longyang Road 8',
      pickupStoreName: null,
      latestPayment: { paymentNo: 'PAY-20260603-CANCELLED', status: 'cancelled', channel: 'wechat' },
      latestRefund: null,
      fulfillmentSummary: { totalTasks: 0, pendingTasks: 0, completedTasks: 0, taskNos: [] },
      fulfillmentTasks: [],
      lines: [{ displayName: 'Cancelled Rice', displaySkuCode: 'SKU-RICE-5KG', quantity: 1, lineTotalAmount: 6990 }]
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
    installLocalStorageMock();
    localStorage.setItem('welfareMallAdminAccessToken', 'admin-token-local');
    localStorage.setItem(
      'welfareMallAdminUser',
      JSON.stringify({ username: 'admin-local', displayName: '本地平台管理员', subjectType: 'platform', subjectId: 'platform' })
    );
    let reviewQueueLoads = 0;
    let settlementLoads = 0;
    let orderLoads = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/orders/payments/callbacks')) {
          return response({
            duplicate: false,
            payment: {
              paymentNo: 'PAY-20260603-PENDING',
              status: 'paid',
              providerPaymentNo: 'LOCAL-PROVIDER-PAY-20260603-PENDING'
            },
            callback: { providerEventId: 'LOCAL-PAYMENT-ORDER-20260603-PENDING', status: 'paid' }
          });
        }
        if (url.includes('/orders/refunds/callbacks')) {
          return response({
            duplicate: false,
            refund: {
              refundNo: 'REF-20260603-001',
              status: 'succeeded',
              providerRefundNo: 'LOCAL-PROVIDER-REF-20260603-001'
            },
            callback: { providerEventId: 'LOCAL-REFUND-CALLBACK-ORDER-20260603-REFUND', status: 'succeeded' }
          });
        }
        if (url.includes('/orders/refunds')) {
          return response({
            idempotentReplay: false,
            refund: {
              refundNo: 'REF-20260603-NEW',
              requestId: 'LOCAL-REFUND-ORDER-20260603-001',
              paymentNo: 'PAY-20260603-001',
              orderNo: 'ORDER-20260603-001',
              status: 'processing',
              channel: 'wechat',
              refundAmount: 13980,
              reason: 'after_sale'
            }
          });
        }
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
          orderLoads += 1;
          return response(orderLoads === 1 ? adminOrdersResponse : { orders: [] });
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
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('requires platform login before loading the Admin workbench', async () => {
    localStorage.clear();
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/auth/login')) {
        return response({
          tokenType: 'Bearer',
          accessToken: 'admin-token-001',
          expiresIn: 3600,
          user: { username: 'admin-local', displayName: '本地平台管理员', subjectType: 'platform', subjectId: 'platform' }
        });
      }
      if (url.includes('/products/review-queue')) {
        return response(reviewQueueResponse);
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
      if (url.includes('/settlements/merchant-statements')) {
        return response(adminSettlementStatementsResponse);
      }

      return response({});
    });

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('平台登录');
    expect(wrapper.text()).not.toContain('商品审核');
    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('/products/review-queue'));

    await setFieldValue(wrapper, '账号', 'admin-local');
    await setFieldValue(wrapper, '密码', 'local-dev-password');
    await wrapper.get('button[aria-label="登录平台工作台"]').trigger('click');
    await flushPromises();

    expect(localStorage.getItem('welfareMallAdminAccessToken')).toBe('admin-token-001');
    expect(wrapper.text()).toContain('本地平台管理员');
    expect(wrapper.text()).toContain('商品审核');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'admin-local', password: 'local-dev-password' })
      })
    );
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
    expect(wrapper.text()).toContain('粮油副食');
    expect(wrapper.text()).toContain('五常香米');
    expect(wrapper.text()).toContain('五常核心产区');
    expect(wrapper.text()).toContain('SKU-RICE-5KG');
    expect(wrapper.text()).toContain('销售价 ¥69.90');
    expect(wrapper.text()).toContain('主图');
    expect(wrapper.text()).toContain('https://img.example.com/rice-cover.jpg');
    expect(wrapper.text()).toContain('产地证明');
    expect(wrapper.text()).toContain('CERT-RICE-001');
    expect(wrapper.text()).toContain('净含量: 5kg');
    expect(wrapper.text()).toContain('福利说明');
    expect(wrapper.text()).toContain('适合企业福利发放');

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
    expect(wrapper.text()).toContain('暂无已通过商品');
  });

  it('publishes products only after approval from the approved review queue', async () => {
    let pendingLoads = 0;
    let approvedLoads = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
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
        if (url.includes('/products/review-queue')) {
          if (url.includes('status=approved')) {
            approvedLoads += 1;
            return response({
              status: 'approved',
              items: [{ ...reviewQueueResponse.items[0], status: 'approved' }]
            });
          }
          pendingLoads += 1;
          return response(pendingLoads === 1 ? reviewQueueResponse : { status: 'pending_review', items: [] });
        }
        if (url.includes('/settlements/merchant-statements')) {
          return response({ statements: [] });
        }
        if (url.includes('/orders/admin/inventory-stocks')) {
          return response({ stocks: [] });
        }
        if (url.includes('/orders/admin/inventory-reservations')) {
          return response({ reservations: [] });
        }
        if (url.includes('/orders/admin')) {
          return response({ orders: [] });
        }
        throw new Error(`Unexpected request: ${url}`);
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    expect(findButton(wrapper, '发布商品池')).toBeUndefined();

    await clickButton(wrapper, '通过审核');
    await flushPromises();

    expect(approvedLoads).toBe(1);
    expect(requestUrls()).toContain('http://localhost:3000/api/products/review-queue?status=approved');
    expect(wrapper.text()).toContain('已通过');

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
    expect(wrapper.text()).toContain('暂无已驳回商品');
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
    expect(JSON.parse(String(generateCall?.[1]?.body))).toEqual({ merchantId: 'merchant-local-review' });
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

  it('filters admin settlement statements by status and merchant from visible controls', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await setFieldValue(wrapper, '结算商户ID', 'merchant-001');
    await clickButton(wrapper, '已打款');
    await flushPromises();

    expect(requestUrls()).toContain('http://localhost:3000/api/settlements/merchant-statements?merchantId=merchant-001&status=paid_offline');
  });

  it('exports currently loaded admin settlement statements as csv', async () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const createObjectURL = vi.fn((blob: Blob) => {
      expect(blob).toBeInstanceOf(Blob);
      return 'blob:admin-settlements';
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
      const blob = firstCreateObjectURLCall![0];
      const csv = await readBlobText(blob);
      expect(csv).toContain('MSS-20260606-001');
      expect(csv).toContain('merchant-001');
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:admin-settlements');
    } finally {
      Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectURL });
      Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevokeObjectURL });
    }
  });

  it('filters admin orders by order status, fulfillment progress, merchant, and task number', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await setFieldValue(wrapper, '商户ID', 'merchant-001');
    await setFieldValue(wrapper, '任务号', 'FT-001');
    await clickButton(wrapper, '已支付');
    await flushPromises();
    await clickButton(wrapper, '待履约');
    await flushPromises();

    expect(requestUrls()).toContain(
      'http://localhost:3000/api/orders/admin?status=paid&merchantId=merchant-001&taskNo=FT-001'
    );
    expect(requestUrls()).toContain(
      'http://localhost:3000/api/orders/admin?status=paid&fulfillmentStatus=pending&merchantId=merchant-001&taskNo=FT-001'
    );
  });

  it('renders and filters cancelled admin orders with a business status label', async () => {
    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('ORDER-20260603-CANCELLED');
    expect(wrapper.text()).toContain('已取消');
    expect(wrapper.text()).not.toContain('cancelled履约');

    await clickButton(wrapper, '已取消');
    await flushPromises();

    expect(requestUrls()).toContain('http://localhost:3000/api/orders/admin?status=cancelled');
  });

  it('renders fulfillment task details on admin order cards', async () => {
    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('履约任务');
    expect(wrapper.text()).toContain('FT-001');
    expect(wrapper.text()).toContain('merchant-001');
    expect(wrapper.text()).toContain('待履约');
  });

  it('renders pickup codes on admin fulfillment task details', async () => {
    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('取货码');
    expect(wrapper.text()).toContain('WM_PICKUP:FT-001');
  });

  it('filters admin inventory reservations and stock balances from visible controls', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await setFieldValue(wrapper, '预占商户ID', 'merchant-001');
    await setFieldValue(wrapper, '预占订单号', 'ORDER-20260603-001');
    await clickButton(wrapper, '释放记录');
    await flushPromises();

    await setFieldValue(wrapper, '库存商户ID', 'merchant-001');
    await setFieldValue(wrapper, '商品ID', 'product-001');
    await setFieldValue(wrapper, 'SKU ID', 'sku-001');
    await clickButton(wrapper, '查询库存');
    await flushPromises();

    expect(requestUrls()).toContain(
      'http://localhost:3000/api/orders/admin/inventory-reservations?status=released&merchantId=merchant-001&orderNo=ORDER-20260603-001'
    );
    expect(requestUrls()).toContain(
      'http://localhost:3000/api/orders/admin/inventory-stocks?merchantId=merchant-001&productId=product-001&skuId=sku-001'
    );
  });

  it('confirms a pending order payment from the Vue order panel', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await clickButton(wrapper, '确认支付');
    await flushPromises();

    const callbackCall = findRequest('/orders/payments/callbacks');
    expect(callbackCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(callbackCall?.[1]?.body))).toEqual({
      providerEventId: 'LOCAL-PAYMENT-ORDER-20260603-PENDING',
      paymentNo: 'PAY-20260603-PENDING',
      providerPaymentNo: 'LOCAL-PROVIDER-PAY-20260603-PENDING',
      status: 'paid',
      paidAt: '2026-06-06T08:10:00.000Z',
      payload: { source: 'admin-vue-local' }
    });
    expect(wrapper.text()).toContain('ORDER-20260603-PENDING 已确认支付成功');
    expect(wrapper.text()).toContain('暂无订单');
  });

  it('requests a refund for a paid order from the Vue order panel', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await clickButton(wrapper, '提交退款');
    await flushPromises();

    const refundCall = findRequest('/orders/refunds');
    expect(refundCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(refundCall?.[1]?.body))).toEqual({
      requestId: 'LOCAL-REFUND-ORDER-20260603-001',
      paymentNo: 'PAY-20260603-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      refundAmount: 13980,
      reason: 'after_sale'
    });
    expect(wrapper.text()).toContain('ORDER-20260603-001 已提交退款申请 REF-20260603-NEW');
  });

  it('confirms a processing refund from the Vue order panel', async () => {
    const wrapper = mount(App);
    await flushPromises();

    await clickButton(wrapper, '确认退款');
    await flushPromises();

    const callbackCall = findRequest('/orders/refunds/callbacks');
    expect(callbackCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(callbackCall?.[1]?.body))).toEqual({
      providerEventId: 'LOCAL-REFUND-CALLBACK-ORDER-20260603-REFUND',
      refundNo: 'REF-20260603-001',
      providerRefundNo: 'LOCAL-PROVIDER-REF-20260603-001',
      status: 'succeeded',
      succeededAt: '2026-06-06T08:20:00.000Z',
      payload: { source: 'admin-vue-local' }
    });
    expect(wrapper.text()).toContain('ORDER-20260603-REFUND 已确认退款成功');
  });
});

function response(body: unknown) {
  return {
    ok: true,
    json: async () => body
  } as Response;
}

function installLocalStorageMock() {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => store.set(key, String(value))),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear())
  });
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

async function setFieldValue(wrapper: ReturnType<typeof mount>, label: string, value: string) {
  const labelWrapper = wrapper.findAll('label').find((candidate) => candidate.text().includes(label));
  expect(labelWrapper, `field ${label}`).toBeTruthy();
  const control = labelWrapper!.find('input,textarea');
  expect(control.exists(), `control ${label}`).toBe(true);
  await control.setValue(value);
}

function readBlobText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

function findButton(wrapper: ReturnType<typeof mount>, text: string) {
  return wrapper.findAll('button').find((candidate) => candidate.text() === text);
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
  await nextTick();
}
