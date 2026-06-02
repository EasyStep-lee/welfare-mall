export const ProductStatuses = {
  Draft: 'draft',
  PendingReview: 'pending_review',
  Approved: 'approved',
  Rejected: 'rejected',
  Archived: 'archived'
} as const;

export type ProductStatus = (typeof ProductStatuses)[keyof typeof ProductStatuses];

export const ProductStatusCatalog: Array<{ code: ProductStatus; name: string }> = [
  { code: ProductStatuses.Draft, name: '草稿' },
  { code: ProductStatuses.PendingReview, name: '待审核' },
  { code: ProductStatuses.Approved, name: '已审核' },
  { code: ProductStatuses.Rejected, name: '已驳回' },
  { code: ProductStatuses.Archived, name: '归档' }
];
