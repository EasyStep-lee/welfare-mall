import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
      primaryImageUrl: 'https://img.example.com/rice-cover.jpg',
      primarySku: {
        code: 'SKU-RICE-5KG',
        priceAmount: 6990,
        marketPriceAmount: 7990,
        specText: '规格: 5kg'
      },
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
      detailSections: [{ type: 'text', title: '福利说明', content: '适合企业福利发放', sortOrder: 1 }],
      latestReviewLog: {
        action: 'submit_review',
        actorUserId: 'merchant-user-001',
        reason: null,
        createdAt: '2026-06-02T00:00:00.000Z'
      }
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
      latestPayment: {
        paymentNo: 'PAY-20260603-001',
        status: 'paid',
        channel: 'wechat'
      },
      latestRefund: {
        refundNo: 'REF-20260603-001',
        status: 'processing',
        channel: 'wechat',
        refundAmount: 13980,
        reason: 'after_sale'
      },
      fulfillmentSummary: {
        totalTasks: 2,
        pendingTasks: 1,
        completedTasks: 1,
        taskNos: ['FT-ORDER-20260603-001-MERCHANT-001-001', 'FT-ORDER-20260603-001-MERCHANT-002-001']
      },
      fulfillmentTasks: [
        {
          taskNo: 'FT-ORDER-20260603-001-MERCHANT-001-001',
          merchantId: 'merchant-001',
          status: 'pending',
          createdAt: '2026-06-03T00:15:00.000Z',
          completedAt: null
        },
        {
          taskNo: 'FT-ORDER-20260603-001-MERCHANT-002-001',
          merchantId: 'merchant-002',
          status: 'completed',
          createdAt: '2026-06-03T00:16:00.000Z',
          completedAt: '2026-06-03T00:30:00.000Z'
        }
      ],
      lines: [
        {
          displayName: 'Local Rice',
          displaySkuCode: 'SKU-RICE-5KG',
          quantity: 2,
          lineTotalAmount: 13980
        }
      ]
    }
  ]
};

const refundProcessingOrdersResponse = {
  orders: [
    {
      ...adminOrdersResponse.orders[0],
      status: 'refund_processing'
    }
  ]
};

const pendingPaymentOrdersResponse = {
  orders: [
    {
      ...adminOrdersResponse.orders[0],
      status: 'pending_payment',
      latestPayment: {
        paymentNo: 'PAY-20260603-PENDING',
        status: 'pending',
        channel: 'wechat'
      },
      latestRefund: null
    }
  ]
};

const paidAfterCallbackOrdersResponse = {
  orders: [
    {
      ...pendingPaymentOrdersResponse.orders[0],
      status: 'paid',
      latestPayment: {
        paymentNo: 'PAY-20260603-PENDING',
        status: 'paid',
        channel: 'wechat'
      }
    }
  ]
};

const refundedAfterCallbackOrdersResponse = {
  orders: [
    {
      ...refundProcessingOrdersResponse.orders[0],
      status: 'refunded',
      latestRefund: {
        refundNo: 'REF-20260603-001',
        status: 'succeeded',
        channel: 'wechat',
        refundAmount: 13980,
        reason: 'after_sale'
      }
    }
  ]
};

describe('Admin product review workbench', () => {
  beforeEach(() => {
    let adminOrderLoads = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes('/orders/refunds')) {
          return {
            ok: true,
            json: async () => ({
              idempotentReplay: false,
              refund: {
                refundNo: 'REF-20260603-001',
                status: 'processing',
                orderNo: 'ORDER-20260603-001'
              }
            })
          };
        }

        if (url.includes('/orders/admin')) {
          adminOrderLoads += 1;
          return {
            ok: true,
            json: async () => (adminOrderLoads === 1 ? adminOrdersResponse : refundProcessingOrdersResponse)
          };
        }

        if (url.includes('/products/review-queue')) {
          return {
            ok: true,
            json: async () => reviewQueueResponse
          };
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders review queue rows with business labels and workflow actions', async () => {
    render(<App />);

    const row = await screen.findByRole('row', { name: /东北五常大米福利装/ });
    expect(within(row).getByText('P-RICE-001')).toBeInTheDocument();
    expect(within(row).getByText('哈尔滨优选商贸')).toBeInTheDocument();
    expect(within(row).getByText('黑龙江福利卡中心')).toBeInTheDocument();
    expect(within(row).getByText('2 个 SKU')).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: '通过审核' })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: '驳回审核' })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: '发布商品池' })).toBeInTheDocument();
  });

  it('renders concrete product master details for review decisions', async () => {
    render(<App />);

    expect(await screen.findByText('SKU-RICE-5KG')).toBeInTheDocument();
    expect(screen.getByText('销售价 ¥69.90')).toBeInTheDocument();
    expect(screen.getByText('主图')).toBeInTheDocument();
    expect(screen.getByText('产地证明')).toBeInTheDocument();
    expect(screen.getByText('净含量: 5kg')).toBeInTheDocument();
    expect(screen.getByText('福利说明')).toBeInTheDocument();
    expect(screen.getByText('适合企业福利发放')).toBeInTheDocument();
  });

  it('renders recent orders for Admin order management', async () => {
    render(<App />);

    expect(await screen.findByText('订单管理')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders/admin');
    expect(screen.getByText('ORDER-20260603-001')).toBeInTheDocument();
    expect(screen.getByText('user-001')).toBeInTheDocument();
    expect(screen.getAllByText('已支付').length).toBeGreaterThan(0);
    expect(screen.getByText('Li Lei / 13800000000 / Pudong Avenue 1')).toBeInTheDocument();
    expect(screen.getByText('合计 ¥139.80')).toBeInTheDocument();
    expect(screen.getByText('微信支付 已支付')).toBeInTheDocument();
    expect(screen.getByText('REF-20260603-001')).toBeInTheDocument();
    expect(screen.getByText('微信支付 退款处理中 ¥139.80')).toBeInTheDocument();
    expect(screen.getByText('履约 2 项')).toBeInTheDocument();
    expect(screen.getByText('待履约 1')).toBeInTheDocument();
    expect(screen.getByText('已完成 1')).toBeInTheDocument();
    expect(screen.getByText('FT-ORDER-20260603-001-MERCHANT-001-001')).toBeInTheDocument();
    expect(screen.getByText('FT-ORDER-20260603-001-MERCHANT-002-001')).toBeInTheDocument();
    expect(screen.getByText('商户 merchant-001')).toBeInTheDocument();
    expect(screen.getByText('任务状态 待履约')).toBeInTheDocument();
    expect(screen.getByText('创建 2026-06-03 00:15')).toBeInTheDocument();
    expect(screen.getByText('商户 merchant-002')).toBeInTheDocument();
    expect(screen.getByText('任务状态 履约完成')).toBeInTheDocument();
    expect(screen.getByText('完成 2026-06-03 00:30')).toBeInTheDocument();
    expect(screen.getByText('Local Rice x2')).toBeInTheDocument();
  });

  it('filters Admin orders by status tab', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '退款中' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders/admin?status=refund_processing');
    });
  });

  it('filters Admin orders by fulfillment progress tab', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '待履约' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders/admin?fulfillmentStatus=pending');
    });
  });

  it('filters Admin orders by fulfillment merchant and keeps status filters composed', async () => {
    render(<App />);

    fireEvent.change(await screen.findByLabelText('履约商户'), { target: { value: ' merchant-001 ' } });
    fireEvent.click(screen.getByRole('button', { name: '筛选商户' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders/admin?merchantId=merchant-001');
    });

    fireEvent.click(await screen.findByRole('button', { name: '待履约' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/orders/admin?fulfillmentStatus=pending&merchantId=merchant-001'
      );
    });
  });

  it('creates a full refund request for a paid order', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '申请退款' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders/refunds', expect.any(Object));
    });
    const refundCall = vi.mocked(fetch).mock.calls.find(([input]) => String(input).includes('/orders/refunds'));
    expect(refundCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(refundCall?.[1]?.body))).toMatchObject({
      paymentNo: 'PAY-20260603-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      refundAmount: 13980,
      reason: 'after_sale',
      requestId: expect.stringMatching(/^admin-refund-ORDER-20260603-001-\d+$/)
    });
    expect(await screen.findByText('ORDER-20260603-001 已提交退款申请 REF-20260603-001')).toBeInTheDocument();
    expect((await screen.findAllByText('退款处理中')).length).toBeGreaterThan(0);
  });

  it('confirms a pending payment callback for Admin order management', async () => {
    let adminOrderLoads = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes('/orders/payments/callbacks')) {
          return {
            ok: true,
            json: async () => ({
              duplicate: false,
              payment: {
                paymentNo: 'PAY-20260603-PENDING',
                status: 'paid',
                providerPaymentNo: 'admin-confirm-PAY-20260603-PENDING'
              },
              callback: {
                providerEventId: 'admin-payment-ORDER-20260603-001-1717394400000',
                status: 'paid'
              }
            })
          };
        }

        if (url.includes('/orders/admin')) {
          adminOrderLoads += 1;
          return {
            ok: true,
            json: async () => (adminOrderLoads === 1 ? pendingPaymentOrdersResponse : paidAfterCallbackOrdersResponse)
          };
        }

        if (url.includes('/products/review-queue')) {
          return {
            ok: true,
            json: async () => reviewQueueResponse
          };
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '确认支付成功' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders/payments/callbacks', expect.any(Object));
    });
    const callbackCall = vi
      .mocked(fetch)
      .mock.calls.find(([input]) => String(input).includes('/orders/payments/callbacks'));
    expect(callbackCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(callbackCall?.[1]?.body))).toMatchObject({
      providerEventId: expect.stringMatching(/^admin-payment-ORDER-20260603-001-\d+$/),
      paymentNo: 'PAY-20260603-PENDING',
      providerPaymentNo: 'admin-confirm-PAY-20260603-PENDING',
      status: 'paid',
      paidAt: expect.any(String),
      payload: { source: 'admin-order-management' }
    });
    expect(await screen.findByText('ORDER-20260603-001 已确认支付成功 PAY-20260603-PENDING')).toBeInTheDocument();
    expect((await screen.findAllByText('已支付')).length).toBeGreaterThan(0);
    expect(await screen.findByText('微信支付 已支付')).toBeInTheDocument();
  });

  it('confirms a processing refund callback for Admin order management', async () => {
    let adminOrderLoads = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes('/orders/refunds/callbacks')) {
          return {
            ok: true,
            json: async () => ({
              duplicate: false,
              refund: {
                refundNo: 'REF-20260603-001',
                status: 'succeeded',
                providerRefundNo: 'admin-confirm-REF-20260603-001'
              },
              callback: {
                providerEventId: 'admin-refund-ORDER-20260603-001-1717394400000',
                status: 'succeeded'
              }
            })
          };
        }

        if (url.includes('/orders/admin')) {
          adminOrderLoads += 1;
          return {
            ok: true,
            json: async () =>
              adminOrderLoads === 1 ? refundProcessingOrdersResponse : refundedAfterCallbackOrdersResponse
          };
        }

        if (url.includes('/products/review-queue')) {
          return {
            ok: true,
            json: async () => reviewQueueResponse
          };
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '确认退款成功' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders/refunds/callbacks', expect.any(Object));
    });
    const callbackCall = vi
      .mocked(fetch)
      .mock.calls.find(([input]) => String(input).includes('/orders/refunds/callbacks'));
    expect(callbackCall?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    expect(JSON.parse(String(callbackCall?.[1]?.body))).toMatchObject({
      providerEventId: expect.stringMatching(/^admin-refund-ORDER-20260603-001-\d+$/),
      refundNo: 'REF-20260603-001',
      providerRefundNo: 'admin-confirm-REF-20260603-001',
      status: 'succeeded',
      succeededAt: expect.any(String),
      payload: { source: 'admin-order-management' }
    });
    expect(await screen.findByText('ORDER-20260603-001 已确认退款成功 REF-20260603-001')).toBeInTheDocument();
    expect((await screen.findAllByText('已退款')).length).toBeGreaterThan(0);
    expect(await screen.findByText('微信支付 退款成功 ¥139.80')).toBeInTheDocument();
  });
});
