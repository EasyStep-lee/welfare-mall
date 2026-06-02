import type { ProductDraftCommandInput } from '../../src/product/product-draft-command';
import { validateProductDraftCommand } from '../../src/product/product-draft-command';

const completeDraft: ProductDraftCommandInput = {
  code: 'P-RICE-001',
  name: '东北五常大米福利装',
  merchantId: 'merchant-001',
  franchiseId: 'franchise-001',
  categoryId: 'category-rice',
  brandId: 'brand-hx',
  originCountry: '中国',
  originProvince: '黑龙江',
  originCity: '哈尔滨',
  skus: [
    {
      code: 'SKU-RICE-5KG',
      priceAmount: 6990,
      marketPriceAmount: 8990,
      specs: [{ name: '规格', value: '5kg' }]
    }
  ],
  media: [
    { type: 'main_image', url: 'https://cdn.example.com/products/rice-main.jpg' },
    { type: 'detail_image', url: 'https://cdn.example.com/products/rice-detail.jpg' }
  ],
  qualifications: [
    {
      type: 'origin_certificate',
      title: '产地证明',
      fileUrl: 'https://cdn.example.com/certs/rice-origin.pdf'
    }
  ],
  parameters: [
    {
      groupName: '基础参数',
      name: '净含量',
      value: '5kg',
      valueType: 'text'
    }
  ],
  detailSections: [
    {
      type: 'image',
      imageUrl: 'https://cdn.example.com/products/rice-detail-1.jpg'
    }
  ]
};

describe('validateProductDraftCommand', () => {
  it('accepts a complete product draft payload for merchant submission preparation', () => {
    const result = validateProductDraftCommand(completeDraft);

    expect(result).toEqual({
      valid: true,
      issues: [],
      submitReadiness: {
        ready: true,
        missingRequirements: []
      }
    });
  });

  it('returns deterministic issue codes for missing product master data and publish assets', () => {
    const result = validateProductDraftCommand({
      code: '',
      name: '',
      merchantId: '',
      franchiseId: '',
      categoryId: '',
      originCountry: '',
      skus: [],
      media: [],
      qualifications: [],
      parameters: [],
      detailSections: []
    });

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      'product_code_required',
      'product_name_required',
      'merchant_required',
      'franchise_required',
      'category_required',
      'origin_country_required',
      'sku_required',
      'main_image_required',
      'detail_image_required',
      'qualification_required',
      'parameter_required',
      'detail_section_required'
    ]);
    expect(result.submitReadiness).toEqual({
      ready: false,
      missingRequirements: ['sku', 'main_image', 'detail_image', 'qualification', 'parameter', 'origin_country']
    });
  });

  it('requires SKU price and spec identity for draft SKUs', () => {
    const result = validateProductDraftCommand({
      ...completeDraft,
      skus: [
        {
          code: '',
          priceAmount: 0,
          marketPriceAmount: -1,
          specs: []
        }
      ]
    });

    expect(result.issues.map((issue) => issue.code)).toEqual([
      'sku_code_required',
      'sku_price_required',
      'sku_market_price_required',
      'sku_spec_required'
    ]);
  });
});
