import { ProductMediaType } from './product-media-type';
import { ProductParameterValueType } from './product-parameter-value-type';
import { ProductQualificationType } from './product-qualification-type';
import { evaluateProductSubmitReadiness } from './product-submit-readiness';

export type ProductDraftSkuInput = {
  code?: string | null;
  priceAmount?: number | null;
  marketPriceAmount?: number | null;
  costPriceAmount?: number | null;
  barcode?: string | null;
  specs?: Array<{ name?: string | null; value?: string | null }> | null;
  weightGrams?: number | null;
  volumeMilliliters?: number | null;
};

export type ProductDraftMediaInput = {
  type?: ProductMediaType | null;
  url?: string | null;
  sortOrder?: number | null;
  altText?: string | null;
};

export type ProductDraftQualificationInput = {
  type?: ProductQualificationType | null;
  title?: string | null;
  certificateNo?: string | null;
  fileUrl?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
};

export type ProductDraftParameterInput = {
  groupName?: string | null;
  name?: string | null;
  value?: string | null;
  valueType?: ProductParameterValueType | null;
  sortOrder?: number | null;
};

export type ProductDraftDetailSectionInput = {
  type?: 'text' | 'image' | 'rich_text' | null;
  title?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  sortOrder?: number | null;
};

export type ProductDraftCommandInput = {
  code?: string | null;
  name?: string | null;
  merchantId?: string | null;
  franchiseId?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  originCountry?: string | null;
  originProvince?: string | null;
  originCity?: string | null;
  originDescription?: string | null;
  skus?: ProductDraftSkuInput[] | null;
  media?: ProductDraftMediaInput[] | null;
  qualifications?: ProductDraftQualificationInput[] | null;
  parameters?: ProductDraftParameterInput[] | null;
  detailSections?: ProductDraftDetailSectionInput[] | null;
};

export type ProductDraftCommandIssue = {
  code: string;
  field: string;
  message: string;
};

export type ProductDraftCommandValidationResult = {
  valid: boolean;
  issues: ProductDraftCommandIssue[];
  submitReadiness: {
    ready: boolean;
    missingRequirements: string[];
  };
};

export function validateProductDraftCommand(input: ProductDraftCommandInput): ProductDraftCommandValidationResult {
  const issues: ProductDraftCommandIssue[] = [];
  const skus = input.skus ?? [];
  const media = input.media ?? [];
  const qualifications = input.qualifications ?? [];
  const parameters = input.parameters ?? [];
  const detailSections = input.detailSections ?? [];

  requireText(issues, input.code, 'code', 'product_code_required', 'Product code is required.');
  requireText(issues, input.name, 'name', 'product_name_required', 'Product name is required.');
  requireText(issues, input.merchantId, 'merchantId', 'merchant_required', 'Merchant is required.');
  requireText(issues, input.franchiseId, 'franchiseId', 'franchise_required', 'Franchise is required.');
  requireText(issues, input.categoryId, 'categoryId', 'category_required', 'Category is required.');
  requireText(issues, input.originCountry, 'originCountry', 'origin_country_required', 'Origin country is required.');

  if (skus.length === 0) {
    issues.push({ code: 'sku_required', field: 'skus', message: 'At least one SKU is required.' });
  }

  for (const [index, sku] of skus.entries()) {
    requireText(issues, sku.code, `skus.${index}.code`, 'sku_code_required', 'SKU code is required.');

    if (!sku.priceAmount || sku.priceAmount <= 0) {
      issues.push({
        code: 'sku_price_required',
        field: `skus.${index}.priceAmount`,
        message: 'SKU sale price must be greater than zero.'
      });
    }

    if (!sku.marketPriceAmount || sku.marketPriceAmount <= 0) {
      issues.push({
        code: 'sku_market_price_required',
        field: `skus.${index}.marketPriceAmount`,
        message: 'SKU market price must be greater than zero.'
      });
    }

    const specs = sku.specs ?? [];
    const hasSpec = specs.some((spec) => hasText(spec.name) && hasText(spec.value));
    if (!hasSpec) {
      issues.push({
        code: 'sku_spec_required',
        field: `skus.${index}.specs`,
        message: 'SKU must include at least one spec name and value.'
      });
    }
  }

  if (!media.some((item) => item.type === 'main_image' && hasText(item.url))) {
    issues.push({ code: 'main_image_required', field: 'media', message: 'Main image is required.' });
  }

  if (!media.some((item) => item.type === 'detail_image' && hasText(item.url))) {
    issues.push({ code: 'detail_image_required', field: 'media', message: 'Detail image is required.' });
  }

  if (qualifications.length === 0) {
    issues.push({
      code: 'qualification_required',
      field: 'qualifications',
      message: 'At least one qualification is required.'
    });
  }

  if (parameters.length === 0) {
    issues.push({ code: 'parameter_required', field: 'parameters', message: 'At least one product parameter is required.' });
  }

  if (!detailSections.some((section) => hasText(section.content) || hasText(section.imageUrl))) {
    issues.push({
      code: 'detail_section_required',
      field: 'detailSections',
      message: 'At least one detail text or image section is required.'
    });
  }

  const submitReadiness = evaluateProductSubmitReadiness({
    skuCount: skus.length,
    mediaTypes: media.flatMap((item) => (item.type ? [item.type] : [])),
    qualificationCount: qualifications.length,
    parameterCount: parameters.length,
    originCountry: input.originCountry
  });

  return {
    valid: issues.length === 0,
    issues,
    submitReadiness
  };
}

function requireText(
  issues: ProductDraftCommandIssue[],
  value: string | null | undefined,
  field: string,
  code: string,
  message: string
) {
  if (!hasText(value)) {
    issues.push({ code, field, message });
  }
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}
