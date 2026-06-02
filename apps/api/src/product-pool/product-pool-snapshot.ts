export type ProductPoolItemSnapshotInput = {
  productId: string;
  skuId: string;
  productName: string;
  skuCode: string;
  priceAmount: number;
  mainImageUrl: string;
};

export type ProductPoolItemSnapshot = {
  productId: string;
  skuId: string;
  displayName: string;
  displaySkuCode: string;
  displayPriceAmount: number;
  displayImageUrl: string;
};

export function buildProductPoolItemSnapshot(input: ProductPoolItemSnapshotInput): ProductPoolItemSnapshot {
  return {
    productId: input.productId,
    skuId: input.skuId,
    displayName: input.productName,
    displaySkuCode: input.skuCode,
    displayPriceAmount: input.priceAmount,
    displayImageUrl: input.mainImageUrl
  };
}
