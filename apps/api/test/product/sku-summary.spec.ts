import { buildSkuSummary } from '../../src/product/sku-summary';

describe('buildSkuSummary', () => {
  it('returns price and spec identity for one SKU', () => {
    const summary = buildSkuSummary({
      id: 'sku-001',
      productId: 'product-001',
      code: 'SKU-RICE-5KG',
      priceAmount: 6990,
      marketPriceAmount: 8990,
      specs: [
        { name: '规格', value: '5kg' },
        { name: '包装', value: '礼盒装' }
      ],
      barcode: '690000000001',
      weightGrams: 5000,
      volumeMilliliters: 8200
    });

    expect(summary).toEqual({
      id: 'sku-001',
      productId: 'product-001',
      code: 'SKU-RICE-5KG',
      priceAmount: 6990,
      marketPriceAmount: 8990,
      specText: '规格: 5kg / 包装: 礼盒装',
      barcode: '690000000001',
      weightGrams: 5000,
      volumeMilliliters: 8200
    });
  });
});
