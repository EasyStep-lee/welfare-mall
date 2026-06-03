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
});
