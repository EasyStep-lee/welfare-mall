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
      buyerUserId: 'local-user-001',
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

describe('Portal product pool catalog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
      buyerUserId: 'local-user-001',
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

  it('loads local buyer orders alongside the catalog', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/orders?buyerUserId=local-user-001')) {
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

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders?buyerUserId=local-user-001');
    expect(wrapper.text()).toContain('我的订单');
    expect(wrapper.text()).toContain('ORDER-20260607-PORTAL');
    expect(wrapper.text()).toContain('待支付');
    expect(wrapper.text()).toContain('¥69.90');
  });

  it('opens a local buyer order detail from the order list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/orders/ORDER-20260607-PORTAL?buyerUserId=local-user-001')) {
          return {
            ok: true,
            json: async () => orderDetailResponse
          };
        }

        if (url.endsWith('/orders?buyerUserId=local-user-001')) {
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
      'http://localhost:3000/api/orders/ORDER-20260607-PORTAL?buyerUserId=local-user-001'
    );
    expect(wrapper.text()).toContain('订单详情');
    expect(wrapper.text()).toContain('本地审核五常大米福利装');
    expect(wrapper.text()).toContain('SKU-LOCAL-REVIEW-5KG');
    expect(wrapper.text()).toContain('本地用户');
    expect(wrapper.text()).toContain('本地联调地址');
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

        if (url.endsWith('/orders/ORDER-20260607-PORTAL?buyerUserId=local-user-001')) {
          return {
            ok: true,
            json: async () => orderDetailResponse
          };
        }

        if (url.endsWith('/orders?buyerUserId=local-user-001')) {
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
});
