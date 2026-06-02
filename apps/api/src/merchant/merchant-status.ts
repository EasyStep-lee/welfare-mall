export const MerchantStatuses = {
  PendingReview: 'pending_review',
  Active: 'active',
  Suspended: 'suspended',
  Archived: 'archived'
} as const;

export type MerchantStatus = (typeof MerchantStatuses)[keyof typeof MerchantStatuses];

export const MerchantStatusCatalog: Array<{ code: MerchantStatus; name: string }> = [
  { code: MerchantStatuses.PendingReview, name: '待审核' },
  { code: MerchantStatuses.Active, name: '正常' },
  { code: MerchantStatuses.Suspended, name: '暂停' },
  { code: MerchantStatuses.Archived, name: '归档' }
];
