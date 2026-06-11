import { flushPromises, mount } from '@vue/test-utils';
import App from './App.vue';

const catalogResponse = {
  productPools: [
    {
      id: 'pool-local-review',
      code: 'FRANCHISE-franchise-local-review-DEFAULT',
      name: '默认商品池',
      status: 'active',
      franchiseId: 'franchise-local-review',
      items: [
        {
          id: 'pool-item-local-review',
          productId: 'product-local-review',
          skuId: 'sku-local-review-5kg',
          sortOrder: 0,
          displayName: '本地审核五常大米福利装',
          displaySkuCode: 'SKU-LOCAL-REVIEW-5KG',
          displayPriceAmount: 6990,
          displayImageUrl: 'https://img.example.com/local-review/rice-main.jpg'
        }
      ]
    }
  ]
};

const detailResponse = {
  id: 'pool-item-local-review',
  productPoolId: 'pool-local-review',
  productId: 'product-local-review',
  skuId: 'sku-local-review-5kg',
  sortOrder: 0,
  displayName: '本地审核五常大米福利装',
  displaySkuCode: 'SKU-LOCAL-REVIEW-5KG',
  displayPriceAmount: 6990,
  displayImageUrl: 'https://img.example.com/local-review/rice-main.jpg',
  product: {
    merchantId: 'merchant-local-review',
    code: 'P-LOCAL-REVIEW',
    name: '本地审核五常大米福利装',
    origin: { country: '中国', province: '黑龙江', city: '哈尔滨', description: '五常核心产区' },
    brand: { id: 'brand-local', code: 'wuchang', name: '五常香米' },
    category: { id: 'category-grain', code: 'grain', name: '粮油副食' },
    media: [{ type: 'main_image', url: 'https://img.example.com/local-review/rice-main.jpg', sortOrder: 1 }],
    qualifications: [{ type: 'origin_certificate', title: '产地证明', certificateNo: 'CERT-LOCAL-001', fileUrl: null }],
    parameters: [{ groupName: '基础参数', name: '净含量', value: '5kg', valueType: 'text', sortOrder: 1 }],
    detailSections: [{ type: 'text', title: '福利说明', content: '适合企业福利发放', sortOrder: 1 }]
  },
  sku: {
    code: 'SKU-LOCAL-REVIEW-5KG',
    priceAmount: 6990,
    marketPriceAmount: 7990,
    specText: '规格: 5kg'
  }
};

const orderListResponse = {
  orders: [
    {
      id: 'order-local-001',
      orderNo: 'ORDER-20260607-PORTAL',
      requestId: 'portal-checkout-pool-item-local-review-001',
      buyerUserId: 'user-001',
      status: 'pending_payment',
      subtotalAmount: 6990,
      discountAmount: 0,
      totalAmount: 6990,
      welfareCardPayableAmount: 0,
      cashPayableAmount: 6990,
      fulfillmentType: 'delivery',
      receiverName: '本地用户',
      receiverPhone: '13800000000',
      receiverAddress: '本地联调地址',
      pickupStoreName: null,
      salesFranchiseId: 'franchise-local-review',
      salesFranchiseName: '本地福利卡中心',
      fulfillmentMerchantId: 'merchant-local-review',
      fulfillmentMerchantName: '本地优选商户',
      fulfillmentMerchantAddress: '上海市浦东新区本地联调路 88 号',
      createdAt: '2026-06-07T00:00:00.000Z',
      updatedAt: '2026-06-07T00:00:00.000Z',
      latestPayment: null,
      latestRefund: null,
      lines: [
        {
          id: 'order-line-local-001',
          orderId: 'order-local-001',
          productPoolItemId: 'pool-item-local-review',
          productId: 'product-local-review',
          merchantId: 'merchant-local-review',
          skuId: 'sku-local-review-5kg',
          displayName: '本地审核五常大米福利装',
          displaySkuCode: 'SKU-LOCAL-REVIEW-5KG',
          displayImageUrl: 'https://img.example.com/local-review/rice-main.jpg',
          unitPriceAmount: 6990,
          quantity: 1,
          lineTotalAmount: 6990,
          createdAt: '2026-06-07T00:00:00.000Z'
        }
      ]
    }
  ]
};

const orderDetailResponse = {
  order: orderListResponse.orders[0]
};

const legacyOrderListResponse = {
  orders: [
    {
      ...orderListResponse.orders[0],
      salesFranchiseId: null,
      salesFranchiseName: null,
      fulfillmentMerchantId: null,
      fulfillmentMerchantName: null,
      fulfillmentMerchantAddress: null
    }
  ]
};

const mixedPaymentOrder = {
  ...orderListResponse.orders[0],
  totalAmount: 6990,
  welfareCardPayableAmount: 1000,
  cashPayableAmount: 5990
};

const mixedPaymentOrderListResponse = {
  orders: [mixedPaymentOrder]
};

const mixedPaymentOrderDetailResponse = {
  order: mixedPaymentOrder
};

const cancelledOrderResponse = {
  order: {
    ...orderListResponse.orders[0],
    status: 'cancelled',
    updatedAt: '2026-06-07T00:05:00.000Z'
  }
};

const cancelledOrderListResponse = {
  orders: [cancelledOrderResponse.order]
};

const latestPaymentResponse = {
  id: 'payment-local-latest',
  paymentNo: 'PAY-20260607-LATEST',
  requestId: 'portal-payment-ORDER-20260607-PORTAL-latest',
  orderNo: 'ORDER-20260607-PORTAL',
  status: 'pending',
  channel: 'wechat',
  totalAmount: 6990,
  welfareCardPayableAmount: 0,
  cashPayableAmount: 6990,
  providerPaymentNo: null,
  paidAt: null,
  createdAt: '2026-06-07T00:01:00.000Z',
  updatedAt: '2026-06-07T00:01:00.000Z'
};

const paidLatestPaymentResponse = {
  ...latestPaymentResponse,
  status: 'paid',
  providerPaymentNo: 'LOCAL-PORTAL-PROVIDER-PAY-20260607-LATEST',
  paidAt: '2026-06-08T00:00:00.000Z',
  updatedAt: '2026-06-08T00:00:00.000Z'
};

const orderListWithLatestPaymentResponse = {
  orders: [{ ...orderListResponse.orders[0], latestPayment: latestPaymentResponse }]
};

const orderDetailWithLatestPaymentResponse = {
  order: orderListWithLatestPaymentResponse.orders[0]
};

const paidOrderListResponse = {
  orders: [{ ...orderListResponse.orders[0], status: 'paid', latestPayment: paidLatestPaymentResponse }]
};

const paidOrderDetailResponse = {
  order: paidOrderListResponse.orders[0]
};

const paidAlipayLatestPaymentResponse = {
  ...paidLatestPaymentResponse,
  channel: 'alipay'
};

const paidAlipayOrderListResponse = {
  orders: [{ ...orderListResponse.orders[0], status: 'paid', latestPayment: paidAlipayLatestPaymentResponse }]
};

const paidAlipayOrderDetailResponse = {
  order: paidAlipayOrderListResponse.orders[0]
};

const paidOrderWithFulfillmentResponse = {
  order: {
    ...paidOrderListResponse.orders[0],
    fulfillmentSummary: {
      totalTasks: 1,
      pendingTasks: 1,
      completedTasks: 0,
      taskNos: ['FT-ORDER-20260607-PORTAL-MERCHANT-LOCAL-REVIEW-001']
    },
    fulfillmentTasks: [
      {
        taskNo: 'FT-ORDER-20260607-PORTAL-MERCHANT-LOCAL-REVIEW-001',
        merchantId: 'merchant-local-review',
        status: 'pending',
        createdAt: '2026-06-08T00:10:00.000Z',
        completedAt: null
      }
    ]
  }
};

const pickupOrderListResponse = {
  orders: [
    {
      ...orderListResponse.orders[0],
      id: 'order-local-pickup-001',
      orderNo: 'ORDER-20260607-PICKUP',
      requestId: 'portal-checkout-pickup-001',
      status: 'paid',
      fulfillmentType: 'pickup',
      receiverAddress: null,
      pickupStoreName: '本地自提点',
      latestPayment: paidLatestPaymentResponse
    }
  ]
};

const pickupOrderDetailResponse = {
  order: {
    ...pickupOrderListResponse.orders[0],
    pickupCode: 'WM_PICKUP:FT-ORDER-PORTAL-PICKUP-001'
  }
};

const paymentResponse = {
  idempotentReplay: false,
  payment: {
    paymentNo: 'PAY-20260607-PORTAL',
    requestId: 'portal-payment-ORDER-20260607-PORTAL-001',
    orderNo: 'ORDER-20260607-PORTAL',
    status: 'pending',
    channel: 'wechat',
    totalAmount: 6990,
    welfareCardPayableAmount: 0,
    cashPayableAmount: 6990,
    providerPaymentNo: null
  }
};

const alipayPaymentResponse = {
  idempotentReplay: false,
  payment: {
    ...paymentResponse.payment,
    channel: 'alipay',
    welfareCardPayableAmount: 1000,
    cashPayableAmount: 5990
  }
};

const paymentCallbackResponse = {
  duplicate: false,
  payment: {
    paymentNo: 'PAY-20260607-LATEST',
    status: 'paid',
    providerPaymentNo: 'LOCAL-PORTAL-PROVIDER-PAY-20260607-LATEST'
  },
  callback: {
    providerEventId: 'LOCAL-PORTAL-PAYMENT-ORDER-20260607-PORTAL',
    status: 'paid'
  }
};

const refundResponse = {
  idempotentReplay: false,
  refund: {
    refundNo: 'REF-20260607-PORTAL',
    requestId: 'portal-refund-ORDER-20260607-PORTAL-001',
    paymentNo: 'PAY-20260607-LATEST',
    orderNo: 'ORDER-20260607-PORTAL',
    channel: 'wechat',
    status: 'processing',
    refundAmount: 6990,
    reason: 'after_sale',
    providerRefundNo: null
  }
};

const refundProcessingOrder = {
  ...paidOrderListResponse.orders[0],
  status: 'refund_processing',
  latestRefund: refundResponse.refund
};

const refundProcessingOrderListResponse = {
  orders: [refundProcessingOrder]
};

const refundProcessingOrderDetailResponse = {
  order: refundProcessingOrder
};

const refundCallbackResponse = {
  duplicate: false,
  refund: {
    ...refundResponse.refund,
    status: 'succeeded',
    providerRefundNo: 'LOCAL-PORTAL-PROVIDER-REF-20260607-PORTAL'
  },
  callback: {
    providerEventId: 'LOCAL-PORTAL-REFUND-ORDER-20260607-PORTAL',
    status: 'succeeded'
  }
};

const refundedOrder = {
  ...refundProcessingOrder,
  status: 'refunded',
  latestRefund: refundCallbackResponse.refund
};

const refundedOrderListResponse = {
  orders: [refundedOrder]
};

const refundedOrderDetailResponse = {
  order: refundedOrder
};

describe('Portal product pool catalog', () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.setItem('welfareMallPortalAccessToken', 'buyer-token-local');
    localStorage.setItem(
      'welfareMallPortalUser',
      JSON.stringify({ username: 'buyer-local', displayName: '本地用户', subjectType: 'buyer', subjectId: 'user-001' })
    );
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('requires buyer login before loading the Portal catalog', async () => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/auth/login')) {
          return response({
            tokenType: 'Bearer',
            accessToken: 'buyer-token-001',
            expiresIn: 3600,
            user: { username: 'buyer-local', displayName: '本地用户', subjectType: 'buyer', subjectId: 'user-001' }
          });
        }
        if (url.includes('/product-pools/catalog')) {
          return response(catalogResponse);
        }
        if (url.includes('/orders?buyerUserId=user-001')) {
          return response(orderListResponse);
        }

        return response({});
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('用户登录');
    expect(wrapper.text()).not.toContain('企业福利商品目录');
    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('/product-pools/catalog'));

    await wrapper.get('input[aria-label="账号"]').setValue('buyer-local');
    await wrapper.get('input[aria-label="密码"]').setValue('local-dev-password');
    await wrapper.get('button[aria-label="登录用户端"]').trigger('click');
    await flushPromises();

    expect(localStorage.getItem('welfareMallPortalAccessToken')).toBe('buyer-token-001');
    expect(wrapper.text()).toContain('本地用户');
    expect(wrapper.text()).toContain('企业福利商品目录');
  });

  it('returns to buyer login when the stored Portal token is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/orders?buyerUserId=user-001')) {
          return {
            ok: false,
            status: 401,
            json: async () => ({ message: 'Unauthorized' })
          } as Response;
        }

        return response(catalogResponse);
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    expect(localStorage.removeItem).toHaveBeenCalledWith('welfareMallPortalAccessToken');
    expect(localStorage.removeItem).toHaveBeenCalledWith('welfareMallPortalUser');
    expect(wrapper.text()).toContain('用户登录');
    expect(wrapper.text()).not.toContain('我的订单');
  });

  it('uses the authenticated buyer subject for order reads and checkout', async () => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/auth/login')) {
          return response({
            tokenType: 'Bearer',
            accessToken: 'buyer-token-999',
            expiresIn: 3600,
            user: {
              username: 'buyer-auth',
              displayName: '授权用户',
              subjectType: 'buyer',
              subjectId: 'buyer-auth-999'
            }
          });
        }
        if (url.includes('/product-pools/catalog')) {
          return response(catalogResponse);
        }
        if (url.endsWith('/product-pools/items/pool-item-local-review')) {
          return response(detailResponse);
        }
        if (url.endsWith('/orders?buyerUserId=buyer-auth-999')) {
          return response({ orders: [] });
        }
        if (url.endsWith('/orders')) {
          return response({
            idempotentReplay: false,
            order: {
              orderNo: 'ORDER-AUTH-BUYER-999',
              status: 'pending_payment',
              totalAmount: 6990,
              welfareCardPayableAmount: 0,
              cashPayableAmount: 6990
            }
          });
        }

        return {
          ok: false,
          json: async () => ({ message: `unexpected ${url}` })
        } as Response;
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('input[aria-label="账号"]').setValue('buyer-auth');
    await wrapper.get('input[aria-label="密码"]').setValue('local-dev-password');
    await wrapper.get('button[aria-label="登录用户端"]').trigger('click');
    await flushPromises();
    await wrapper.get('button[aria-label="查看 本地审核五常大米福利装 详情"]').trigger('click');
    await flushPromises();
    await wrapper.get('button[aria-label="为 本地审核五常大米福利装 创建订单"]').trigger('click');
    await flushPromises();

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders?buyerUserId=buyer-auth-999', {
      headers: { Authorization: 'Bearer buyer-token-999' }
    });
    const checkoutCall = vi.mocked(fetch).mock.calls.find(([input]) => String(input).endsWith('/orders'));
    expect(JSON.parse(String(checkoutCall?.[1]?.body))).toMatchObject({
      buyerUserId: 'buyer-auth-999'
    });
    expect(checkoutCall?.[1]).toMatchObject({
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer buyer-token-999' }
    });
  });

  it('loads and renders product pool item snapshots', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => catalogResponse
      }))
    );

    const wrapper = mount(App);
    await flushPromises();

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/product-pools/catalog');
    expect(wrapper.text()).toContain('默认商品池');
    expect(wrapper.text()).toContain('本地审核五常大米福利装');
    expect(wrapper.text()).toContain('SKU-LOCAL-REVIEW-5KG');
    expect(wrapper.text()).toContain('¥69.90');
  });

  it('renders an empty state when no pool items exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ productPools: [{ ...catalogResponse.productPools[0], items: [] }] })
      }))
    );

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('暂无可展示商品');
  });

  it('opens a product detail panel from a catalog card', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/product-pools/items/pool-item-local-review')) {
          return {
            ok: true,
            json: async () => detailResponse
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('button[aria-label="查看 本地审核五常大米福利装 详情"]').trigger('click');
    await flushPromises();

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/product-pools/items/pool-item-local-review');
    expect(wrapper.text()).toContain('P-LOCAL-REVIEW');
    expect(wrapper.text()).toContain('履约商户');
    expect(wrapper.text()).toContain('merchant-local-review');
    expect(wrapper.text()).toContain('五常香米');
    expect(wrapper.text()).toContain('粮油副食');
    expect(wrapper.text()).toContain('五常核心产区');
    expect(wrapper.text()).toContain('净含量');
    expect(wrapper.text()).toContain('5kg');
    expect(wrapper.text()).toContain('产地证明');
    expect(wrapper.text()).toContain('福利说明');
    expect(wrapper.text()).toContain('适合企业福利发放');
  });

  it('creates a local checkout order from the product detail panel', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/product-pools/items/pool-item-local-review')) {
          return {
            ok: true,
            json: async () => detailResponse
          };
        }

        if (url.endsWith('/orders')) {
          return {
            ok: true,
            json: async () => ({
              idempotentReplay: false,
              order: {
                orderNo: 'ORDER-20260607-PORTAL',
                status: 'pending_payment',
                totalAmount: 6990,
                welfareCardPayableAmount: 0,
                cashPayableAmount: 6990
              }
            })
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('button[aria-label="查看 本地审核五常大米福利装 详情"]').trigger('click');
    await flushPromises();
    await wrapper.get('button[aria-label="为 本地审核五常大米福利装 创建订单"]').trigger('click');
    await flushPromises();

    const checkoutCall = vi.mocked(fetch).mock.calls.find(([input]) => String(input).endsWith('/orders'));
    expect(checkoutCall).toBeTruthy();
    expect(checkoutCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(checkoutCall?.[1]?.body))).toMatchObject({
      buyerUserId: 'user-001',
      items: [{ productPoolItemId: 'pool-item-local-review', quantity: 1 }],
      welfareCardPaymentAmount: 0,
      fulfillment: {
        type: 'delivery',
        receiverName: '本地用户',
        receiverPhone: '13800000000',
        receiverAddress: '本地联调地址'
      }
    });
    expect(JSON.parse(String(checkoutCall?.[1]?.body)).requestId).toContain('portal-checkout-pool-item-local-review-');
    expect(wrapper.text()).toContain('订单创建成功');
    expect(wrapper.text()).toContain('ORDER-20260607-PORTAL');
    expect(wrapper.text()).toContain('待支付');
  });

  it('opens the newly created checkout order detail from the checkout result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/product-pools/items/pool-item-local-review')) {
          return {
            ok: true,
            json: async () => detailResponse
          };
        }

        if (url.endsWith('/orders/ORDER-20260607-PORTAL?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => orderDetailResponse
          };
        }

        if (url.endsWith('/orders')) {
          return {
            ok: true,
            json: async () => ({
              idempotentReplay: false,
              order: {
                orderNo: 'ORDER-20260607-PORTAL',
                status: 'pending_payment',
                totalAmount: 6990,
                welfareCardPayableAmount: 0,
                cashPayableAmount: 6990
              }
            })
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('button[aria-label="查看 本地审核五常大米福利装 详情"]').trigger('click');
    await flushPromises();
    await wrapper.get('button[aria-label="为 本地审核五常大米福利装 创建订单"]').trigger('click');
    await flushPromises();
    await wrapper.get('button[aria-label="查看订单 ORDER-20260607-PORTAL 详情并支付"]').trigger('click');
    await flushPromises();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/orders/ORDER-20260607-PORTAL?buyerUserId=user-001',
      { headers: { Authorization: 'Bearer buyer-token-local' } }
    );
    expect(wrapper.text()).toContain('订单详情');
    expect(wrapper.text()).toContain('ORDER-20260607-PORTAL');
    expect(wrapper.text()).toContain('发起支付');
  });

  it('creates a local pickup checkout order from the product detail panel', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/product-pools/items/pool-item-local-review')) {
          return {
            ok: true,
            json: async () => detailResponse
          };
        }

        if (url.endsWith('/orders')) {
          return {
            ok: true,
            json: async () => ({
              idempotentReplay: false,
              order: {
                orderNo: 'ORDER-20260608-PORTAL-PICKUP',
                status: 'pending_payment',
                totalAmount: 6990,
                welfareCardPayableAmount: 0,
                cashPayableAmount: 6990
              }
            })
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('button[aria-label="查看 本地审核五常大米福利装 详情"]').trigger('click');
    await flushPromises();
    await wrapper.get('button[aria-label="选择商户自提履约方式"]').trigger('click');
    await wrapper.get('button[aria-label="为 本地审核五常大米福利装 创建订单"]').trigger('click');
    await flushPromises();

    const checkoutCall = vi.mocked(fetch).mock.calls.find(([input]) => String(input).endsWith('/orders'));
    const checkoutBody = JSON.parse(String(checkoutCall?.[1]?.body));
    expect(checkoutBody).toMatchObject({
      buyerUserId: 'user-001',
      items: [{ productPoolItemId: 'pool-item-local-review', quantity: 1 }],
      welfareCardPaymentAmount: 0,
      fulfillment: {
        type: 'pickup'
      }
    });
    expect(checkoutBody.fulfillment).not.toHaveProperty('pickupStoreName');
    expect(wrapper.text()).toContain('商户自提');
    expect(wrapper.text()).toContain('merchant-local-review');
    expect(wrapper.text()).not.toContain('门店自提');
    expect(wrapper.text()).toContain('ORDER-20260608-PORTAL-PICKUP');
  });

  it('loads local buyer orders alongside the catalog', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/orders?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => orderListResponse
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders?buyerUserId=user-001', {
      headers: { Authorization: 'Bearer buyer-token-local' }
    });
    expect(wrapper.text()).toContain('我的订单');
    expect(wrapper.text()).toContain('ORDER-20260607-PORTAL');
    expect(wrapper.text()).toContain('待支付');
    expect(wrapper.text()).toContain('¥69.90');
    expect(wrapper.text()).toContain('销售加盟商 本地福利卡中心');
    expect(wrapper.text()).toContain('履约商户');
    expect(wrapper.text()).toContain('本地优选商户');
    expect(wrapper.text()).not.toContain('履约商户 merchant-local-review');
  });

  it('does not expose internal merchant IDs for legacy orders without snapshots', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/orders?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => legacyOrderListResponse
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('销售加盟商 待确认');
    expect(wrapper.text()).toContain('履约商户 待确认');
    expect(wrapper.text()).not.toContain('merchant-local-review');
  });

  it('opens a local buyer order detail from the order list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/orders/ORDER-20260607-PORTAL?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => orderDetailResponse
          };
        }

        if (url.endsWith('/orders?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => orderListResponse
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('button[aria-label="查看订单 ORDER-20260607-PORTAL 详情"]').trigger('click');
    await flushPromises();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/orders/ORDER-20260607-PORTAL?buyerUserId=user-001',
      { headers: { Authorization: 'Bearer buyer-token-local' } }
    );
    expect(wrapper.text()).toContain('订单详情');
    expect(wrapper.text()).toContain('本地审核五常大米福利装');
    expect(wrapper.text()).toContain('SKU-LOCAL-REVIEW-5KG');
    expect(wrapper.text()).toContain('本地用户');
    expect(wrapper.text()).toContain('本地联调地址');
    expect(wrapper.text()).toContain('销售加盟商');
    expect(wrapper.text()).toContain('本地福利卡中心');
    expect(wrapper.text()).toContain('履约商户');
    expect(wrapper.text()).toContain('本地优选商户');
    expect(wrapper.text()).toContain('履约地址');
    expect(wrapper.text()).toContain('上海市浦东新区本地联调路 88 号');
    expect(wrapper.text()).not.toContain('履约商户 merchant-local-review');
    expect(wrapper.text()).toContain('¥69.90');
  });

  it('creates a WeChat payment from a pending order detail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/orders/payments')) {
          return {
            ok: true,
            json: async () => paymentResponse
          };
        }

        if (url.endsWith('/orders/ORDER-20260607-PORTAL?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => orderDetailResponse
          };
        }

        if (url.endsWith('/orders?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => orderListResponse
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('button[aria-label="查看订单 ORDER-20260607-PORTAL 详情"]').trigger('click');
    await flushPromises();
    await wrapper.get('button[aria-label="为订单 ORDER-20260607-PORTAL 发起支付"]').trigger('click');
    await flushPromises();

    const paymentCall = vi.mocked(fetch).mock.calls.find(([input]) => String(input).endsWith('/orders/payments'));
    expect(paymentCall).toBeTruthy();
    expect(paymentCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(paymentCall?.[1]?.body))).toMatchObject({
      orderNo: 'ORDER-20260607-PORTAL',
      channel: 'wechat',
      totalAmount: 6990,
      welfareCardPayableAmount: 0,
      cashPayableAmount: 6990
    });
    expect(JSON.parse(String(paymentCall?.[1]?.body)).requestId).toContain('portal-payment-ORDER-20260607-PORTAL-');
    expect(wrapper.text()).toContain('支付单创建成功');
    expect(wrapper.text()).toContain('PAY-20260607-PORTAL');
    expect(wrapper.text()).toContain('微信支付');
    expect(wrapper.text()).toContain('待支付');
  });

  it('creates an Alipay online remainder payment while showing welfare-card debit separately', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/orders/payments')) {
          return {
            ok: true,
            json: async () => alipayPaymentResponse
          };
        }

        if (url.endsWith('/orders/ORDER-20260607-PORTAL?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => mixedPaymentOrderDetailResponse
          };
        }

        if (url.endsWith('/orders?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => mixedPaymentOrderListResponse
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('button[aria-label="查看订单 ORDER-20260607-PORTAL 详情"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('福利卡抵扣 ¥10.00');
    expect(wrapper.text()).toContain('线上补差 ¥59.90');
    expect(wrapper.text()).not.toContain('现金');

    await wrapper.get('button[aria-label="选择支付宝支付渠道"]').trigger('click');
    await wrapper.get('button[aria-label="为订单 ORDER-20260607-PORTAL 发起支付"]').trigger('click');
    await flushPromises();

    const paymentCall = vi.mocked(fetch).mock.calls.find(([input]) => String(input).endsWith('/orders/payments'));
    expect(paymentCall).toBeTruthy();
    expect(JSON.parse(String(paymentCall?.[1]?.body))).toMatchObject({
      orderNo: 'ORDER-20260607-PORTAL',
      channel: 'alipay',
      totalAmount: 6990,
      welfareCardPayableAmount: 1000,
      cashPayableAmount: 5990
    });
    expect(wrapper.text()).toContain('支付单创建成功');
    expect(wrapper.text()).toContain('支付宝 · 待支付');
  });

  it('cancels a pending buyer order from the order detail panel', async () => {
    let ordersRequestCount = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/orders/ORDER-20260607-PORTAL/cancel')) {
          return {
            ok: true,
            json: async () => cancelledOrderResponse
          };
        }

        if (url.endsWith('/orders/ORDER-20260607-PORTAL?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => orderDetailResponse
          };
        }

        if (url.endsWith('/orders?buyerUserId=user-001')) {
          ordersRequestCount += 1;
          return {
            ok: true,
            json: async () => (ordersRequestCount > 1 ? cancelledOrderListResponse : orderListResponse)
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('button[aria-label="查看订单 ORDER-20260607-PORTAL 详情"]').trigger('click');
    await flushPromises();
    await wrapper.get('button[aria-label="取消订单 ORDER-20260607-PORTAL"]').trigger('click');
    await flushPromises();

    const cancelCall = vi
      .mocked(fetch)
      .mock.calls.find(([input]) => String(input).endsWith('/orders/ORDER-20260607-PORTAL/cancel'));
    expect(cancelCall).toBeTruthy();
    expect(cancelCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(cancelCall?.[1]?.body))).toEqual({
      buyerUserId: 'user-001',
      reason: 'user_cancel'
    });
    expect(ordersRequestCount).toBe(2);
    expect(wrapper.text()).toContain('订单已取消');
    expect(wrapper.text()).toContain('已取消');
    expect(wrapper.find('button[aria-label="取消订单 ORDER-20260607-PORTAL"]').exists()).toBe(false);
  });

  it('renders persisted latest payment on order list and detail reads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/orders/ORDER-20260607-PORTAL?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => orderDetailWithLatestPaymentResponse
          };
        }

        if (url.endsWith('/orders?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => orderListWithLatestPaymentResponse
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('最近支付');
    expect(wrapper.text()).toContain('PAY-20260607-LATEST');
    expect(wrapper.text()).toContain('微信支付 · 待支付');

    await wrapper.get('button[aria-label="查看订单 ORDER-20260607-PORTAL 详情"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('订单详情');
    expect(wrapper.text()).toContain('最近支付');
    expect(wrapper.text()).toContain('PAY-20260607-LATEST');
    expect(wrapper.text()).toContain('微信支付 · 待支付');
  });

  it('does not offer a second payment creation action when latest payment is pending', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/orders/ORDER-20260607-PORTAL?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => orderDetailWithLatestPaymentResponse
          };
        }

        if (url.endsWith('/orders?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => orderListWithLatestPaymentResponse
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('button[aria-label="查看订单 ORDER-20260607-PORTAL 详情"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('确认支付成功');
    expect(wrapper.find('button[aria-label="为订单 ORDER-20260607-PORTAL 发起支付"]').exists()).toBe(false);
  });

  it('confirms a persisted local payment as paid and refreshes order reads', async () => {
    let ordersRequestCount = 0;
    let detailRequestCount = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/orders/payments/callbacks')) {
          return {
            ok: true,
            json: async () => paymentCallbackResponse
          };
        }

        if (url.endsWith('/orders/ORDER-20260607-PORTAL?buyerUserId=user-001')) {
          detailRequestCount += 1;
          return {
            ok: true,
            json: async () => (detailRequestCount > 1 ? paidOrderDetailResponse : orderDetailWithLatestPaymentResponse)
          };
        }

        if (url.endsWith('/orders?buyerUserId=user-001')) {
          ordersRequestCount += 1;
          return {
            ok: true,
            json: async () => (ordersRequestCount > 1 ? paidOrderListResponse : orderListWithLatestPaymentResponse)
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('button[aria-label="查看订单 ORDER-20260607-PORTAL 详情"]').trigger('click');
    await flushPromises();
    await wrapper.get('button[aria-label="确认支付单 PAY-20260607-LATEST 支付成功"]').trigger('click');
    await flushPromises();

    const callbackCall = vi
      .mocked(fetch)
      .mock.calls.find(([input]) => String(input).endsWith('/orders/payments/callbacks'));
    expect(callbackCall).toBeTruthy();
    expect(callbackCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const callbackBody = JSON.parse(String(callbackCall?.[1]?.body));
    expect(callbackBody).toMatchObject({
      providerEventId: 'LOCAL-PORTAL-PAYMENT-ORDER-20260607-PORTAL',
      paymentNo: 'PAY-20260607-LATEST',
      providerPaymentNo: 'LOCAL-PORTAL-PROVIDER-PAY-20260607-LATEST',
      status: 'paid',
      payload: { source: 'portal-local-payment' }
    });
    expect(callbackBody.paidAt).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/));
    expect(ordersRequestCount).toBe(2);
    expect(detailRequestCount).toBe(2);
    expect(wrapper.text()).toContain('支付已确认');
    expect(wrapper.text()).toContain('PAY-20260607-LATEST');
    expect(wrapper.text()).toContain('微信支付 · 已支付');
    expect(wrapper.text()).toContain('已支付');
  });

  it('creates a full refund request from a paid buyer order detail', async () => {
    let ordersRequestCount = 0;
    let detailRequestCount = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/orders/refunds')) {
          return {
            ok: true,
            json: async () => refundResponse
          };
        }

        if (url.endsWith('/orders/ORDER-20260607-PORTAL?buyerUserId=user-001')) {
          detailRequestCount += 1;
          return {
            ok: true,
            json: async () =>
              detailRequestCount > 1 ? refundProcessingOrderDetailResponse : paidOrderDetailResponse
          };
        }

        if (url.endsWith('/orders?buyerUserId=user-001')) {
          ordersRequestCount += 1;
          return {
            ok: true,
            json: async () => (ordersRequestCount > 1 ? refundProcessingOrderListResponse : paidOrderListResponse)
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('button[aria-label="查看订单 ORDER-20260607-PORTAL 详情"]').trigger('click');
    await flushPromises();
    await wrapper.get('button[aria-label="为订单 ORDER-20260607-PORTAL 申请退款"]').trigger('click');
    await flushPromises();

    const refundCall = vi.mocked(fetch).mock.calls.find(([input]) => String(input).endsWith('/orders/refunds'));
    expect(refundCall).toBeTruthy();
    expect(refundCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const refundBody = JSON.parse(String(refundCall?.[1]?.body));
    expect(refundBody).toMatchObject({
      paymentNo: 'PAY-20260607-LATEST',
      orderNo: 'ORDER-20260607-PORTAL',
      channel: 'wechat',
      refundAmount: 6990,
      reason: 'after_sale'
    });
    expect(refundBody.requestId).toContain('portal-refund-ORDER-20260607-PORTAL-');
    expect(ordersRequestCount).toBe(2);
    expect(detailRequestCount).toBe(2);
    expect(wrapper.text()).toContain('退款申请已提交');
    expect(wrapper.text()).toContain('REF-20260607-PORTAL');
    expect(wrapper.text()).toContain('退款中');
    expect(wrapper.find('button[aria-label="为订单 ORDER-20260607-PORTAL 申请退款"]').exists()).toBe(false);
  });

  it('uses the original online payment channel when requesting a refund', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/orders/refunds')) {
          return {
            ok: true,
            json: async () => ({
              ...refundResponse,
              refund: {
                ...refundResponse.refund,
                channel: 'alipay'
              }
            })
          };
        }

        if (url.endsWith('/orders/ORDER-20260607-PORTAL?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => paidAlipayOrderDetailResponse
          };
        }

        if (url.endsWith('/orders?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => paidAlipayOrderListResponse
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('button[aria-label="查看订单 ORDER-20260607-PORTAL 详情"]').trigger('click');
    await flushPromises();
    await wrapper.get('button[aria-label="为订单 ORDER-20260607-PORTAL 申请退款"]').trigger('click');
    await flushPromises();

    const refundCall = vi.mocked(fetch).mock.calls.find(([input]) => String(input).endsWith('/orders/refunds'));
    expect(refundCall).toBeTruthy();
    expect(JSON.parse(String(refundCall?.[1]?.body))).toMatchObject({
      paymentNo: 'PAY-20260607-LATEST',
      orderNo: 'ORDER-20260607-PORTAL',
      channel: 'alipay',
      refundAmount: 6990,
      reason: 'after_sale'
    });
  });

  it('confirms a processing local refund as succeeded and refreshes order reads', async () => {
    let ordersRequestCount = 0;
    let detailRequestCount = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/orders/refunds/callbacks')) {
          return {
            ok: true,
            json: async () => refundCallbackResponse
          };
        }

        if (url.endsWith('/orders/ORDER-20260607-PORTAL?buyerUserId=user-001')) {
          detailRequestCount += 1;
          return {
            ok: true,
            json: async () => (detailRequestCount > 1 ? refundedOrderDetailResponse : refundProcessingOrderDetailResponse)
          };
        }

        if (url.endsWith('/orders?buyerUserId=user-001')) {
          ordersRequestCount += 1;
          return {
            ok: true,
            json: async () => (ordersRequestCount > 1 ? refundedOrderListResponse : refundProcessingOrderListResponse)
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('button[aria-label="查看订单 ORDER-20260607-PORTAL 详情"]').trigger('click');
    await flushPromises();
    await wrapper.get('button[aria-label="确认退款单 REF-20260607-PORTAL 退款成功"]').trigger('click');
    await flushPromises();

    const callbackCall = vi
      .mocked(fetch)
      .mock.calls.find(([input]) => String(input).endsWith('/orders/refunds/callbacks'));
    expect(callbackCall).toBeTruthy();
    expect(callbackCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const callbackBody = JSON.parse(String(callbackCall?.[1]?.body));
    expect(callbackBody).toMatchObject({
      providerEventId: 'LOCAL-PORTAL-REFUND-ORDER-20260607-PORTAL',
      refundNo: 'REF-20260607-PORTAL',
      providerRefundNo: 'LOCAL-PORTAL-PROVIDER-REF-20260607-PORTAL',
      status: 'succeeded',
      payload: { source: 'portal-local-refund' }
    });
    expect(callbackBody.succeededAt).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/));
    expect(ordersRequestCount).toBe(2);
    expect(detailRequestCount).toBe(2);
    expect(wrapper.text()).toContain('退款已确认');
    expect(wrapper.text()).toContain('退款成功');
    expect(wrapper.text()).toContain('已退款');
    expect(wrapper.find('button[aria-label="确认退款单 REF-20260607-PORTAL 退款成功"]').exists()).toBe(false);
  });

  it('renders fulfillment progress for a paid buyer order detail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/orders/ORDER-20260607-PORTAL?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => paidOrderWithFulfillmentResponse
          };
        }

        if (url.endsWith('/orders?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => paidOrderListResponse
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('button[aria-label="查看订单 ORDER-20260607-PORTAL 详情"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('履约进度');
    expect(wrapper.text()).toContain('待履约 1');
    expect(wrapper.text()).toContain('FT-ORDER-20260607-PORTAL-MERCHANT-LOCAL-REVIEW-001');
  });

  it('renders pickup code for a pickup buyer order detail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/orders/ORDER-20260607-PICKUP?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => pickupOrderDetailResponse
          };
        }

        if (url.endsWith('/orders?buyerUserId=user-001')) {
          return {
            ok: true,
            json: async () => pickupOrderListResponse
          };
        }

        return {
          ok: true,
          json: async () => catalogResponse
        };
      })
    );

    const wrapper = mount(App);
    await flushPromises();

    await wrapper.get('button[aria-label="查看订单 ORDER-20260607-PICKUP 详情"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('履约商户');
    expect(wrapper.text()).toContain('本地优选商户');
    expect(wrapper.text()).toContain('履约地址');
    expect(wrapper.text()).toContain('上海市浦东新区本地联调路 88 号');
    expect(wrapper.text()).not.toContain('履约商户 merchant-local-review');
    expect(wrapper.text()).not.toContain('本地自提点');
    expect(wrapper.text()).not.toContain('门店自提');
    expect(wrapper.text()).toContain('取货码');
    expect(wrapper.text()).toContain('WM_PICKUP:FT-ORDER-PORTAL-PICKUP-001');
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
