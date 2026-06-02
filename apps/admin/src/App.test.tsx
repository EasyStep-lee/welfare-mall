import { render, screen, within } from '@testing-library/react';
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
      latestReviewLog: {
        action: 'submit_review',
        actorUserId: 'merchant-user-001',
        reason: null,
        createdAt: '2026-06-02T00:00:00.000Z'
      }
    }
  ]
};

describe('Admin product review workbench', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => reviewQueueResponse
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders review queue rows with business labels and workflow actions', async () => {
    render(<App />);

    const row = await screen.findByRole('row', { name: /东北五常大米福利装/ });
    expect(within(row).getByText('哈尔滨优选商贸')).toBeInTheDocument();
    expect(within(row).getByText('黑龙江福利卡中心')).toBeInTheDocument();
    expect(within(row).getByText('2 个 SKU')).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: '通过审核' })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: '驳回审核' })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: '发布商品池' })).toBeInTheDocument();
  });
});
