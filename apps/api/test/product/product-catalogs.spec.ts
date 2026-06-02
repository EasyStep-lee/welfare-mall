import { ProductMediaTypeCatalog } from '../../src/product/product-media-type';
import { ProductParameterValueTypeCatalog } from '../../src/product/product-parameter-value-type';
import { ProductQualificationTypeCatalog } from '../../src/product/product-qualification-type';
import { ProductSaleStatusCatalog } from '../../src/product/product-sale-status';
import { ProductStatusCatalog } from '../../src/product/product-status';

describe('product catalogs', () => {
  it('defines the product review lifecycle', () => {
    expect(ProductStatusCatalog.map((status) => status.code)).toEqual([
      'draft',
      'pending_review',
      'approved',
      'rejected',
      'archived'
    ]);
  });

  it('defines sale statuses separately from review status', () => {
    expect(ProductSaleStatusCatalog.map((status) => status.code)).toEqual(['on_sale', 'off_sale']);
  });

  it('defines all media usages needed by product master data', () => {
    expect(ProductMediaTypeCatalog.map((type) => type.code)).toEqual(['main_image', 'gallery_image', 'detail_image', 'video']);
  });

  it('defines qualification types as first-class records', () => {
    expect(ProductQualificationTypeCatalog.map((type) => type.code)).toEqual([
      'food_license',
      'brand_authorization',
      'origin_certificate',
      'inspection_report',
      'service_license'
    ]);
  });

  it('defines parameter value types for structured product parameters', () => {
    expect(ProductParameterValueTypeCatalog.map((type) => type.code)).toEqual(['text', 'number', 'boolean', 'date']);
  });
});
