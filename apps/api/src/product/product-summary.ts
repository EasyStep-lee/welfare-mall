import { ProductSaleStatus } from './product-sale-status';
import { ProductStatus } from './product-status';

export type ProductOriginInput = {
  country: string;
  province?: string;
  city?: string;
  description?: string;
};

export type ProductSummaryInput = {
  id: string;
  code: string;
  name: string;
  merchantId: string;
  franchiseId: string;
  categoryName: string;
  brandName: string;
  origin: ProductOriginInput;
  mainImageUrl: string;
  status: ProductStatus;
  saleStatus: ProductSaleStatus;
};

export type ProductSummary = Omit<ProductSummaryInput, 'origin'> & {
  origin: string;
};

export function buildProductSummary(input: ProductSummaryInput): ProductSummary {
  return {
    id: input.id,
    code: input.code,
    name: input.name,
    merchantId: input.merchantId,
    franchiseId: input.franchiseId,
    categoryName: input.categoryName,
    brandName: input.brandName,
    origin: formatProductOrigin(input.origin),
    mainImageUrl: input.mainImageUrl,
    status: input.status,
    saleStatus: input.saleStatus
  };
}

function formatProductOrigin(origin: ProductOriginInput): string {
  return [origin.country, origin.province, origin.city, origin.description].filter(Boolean).join(' ');
}
