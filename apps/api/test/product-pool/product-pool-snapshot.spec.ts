import { buildProductPoolItemSnapshot } from '../../src/product-pool/product-pool-snapshot';

describe('buildProductPoolItemSnapshot', () => {
  it('copies display data while retaining product and SKU references', () => {
    const snapshot = buildProductPoolItemSnapshot({
      productId: 'product-001',
      skuId: 'sku-001',
      productName: '东北五常大米福利装',
      skuCode: 'SKU-RICE-5KG',
      priceAmount: 6990,
      mainImageUrl: 'https://cdn.example.com/products/rice-main.jpg'
    });

    expect(snapshot).toEqual({
      productId: 'product-001',
      skuId: 'sku-001',
      displayName: '东北五常大米福利装',
      displaySkuCode: 'SKU-RICE-5KG',
      displayPriceAmount: 6990,
      displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg'
    });
  });
});
