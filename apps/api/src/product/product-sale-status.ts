export const ProductSaleStatuses = {
  OnSale: 'on_sale',
  OffSale: 'off_sale'
} as const;

export type ProductSaleStatus = (typeof ProductSaleStatuses)[keyof typeof ProductSaleStatuses];

export const ProductSaleStatusCatalog: Array<{ code: ProductSaleStatus; name: string }> = [
  { code: ProductSaleStatuses.OnSale, name: '上架' },
  { code: ProductSaleStatuses.OffSale, name: '下架' }
];
