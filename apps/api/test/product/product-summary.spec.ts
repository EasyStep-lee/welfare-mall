import { buildProductSummary } from '../../src/product/product-summary';

describe('buildProductSummary', () => {
  it('returns the product master-data identity used by list and pool contracts', () => {
    const summary = buildProductSummary({
      id: 'product-001',
      code: 'P-RICE-001',
      name: '东北五常大米福利装',
      merchantId: 'merchant-001',
      franchiseId: 'franchise-001',
      categoryName: '粮油副食',
      brandName: '禾香',
      origin: {
        country: '中国',
        province: '黑龙江',
        city: '哈尔滨',
        description: '五常核心产区'
      },
      mainImageUrl: 'https://cdn.example.com/products/rice-main.jpg',
      status: 'approved',
      saleStatus: 'on_sale'
    });

    expect(summary).toEqual({
      id: 'product-001',
      code: 'P-RICE-001',
      name: '东北五常大米福利装',
      merchantId: 'merchant-001',
      franchiseId: 'franchise-001',
      categoryName: '粮油副食',
      brandName: '禾香',
      origin: '中国 黑龙江 哈尔滨 五常核心产区',
      mainImageUrl: 'https://cdn.example.com/products/rice-main.jpg',
      status: 'approved',
      saleStatus: 'on_sale'
    });
  });
});
