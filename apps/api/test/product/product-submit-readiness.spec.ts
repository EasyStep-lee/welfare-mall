import { evaluateProductSubmitReadiness } from '../../src/product/product-submit-readiness';

describe('evaluateProductSubmitReadiness', () => {
  it('allows submit when product master data has SKU, images, qualification, parameters, and origin', () => {
    const result = evaluateProductSubmitReadiness({
      skuCount: 1,
      mediaTypes: ['main_image', 'detail_image'],
      qualificationCount: 1,
      parameterCount: 1,
      originCountry: '中国'
    });

    expect(result).toEqual({
      ready: true,
      missingRequirements: []
    });
  });

  it('blocks submit when detail image is missing', () => {
    const result = evaluateProductSubmitReadiness({
      skuCount: 1,
      mediaTypes: ['main_image'],
      qualificationCount: 1,
      parameterCount: 1,
      originCountry: '中国'
    });

    expect(result).toEqual({
      ready: false,
      missingRequirements: ['detail_image']
    });
  });
});
