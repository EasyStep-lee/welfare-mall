import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

const completedFulfillmentQueueResponse = {
  orders: [
    {
      id: 'fulfillment-task-002',
      taskNo: 'FT-ORDER-20260603-002-MERCHANT-001-001',
      orderNo: 'ORDER-20260603-002',
      status: 'completed',
      createdAt: '2026-06-03T08:10:00.000Z',
      updatedAt: '2026-06-03T08:45:00.000Z',
      completedAt: '2026-06-03T08:45:00.000Z',
      totalAmount: 6990,
      cashPayableAmount: 6990,
      welfareCardPayableAmount: 0,
      fulfillmentType: 'pickup',
      receiverName: null,
      receiverPhone: null,
      receiverAddress: null,
      pickupStoreName: '浦东直营网点',
      pickupCode: 'WM_PICKUP:FT-ORDER-20260603-002-MERCHANT-001-001',
      latestPayment: {
        paymentNo: 'PAY-20260603-002',
        status: 'paid',
        channel: 'wechat'
      },
      lines: [
        {
          displayName: 'Pickup Rice',
          displaySkuCode: 'SKU-RICE-2KG',
          quantity: 1,
          lineTotalAmount: 6990
        }
      ]
    }
  ]
};

const pickupFulfillmentQueueResponse = {
  orders: [
    {
      id: 'fulfillment-task-003',
      taskNo: 'FT-ORDER-20260603-003-MERCHANT-001-001',
      orderNo: 'ORDER-20260603-003',
      status: 'paid',
      createdAt: '2026-06-03T08:10:00.000Z',
      updatedAt: '2026-06-03T08:10:00.000Z',
      completedAt: null,
      totalAmount: 6990,
      cashPayableAmount: 6990,
      welfareCardPayableAmount: 0,
      fulfillmentType: 'pickup',
      receiverName: null,
      receiverPhone: null,
      receiverAddress: null,
      pickupStoreName: '浦东直营网点',
      pickupCode: 'WM_PICKUP:FT-ORDER-20260603-003-MERCHANT-001-001',
      latestPayment: {
        paymentNo: 'PAY-20260603-003',
        status: 'paid',
        channel: 'wechat'
      },
      lines: [
        {
          displayName: 'Pickup Rice',
          displaySkuCode: 'SKU-RICE-2KG',
          quantity: 1,
          lineTotalAmount: 6990
        }
      ]
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
      items: [
        {
          id: 'bill-item-001',
          billItemNo: 'MSBI-ORDER-20260605-001-ORDER-LINE-001',
          merchantId: 'merchant-001',
          orderNo: 'ORDER-20260605-001',
          orderLineId: 'order-line-001',
          productId: 'product-001',
          skuId: 'sku-001',
          source: 'order_paid',
          status: 'statement_generated',
          grossAmount: 13980,
          refundOffsetAmount: 1000,
          adjustmentAmount: -500,
          netAmount: 12480,
          statementId: 'statement-001',
          createdAt: '2026-06-05T00:00:00.000Z',
          updatedAt: '2026-06-06T00:00:00.000Z'
        },
        {
          id: 'bill-item-002',
          billItemNo: 'MSBI-ORDER-20260605-002-ORDER-LINE-002',
          merchantId: 'merchant-001',
          orderNo: 'ORDER-20260605-002',
          orderLineId: 'order-line-002',
          productId: 'product-002',
          skuId: null,
          source: 'order_paid',
          status: 'statement_generated',
          grossAmount: 5000,
          refundOffsetAmount: 0,
          adjustmentAmount: 0,
          netAmount: 5000,
          statementId: 'statement-001',
          createdAt: '2026-06-05T00:10:00.000Z',
          updatedAt: '2026-06-06T00:00:00.000Z'
        }
      ]
    }
  ]
};

const generatedSettlementStatement = merchantSettlementStatementsResponse.statements[0]!;

const paidMerchantSettlementStatementsResponse = {
  statements: [
    {
      ...generatedSettlementStatement,
      status: 'paid_offline',
      paidAt: '2026-06-07T00:00:00.000Z',
      items: generatedSettlementStatement.items.map((item) => ({
        ...item,
        status: 'paid_offline'
      }))
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
        if (url.includes('/settlements/merchant-statements')) {
          return {
            ok: true,
            json: async () => merchantSettlementStatementsResponse
          };
        }

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
          if (url.includes('status=completed')) {
            return {
              ok: true,
              json: async () => completedFulfillmentQueueResponse
            };
          }

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
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/orders/merchant/fulfillment?merchantId=merchant-001&status=paid'
    );
    expect(screen.getByText('ORDER-20260603-001')).toBeInTheDocument();
    expect(screen.getByText('任务 FT-ORDER-20260603-001-MERCHANT-001-001')).toBeInTheDocument();
    expect(screen.getByText('任务状态 待履约')).toBeInTheDocument();
    expect(screen.getByText('创建 2026-06-03 08:10')).toBeInTheDocument();
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

  it('renders merchant settlement statements with bill item details', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: '商户结算' })).toBeInTheDocument();
    const settlementPanel = screen.getByLabelText('商户结算');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/settlements/merchant-statements?merchantId=merchant-001&status=generated'
    );
    expect(within(settlementPanel).getByText('MSS-20260606-001')).toBeInTheDocument();
    expect(within(settlementPanel).getAllByText('待打款').length).toBeGreaterThan(0);
    expect(within(settlementPanel).getByText('生成 2026-06-06 00:00')).toBeInTheDocument();
    expect(within(settlementPanel).getByText('明细 2 条')).toBeInTheDocument();
    expect(within(settlementPanel).getByText('总额 ¥189.80')).toBeInTheDocument();
    expect(within(settlementPanel).getByText('退款抵扣 ¥10.00')).toBeInTheDocument();
    expect(within(settlementPanel).getByText('调整 -¥5.00')).toBeInTheDocument();
    expect(within(settlementPanel).getByText('应收 ¥174.80')).toBeInTheDocument();
    expect(within(settlementPanel).getByText('ORDER-20260605-001')).toBeInTheDocument();
    expect(within(settlementPanel).getByText('product-001 / sku-001')).toBeInTheDocument();
    expect(within(settlementPanel).getByText('账单 ¥124.80')).toBeInTheDocument();
    expect(within(settlementPanel).getByText('ORDER-20260605-002')).toBeInTheDocument();
    expect(within(settlementPanel).getByText('product-002 / 默认规格')).toBeInTheDocument();
  });

  it('filters merchant settlement statements by status while preserving merchant context', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '已打款' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/settlements/merchant-statements?merchantId=merchant-001&status=paid_offline'
      );
    });

    fireEvent.click(await screen.findByRole('button', { name: '全部结算' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/settlements/merchant-statements?merchantId=merchant-001');
    });
  });

  it('renders paid merchant settlement history as read-only', async () => {
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/settlements/merchant-statements')) {
        return {
          ok: true,
          json: async () => paidMerchantSettlementStatementsResponse
        } as Response;
      }

      if (url.includes('/orders/merchant/fulfillment')) {
        return {
          ok: true,
          json: async () => fulfillmentQueueResponse
        } as Response;
      }

      return {
        ok: true,
        json: async () => draftQueueResponse
      } as Response;
    });

    render(<App />);

    const settlementPanel = await screen.findByLabelText('商户结算');
    expect(within(settlementPanel).getAllByText('已线下打款').length).toBeGreaterThan(0);
    expect(within(settlementPanel).getByText('打款 2026-06-07 00:00')).toBeInTheDocument();
    expect(within(settlementPanel).queryByRole('button', { name: '确认离线打款' })).not.toBeInTheDocument();
  });

  it('filters merchant fulfillment orders by status tab', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '已完成' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/orders/merchant/fulfillment?merchantId=merchant-001&status=completed'
      );
    });
  });

  it('filters merchant fulfillment orders by order and task lookup fields', async () => {
    render(<App />);

    fireEvent.change(await screen.findByLabelText('履约订单号'), { target: { value: ' ORDER-20260603-001 ' } });
    fireEvent.change(await screen.findByLabelText('履约任务号'), {
      target: { value: ' FT-ORDER-20260603-001-MERCHANT-001-001 ' }
    });
    fireEvent.click(screen.getByRole('button', { name: '筛选履约' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/orders/merchant/fulfillment?merchantId=merchant-001&status=paid&orderNo=ORDER-20260603-001&taskNo=FT-ORDER-20260603-001-MERCHANT-001-001'
      );
    });

    fireEvent.click(await screen.findByRole('button', { name: '已完成' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/orders/merchant/fulfillment?merchantId=merchant-001&status=completed&orderNo=ORDER-20260603-001&taskNo=FT-ORDER-20260603-001-MERCHANT-001-001'
      );
    });
  });

  it('renders completed fulfillment tasks as read-only history', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '已完成' }));

    expect(await screen.findByText('ORDER-20260603-002')).toBeInTheDocument();
    expect(screen.getByText('任务 FT-ORDER-20260603-002-MERCHANT-001-001')).toBeInTheDocument();
    expect(screen.getByText('任务状态 已完成')).toBeInTheDocument();
    expect(screen.getByText('创建 2026-06-03 08:10')).toBeInTheDocument();
    expect(screen.getByText('完成 2026-06-03 08:45')).toBeInTheDocument();
    expect(screen.getByText('浦东直营网点')).toBeInTheDocument();
    expect(screen.getByText('取货码 WM_PICKUP:FT-ORDER-20260603-002-MERCHANT-001-001')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '确认完成' })).not.toBeInTheDocument();
  });

  it('submits the entered pickup code when completing pickup fulfillment', async () => {
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/settlements/merchant-statements')) {
        return {
          ok: true,
          json: async () => merchantSettlementStatementsResponse
        } as Response;
      }

      if (url.includes('/orders/merchant/fulfillment/ORDER-20260603-003/complete')) {
        return {
          ok: true,
          json: async () => ({
            order: {
              orderNo: 'ORDER-20260603-003',
              status: 'completed'
            }
          })
        } as Response;
      }

      if (url.includes('/orders/merchant/fulfillment')) {
        return {
          ok: true,
          json: async () => pickupFulfillmentQueueResponse
        } as Response;
      }

      return {
        ok: true,
        json: async () => draftQueueResponse
      } as Response;
    });

    render(<App />);

    const pickupCodeInput = await screen.findByLabelText('核销取货码');
    fireEvent.change(pickupCodeInput, {
      target: { value: ' WM_PICKUP:FT-ORDER-20260603-003-MERCHANT-001-001 ' }
    });
    await userEvent.click(screen.getByRole('button', { name: '确认完成' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders/merchant/fulfillment/ORDER-20260603-003/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'merchant-001',
          pickupCode: 'WM_PICKUP:FT-ORDER-20260603-003-MERCHANT-001-001'
        })
      });
    });
  });

  it('saves a complete product draft from merchant-facing fields', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('商品编码'), { target: { value: 'P-TEA-001' } });
    fireEvent.change(screen.getByLabelText('商品名称'), { target: { value: '安吉白茶福利礼盒' } });
    fireEvent.change(screen.getByLabelText('销售价'), { target: { value: '168.50' } });
    fireEvent.change(screen.getByLabelText('主图地址'), { target: { value: 'https://img.example.com/tea-main.jpg' } });
    fireEvent.change(screen.getByLabelText('详情图地址'), { target: { value: 'https://img.example.com/tea-detail.jpg' } });
    fireEvent.change(screen.getByLabelText('资质文件'), { target: { value: 'https://img.example.com/certs/tea-origin.pdf' } });
    fireEvent.change(screen.getByLabelText('商品参数'), { target: { value: '净含量 250g' } });
    fireEvent.change(screen.getByLabelText('详情图文'), { target: { value: '适合企业节日福利发放。' } });

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
