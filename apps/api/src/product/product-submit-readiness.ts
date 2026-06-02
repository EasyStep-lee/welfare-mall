import { ProductMediaType } from './product-media-type';

export type ProductSubmitReadinessInput = {
  skuCount: number;
  mediaTypes: ProductMediaType[];
  qualificationCount: number;
  parameterCount: number;
  originCountry?: string | null;
};

export type ProductSubmitReadinessResult = {
  ready: boolean;
  missingRequirements: string[];
};

export function evaluateProductSubmitReadiness(input: ProductSubmitReadinessInput): ProductSubmitReadinessResult {
  const missingRequirements: string[] = [];

  if (input.skuCount < 1) {
    missingRequirements.push('sku');
  }

  if (!input.mediaTypes.includes('main_image')) {
    missingRequirements.push('main_image');
  }

  if (!input.mediaTypes.includes('detail_image')) {
    missingRequirements.push('detail_image');
  }

  if (input.qualificationCount < 1) {
    missingRequirements.push('qualification');
  }

  if (input.parameterCount < 1) {
    missingRequirements.push('parameter');
  }

  if (!input.originCountry) {
    missingRequirements.push('origin_country');
  }

  return {
    ready: missingRequirements.length === 0,
    missingRequirements
  };
}
