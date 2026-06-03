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

describe('Merchant product submission workbench', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
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
});
