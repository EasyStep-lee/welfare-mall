export type SkuSpecInput = {
  name: string;
  value: string;
};

export type SkuSummaryInput = {
  id: string;
  productId: string;
  code: string;
  priceAmount: number;
  marketPriceAmount: number;
  specs: SkuSpecInput[];
  barcode: string;
  weightGrams: number;
  volumeMilliliters: number;
};

export type SkuSummary = Omit<SkuSummaryInput, 'specs'> & {
  specText: string;
};

export function buildSkuSummary(input: SkuSummaryInput): SkuSummary {
  return {
    id: input.id,
    productId: input.productId,
    code: input.code,
    priceAmount: input.priceAmount,
    marketPriceAmount: input.marketPriceAmount,
    specText: input.specs.map((spec) => `${spec.name}: ${spec.value}`).join(' / '),
    barcode: input.barcode,
    weightGrams: input.weightGrams,
    volumeMilliliters: input.volumeMilliliters
  };
}
