import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      orderNo: 'ORDER-20260603-001',
      status: 'paid',
      totalAmount: 13980,
      cashPayableAmount: 8980,
      welfareCardPayableAmount: 5000,
      fulfillmentType: 'delivery',
      receiverName: 'Li Lei',
      receiverPhone: '13800000000',
      receiverAddress: 'Pudong Avenue 1',
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

describe('Merchant product submission workbench', () => {
  beforeEach(() => {
    let fulfillmentQueueLoads = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/orders/merchant/fulfillment/ORDER-20260603-001/complete')) {
          return {
            ok: true,
            json: async () => ({
              order: {
                orderNo: 'ORDER-20260603-001',
                status: 'completed'
              }
            })
          };
        }

        if (url.includes('/orders/merchant/fulfillment')) {
          fulfillmentQueueLoads += 1;
          return {
            ok: true,
            json: async () => (fulfillmentQueueLoads === 1 ? fulfillmentQueueResponse : { orders: [] })
          };
        }

        if (url.includes('/review-submissions')) {
          return {
            ok: true,
            json: async () => ({
              productId: 'product-001',
              action: 'submit_review',
              fromStatus: 'draft',
              toStatus: 'pending_review'
            })
          };
        }

        return {
          ok: true,
          json: async () => draftQueueResponse
        };
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders product readiness and submits a draft for review', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: '履约订单' })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders/merchant/fulfillment?merchantId=merchant-001');
    expect(screen.getByText('ORDER-20260603-001')).toBeInTheDocument();
    expect(screen.getByText('Li Lei / 13800000000 / Pudong Avenue 1')).toBeInTheDocument();
    expect(screen.getByText('微信支付 已支付')).toBeInTheDocument();
    expect(screen.getByText('Local Rice x2')).toBeInTheDocument();
    expect(screen.getByText('合计 ¥139.80')).toBeInTheDocument();
    expect(screen.getByText('现金 ¥89.80')).toBeInTheDocument();
    expect(screen.getByText('福利卡 ¥50.00')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '确认完成' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders/merchant/fulfillment/ORDER-20260603-001/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: 'merchant-001' })
      });
    });
    expect(await screen.findByText('ORDER-20260603-001 已确认完成')).toBeInTheDocument();
    expect(await screen.findByText('暂无待履约订单')).toBeInTheDocument();

    const row = await screen.findByRole('row', { name: /东北五常大米福利装/ });
    expect(within(row).getByText('草稿')).toBeInTheDocument();
    expect(within(row).getByText('2 个 SKU')).toBeInTheDocument();
    expect(within(row).getByText('3 张图')).toBeInTheDocument();
    expect(within(row).getByText('1 项资质')).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: '提交审核' })).toBeInTheDocument();
    expect(screen.getByText('4 项')).toBeInTheDocument();
    expect(screen.getByText('2 段')).toBeInTheDocument();

    await userEvent.click(within(row).getByRole('button', { name: '提交审核' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/products/product-001/review-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorUserId: 'merchant-user-001' })
      });
    });
    expect(await screen.findByText('东北五常大米福利装 已提交审核')).toBeInTheDocument();
  });

  it('saves a complete product draft from merchant-facing fields', async () => {
    render(<App />);

    await userEvent.clear(screen.getByLabelText('商品编码'));
    await userEvent.type(screen.getByLabelText('商品编码'), 'P-TEA-001');
    await userEvent.clear(screen.getByLabelText('商品名称'));
    await userEvent.type(screen.getByLabelText('商品名称'), '安吉白茶福利礼盒');
    await userEvent.clear(screen.getByLabelText('销售价'));
    await userEvent.type(screen.getByLabelText('销售价'), '168.50');
    await userEvent.clear(screen.getByLabelText('主图地址'));
    await userEvent.type(screen.getByLabelText('主图地址'), 'https://img.example.com/tea-main.jpg');
    await userEvent.clear(screen.getByLabelText('详情图地址'));
    await userEvent.type(screen.getByLabelText('详情图地址'), 'https://img.example.com/tea-detail.jpg');
    await userEvent.clear(screen.getByLabelText('资质文件'));
    await userEvent.type(screen.getByLabelText('资质文件'), 'https://img.example.com/certs/tea-origin.pdf');
    await userEvent.clear(screen.getByLabelText('商品参数'));
    await userEvent.type(screen.getByLabelText('商品参数'), '净含量 250g');
    await userEvent.clear(screen.getByLabelText('详情图文'));
    await userEvent.type(screen.getByLabelText('详情图文'), '适合企业节日福利发放。');

    await userEvent.click(screen.getByRole('button', { name: '保存草稿' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/products/drafts/save',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String)
        })
      );
    });

    const saveCall = vi.mocked(fetch).mock.calls.find(([url]) => String(url).includes('/products/drafts/save'));
    const requestBody = JSON.parse(String(saveCall?.[1]?.body));
    expect(requestBody.actorUserId).toBe('merchant-user-001');
    expect(requestBody.payload).toEqual(
      expect.objectContaining({
        code: 'P-TEA-001',
        name: '安吉白茶福利礼盒',
        merchantId: 'merchant-001',
        franchiseId: 'franchise-001',
        categoryId: 'category-rice',
        brandId: 'brand-rice',
        originCountry: '中国'
      })
    );
    expect(requestBody.payload.skus[0]).toEqual(
      expect.objectContaining({
        code: 'SKU-P-TEA-001',
        priceAmount: 16850,
        specs: [{ name: '规格', value: '标准装' }]
      })
    );
    expect(requestBody.payload.media).toEqual([
      expect.objectContaining({ type: 'main_image', url: 'https://img.example.com/tea-main.jpg' }),
      expect.objectContaining({ type: 'detail_image', url: 'https://img.example.com/tea-detail.jpg' })
    ]);
    expect(requestBody.payload.qualifications[0]).toEqual(
      expect.objectContaining({
        type: 'origin_certificate',
        fileUrl: 'https://img.example.com/certs/tea-origin.pdf'
      })
    );
    expect(await screen.findByText('安吉白茶福利礼盒 草稿已保存')).toBeInTheDocument();
  });
});
