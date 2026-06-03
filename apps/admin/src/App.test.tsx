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
    expect(screen.getByText('已支付')).toBeInTheDocument();
    expect(screen.getByText('Li Lei / 13800000000 / Pudong Avenue 1')).toBeInTheDocument();
    expect(screen.getByText('合计 ¥139.80')).toBeInTheDocument();
    expect(screen.getByText('微信支付 已支付')).toBeInTheDocument();
    expect(screen.getByText('Local Rice x2')).toBeInTheDocument();
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
    expect(await screen.findByText('退款处理中')).toBeInTheDocument();
  });
});
